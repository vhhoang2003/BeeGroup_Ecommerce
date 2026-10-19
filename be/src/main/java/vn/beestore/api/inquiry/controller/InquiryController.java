package vn.beestore.api.inquiry.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.beestore.api.common.api.ApiResponse;
import vn.beestore.api.common.api.PaginatedResponse;
import vn.beestore.api.common.security.CurrentUser;
import vn.beestore.api.common.web.ClientInfo;
import vn.beestore.api.inquiry.domain.Inquiry;
import vn.beestore.api.inquiry.dto.InquiryDtos.ContactRequest;
import vn.beestore.api.inquiry.dto.InquiryDtos.InquiryCreatedResponse;
import vn.beestore.api.inquiry.dto.InquiryDtos.MyInquiryDto;
import vn.beestore.api.inquiry.dto.InquiryDtos.ProductInquiryRequest;
import vn.beestore.api.inquiry.service.InquiryService;

/** {@code POST /inquiries}, {@code POST /contact} (public) and {@code GET /me/inquiries} (README §8.3). */
@RestController
@RequestMapping("/api/v1")
public class InquiryController {

    private final InquiryService inquiries;

    public InquiryController(InquiryService inquiries) {
        this.inquiries = inquiries;
    }

    @PostMapping("/inquiries")
    ResponseEntity<ApiResponse<InquiryCreatedResponse>> create(
            @Valid @RequestBody ProductInquiryRequest req, HttpServletRequest http) {
        Inquiry inquiry =
                inquiries.createProductInquiry(req, CurrentUser.idIfPresent().orElse(null), ClientInfo.from(http));
        return created(inquiry);
    }

    @PostMapping("/contact")
    ResponseEntity<ApiResponse<InquiryCreatedResponse>> contact(
            @Valid @RequestBody ContactRequest req, HttpServletRequest http) {
        Inquiry inquiry = inquiries.createContact(req, CurrentUser.idIfPresent().orElse(null), ClientInfo.from(http));
        return created(inquiry);
    }

    @GetMapping("/me/inquiries")
    ApiResponse<PaginatedResponse<MyInquiryDto>> mine(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
        return ApiResponse.ok(inquiries.myInquiries(CurrentUser.id(), page, size));
    }

    private static ResponseEntity<ApiResponse<InquiryCreatedResponse>> created(Inquiry inquiry) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(
                        new InquiryCreatedResponse(inquiry.getCode()), "We will contact you within 24 working hours"));
    }
}
