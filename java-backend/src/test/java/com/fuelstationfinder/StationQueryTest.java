package com.fuelstationfinder;

import static org.junit.jupiter.api.Assertions.*;
import java.util.Map;
import org.junit.jupiter.api.Test;

class StationQueryTest {
    @Test void defaultsAndCombinedFilters() {
        assertEquals(new StationQuery(null, null, null, null, "asc"), StationQuery.parse(Map.of()));
        assertEquals(new StationQuery(50.94, 6.96, 5, "Bonner", "nearest"), StationQuery.parse(Map.of(
                "lat", new String[]{"50.94"}, "lng", new String[]{"6.96"},
                "radius", new String[]{"5"}, "search", new String[]{" Bonner "},
                "sort", new String[]{"nearest"})));
    }

    @Test void rejectsInvalidLocationBeforeDatabaseAccess() {
        var error = assertThrows(InvalidQueryException.class,
                () -> StationQuery.parse(Map.of("radius", new String[]{"5"})));
        assertEquals(new QueryIssue("location", "lat, lng, and radius must be provided together."),
                error.details().getFirst());
    }

    @Test void rejectsUnknownAndUnsafeInputs() {
        assertThrows(InvalidQueryException.class, () -> StationQuery.parse(Map.of("serach", new String[]{"Bonner"})));
        assertThrows(InvalidQueryException.class, () -> StationQuery.parse(Map.of("lat", new String[]{"91"},
                "lng", new String[]{"6.96"}, "radius", new String[]{"5"})));
        assertThrows(InvalidQueryException.class, () -> StationQuery.parse(Map.of("search", new String[]{"x".repeat(101)})));
        assertThrows(InvalidQueryException.class, () -> StationQuery.parse(Map.of("sort", new String[]{"nearest"})));
    }
}
