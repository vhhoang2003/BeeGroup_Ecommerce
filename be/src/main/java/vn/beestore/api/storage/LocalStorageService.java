package vn.beestore.api.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import vn.beestore.api.common.config.AppProperties;

/** Stores objects on a local directory / Docker volume ({@code STORAGE_LOCAL_PATH}) served under {@code /uploads}. */
@Service
public class LocalStorageService implements StorageService {

    private final Path root;
    private final String publicBaseUrl;

    public LocalStorageService(AppProperties props) {
        AppProperties.Storage cfg = props.storage();
        if (!"local".equalsIgnoreCase(cfg.driver())) {
            throw new IllegalStateException("STORAGE_DRIVER '" + cfg.driver() + "' is not supported yet; use 'local'");
        }
        this.root = Path.of(cfg.localPath()).toAbsolutePath().normalize();
        this.publicBaseUrl = cfg.publicBaseUrl().replaceAll("/+$", "");
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create storage directory " + root, e);
        }
    }

    public Path root() {
        return root;
    }

    @Override
    public void put(String key, byte[] content, String contentType) {
        Path target = resolve(key);
        try {
            Files.createDirectories(target.getParent());
            Path tmp = Files.createTempFile(target.getParent(), ".upload-", ".tmp");
            Files.write(tmp, content);
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot store " + key, e);
        }
    }

    @Override
    public boolean exists(String key) {
        return Files.isRegularFile(resolve(key));
    }

    @Override
    public long size(String key) {
        try {
            return Files.size(resolve(key));
        } catch (IOException e) {
            return -1;
        }
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot delete " + key, e);
        }
    }

    @Override
    public String publicUrl(String key) {
        String encoded = Arrays.stream(key.split("/"))
                .map(part -> URLEncoder.encode(part, StandardCharsets.UTF_8).replace("+", "%20"))
                .collect(Collectors.joining("/"));
        return publicBaseUrl + "/" + encoded;
    }

    /** Resolves a key inside the storage root and rejects anything that escapes it. */
    Path resolve(String key) {
        if (key == null || key.isBlank() || key.startsWith("/") || key.contains("\\")) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        Path path = root.resolve(key).normalize();
        if (!path.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return path;
    }
}
