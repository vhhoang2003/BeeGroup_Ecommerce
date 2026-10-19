package vn.beestore.api.catalog.domain;

import java.util.Map;

/** One row of {@code products.specs}: {@code {key, label:{en,vi,zh}, value:{en,vi,zh}}} (README §7.2). */
public record SpecRow(String key, Map<String, String> label, Map<String, String> value) {}
