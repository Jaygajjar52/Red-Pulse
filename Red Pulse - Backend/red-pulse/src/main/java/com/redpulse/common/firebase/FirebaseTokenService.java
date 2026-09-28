package com.redpulse.common.firebase;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.redpulse.common.exception.UnauthorizedException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class FirebaseTokenService {
    private final ObjectProvider<FirebaseAuth> firebaseAuthProvider;

    public FirebaseTokenService(ObjectProvider<FirebaseAuth> firebaseAuthProvider) {
        this.firebaseAuthProvider = firebaseAuthProvider;
    }

    public VerifiedFirebaseUser verify(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("A Firebase ID token is required");
        }
        FirebaseAuth firebaseAuth = firebaseAuthProvider.getIfAvailable();
        if (firebaseAuth == null) {
            throw new IllegalStateException("Firebase authentication is not configured");
        }
        String idToken = authorizationHeader.substring("Bearer ".length()).trim();
        if (idToken.isBlank()) throw new UnauthorizedException("A Firebase ID token is required");
        try {
            FirebaseToken token = firebaseAuth.verifyIdToken(idToken);
            Object rawPhone = token.getClaims().get("phone_number");
            if (!(rawPhone instanceof String phone) || phone.isBlank()) {
                throw new UnauthorizedException("The Firebase account has no verified phone number");
            }
            return new VerifiedFirebaseUser(token.getUid(), phone);
        } catch (FirebaseAuthException | IllegalArgumentException exception) {
            throw new UnauthorizedException("Invalid or expired Firebaxse ID token", exception);
        }
    }

    public record VerifiedFirebaseUser(String uid, String phoneNumber) {}
}
