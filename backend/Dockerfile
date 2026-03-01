# ─────────────────────────────────────────────
# Stage 1: Build JAR using official Gradle image
# ─────────────────────────────────────────────
FROM gradle:8.5-jdk17-alpine AS builder

WORKDIR /app

COPY build.gradle .
COPY settings.gradle .
RUN gradle dependencies --no-daemon

COPY src/ src/
RUN gradle clean bootJar --no-daemon

# ─────────────────────────────────────────────
# Stage 2: Lean runtime image
# ─────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S myaangan && adduser -S myaangan -G myaangan

COPY --from=builder /app/build/libs/myaangan-backend.jar app.jar

RUN chown myaangan:myaangan app.jar

USER myaangan

EXPOSE 8080

# Spring Boot will retry DB connection automatically via:
# spring.datasource.hikari.connection-timeout and JPA ddl-auto
ENTRYPOINT ["java", \
  "-Dspring.datasource.hikari.initializationFailTimeout=60000", \
  "-jar", "app.jar"]
