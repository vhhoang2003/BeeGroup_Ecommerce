package vn.beestore.api.catalog.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.beestore.api.catalog.domain.Category;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    @EntityGraph(attributePaths = "subCategories")
    List<Category> findAllByOrderBySortOrderAscSlugAsc();

    @EntityGraph(attributePaths = "subCategories")
    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
