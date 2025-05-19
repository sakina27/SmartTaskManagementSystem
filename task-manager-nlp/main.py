from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import shutil
import subprocess
import os
import torch
import dateparser

from faster_whisper import WhisperModel
from transformers import (
    BertTokenizer, BertForSequenceClassification,
    BertTokenizerFast, BertForTokenClassification,
    T5Tokenizer, T5ForConditionalGeneration
)

# ----------- FastAPI Setup ----------- #
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------- Load ASR Model ----------- #
asr_model = WhisperModel("base")

# ----------- Load ML Models ----------- #
# Priority Classification
priority_tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
priority_model = BertForSequenceClassification.from_pretrained("models/priority_model")
priority_model.eval()

# Date Extraction
date_tokenizer = BertTokenizerFast.from_pretrained("bert-base-uncased")
date_model = BertForTokenClassification.from_pretrained("models/bert_date_ner_model_new2")
date_model.eval()
label_map = {0: 'O', 1: 'B-DATE', 2: 'I-DATE'}

# Task Summarization
summarizer_tokenizer = T5Tokenizer.from_pretrained("t5-small")
summarizer_model = T5ForConditionalGeneration.from_pretrained("models/tasksummarization_model")
summarizer_model.eval()

# ----------- Request Model ----------- #
class TextReq(BaseModel):
    text: str

# ----------- Core Inference Functions ----------- #
def extract_priority(text):
    inputs = priority_tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = priority_model(**inputs)
    pred = torch.argmax(outputs.logits, dim=1).item()
    return ["high", "medium", "low"][pred]

def extract_date(text):
    inputs = date_tokenizer(
        text,
        return_offsets_mapping=True,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        max_length=128
    )
    offset_mapping = inputs.pop("offset_mapping")

    with torch.no_grad():
        outputs = date_model(**inputs)

    logits = outputs.logits
    predictions = torch.argmax(logits, dim=2)[0].tolist()
    offsets = offset_mapping[0]
    tokens = date_tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])

    date_tokens = []
    for pred, (start, end) in zip(predictions, offsets):
        label = label_map[pred]
        if label in ["B-DATE", "I-DATE"] and start != 0:
            date_tokens.append(text[start:end])

    if date_tokens:
        date_str = ' '.join(date_tokens)
        parsed_date = dateparser.parse(date_str)
        if parsed_date:
            return parsed_date.date().isoformat()
    return "unspecified"

def extract_summary(text):
    input_text = "summarize: " + text
    inputs = summarizer_tokenizer.encode(input_text, return_tensors="pt", max_length=128, truncation=True)
    with torch.no_grad():
        outputs = summarizer_model.generate(inputs, max_length=32, num_beams=4, early_stopping=True)
    return summarizer_tokenizer.decode(outputs[0], skip_special_tokens=True)

def extract_task(text):
    return {
        "title": text,
        "description": extract_summary(text),
        "due_date": extract_date(text),
        "priority": extract_priority(text)
    }

# ----------- FastAPI Endpoints ----------- #
@app.post("/text-to-task")
def text_to_task(req: TextReq):
    return {"task": extract_task(req.text)}

@app.post("/audio-to-task")
async def audio_to_task(audio: UploadFile = File(...)):
    temp_input_path = "temp_input.webm"
    temp_output_path = "temp.wav"

    with open(temp_input_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    if os.path.getsize(temp_input_path) == 0:
        raise Exception("Uploaded file is empty!")

    subprocess.run([
        "ffmpeg", "-y", "-i", temp_input_path,
        "-ar", "16000", "-ac", "1", temp_output_path
    ], check=True)

    segments, _ = asr_model.transcribe(temp_output_path)
    transcribed_text = " ".join(segment.text for segment in segments)

    task = extract_task(transcribed_text)
    return {
        "text": transcribed_text,
        "task": task
    }

# ----------- Run Server (for direct execution) ----------- #
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
