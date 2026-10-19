package vn.beestore.api.inquiry.service;

/**
 * Published inside the creating transaction; notifications go out after commit (README §6.6).
 *
 * @param summary one-line text for the sales webhook (no email address or IP, SEC-14)
 */
public record InquiryCreatedEvent(String code, String summary) {}
