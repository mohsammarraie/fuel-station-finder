package com.fuelstationfinder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.sql.ResultSet;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

class StationRepositoryTest {
    @Test void defaultQueryOnlyReturnsActiveStationsInAddressOrder() {
        var jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<Station>>any(), any(Object[].class)))
                .thenReturn(List.of());

        new StationRepository(jdbc).findAll(new StationQuery(null, null, null, null, "asc"));

        var sql = ArgumentCaptor.forClass(String.class);
        var values = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc).query(sql.capture(), org.mockito.ArgumentMatchers.<RowMapper<Station>>any(), values.capture());
        assertTrue(sql.getValue().contains("WHERE is_active = TRUE ORDER BY lower(address) ASC, id ASC"));
        assertArrayEquals(new Object[0], values.getValue());
    }

    @Test void locationAndSearchUseBoundValuesAndEscapeWildcards() {
        var jdbc = mock(JdbcTemplate.class);
        new StationRepository(jdbc).findAll(new StationQuery(50.94, 6.96, 5, "50%_!", "nearest"));

        var sql = ArgumentCaptor.forClass(String.class);
        var values = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc).query(sql.capture(), org.mockito.ArgumentMatchers.<RowMapper<Station>>any(), values.capture());
        assertTrue(sql.getValue().contains("ST_DWithin"));
        assertTrue(sql.getValue().contains("LIKE lower(?) ESCAPE '!'"));
        assertTrue(sql.getValue().contains("ORDER BY distance_km ASC"));
        assertFalse(sql.getValue().contains("50%_!"));
        assertArrayEquals(new Object[]{6.96, 50.94, 6.96, 50.94, 5_000, "%50!%!_!!%"}, values.getValue());
    }

    @Test void mapsCoordinatesAndRoundsDistanceToThreeDecimals() throws Exception {
        var jdbc = mock(JdbcTemplate.class);
        var row = mock(ResultSet.class);
        when(row.getLong("id")).thenReturn(7L);
        when(row.getInt("external_id")).thenReturn(98);
        when(row.getString("address")).thenReturn("Bonner Str.");
        when(row.getDouble("latitude")).thenReturn(50.94);
        when(row.getDouble("longitude")).thenReturn(6.96);
        when(row.getObject("distance_km", Double.class)).thenReturn(1.23456);
        when(jdbc.query(anyString(), org.mockito.ArgumentMatchers.<RowMapper<Station>>any(), any(Object[].class)))
                .thenAnswer(invocation -> List.of(invocation.<RowMapper<Station>>getArgument(1).mapRow(row, 0)));

        var result = new StationRepository(jdbc).findAll(new StationQuery(null, null, null, null, "asc"));

        assertEquals(List.of(new Station(7, 98, "Bonner Str.", 50.94, 6.96, 1.235)), result);
    }
}
