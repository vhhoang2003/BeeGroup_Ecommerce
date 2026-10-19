package vn.beestore.api.inquiry.repository;

import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.beestore.api.inquiry.domain.Inquiry;

public interface InquiryRepository extends JpaRepository<Inquiry, UUID>, JpaSpecificationExecutor<Inquiry> {

    Page<Inquiry> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query(value = "select nextval('inquiry_code_seq')", nativeQuery = true)
    long nextCodeNumber();

    /** Removes contact data copied into the user's inquiries when their account is anonymized (SEC-14). */
    @Modifying
    @Query(
            """
            update Inquiry i set i.fullName = 'Deleted user', i.email = 'deleted@deleted.invalid', i.phone = null,
                   i.ipAddress = null
            where i.user.id = :userId
            """)
    int anonymizeForUser(@Param("userId") UUID userId);

    long countByCreatedAtAfter(Instant since);
}
