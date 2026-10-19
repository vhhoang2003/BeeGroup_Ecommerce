package vn.beestore.api.inquiry.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;
import vn.beestore.api.common.persistence.BaseEntity;
import vn.beestore.api.user.domain.User;

/** Status change and/or internal note on an inquiry (ENG-05 history, ADM-05 notes). */
@Entity
@Table(name = "inquiry_events")
public class InquiryEvent extends BaseEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inquiry_id", nullable = false)
    private Inquiry inquiry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    private InquiryStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 20)
    private InquiryStatus toStatus;

    @Column(columnDefinition = "text")
    private String note;

    protected InquiryEvent() {}

    public InquiryEvent(Inquiry inquiry, User actor, InquiryStatus from, InquiryStatus to, String note) {
        this.inquiry = inquiry;
        this.actor = actor;
        this.fromStatus = from;
        this.toStatus = to;
        this.note = note;
    }

    public UUID getId() {
        return id;
    }

    public Inquiry getInquiry() {
        return inquiry;
    }

    public User getActor() {
        return actor;
    }

    public InquiryStatus getFromStatus() {
        return fromStatus;
    }

    public InquiryStatus getToStatus() {
        return toStatus;
    }

    public String getNote() {
        return note;
    }
}
