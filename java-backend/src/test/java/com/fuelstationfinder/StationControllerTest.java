package com.fuelstationfinder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class StationControllerTest {
    private StationService service;
    private MockMvc mvc;

    @BeforeEach void setUp() {
        service = mock(StationService.class);
        mvc = MockMvcBuilders.standaloneSetup(new StationController(service))
                .setControllerAdvice(new ApiExceptionHandler())
                .addFilters(new RequestFilter())
                .build();
    }

    @Test void healthKeepsTheExpressResponseShape() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(header().exists("X-Request-Id"));
        verifyNoInteractions(service);
    }

    @Test void stationsPassesParsedQueryAndReturnsDataAndCount() throws Exception {
        var station = new Station(1, 98, "Bonner Str. 98", 50.916, 6.960, 1.234);
        when(service.findAll(any())).thenReturn(List.of(station));

        mvc.perform(get("/api/stations").param("lat", "50.94").param("lng", "6.96")
                        .param("radius", "5").param("search", " Bonner ").param("sort", "nearest")
                        .header("X-Request-Id", " interview-test "))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Request-Id", "interview-test"))
                .andExpect(jsonPath("$.meta.count").value(1))
                .andExpect(jsonPath("$.data[0].externalId").value(98))
                .andExpect(jsonPath("$.data[0].distanceKm").value(1.234));
        verify(service).findAll(new StationQuery(50.94, 6.96, 5, "Bonner", "nearest"));
    }

    @Test void invalidQueryReturnsBadRequestWithoutCallingDatabase() throws Exception {
        mvc.perform(get("/api/stations").param("radius", "5"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_QUERY"))
                .andExpect(jsonPath("$.error.details[0].field").value("location"));
        verifyNoInteractions(service);
    }

    @Test void unexpectedServiceFailureDoesNotExposeExceptionDetails() throws Exception {
        when(service.findAll(any())).thenThrow(new IllegalStateException("private database detail"));
        mvc.perform(get("/api/stations"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error.code").value("INTERNAL_SERVER_ERROR"))
                .andExpect(jsonPath("$.error.message").value("An unexpected error occurred."));
    }

    @Test void preflightReturnsCorsHeadersWithoutCallingService() throws Exception {
        mvc.perform(options("/api/stations").header("Access-Control-Request-Headers", "X-Example"))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Access-Control-Allow-Origin", "*"))
                .andExpect(header().string("Access-Control-Allow-Headers", "X-Example"));
        verifyNoInteractions(service);
    }
}
