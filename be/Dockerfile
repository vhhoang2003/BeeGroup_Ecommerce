# README §12.3: multi-stage build, non-root runtime on Temurin 21.
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline
COPY src src
RUN ./mvnw -q package -DskipTests -Djacoco.skip=true -Dspotless.check.skip=true

# glibc-based runtime (not Alpine): the cwebp/dwebp binaries bundled with scrimage-webp, used for the WebP image
# variants of ADM-03, are built against glibc and do not run on musl (Decision Log D-11).
FROM eclipse-temurin:21-jre
RUN groupadd --system app && useradd --system --gid app --home-dir /app app \
    && mkdir -p /data/uploads && chown app:app /data/uploads
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
