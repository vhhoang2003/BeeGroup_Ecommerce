package vn.beestore.api.user.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.beestore.api.user.domain.WishlistItem;

public interface WishlistRepository extends JpaRepository<WishlistItem, WishlistItem.Key> {

    @Query(
            """
            select w from WishlistItem w join fetch w.product p join fetch p.category left join fetch p.subCategory
            where w.id.userId = :userId order by w.createdAt desc
            """)
    List<WishlistItem> findForUser(@Param("userId") UUID userId);
}
