# README §12.3: multi-stage build, non-root runtime on Temurin 21.
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q package -DskipTests -Djacoco.skip=true -Dspotless.check.skip=true

FROM eclipse-temurin:21-jre-alpine
# libwebp tools are not needed: scrimage-webp ships its own cwebp binaries; libstdc++/libgcc let them run on Alpine.
RUN apk add --no-cache libstdc++ libgcc && addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
