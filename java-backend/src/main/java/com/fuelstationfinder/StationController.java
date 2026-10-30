package com.fuelstationfinder;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StationController {
    private final StationService service;
    public StationController(StationService service) { this.service = service; }

    @GetMapping("/api/health")
    public Health health() { return new Health("ok"); }

    @GetMapping("/api/stations")
    public StationResponse stations(HttpServletRequest request) {
        var stations = service.findAll(StationQuery.parse(request.getParameterMap()));
        return new StationResponse(stations, new Meta(stations.size()));
    }

    public record Health(String status) {}
    public record Meta(int count) {}
    public record StationResponse(List<Station> data, Meta meta) {}
}
