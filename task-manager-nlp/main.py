from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from faster_whisper import WhisperModel
import torch
import subprocess
import os
import shutil
import dateparser
import requests

from transformers import (
    T5Tokenizer, T5ForConditionalGeneration,
    BertTokenizer, BertForSequenceClassification,
    BertTokenizerFast, BertForTokenClassification
)

app = FastAPI()

# Directories and URLs
//model download
MODEL_DIR = "models"
MODEL_DOWNLOADS = {
    "priority_model": {
        "path": os.path.join(MODEL_DIR, "priority_model"),
        "url": "https://drive.google.com/file/d/1Ge4oju6JDdRo7B6PrAXyDycOtpwDAhY-/view?usp=drive_link"
    },
    "bert_date_ner_model_new2": {
        "path": os.path.join(MODEL_DIR, "bert_date_ner_model_new2"),
        "url": "https://drive.google.com/file/d/1269h1y9VbPAZUQ5qzme1VmTN802MReUX/view?usp=drive_link"
    },
    "tasksummarization_model": {
        "path": os.path.join(MODEL_DIR, "tasksummarization_model"),
        "url": "https://drive.google.com/file/d/1EPHl69jyh_A79ETTbRY24zCsrkuTKR2B/view?usp=drive_link"
    }
}

label_map = {0: 'O', 1: 'B-DATE', 2: 'I-DATE'}

# Lazy-loaded models
asr_model = None
priority_model = None
priority_tokenizer = None
date_model = None
date_tokenizer = None
summarizer_model = None
summarizer_tokenizer = None

class Task(BaseModel):
    summary: str
    priority: str
    date: str

@app.on_event("startup")
async def download_all_models():
    os.makedirs(MODEL_DIR, exist_ok=True)
    for name, meta in MODEL_DOWNLOADS.items():
        await download_model_if_not_exists(meta["path"], meta["url"])

async def download_model_if_not_exists(path: str, url: str):
    if not os.path.exists(path):
        print(f"Downloading {path} from {url}")
        response = requests.get(url, stream=True)
        zip_path = path + ".zip"
        with open(zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        shutil.unpack_archive(zip_path, path)
        os.remove(zip_path)
        print(f"{path} downloaded and extracted.")
    else:
        print(f"{path} already exists.")

@app.get("/")
def read_root():
    return {"message": "Task Extractor API"}

@app.post("/audio-to-task")
async def audio_to_task(audio: UploadFile = File(...)):
    global asr_model
    if asr_model is None:
        asr_model = WhisperModel("base")

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

    os.remove(temp_input_path)
    os.remove(temp_output_path)

    task = extract_task(transcribed_text)
    return {
        "text": transcribed_text,
        "task": task
    }

def extract_task(text):
    summary = extract_summary(text)
    priority = extract_priority(text)
    date = extract_date(text)
    return Task(summary=summary, priority=priority, date=date)

def extract_summary(text):
    global summarizer_model, summarizer_tokenizer
    if summarizer_model is None or summarizer_tokenizer is None:
        path = MODEL_DOWNLOADS["tasksummarization_model"]["path"]
        summarizer_tokenizer = T5Tokenizer.from_pretrained("t5-small")
        summarizer_model = T5ForConditionalGeneration.from_pretrained(path)
        summarizer_model.eval()

    input_text = "summarize: " + text
    inputs = summarizer_tokenizer.encode(input_text, return_tensors="pt", max_length=128, truncation=True)
    with torch.no_grad():
        outputs = summarizer_model.generate(inputs, max_length=32, num_beams=4, early_stopping=True)
    return summarizer_tokenizer.decode(outputs[0], skip_special_tokens=True)

def extract_priority(text):
    global priority_model, priority_tokenizer
    if priority_model is None or priority_tokenizer is None:
        path = MODEL_DOWNLOADS["priority_model"]["path"]
        priority_tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
        priority_model = BertForSequenceClassification.from_pretrained(path)
        priority_model.eval()

    inputs = priority_tokenizer(t