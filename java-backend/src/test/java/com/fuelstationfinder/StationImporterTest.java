package com.fuelstationfinder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class StationImporterTest {
    private DataSource dataSource;
    private Connection connection;
    private PreparedStatement statement;
    private ArcGisClient source;
    private List<String> sql;

    @BeforeEach void setUp() throws Exception {
        dataSource = mock(DataSource.class);
        connection = mock(Connection.class);
        statement = mock(PreparedStatement.class);
        source = mock(ArcGisClient.class);
        sql = new ArrayList<>();
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(anyString())).thenAnswer(invocation -> {
            sql.add(invocation.getArgument(0));
            return statement;
        });
        when(statement.getUpdateCount()).thenReturn(2);
        var runId = mock(ResultSet.class);
        when(runId.getLong(1)).thenReturn(42L);
        when(statement.executeQuery()).thenReturn(runId);
        when(source.sourceUrl()).thenReturn("https://example.test/query");
    }

    @Test void successfulImportCommitsAndRecordsCounts() throws Exception {
        when(source.fetchStations()).thenReturn(List.of(new ArcGisClient.SourceStation(98, "Bonner Str.", 6.96, 50.94)));

        new StationImporter(dataSource, source).run();

        assertTrue(sql.stream().anyMatch(value -> value.contains("ON CONFLICT (external_id) DO UPDATE")));
        assertTrue(sql.stream().anyMatch(value -> value.contains("UPDATE stations SET is_active = FALSE")));
        assertTrue(sql.stream().anyMatch(value -> value.contains("status = 'succeeded'")));
        assertFalse(sql.stream().anyMatch(value -> value.contains("status = 'failed'")));
        verify(statement).setObject(1, 1); // fetched count
        verify(statement).setObject(2, 1); // upserted count
        verify(statement).setObject(3, 2); // deactivated count
        verify(connection).commit();
        verify(connection, never()).rollback();
        assertTrue(sql.getLast().contains("pg_advisory_unlock"));
    }

    @Test void emptySourceRecordsFailureWithoutDeactivatingStations() throws Exception {
        when(source.fetchStations()).thenReturn(List.of());

        var failure = assertThrows(IllegalStateException.class, () -> new StationImporter(dataSource, source).run());

        assertEquals("Station import failed", failure.getMessage());
        assertTrue(sql.stream().anyMatch(value -> value.contains("status = 'failed'")));
        assertFalse(sql.stream().anyMatch(value -> value.contains("UPDATE stations SET is_active = FALSE")));
        verify(connection, never()).commit();
        assertTrue(sql.getLast().contains("pg_advisory_unlock"));
    }
}
