# ─────────────────────────────────────────────
# Stage 1: Build JAR
# ─────────────────────────────────────────────
FROM gradle:8.5-jdk17-alpine AS builder

WORKDIR /app
COPY build.gradle .
COPY settings.gradle .
RUN gradle dependencies --no-daemon
COPY src/ src/
RUN gradle clean bootJar --no-daemon

# ─────────────────────────────────────────────
# Stage 2: Runtime
# ─────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

# Install su-exec for clean privilege dropping
RUN apk add --no-cache su-exec

WORKDIR /app

RUN addgroup -S myaangan && adduser -S myaangan -G myaangan

# Pre-create uploads dir — Docker named volume will mount over this
# but the entrypoint will fix ownership at runtime
RUN mkdir -p /app/uploads/photos

COPY --from=builder /app/build/libs/myaangan-backend.jar app.jar
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && chown myaangan:myaangan app.jar

EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
