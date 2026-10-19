package vn.beestore.api.storage;

/**
 * Object storage for product images (README §3.2: local volume in dev, S3-compatible later). Keys are relative,
 * slash-separated paths such as {@code catalog/cpu/amd-epyc-7402/01-top.jpg}.
 */
public interface StorageService {

    void put(String key, byte[] content, String contentType);

    boolean exists(String key);

    long size(String key);

    void delete(String key);

    /** Absolute URL the browser loads the object from ({@code PUBLIC_ASSET_BASE_URL} + key). */
    String publicUrl(String key);
}
