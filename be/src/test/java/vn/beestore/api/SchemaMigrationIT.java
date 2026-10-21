package vn.beestore.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import vn.beestore.api.support.IntegrationTest;

/** T0.3: Flyway applies V1..V4 and Hibernate validates every entity against the schema (context starts). */
class SchemaMigrationIT extends IntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void allMigrationsAppliedAndSearchExtensionsPresent() {
        Integer applied = jdbc.queryForObject(
                "select count(*) from flyway_schema_history where success and version is not null", Integer.class);
        assertThat(applied).isEqualTo(5);

        Integer trgm =
                jdbc.queryForObject("select count(*) from pg_extension where extname = 'pg_trgm'", Integer.class);
        assertThat(trgm).isEqualTo(1);

        Long next = jdbc.queryForObject("select nextval('inquiry_code_seq')", Long.class);
        assertThat(next).isPositive();
    }
}
