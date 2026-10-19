package vn.beestore.api.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;
import vn.beestore.api.storage.ImageProcessor.Format;
import vn.beestore.api.storage.ImageProcessor.ProcessedImage;

/** ADM-03 / SEC-11. */
class ImageProcessorTest {

    private final ImageProcessor processor = new ImageProcessor();

    @Test
    void sniffsFormatsByMagicBytes() {
        assertThat(ImageProcessor.sniff(new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0}))
                .isEqualTo(Format.JPEG);
        assertThat(ImageProcessor.sniff(new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}))
                .isEqualTo(Format.PNG);
        assertThat(ImageProcessor.sniff("RIFF0000WEBPVP8 ".getBytes(StandardCharsets.US_ASCII)))
                .isEqualTo(Format.WEBP);
        assertThat(ImageProcessor.sniff("GIF89a".getBytes(StandardCharsets.US_ASCII)))
                .isNull();
        assertThat(ImageProcessor.sniff("<svg/>".getBytes(StandardCharsets.US_ASCII)))
                .isNull();
    }

    @Test
    void producesThreeWebpVariantsWithoutUpscaling() throws Exception {
        ProcessedImage big = processor.process(jpeg(2400, 1200));
        assertThat(big.width()).isEqualTo(2400);
        assertThat(big.variants()).containsOnlyKeys(320, 800, 1600);
        assertThat(width(big.variants().get(320))).isEqualTo(320);
        assertThat(width(big.variants().get(1600))).isEqualTo(1600);
        big.variants().values().forEach(v -> assertThat(ImageProcessor.sniff(v)).isEqualTo(Format.WEBP));

        ProcessedImage small = processor.process(jpeg(500, 300));
        assertThat(width(small.variants().get(1600))).isEqualTo(500);
        assertThat(width(small.variants().get(320))).isEqualTo(320);
    }

    @Test
    void rejectsOversizedAndUndecodableFiles() {
        byte[] huge = new byte[(int) ImageProcessor.MAX_BYTES + 1];
        huge[0] = (byte) 0xFF;
        huge[1] = (byte) 0xD8;
        huge[2] = (byte) 0xFF;
        assertThatThrownBy(() -> processor.process(huge))
                .isInstanceOfSatisfying(
                        ApiException.class, e -> assertThat(e.code()).isEqualTo(ErrorCode.FILE_TOO_LARGE));
        assertThatThrownBy(() -> processor.process(new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1, 2, 3}))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> processor.process(new byte[0])).isInstanceOf(ApiException.class);
    }

    private static byte[] jpeg(int width, int height) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "jpg", out);
        return out.toByteArray();
    }

    /** Reads the canvas width from a VP8 / VP8L / VP8X WebP header. */
    private static int width(byte[] webp) {
        String chunk = new String(webp, 12, 4, StandardCharsets.US_ASCII);
        return switch (chunk) {
            case "VP8 " -> ((webp[26] & 0xFF) | (webp[27] & 0x3F) << 8);
            case "VP8L" -> 1 + ((webp[21] & 0xFF) | (webp[22] & 0x3F) << 8);
            case "VP8X" -> 1 + ((webp[24] & 0xFF) | (webp[25] & 0xFF) << 8 | (webp[26] & 0xFF) << 16);
            default -> throw new AssertionError("Unknown WebP chunk " + chunk);
        };
    }
}
