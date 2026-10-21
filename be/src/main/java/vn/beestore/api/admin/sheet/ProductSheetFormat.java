package vn.beestore.api.admin.sheet;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import vn.beestore.api.catalog.domain.ProductStatus;
import vn.beestore.api.catalog.domain.StockStatus;

/**
 * The standard price list workbook: one sheet per category (named after it), a header row, then one product per row.
 * Every sheet has the shared {@link Field} columns; each category adds its own spec columns ({@link #SPECS}). Any
 * other header becomes a custom spec. Headers are matched loosely (case, accents and punctuation are ignored), so the
 * older hand-made price list headers ("Core/Thread", "VND", "Warranty"...) are accepted too.
 */
public final class ProductSheetFormat {

    private ProductSheetFormat() {}

    public static final String GUIDE_SHEET = "Hướng dẫn";

    /** Shared columns, in export order. */
    public enum Field {
        CODE("Mã sản phẩm", "ma sp", "slug", "code"),
        SUB_CATEGORY("Dòng", "dong san pham", "nhom", "the he", "generation", "generation brand", "sub category"),
        BRAND("Thương hiệu", "hang", "brand"),
        SKU("SKU / Model", "sku", "model", "ma model"),
        NAME("Tên sản phẩm", "ten", "name", "product"),
        PRICE("Giá (VND)", "gia", "gia ban", "vnd", "price"),
        WARRANTY("Bảo hành (tháng)", "bao hanh", "warranty"),
        STOCK("Tình trạng kho", "kho", "ton kho", "stock"),
        STATUS("Trạng thái", "hien thi", "status"),
        /** Recognised and ignored: row numbers, and the category column of older single-sheet price lists. */
        IGNORED("STT", "no", "so thu tu", "#", "type", "loai", "danh muc", "category");

        final String header;
        final List<String> aliases;

        Field(String header, String... aliases) {
            this.header = header;
            this.aliases =
                    Arrays.stream(aliases).map(ProductSheetFormat::normalize).toList();
        }

        public String header() {
            return header;
        }

        boolean matches(String normalizedHeader) {
            return normalize(header).equals(normalizedHeader) || aliases.contains(normalizedHeader);
        }
    }

    /** A spec column; the key matches {@code products.specs[].key} so imports update the existing row. */
    public record SpecColumn(String key, Map<String, String> label, List<String> aliases) {

        boolean matches(String normalizedHeader) {
            return label.values().stream().map(ProductSheetFormat::normalize).anyMatch(normalizedHeader::equals)
                    || aliases.contains(normalizedHeader);
        }
    }

    private static SpecColumn spec(String key, String vi, String en, String zh, String... aliases) {
        return new SpecColumn(
                key,
                labels(vi, en, zh),
                Arrays.stream(aliases).map(ProductSheetFormat::normalize).toList());
    }

    /** Spec columns per category slug, using the labels of the curated catalog. */
    public static final Map<String, List<SpecColumn>> SPECS = Map.of(
            "cpu",
            List.of(
                    spec("cores", "Số nhân / luồng", "Cores / Threads", "核心 / 线程", "core thread", "nhan luong"),
                    spec("l3", "Bộ nhớ đệm L3", "L3 cache", "三级缓存", "l3", "cache l3"),
                    spec("base", "Xung cơ bản", "Base clock", "基础频率", "base", "xung co ban"),
                    spec("boost", "Xung boost tối đa", "Max boost clock", "最大加速频率", "boost", "xung boost"),
                    spec("tdp", "TDP (công suất nhiệt)", "TDP", "热设计功耗 (TDP)", "tdp")),
            "mainboard",
            List.of(
                    spec("cpucount", "Số socket CPU", "CPU sockets", "CPU 插槽数量", "so cpu", "socket cpu"),
                    spec("formfactor", "Kích thước chuẩn", "Form factor", "板型", "form factor"),
                    spec("slots", "Khe mở rộng", "Expansion slots", "扩展插槽", "khe pcie", "pcie"),
                    spec("bmc", "Quản lý từ xa (BMC)", "Remote management (BMC)", "远程管理 (BMC)", "bmc")),
            "gpu",
            List.of(
                    spec("gpuarch", "Kiến trúc GPU", "GPU architecture", "GPU 架构", "kien truc", "architecture"),
                    spec("vram", "Bộ nhớ", "Memory", "显存", "vram", "bo nho"),
                    spec("iface", "Giao tiếp", "Interface", "接口", "interface"),
                    spec("tdp", "TDP (công suất nhiệt)", "TDP", "热设计功耗 (TDP)", "tdp")),
            "cooler",
            List.of(
                    spec("type", "Loại", "Type", "类型", "loai tan nhiet"),
                    spec("socket", "Socket", "Socket", "插槽"),
                    spec("rated", "Công suất tản nhiệt", "Rated cooling capacity", "额定散热功率", "cong suat", "tdp")),
            "kvm",
            List.of(
                    spec("video", "Đầu vào video", "Video input", "视频输入", "video"),
                    spec("network", "Mạng", "Network", "网络", "lan"),
                    spec("power", "Nguồn", "Power input", "电源", "power")));

