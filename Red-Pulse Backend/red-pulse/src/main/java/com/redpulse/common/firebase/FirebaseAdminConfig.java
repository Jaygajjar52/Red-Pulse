//package com.redpulse.common.firebase;
//
//import com.google.auth.oauth2.GoogleCredentials;
//import com.google.firebase.FirebaseApp;
//import com.google.firebase.FirebaseOptions;
//import com.google.firebase.auth.FirebaseAuth;
//import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.beans.factory.annotation.Value;
//
//import java.io.IOException;
//import java.util.List;
//
//@Configuration
//public class FirebaseAdminConfig {
//
//    @Bean
//    @ConditionalOnProperty(name = "firebase.enabled", havingValue = "true")
//    FirebaseApp firebaseApp(
//            @Value("${firebase.project-id}") String projectId,
//            @Value("${firebase.client-email}") String clientEmail,
//            @Value("${firebase.private-key}") String privateKey,
//            @Value("${firebase.private-key-id}") String privateKeyId,
//            @Value("${firebase.client-id}") String clientId
//    ) throws IOException {
//        if (projectId.isBlank() || clientEmail.isBlank() || privateKey.isBlank()
//                || privateKeyId.isBlank() || clientId.isBlank()) {
//            throw new IllegalStateException(
//                    "All Firebase service-account fields are required when Firebase is enabled"
//            );
//        }
//
//        FirebaseOptions options = FirebaseOptions.builder()
//                .setCredentials(GoogleCredentials.fromStream(
//                        new ServiceAccountJson(projectId, clientEmail, privateKey, privateKeyId, clientId).toInputStream()
//                ))
//                .setProjectId(projectId)
//                .build();
//
//        List<FirebaseApp> apps = FirebaseApp.getApps();
//        return apps.isEmpty() ? FirebaseApp.initializeApp(options) : apps.get(0);
//    }
//
//    @Bean
//    @ConditionalOnProperty(name = "firebase.enabled", havingValue = "true")
//    FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
//        return FirebaseAuth.getInstance(firebaseApp);
//    }
//
//    private record ServiceAccountJson(String projectId, String clientEmail, String privateKey,
//                                      String privateKeyId, String clientId) {
//        java.io.InputStream toInputStream() {
//            String json = """
//                    {
//                      "type": "service_account",
//                      "project_id": "%s",
//                      "private_key": "%s",
//                      "private_key_id": "%s",
//                      "client_email": "%s",
//                      "client_id": "%s",
//                      "token_uri": "https://oauth2.googleapis.com/token"
//                    }
//                    """.formatted(
//                    escape(projectId),
//                    escape(privateKey.replace("\\n", "\n")),
//                    escape(privateKeyId),
//                    escape(clientEmail),
//                    escape(clientId)
//            );
//            return new java.io.ByteArrayInputStream(json.getBytes(java.nio.charset.StandardCharsets.UTF_8));
//        }
//
//        private static String escape(String value) {
//            return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\r", "\\r")
//                    .replace("\n", "\\n");
//        }
//    }
//}
