package com.fuelstationfinder;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Lazy;

@Component
@Lazy
public class StationImporter {
    private static final Logger log = LoggerFactory.getLogger(StationImporter.class);
    private final DataSource dataSource;
    private final ArcGisClient source;

    public StationImporter(DataSource dataSource, ArcGisClient source) {
        this.dataSource = dataSource;
        this.source = source;
    }

    public void run() {
        try (var connection = dataSource.getConnection()) {
            Sql.execute(connection, "SELECT pg_advisory_lock(hashtext(?))", "fuel-station-finder:station-import");
            long runId = 0;
            try {
                try (var statement = connection.prepareStatement("INSERT INTO station_import_runs (status, source_url) VALUES ('running', ?) RETURNING id")) {
                    statement.setString(1, source.sourceUrl());
                    try (var result = statement.executeQuery()) { result.next(); runId = result.getLong(1); }
                }
                var stations = source.fetchStations();
                if (stations.isEmpty()) throw new IllegalStateException("Station source returned no records; synchronization was cancelled");
                var seenAt = Timestamp.from(Instant.now());
                connection.setAutoCommit(false);
                try {
                    for (var station : stations) {
                        Sql.execute(connection, """
                                INSERT INTO stations (external_id, address, location, is_active, last_seen_at)
                                VALUES (?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, TRUE, ?)
                                ON CONFLICT (external_id) DO UPDATE SET address = EXCLUDED.address,
                                  location = EXCLUDED.location, is_active = TRUE, last_seen_at = EXCLUDED.last_seen_at
                                """, station.externalId(), station.address(), station.longitude(), station.latitude(), seenAt);
                    }
                    var deactivated = Sql.execute(connection, "UPDATE stations SET is_active = FALSE WHERE is_active = TRUE AND last_seen_at < ?", seenAt);
                    Sql.execute(connection, """
                            UPDATE station_import_runs SET status = 'succeeded', completed_at = CURRENT_TIMESTAMP,
                              fetched_count = ?, upserted_count = ?, deactivated_count = ? WHERE id = ?
                            """, stations.size(), stations.size(), deactivated, runId);
                    connection.commit();
                    log.info("Station import succeeded: runId={} fetchedCount={} upsertedCount={} deactivatedCount={}",
                            runId, stations.size(), stations.size(), deactivated);
                } catch (Exception exception) { connection.rollback(); throw exception; }
                finally { connection.setAutoCommit(true); }
            } catch (Exception exception) {
                if (runId != 0) {
                    var message = exception.getMessage() == null ? "Unknown station import error" : exception.getMessage();
                    Sql.execute(connection, "UPDATE station_import_runs SET status = 'failed', completed_at = CURRENT_TIMESTAMP, error_message = ? WHERE id = ?",
                            message.substring(0, Math.min(2_000, message.length())), runId);
                }
                throw exception;
            } finally {
                Sql.execute(connection, "SELECT pg_advisory_unlock(hashtext(?))", "fuel-station-finder:station-import");
            }
        } catch (Exception exception) {
            throw new IllegalStateException("Station import failed", exception);
        }
    }
}
