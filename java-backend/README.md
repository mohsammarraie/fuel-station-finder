# Java backend

A Java 25 / Spring Boot 4.1 alternative to the Express backend. It serves the same `/api` endpoints, uses the same PostgreSQL/PostGIS database and migrations, and works with the existing frontend on port 3000. Run only one backend on that port at a time.

The API provides `GET /api/health` and `GET /api/stations` with search, sorting, and optional radius filtering. The optional ArcGIS importer validates source data before updating stations and records each import attempt. The implementation uses Spring MVC controllers, JDBC for PostGIS queries, and Java records for request and response data.

## Docker Compose

Run from the repository root. Docker is the only host requirement for this workflow.

| Command | Result |
| --- | --- |
| `docker compose up` | Start the database and Java backend; build the image if missing |
| `docker compose up --build` | Rebuild the image after Java source changes, then start both |
| `docker compose up -d database` | Start only the database in the background |
| `docker compose up java-backend` | Start the backend and its database dependency |
| `docker compose up --no-deps java-backend` | Start only the backend; the database must already be running |
| `docker compose down` | Stop and remove containers; keep the database volume |

The backend container runs migrations before serving requests. Compose sets the `local` Spring profile and connects to the database at the Compose hostname `database`. Check `http://localhost:3000/api/health` after startup. To add ten example stations to a fresh database:

```bash
docker compose exec java-backend java -jar /app/app.jar --spring.main.web-application-type=none --app.command=seed
```

On Apple Silicon, Java runs in an ARM64 container. The existing PostGIS image is AMD64-only, so Docker Desktop emulates that database container.

## Maven / IntelliJ

For a host Java run, install JDK 25 and Maven. Start the database from the repository root, then run these commands in `java-backend`:

```bash
docker compose up -d database
cd java-backend
mvn spring-boot:run -Dspring-boot.run.profiles=local '-Dspring-boot.run.arguments=--spring.main.web-application-type=none --app.command=migrate'
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

The migration is safe to repeat. Seed with the same command, changing `--app.command=migrate` to `--app.command=seed`; skip it if stations already exist. Use `--app.command=import` for a live import. The source URL is configured in [`application.properties`](src/main/resources/application.properties) and can be overridden with `STATION_SOURCE_URL`.

Use `mvn test` for tests, `mvn package` for an executable JAR, or `mvn clean verify` for a clean build. The tests cover HTTP responses, query validation, repository SQL construction, ArcGIS responses, and import outcomes; mocked JDBC tests do not replace a database integration check.

In IntelliJ, import `pom.xml`, select JDK 25, and run `com.fuelstationfinder.FuelStationApplication` with **Active profiles** set to `local`. For a plain Application configuration, put `--spring.profiles.active=local` in **Program arguments**. The profile is deliberately not the default in [`application.properties`](src/main/resources/application.properties).

## Database configuration

[`application-local.properties`](src/main/resources/application-local.properties) contains the connection settings for the Docker database when the Java process runs on the host. In Compose, `SPRING_DATASOURCE_URL` points to `database:5432` instead of `localhost:5432`. For another database, set `SPRING_DATASOURCE_URL` (a `jdbc:postgresql://` URL), `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`, and select a profile other than `local`.

The frontend continues to send `/api` requests to port 3000. Its setup is in the [root README](../README.md).
