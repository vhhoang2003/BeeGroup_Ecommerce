package vn.beestore.api.admin.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import vn.beestore.api.admin.service.RevalidationNotifier.ContentChanged;
import vn.beestore.api.common.config.AppProperties;

/** README §6.7: on-demand revalidation call to the Next.js server. */
class RevalidationNotifierTest {

    private static AppProperties props(String url) {
        return new AppProperties(
                null, null, null, null, null, new AppProperties.Revalidate(url, "s3cret"), null, null, false);
    }

    record Received(String upgrade, String body) {}

    @Test
    void postsSecretAndPathsOverPlainHttp11() throws Exception {
        CompletableFuture<Received> received = new CompletableFuture<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/revalidate", exchange -> {
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            received.complete(new Received(exchange.getRequestHeaders().getFirst("Upgrade"), body));
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        server.start();
        try {
            String url = "http://127.0.0.1:" + server.getAddress().getPort() + "/api/revalidate";
            new RevalidationNotifier(RestClient.builder(), props(url))
                    .onContentChanged(new ContentChanged(List.of("/", "/products/amd-epyc-7402")));

            Received request = received.get(5, TimeUnit.SECONDS);
            // Node.js drops requests that ask for an h2c upgrade, so the client must not send one.
            assertThat(request.upgrade()).isNull();
            assertThat(request.body()).contains("\"secret\":\"s3cret\"").contains("/products/amd-epyc-7402");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void skipsWhenNotConfigured() {
        new RevalidationNotifier(RestClient.builder(), props("")).onContentChanged(new ContentChanged(List.of("/")));
    }
}
