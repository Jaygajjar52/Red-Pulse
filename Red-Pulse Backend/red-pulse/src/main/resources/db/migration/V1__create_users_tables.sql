CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                       first_name VARCHAR(50) NOT NULL,
                       last_name VARCHAR(50) NOT NULL,

                       email VARCHAR(255) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,

                       phone_number VARCHAR(15),

                       role VARCHAR(20) NOT NULL,
                       status VARCHAR(20) NOT NULL,

                       is_active BOOLEAN NOT NULL DEFAULT TRUE,
                       is_verified BOOLEAN NOT NULL DEFAULT FALSE,

                       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);