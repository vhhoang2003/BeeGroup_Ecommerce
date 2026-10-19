package vn.beestore.api.user.service;

import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.catalog.domain.Product;
import vn.beestore.api.catalog.domain.ProductStatus;
import vn.beestore.api.catalog.dto.CatalogDtos.ProductSummaryDto;
import vn.beestore.api.catalog.repository.ProductRepository;
import vn.beestore.api.catalog.service.CatalogMapper;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.user.domain.WishlistItem;
import vn.beestore.api.user.repository.WishlistRepository;

/** Saved products of a logged-in customer (ENG-06). */
@Service
public class WishlistService {

    private final WishlistRepository wishlist;
    private final ProductRepository products;
    private final CatalogMapper mapper;

    public WishlistService(WishlistRepository wishlist, ProductRepository products, CatalogMapper mapper) {
        this.wishlist = wishlist;
        this.products = products;
        this.mapper = mapper;
    }

    /** Only products that are still published are returned. */
    @Transactional(readOnly = true)
    public List<ProductSummaryDto> list(UUID userId, String locale) {
        return wishlist.findForUser(userId).stream()
                .map(WishlistItem::getProduct)
                .filter(p -> p.getStatus() == ProductStatus.PUBLISHED)
                .map(p -> mapper.toSummary(p, locale))
                .toList();
    }

    /** Idempotent: adding a product twice keeps one entry. Returns {@code true} when it was newly added. */
    @Transactional
    public boolean add(UUID userId, UUID productId) {
        Product product = products.findById(productId)
                .filter(p -> p.getStatus() == ProductStatus.PUBLISHED)
                .orElseThrow(() -> ApiException.notFound("Product"));
        WishlistItem.Key key = new WishlistItem.Key(userId, productId);
        if (wishlist.existsById(key)) {
            return false;
        }
        wishlist.save(new WishlistItem(userId, product));
        return true;
    }

    @Transactional
    public void remove(UUID userId, UUID productId) {
        wishlist.deleteById(new WishlistItem.Key(userId, productId));
    }
}
