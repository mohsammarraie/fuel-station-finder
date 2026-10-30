package com.fuelstationfinder;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApiErrorController implements ErrorController {
    @RequestMapping("/error")
    public ResponseEntity<?> error(HttpServletRequest request) {
        var status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        if (status instanceof Integer code && code == 404) {
            return ResponseEntity.status(404).body(Map.of("error", Map.of(
                    "code", "NOT_FOUND", "message", "The requested resource was not found.")));
        }
        return ResponseEntity.status(500).body(Map.of("error", Map.of(
                "code", "INTERNAL_SERVER_ERROR", "message", "An unexpected error occurred.")));
    }
}
