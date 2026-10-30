package com.fuelstationfinder;

import static org.junit.jupiter.api.Assertions.*;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class ArcGisClientTest {
    @Test void paginatesAndValidatesBeforeReturning() throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/query", exchange -> {
            var second = exchange.getRequestURI().getQuery().contains("resultOffset=1");
            var body = second ? """
                    {"features":[{"attributes":{"objectid":2,"adresse":"Second"},"geometry":{"x":6.97,"y":50.95}}],"exceededTransferLimit":false}
                    """ : """
                    {"features":[{"attributes":{"objectid":1,"adresse":"First"},"geometry":{"x":6.96,"y":50.94}}],"exceededTransferLimit":true}
                    """;
            var bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            try (var output = exchange.getResponseBody()) { output.write(bytes); }
        });
        server.start();
        try {
            var client = new ArcGisClient(new JsonMapper(), "http://127.0.0.1:" + server.getAddress().getPort() + "/query",
                    1, HttpClient.newHttpClient());
            var stations = client.fetchStations();
            assertEquals(2, stations.size());
            assertEquals(new ArcGisClient.SourceStation(1, "First", 6.96, 50.94), stations.getFirst());
        } finally { server.stop(0); }
    }

    @Test void rejectsHtmlInsteadOfTreatingItAsAnEmptyImport() throws Exception {
        assertRejected("<html>Redirected source</html>", "Invalid station source response");
    }

    @Test void rejectsDuplicateSourceIdsBeforeImportingAnyRecords() throws Exception {
        assertRejected("""
                {"features":[
                  {"attributes":{"objectid":1,"adresse":"First"},"geometry":{"x":6.96,"y":50.94}},
                  {"attributes":{"objectid":1,"adresse":"Second"},"geometry":{"x":6.97,"y":50.95}}
                ],"exceededTransferLimit":false}
                """, "duplicate objectid 1");
    }

    private static void assertRejected(String body, String expectedMessage) throws Exception {
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/query", exchange -> {
            var bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            try (var output = exchange.getResponseBody()) { output.write(bytes); }
        });
        server.start();
        try {
            var client = new ArcGisClient(new JsonMapper(),
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/query", 500, HttpClient.newHttpClient());
            assertTrue(assertThrows(IOException.class, client::fetchStations).getMessage().contains(expectedMessage));
        } finally { server.stop(0); }
    }
}
