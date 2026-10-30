package com.fuelstationfinder;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

public record StationQuery(Double latitude, Double longitude, Integer radiusKm, String search, String sort) {
    private static final Set<String> KEYS = Set.of("lat", "lng", "radius", "search", "sort");
    private static final Pattern DECIMAL = Pattern.compile("[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)");

    public static StationQuery parse(Map<String, String[]> parameters) {
        var errors = new ArrayList<QueryIssue>();
        for (var key : parameters.keySet()) {
            if (!KEYS.contains(key)) errors.add(new QueryIssue("", "Unrecognized key: \"" + key + "\""));
            if (parameters.get(key).length != 1) errors.add(new QueryIssue(key, "Expected string, received array"));
        }
        var lat = decimal(parameters, "lat", -90, 90, errors);
        var lng = decimal(parameters, "lng", -180, 180, errors);
        var radiusText = one(parameters, "radius");
        Integer radius = null;
        if (radiusText != null) {
            if (Set.of("2", "5", "10").contains(radiusText)) radius = Integer.valueOf(radiusText);
            else errors.add(new QueryIssue("radius", "Invalid option: expected one of \"2\"|\"5\"|\"10\""));
        }
        var search = one(parameters, "search");
        if (search != null) {
            search = search.trim();
            if (search.length() > 100) errors.add(new QueryIssue("search", "Must contain at most 100 characters."));
            if (search.isEmpty()) search = null;
        }
        var sort = one(parameters, "sort");
        if (sort == null) sort = "asc";
        else if (!Set.of("asc", "desc", "nearest", "farthest").contains(sort))
            errors.add(new QueryIssue("sort", "Invalid option: expected one of \"asc\"|\"desc\"|\"nearest\"|\"farthest\""));
        int supplied = (parameters.containsKey("lat") ? 1 : 0) + (parameters.containsKey("lng") ? 1 : 0)
                + (parameters.containsKey("radius") ? 1 : 0);
        if (supplied != 0 && supplied != 3)
            errors.add(new QueryIssue("location", "lat, lng, and radius must be provided together."));
        if ((sort.equals("nearest") || sort.equals("farthest")) && supplied != 3)
            errors.add(new QueryIssue("sort", "Distance sorting requires lat, lng, and radius."));
        if (!errors.isEmpty()) throw new InvalidQueryException(errors);
        return new StationQuery(lat, lng, radius, search, sort);
    }

    private static String one(Map<String, String[]> parameters, String key) {
        var values = parameters.get(key);
        return values == null || values.length != 1 ? null : values[0];
    }

    private static Double decimal(Map<String, String[]> parameters, String key, double min, double max, List<QueryIssue> errors) {
        var value = one(parameters, key);
        if (value == null) return null;
        if (!DECIMAL.matcher(value.trim()).matches()) {
            errors.add(new QueryIssue(key, "Must be a valid decimal number."));
            return null;
        }
        var number = Double.parseDouble(value.trim());
        if (!Double.isFinite(number) || number < min || number > max) {
            errors.add(new QueryIssue(key, number < min ? "Must be at least " + (int) min + "." : "Must be at most " + (int) max + "."));
        }
        return number;
    }
}
