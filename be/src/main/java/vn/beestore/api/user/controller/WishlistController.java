package vn.beestore.api.user.controller;

import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.beestore.api.catalog.dto.CatalogDtos.ProductSummaryDto;
import vn.beestore.api.catalog.service.CatalogMapper;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.security.CurrentUser;
import vn.beestore.api.user.service.WishlistService;

/** {@code /api/v1/me/wishlist} (ENG-06). */
@RestController
@RequestMapping("/api/v1/me/wishlist")
public class WishlistController {

    private final WishlistService wishlist;

    public WishlistController(WishlistService wishlist) {
        this.wishlist = wishlist;
    }

    @GetMapping
    ApiResponse<List<ProductSummaryDto>> list(@RequestParam(required = false) String locale) {
        return ApiResponse.ok(wishlist.list(CurrentUser.id(), CatalogMapper.normalizeLocale(locale)));
    }

    @PostMapping("/{productId}")
    ResponseEntity<Void> add(@PathVariable UUID productId) {
        boolean added = wishlist.add(CurrentUser.id(), productId);
        return ResponseEntity.status(added ? HttpStatus.CREATED : HttpStatus.NO_CONTENT)
                .build();
    }

    @DeleteMapping("/{productId}")
    ResponseEntity<Void> remove(@PathVariable UUID productId) {
        wishlist.remove(CurrentUser.id(), productId);
        return ResponseEntity.noContent().build();
    }
}
