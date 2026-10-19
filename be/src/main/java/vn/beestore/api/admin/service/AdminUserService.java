package vn.beestore.api.admin.service;

import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.beestore.api.admin.dto.AdminDtos.UserUpdateRequest;
import vn.beestore.api.auth.service.SessionService;
import vn.beestore.api.auth.service.VerificationService;
import vn.beestore.api.common.api.PaginatedResponse;
import vn.beestore.api.common.error.ApiException;
import vn.beestore.api.common.security.CurrentUser;
import vn.beestore.api.user.domain.Role;
import vn.beestore.api.user.domain.User;
import vn.beestore.api.user.domain.UserStatus;
import vn.beestore.api.user.dto.UserDto;
import vn.beestore.api.user.dto.UserMapper;
import vn.beestore.api.user.repository.UserRepository;

/** Search, lock / unlock, role change and verification resend for admins (ADM-06). */
@Service
public class AdminUserService {

    private final UserRepository users;
    private final UserMapper mapper;
    private final SessionService sessions;
    private final VerificationService verification;
    private final AuditService audit;

    public AdminUserService(
            UserRepository users,
            UserMapper mapper,
            SessionService sessions,
            VerificationService verification,
            AuditService audit) {
        this.users = users;
        this.mapper = mapper;
        this.sessions = sessions;
        this.verification = verification;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<UserDto> search(String q, Role role, UserStatus status, int page, int size) {
        String query = q == null || q.isBlank() ? null : q.trim();
        var result = users.search(
                query,
                role,
                status,
                PageRequest.of(
                        Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Order.desc("createdAt"))));
        return PaginatedResponse.of(result, mapper::toDto);
    }

    @Transactional(readOnly = true)
    public UserDto get(UUID id) {
        return mapper.toDto(find(id));
    }

    @Transactional
    public UserDto update(UUID id, UserUpdateRequest req) {
        User user = find(id);
        UserDto before = mapper.toDto(user);
        boolean self = CurrentUser.idIfPresent().map(id::equals).orElse(false);

        if (req.status() != null && req.status() != user.getStatus()) {
            switch (req.status()) {
                case LOCKED -> {
                    if (self) {
                        throw ApiException.validation("status", "You cannot lock your own account");
                    }
                    user.setStatus(UserStatus.LOCKED);
                    sessions.revokeAll(user.getId());
                }
                case ACTIVE -> {
                    if (user.getStatus() != UserStatus.LOCKED) {
                        throw ApiException.validation("status", "Only locked accounts can be unlocked");
                    }
                    user.setStatus(
                            user.getEmailVerifiedAt() == null ? UserStatus.PENDING_VERIFICATION : UserStatus.ACTIVE);
                    user.setLockedUntil(null);
                    user.setFailedLoginCount(0);
                    user.setFailedLoginWindowStart(null);
                }
                default -> throw ApiException.validation("status", "Status can only be set to LOCKED or ACTIVE");
            }
        }

        if (req.role() != null && req.role() != user.getRole()) {
            if (self && req.role() != Role.ADMIN) {
                throw ApiException.validation("role", "You cannot remove your own admin role");
            }
            user.setRole(req.role());
            // Access tokens carry the role; force a fresh login so the change applies immediately.
            sessions.revokeAll(user.getId());
        }

        if (Boolean.TRUE.equals(req.resendVerification())) {
            if (user.getStatus() != UserStatus.PENDING_VERIFICATION) {
                throw ApiException.validation("resendVerification", "Account is already verified");
            }
            verification.sendEmailVerification(user);
        }

        UserDto after = mapper.toDto(user);
        audit.record("USER_UPDATE", "user", id, before, after);
        return after;
    }

    private User find(UUID id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
    }
}
