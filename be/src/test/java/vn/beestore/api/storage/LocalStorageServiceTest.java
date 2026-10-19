package vn.beestore.api.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import vn.beestore.api.common.config.AppProperties;

class LocalStorageServiceTest {

    @TempDir
    Path dir;

    private LocalStorageService storage(String driver) {
        return new LocalStorageService(new AppProperties(
                null,
                null,
                null,
                new AppProperties.Storage(driver, dir.toString(), "http://cdn.test/uploads/"),
                null,
                null,
                null,
                null,
                false));
    }

    @Test
    void storesReadsAndDeletes() {
        LocalStorageService s = storage("local");
        s.put("catalog/cpu/a/01.jpg", new byte[] {1, 2, 3}, "image/jpeg");
        assertThat(s.exists("catalog/cpu/a/01.jpg")).isTrue();
        assertThat(s.size("catalog/cpu/a/01.jpg")).isEqualTo(3);
        s.delete("catalog/cpu/a/01.jpg");
        assertThat(s.exists("catalog/cpu/a/01.jpg")).isFalse();
    }

    @Test
    void publicUrlEncodesEachSegment() {
        assertThat(storage("local").publicUrl("catalog/main/H12D 1P/01.png"))
                .isEqualTo("http://cdn.test/uploads/catalog/main/H12D%201P/01.png");
    }

    @Test
    void rejectsKeysThatEscapeTheRoot() {
        LocalStorageService s = storage("local");
        for (String bad : new String[] {"../secret.txt", "a/../../b", "/etc/passwd", "a\\b"}) {
            assertThatThrownBy(() -> s.resolve(bad)).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    void unsupportedDriverFailsFast() {
        assertThatThrownBy(() -> storage("s3")).isInstanceOf(IllegalStateException.class);
    }
}
