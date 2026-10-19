package vn.beestore.api.inquiry.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.beestore.api.inquiry.domain.InquiryEvent;

public interface InquiryEventRepository extends JpaRepository<InquiryEvent, UUID> {

    List<InquiryEvent> findByInquiryIdInOrderByCreatedAtAsc(Collection<UUID> inquiryIds);

    List<InquiryEvent> findByInquiryIdOrderByCreatedAtAsc(UUID inquiryId);
}
