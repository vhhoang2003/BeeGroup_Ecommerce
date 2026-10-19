package vn.beestore.api.catalog.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ProductSearchRepositoryTest {

    @Test
    void buildsPrefixQueriesFromSafeTokens() {
        assertThat(ProductSearchRepository.toPrefixTsQuery("7B1")).isEqualTo("7b1:*");
        assertThat(ProductSearchRepository.toPrefixTsQuery("  SP3   24 core ")).isEqualTo("sp3:* & 24:* & core:*");
        assertThat(ProductSearchRepository.toPrefixTsQuery("a'b & c|d:*!")).isEqualTo("a:* & b:* & c:* & d:*");
        assertThat(ProductSearchRepository.toPrefixTsQuery("tản nhiệt")).isEqualTo("tản:* & nhiệt:*");
        assertThat(ProductSearchRepository.toPrefixTsQuery("!!!")).isEmpty();
        assertThat(ProductSearchRepository.toPrefixTsQuery(null)).isEmpty();
    }
}
