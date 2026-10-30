package com.fuelstationfinder;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Component
@Lazy
public class ArcGisClient {
    private final HttpClient http;
    private final JsonMapper json;
    private final String sourceUrl;
    private final int pageSize;

    @Autowired
    public ArcGisClient(JsonMapper json, @Value("${station.source-url}") String sourceUrl,
            @Value("${station.import-page-size}") int pageSize) {
        this(json, sourceUrl, pageSize,
                HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build());
    }

    ArcGisClient(JsonMapper json, String sourceUrl, int pageSize, HttpClient http) {
        this.json = json;
        this.sourceUrl = sourceUrl;
        this.pageSize = pageSize;
        this.http = http;
        if (pageSize < 1 || pageSize > 5_000) throw new IllegalArgumentException("STATION_IMPORT_PAGE_SIZE must be 1 to 5000");
    }

    public String sourceUrl() { return sourceUrl; }

    public List<SourceStation> fetchStations() throws IOException, InterruptedException {
        var stations = new ArrayList<SourceStation>();
        var ids = new HashSet<Integer>();
        int offset = 0;
        for (int page = 0; page < 1_000; page++) {
            var query = "where=objectid+is+not+null&outFields=objectid%2Cadresse&returnGeometry=true&outSR=4326"
                    + "&orderByFields=objectid+ASC&resultOffset=" + offset + "&resultRecordCount=" + pageSize + "&f=json";
            var uri = URI.create(sourceUrl + (sourceUrl.contains("?") ? "&" : "?") + query);
            var request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(30))
                    .header("Accept", "application/json").GET().build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300)
                throw new IOException("Station source request failed with HTTP " + response.statusCode());
            JsonNode payload;
            try { payload = json.readTree(response.body()); }
            catch (RuntimeException exception) { throw new IOException("Invalid station source response", exception); }
            if (payload.has("error")) throw new IOException("ArcGIS error: " + payload.path("error").path("message").asText());
            var features = payload.path("features");
            if (!features.isArray()) throw new IOException("Invalid station source response: features must be an array");
            for (var feature : features) {
                var attributes = feature.path("attributes");
                var geometry = feature.path("geometry");
                var id = attributes.path("objectid");
                var address = attributes.path("adresse");
                var longitude = geometry.path("x");
                var latitude = geometry.path("y");
                if (!id.isIntegralNumber() || id.asInt() < 1 || !address.isString() || address.asText().trim().isEmpty()
                        || !longitude.isNumber() || !latitude.isNumber()
                        || longitude.asDouble() < -180 || longitude.asDouble() > 180
                        || latitude.asDouble() < -90 || latitude.asDouble() > 90)
                    throw new IOException("Invalid station source response: malformed feature");
                if (!ids.add(id.asInt())) throw new IOException("Station source returned duplicate objectid " + id.asInt());
                stations.add(new SourceStation(id.asInt(), address.asText().trim(), longitude.asDouble(), latitude.asDouble()));
            }
            var limit = payload.path("exceededTransferLimit");
            boolean more = limit.isBoolean() ? limit.asBoolean() : features.size() == pageSize;
            if (!more) return stations;
            if (features.isEmpty()) throw new IOException("Station source indicated another page but returned no records");
            offset += features.size();
        }
        throw new IOException("Station import exceeded 1000 pages");
    }

    public record SourceStation(int externalId, String address, double longitude, double latitude) {}
}
