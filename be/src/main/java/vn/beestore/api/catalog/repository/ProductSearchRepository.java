package vn.beestore.api.catalog.repository;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Full-text and trigram search over published products (CAT-04, README §7.3). Prefix matching on {@code search_vector}
 * ("7B1" finds 7B12 and 7B13) plus {@code pg_trgm} word similarity on translated names for typos.
 */
@Repository
public class ProductSearchRepository {

    /** Minimum {@code word_similarity} for a name to count as a fuzzy match. */
    static final double SIMILARITY_THRESHOLD = 0.45;

    private final NamedParameterJdbcTemplate jdbc;

    public ProductSearchRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Ids of published products matching {@code q}, best matches first (at most {@code limit}). */
    public List<UUID> search(String q, int limit) {
        String tsQuery = toPrefixTsQuery(q);
        String trimmed = q == null ? "" : q.trim();
        if (tsQuery.isEmpty() && trimmed.isEmpty()) {
            return List.of();
        }
        String sql =
                """
                select p.id
                from products p
                left join lateral (
                    select max(word_similarity(:q, t.name)) as sim
                    from product_translations t where t.product_id = p.id
                ) n on true
                where p.status = 'PUBLISHED'
                  and ((:tsq <> '' and p.search_vector @@ to_tsquery('simple', :tsq)) or n.sim >= :threshold)
                order by (case when :tsq <> '' then ts_rank(p.search_vector, to_tsquery('simple', :tsq)) else 0 end)
                         + coalesce(n.sim, 0) desc, p.slug
                limit :limit
                """;
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("q", trimmed.toLowerCase(Locale.ROOT))
                .addValue("tsq", tsQuery)
                .addValue("threshold", SIMILARITY_THRESHOLD)
                .addValue("limit", limit);
        return jdbc.queryForList(sql, params, UUID.class);
    }

    /** Rebuilds {@code search_vector} from brand, slug, translated names, highlights and spec values. */
    public void reindex(UUID productId) {
        String sql =
                """
                update products p set search_vector = to_tsvector('simple',
                    coalesce(p.brand, '') || ' ' || replace(p.slug, '-', ' ') || ' ' ||
                    coalesce((select string_agg(coalesce(t.name, '') || ' ' || coalesce(t.short_description, '') || ' ' ||
                                                coalesce((select string_agg(h.val, ' ') from jsonb_array_elements_text(t.highlights) as h(val)), ''), ' ')
                              from product_translations t where t.product_id = p.id), '') || ' ' ||
                    coalesce((select string_agg(v.value, ' ')
                              from jsonb_array_elements(p.specs) s, jsonb_each_text(s -> 'value') v), ''))
                where p.id = :id
                """;
        jdbc.update(sql, new MapSqlParameterSource("id", productId));
    }

    /** {@code "7B1 sp3"} becomes {@code "7b1:* & sp3:*"}; characters that are not letters or digits are dropped. */
    static String toPrefixTsQuery(String q) {
        if (q == null) {
            return "";
        }
        return Arrays.stream(q.toLowerCase(Locale.ROOT).split("[^\\p{L}\\p{N}]+"))
                .filter(token -> !token.isBlank())
                .limit(8)
                .map(token -> token + ":*")
                .collect(Collectors.joining(" & "));
    }
}
