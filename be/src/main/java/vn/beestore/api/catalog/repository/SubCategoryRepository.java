package vn.beestore.api.catalog.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.beestore.api.catalog.domain.SubCategory;

public interface SubCategoryRepository extends JpaRepository<SubCategory, UUID> {

    Optional<SubCategory> findByCategoryIdAndSlug(UUID categoryId, String slug);

    boolean existsByCategoryIdAndSlug(UUID categoryId, String slug);
}
