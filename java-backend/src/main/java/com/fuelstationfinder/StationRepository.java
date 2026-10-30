package com.fuelstationfinder;

import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class StationRepository {
    private final JdbcTemplate jdbc;

    public StationRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<Station> findAll(StationQuery query) {
        var values = new ArrayList<Object>();
        var conditions = new ArrayList<String>();
        conditions.add("is_active = TRUE");
        String distance = "NULL::DOUBLE PRECISION";
        if (query.latitude() != null) {
            var point = "ST_SetSRID(ST_MakePoint(?::DOUBLE PRECISION, ?::DOUBLE PRECISION), 4326)::GEOGRAPHY";
            distance = "ST_Distance(location, " + point + ") / 1000.0";
            values.add(query.longitude());
            values.add(query.latitude());
            conditions.add("ST_DWithin(location, " + point + ", ?)");
            values.add(query.longitude());
            values.add(query.latitude());
            values.add(query.radiusKm() * 1_000);
        }
        if (query.search() != null) {
            conditions.add("lower(address) LIKE lower(?) ESCAPE '!'");
            values.add("%" + query.search().replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%");
        }
        var order = switch (query.sort()) {
            case "nearest" -> "distance_km ASC, lower(address) ASC, id ASC";
            case "farthest" -> "distance_km DESC, lower(address) ASC, id ASC";
            case "desc" -> "lower(address) DESC, id DESC";
            default -> "lower(address) ASC, id ASC";
        };
        var sql = """
                SELECT id, external_id, address,
                  ST_Y(location::geometry) AS latitude,
                  ST_X(location::geometry) AS longitude,
                """ + distance + " AS distance_km FROM stations WHERE " + String.join(" AND ", conditions)
                + " ORDER BY " + order;
        return jdbc.query(sql, (row, index) -> {
            var km = row.getObject("distance_km", Double.class);
            return new Station(row.getLong("id"), row.getInt("external_id"), row.getString("address"),
                    row.getDouble("latitude"), row.getDouble("longitude"),
                    km == null ? null : Math.round(km * 1000.0) / 1000.0);
        }, values.toArray());
    }
}