    public static List<SpecColumn> specsFor(String categorySlug) {
        return SPECS.getOrDefault(categorySlug, List.of());
    }

    // --- Warranty -------------------------------------------------------------------------------------------------

    public static final String WARRANTY_KEY = "warranty";
    public static final Map<String, String> WARRANTY_LABEL = labels("Bảo hành", "Warranty", "保修");

    public static Map<String, String> warrantyValue(int months) {
        return labels(months + " tháng", months + (months == 1 ? " month" : " months"), months + " 个月");
    }

    /**
     * Months from "12", "12 tháng", "1 year", "3 month", "2 năm"; {@code null} when the text has no number. Years
     * are recognised by "year" / "năm" / "nam".
     */
    public static Integer parseWarrantyMonths(String text) {
        if (text == null) {
            return null;
        }
        var m = java.util.regex.Pattern.compile("(\\d+)").matcher(text);
        if (!m.find()) {
            return null;
        }
        int n = Integer.parseInt(m.group(1));
        String norm = normalize(text);
        return norm.contains("year") || norm.contains("nam") ? n * 12 : n;
    }

    // --- Stock / status labels ------------------------------------------------------------------------------------

    public static final Map<StockStatus, String> STOCK_LABEL = Map.of(
            StockStatus.IN_STOCK, "Còn hàng",
            StockStatus.LOW_STOCK, "Sắp hết hàng",
            StockStatus.OUT_OF_STOCK, "Hết hàng",
            StockStatus.PRE_ORDER, "Đặt trước");

    public static final Map<ProductStatus, String> STATUS_LABEL = Map.of(
            ProductStatus.PUBLISHED, "Đang bán",
            ProductStatus.DRAFT, "Nháp",
            ProductStatus.ARCHIVED, "Lưu trữ");

    /** Accepts the Vietnamese label or the enum name, in any case / accents. */
    static <E extends Enum<E>> E parseEnum(String text, Map<E, String> labels) {
        String norm = normalize(text);
        for (var entry : labels.entrySet()) {
            if (normalize(entry.getValue()).equals(norm)
                    || normalize(entry.getKey().name()).equals(norm)) {
                return entry.getKey();
            }
        }
        return null;
    }

    // --- Text helpers ---------------------------------------------------------------------------------------------

    /** Lower case, no accents ("đ" → "d"), punctuation collapsed to single spaces. */
    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        String s = Normalizer.normalize(text.replace('đ', 'd').replace('Đ', 'D'), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        return s.replaceAll("[^a-z0-9#\\p{IsHan}]+", " ").trim();
    }

    /** URL slug matching {@code AdminDtos.SLUG_PATTERN}: "AMD EPYC 7F32" → "amd-epyc-7f32". */
    public static String slugify(String text) {
        return normalize(text)
                .replace("#", "")
                .trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    static Map<String, String> labels(String vi, String en, String zh) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("vi", vi);
        map.put("en", en);
        map.put("zh", zh);
        return map;
    }

    /** The same text for every locale (used where the sheet carries one language). */
    static Map<String, String> sameForAll(String text) {
        return labels(text, text, text);
    }
}
