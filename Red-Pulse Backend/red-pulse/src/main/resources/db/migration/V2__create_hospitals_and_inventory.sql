
CREATE TABLE donor_profiles (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                user_id UUID NOT NULL UNIQUE,

                                blood_group VARCHAR(20) NOT NULL,
                                date_of_birth DATE,
                                gender VARCHAR(30),
                                weight NUMERIC(5,2),

                                city VARCHAR(100),
                                state VARCHAR(100),

                                latitude DOUBLE PRECISION,
                                longitude DOUBLE PRECISION,

                                last_donation_date DATE,

                                availability_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',

                                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                CONSTRAINT fk_donor_profile_user
                                    FOREIGN KEY (user_id)
                                        REFERENCES users(id)
                                        ON DELETE CASCADE
);


CREATE TABLE hospitals (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                           user_id UUID UNIQUE,

                           hospital_name VARCHAR(255) NOT NULL,
                           registration_number VARCHAR(100) UNIQUE,

                           phone VARCHAR(20),
                           email VARCHAR(255),

                           address VARCHAR(500),
                           city VARCHAR(100),
                           state VARCHAR(100),

                           latitude DOUBLE PRECISION,
                           longitude DOUBLE PRECISION,

                           is_active BOOLEAN NOT NULL DEFAULT TRUE,
                           is_verified BOOLEAN NOT NULL DEFAULT FALSE,

                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                           CONSTRAINT fk_hospital_user
                               FOREIGN KEY (user_id)
                                   REFERENCES users(id)
                                   ON DELETE SET NULL
);


CREATE TABLE blood_inventory (
                                 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                 hospital_id UUID NOT NULL,

                                 blood_group VARCHAR(20) NOT NULL,

                                 quantity_units INTEGER NOT NULL DEFAULT 0,

                                 last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                 CONSTRAINT fk_inventory_hospital
                                     FOREIGN KEY (hospital_id)
                                         REFERENCES hospitals(id)
                                         ON DELETE CASCADE,

                                 CONSTRAINT chk_inventory_quantity
                                     CHECK (quantity_units >= 0),

                                 CONSTRAINT uq_hospital_blood_group
                                     UNIQUE (hospital_id, blood_group)
);


CREATE INDEX idx_donor_profiles_blood_group
    ON donor_profiles(blood_group);

CREATE INDEX idx_donor_profiles_city
    ON donor_profiles(city);

CREATE INDEX idx_hospitals_city
    ON hospitals(city);

CREATE INDEX idx_blood_inventory_blood_group
    ON blood_inventory(blood_group);