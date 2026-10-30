package com.fuelstationfinder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import javax.sql.DataSource;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Lazy;

@Component
public class MaintenanceCommands {
    private final DataSource dataSource;
    private final StationImporter importer;

    public MaintenanceCommands(DataSource dataSource, @Lazy StationImporter importer) {
        this.dataSource = dataSource;
        this.importer = importer;
    }

    public void run(String command) {
        try {
            switch (command) {
                case "migrate" -> migrate();
                case "seed" -> seed();
                case "import" -> importer.run();
                default -> throw new IllegalArgumentException("Unknown app.command: " + command);
            }
        } catch (SQLException | IOException exception) {
            throw new IllegalStateException("Maintenance command failed: " + command, exception);
        }
    }

    private void migrate() throws SQLException, IOException {
        try (var connection = dataSource.getConnection()) {
            Sql.execute(connection, "SELECT pg_advisory_lock(hashtext(?))", "fuel-station-finder:migrations");
            try {
                Sql.execute(connection, "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)");
                var applied = new HashSet<Integer>();
                try (var statement = connection.createStatement(); var result = statement.executeQuery("SELECT version FROM schema_migrations")) {
                    while (result.next()) applied.add(result.getInt(1));
                }
                for (var migration : List.of(new Migration(1, "create stations", "V1__create_stations.sql"),
                        new Migration(2, "add station import tracking", "V2__add_station_import_tracking.sql"))) {
                    if (applied.contains(migration.version())) continue;
                    connection.setAutoCommit(false);
                    try {
                        var resource = "/migrations/" + migration.file();
                        try (var input = getClass().getResourceAsStream(resource)) {
                            if (input == null) throw new IOException("Missing migration: " + resource);
                            try (var statement = connection.createStatement()) {
                                statement.execute(new String(input.readAllBytes(), StandardCharsets.UTF_8));
                            }
                        }
                        Sql.execute(connection, "INSERT INTO schema_migrations (version, name) VALUES (?, ?)", migration.version(), migration.name());
                        connection.commit();
                    } catch (SQLException | IOException exception) {
                        connection.rollback();
                        throw exception;
                    } finally { connection.setAutoCommit(true); }
                }
            } finally { Sql.execute(connection, "SELECT pg_advisory_unlock(hashtext(?))", "fuel-station-finder:migrations"); }
        }
    }

    private void seed() throws SQLException {
        try (var connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                for (var station : List.of(
                        new Seed(98, "Bonner Str. 98 (50677 Neustadt/Süd)", 6.960644911005172, 50.916095041454554),
                        new Seed(99, "Hülchrather Str. 17 (50670 Neustadt/Nord)", 6.961069175632063, 50.954466539174284),
                        new Seed(100, "Siegburger Str. 116 (50679 Deutz)", 6.979491940887355, 50.923288946783285),
                        new Seed(101, "Marsilstein 3 (50676 Altstadt/Süd)", 6.944522335446989, 50.935113088265084),
                        new Seed(102, "Deutz-Kalker Str. 103 (50679 Deutz)", 6.9917132640677755, 50.937189337758255),
                        new Seed(103, "Ringstr. 21 (50996 Rodenkirchen)", 6.9919236852224, 50.89030570672304),
                        new Seed(104, "Brühler Str. 223 (50968 Raderthal)", 6.953723006149421, 50.89987757453494),
                        new Seed(112, "Aachener Str. 1035 (50858 Junkersdorf)", 6.8581281326722605, 50.93767146119405),
                        new Seed(124, "Flughafen/Nordallee (51147 Köln)", 7.112903272879867, 50.88113367263274),
                        new Seed(51, "Neusser Landstr. 323 (50769 Worringen)", 6.864124787483406, 51.067769336314974))) {
                    Sql.execute(connection, """
                            INSERT INTO stations (external_id, address, location, is_active, last_seen_at)
                            VALUES (?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, TRUE, CURRENT_TIMESTAMP)
                            ON CONFLICT (external_id) DO UPDATE SET address = EXCLUDED.address,
                              location = EXCLUDED.location, is_active = TRUE, last_seen_at = CURRENT_TIMESTAMP
                            WHERE stations.address IS DISTINCT FROM EXCLUDED.address
                              OR NOT ST_Equals(stations.location::geometry, EXCLUDED.location::geometry)
                              OR stations.is_active = FALSE
                            """, station.id(), station.address(), station.longitude(), station.latitude());
                }
                connection.commit();
            } catch (SQLException exception) { connection.rollback(); throw exception; }
        }
    }

    private record Migration(int version, String name, String file) {}
    private record Seed(int id, String address, double longitude, double latitude) {}
}
