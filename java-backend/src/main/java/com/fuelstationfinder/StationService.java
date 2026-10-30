package com.fuelstationfinder;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class StationService {
    private final StationRepository repository;
    public StationService(StationRepository repository) { this.repository = repository; }
    public List<Station> findAll(StationQuery query) { return repository.findAll(query); }
}
