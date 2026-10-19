package vn.beestore.api.storage;

import java.time.Duration;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Serves the local storage directory under {@code /uploads/**} (dev / single-server setups). */
@Configuration
public class StorageWebConfig implements WebMvcConfigurer {

    private final LocalStorageService storage;

    public StorageWebConfig(LocalStorageService storage) {
        this.storage = storage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(storage.root().toUri().toString())
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic());
    }
}
