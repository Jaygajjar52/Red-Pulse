package com.redpulse.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Authentication getAuthentication() {
        return SecurityContextHolder
                .getContext()
                .getAuthentication();
    }

    public static boolean isAuthenticated() {
        Authentication authentication = getAuthentication();

        return authentication != null
                && authentication.isAuthenticated();
    }

    public static UserPrincipal getCurrentUser() {
        Authentication authentication = getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserPrincipal userPrincipal)) {
            return null;
        }

        return userPrincipal;
    }

    public static UUID getCurrentUserId() {
        UserPrincipal userPrincipal = getCurrentUser();

        return userPrincipal != null
                ? userPrincipal.getId()
                : null;
    }

    public static String getCurrentUserEmail() {
        UserPrincipal userPrincipal = getCurrentUser();

        return userPrincipal != null
                ? userPrincipal.getUsername()
                : null;
    }

    public static boolean hasRole(String role) {
        UserPrincipal userPrincipal = getCurrentUser();

        if (userPrincipal == null) {
            return false;
        }

        return userPrincipal.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        authority.getAuthority().equals(role)
                );
    }
}
