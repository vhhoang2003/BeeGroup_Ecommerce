package vn.beestore.api.common.api;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/** Paginated {@code data} payload (README §8.1). Page numbers are zero-based. */
public record PaginatedResponse<T>(
        List<T> content, int pageNumber, int pageSize, long totalElements, int totalPages, boolean last) {

    public static <T> PaginatedResponse<T> of(Page<T> page) {
        return new PaginatedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast());
    }

    public static <S, T> PaginatedResponse<T> of(Page<S> page, Function<S, T> mapper) {
        return of(page.map(mapper));
    }
}
