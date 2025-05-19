# Dockerfile inside task-service (same for other services)
FROM maven:3.9.5-eclipse-temurin-17 AS build

WORKDIR /build
COPY . .

# Build only the task-service module
RUN mvn -pl task-service clean package -DskipTests

FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=build /build/task-service/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
