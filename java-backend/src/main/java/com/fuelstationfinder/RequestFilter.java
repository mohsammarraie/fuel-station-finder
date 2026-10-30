package com.fuelstationfinder;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var incoming = request.getHeader("X-Request-Id");
        var trimmed = incoming == null ? "" : incoming.trim();
        var id = trimmed.isEmpty() || trimmed.length() > 100 ? UUID.randomUUID().toString() : trimmed;
        response.setHeader("X-Request-Id", id);
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE");
        response.setHeader("Access-Control-Allow-Headers", request.getHeader("Access-Control-Request-Headers") == null
                ? "*" : request.getHeader("Access-Control-Request-Headers"));
        if ("OPTIONS".equals(request.getMethod())) { response.setStatus(204); return; }
        var started = System.nanoTime();
        try { chain.doFilter(request, response); }
        finally {
            if (!"/api/health".equals(request.getRequestURI()))
                log.info("requestId={} method={} path={} status={} durationMs={}", id, request.getMethod(),
                        request.getRequestURI(), response.getStatus(), (System.nanoTime() - started) / 1_000_000);
        }
    }
}
