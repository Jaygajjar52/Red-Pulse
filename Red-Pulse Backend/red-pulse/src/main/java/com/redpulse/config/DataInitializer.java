package com.redpulse.config;

import com.redpulse.enums.Role;
import com.redpulse.enums.UserStatus;
import com.redpulse.modules.user.entity.User;
import com.redpulse.modules.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean bootstrapEnabled;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminPhone;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           @Value("${app.admin.bootstrap-enabled:false}") boolean bootstrapEnabled,
                           @Value("${app.admin.email:}") String adminEmail,
                           @Value("${app.admin.password:}") String adminPassword,
                           @Value("${app.admin.phone:}") String adminPhone) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapEnabled = bootstrapEnabled;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminPhone = adminPhone;
    }

    @Override
    public void run(String... args) {
        if (!bootstrapEnabled) {
            return;
        }
        if (adminEmail.isBlank() || adminPassword.isBlank() || adminPhone.isBlank()) {
            throw new IllegalStateException("Admin bootstrap requires ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_PHONE");
        }
        if (userRepository.findByEmail(adminEmail.trim().toLowerCase()).isEmpty()) {
            User admin = new User(
                    "System",
                    "Admin",
                    adminEmail.trim().toLowerCase(),
                    passwordEncoder.encode(adminPassword),
                    adminPhone,
                    Role.ADMIN,
                    UserStatus.ACTIVE
            );
            admin.setActive(true);
            admin.setVerified(true);
            userRepository.save(admin);
            log.info("Development administrator account initialized: {}", adminEmail.trim().toLowerCase());
        }
    }
}
