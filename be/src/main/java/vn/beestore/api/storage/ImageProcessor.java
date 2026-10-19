package vn.beestore.api.storage;

import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.webp.WebpImageReader;
import com.sksamuel.scrimage.webp.WebpWriter;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.error.ErrorCode;

/**
 * Validates and re-encodes uploaded product images (ADM-03, SEC-11): only JPEG / PNG / WebP recognised by their magic
 * bytes, at most 5 MB, decoded and re-encoded (which drops EXIF and any trailing payload) into WebP variants 320, 800
 * and 1600 px wide. Images are never upscaled.
 */
@Component
public class ImageProcessor {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    public static final List<Integer> VARIANT_WIDTHS = List.of(320, 800, 1600);

    private static final WebpWriter WRITER = WebpWriter.DEFAULT.withQ(82);

    public enum Format {
        JPEG,
        PNG,
        WEBP
    }

    public record ProcessedImage(int width, int height, Map<Integer, byte[]> variants) {}

    public ProcessedImage process(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw ApiException.validation("file", "File is empty");
        }
        if (bytes.length > MAX_BYTES) {
            throw new ApiException(ErrorCode.FILE_TOO_LARGE, "File exceeds the 5 MB limit");
        }
        Format format = sniff(bytes);
        if (format == null) {
            throw ApiException.validation("file", "Only JPEG, PNG or WebP images are allowed");
        }
        ImmutableImage image;
        try {
            image = format == Format.WEBP
                    ? ImmutableImage.loader()
                            .withImageReaders(List.of(new WebpImageReader()))
                            .fromBytes(bytes)
                    : ImmutableImage.loader().fromBytes(bytes);
        } catch (IOException | RuntimeException e) {
            throw ApiException.validation("file", "The image could not be decoded");
        }

        Map<Integer, byte[]> variants = new LinkedHashMap<>();
        for (int width : VARIANT_WIDTHS) {
            ImmutableImage scaled = image.width > width ? image.scaleToWidth(width) : image;
            try {
                variants.put(width, scaled.bytes(WRITER));
            } catch (IOException e) {
                throw new IllegalStateException("WebP encoding failed", e);
            }
        }
        return new ProcessedImage(image.width, image.height, variants);
    }

    /** Detects the format from the file signature, ignoring the client-supplied name and content type. */
    public static Format sniff(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return Format.JPEG;
        }
        if (b.length >= 8
                && (b[0] & 0xFF) == 0x89
                && b[1] == 'P'
                && b[2] == 'N'
                && b[3] == 'G'
                && b[4] == 0x0D
                && b[5] == 0x0A
                && b[6] == 0x1A
                && b[7] == 0x0A) {
            return Format.PNG;
        }
        if (b.length >= 12
                && b[0] == 'R'
                && b[1] == 'I'
                && b[2] == 'F'
                && b[3] == 'F'
                && b[8] == 'W'
                && b[9] == 'E'
                && b[10] == 'B'
                && b[11] == 'P') {
            return Format.WEBP;
        }
        return null;
    }
}
