package vn.beestore.api.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.common.persistence.BaseEntity;

@Entity
@Table(name = "wishlist_items")
public class WishlistItem extends BaseEntity {

    @EmbeddedId
    private Key id;

    @MapsId("productId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    protected WishlistItem() {}

    public WishlistItem(UUID userId, Product product) {
        this.id = new Key(userId, product.getId());
        this.product = product;
    }

    public Product getProduct() {
        return product;
    }

    @Embeddable
    public static class Key implements Serializable {

        @Column(name = "user_id")
        private UUID userId;

        @Column(name = "product_id")
        private UUID productId;

        protected Key() {}

        public Key(UUID userId, UUID productId) {
            this.userId = userId;
            this.productId = productId;
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Key k && Objects.equals(userId, k.userId) && Objects.equals(productId, k.productId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, productId);
        }
    }
}
