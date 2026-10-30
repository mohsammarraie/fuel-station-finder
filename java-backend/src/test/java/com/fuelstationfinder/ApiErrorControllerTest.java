package com.fuelstationfinder;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import jakarta.servlet.RequestDispatcher;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ApiErrorControllerTest {
    @Test void forwardsMissingRoutesAsTheExpectedJson404() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new ApiErrorController()).build();

        mvc.perform(get("/error").requestAttr(RequestDispatcher.ERROR_STATUS_CODE, 404))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.error.message").value("The requested resource was not found."));
    }
}
