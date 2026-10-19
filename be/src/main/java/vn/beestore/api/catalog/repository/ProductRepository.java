package vn.beestore.api.catalog.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.catalog.domain.ProductStatus;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    @Override
    @EntityGraph(attributePaths = {"category", "subCategory"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"category", "subCategory"})
    List<Product> findAll(Specification<Product> spec);

    @EntityGraph(attributePaths = {"category", "subCategory"})
    Optional<Product> findBySlug(String slug);

    @EntityGraph(attributePaths = {"category", "subCategory"})
    Optional<Product> findBySlugAndStatus(String slug, ProductStatus status);

    boolean existsBySlug(String slug);

    boolean existsBySku(String sku);

    /** Rows of {@code [categoryId, subCategoryId, count]} over published products, for menu counters. */
    @Query(
            """
            select p.category.id, p.subCategory.id, count(p) from Product p
            where p.status = :status group by p.category.id, p.subCategory.id
            """)
    List<Object[]> countByCategoryAndSubCategory(@Param("status") ProductStatus status);

    @Modifying
    @Query("update Product p set p.viewCount = p.viewCount + 1 where p.id = :id and p.status = :status")
    int incrementViews(@Param("id") UUID id, @Param("status") ProductStatus status);

    long countByCategoryId(UUID categoryId);

    long countBySubCategoryId(UUID subCategoryId);
}
