
CREATE TABLE blood_requests (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                requester_id UUID NOT NULL,
                                hospital_id UUID,

                                blood_group VARCHAR(20) NOT NULL,
                                units_required INTEGER NOT NULL,

                                urgency_level VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
                                status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

                                required_by DATE,

                                city VARCHAR(100),
                                state VARCHAR(100),

                                additional_notes VARCHAR(1000),

                                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                CONSTRAINT fk_blood_request_requester
                                    FOREIGN KEY (requester_id)
                                        REFERENCES users(id)
                                        ON DELETE CASCADE,

                                CONSTRAINT fk_blood_request_hospital
                                    FOREIGN KEY (hospital_id)
                                        REFERENCES hospitals(id)
                                        ON DELETE SET NULL,

                                CONSTRAINT chk_blood_request_units
                                    CHECK (units_required > 0)
);


CREATE TABLE emergency_requests (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                                    blood_request_id UUID NOT NULL UNIQUE,

                                    emergency_level VARCHAR(30) NOT NULL DEFAULT 'CRITICAL',
                                    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

                                    contact_name VARCHAR(255),
                                    contact_phone VARCHAR(20),

                                    location_description VARCHAR(500),

                                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                    CONSTRAINT fk_emergency_blood_request
                                        FOREIGN KEY (blood_request_id)
                                            REFERENCES blood_requests(id)
                                            ON DELETE CASCADE
);


CREATE INDEX idx_blood_requests_requester
    ON blood_requests(requester_id);

CREATE INDEX idx_blood_requests_hospital
    ON blood_requests(hospital_id);

CREATE INDEX idx_blood_requests_blood_group
    ON blood_requests(blood_group);

CREATE INDEX idx_blood_requests_status
    ON blood_requests(status);

CREATE INDEX idx_blood_requests_city
    ON blood_requests(city);

CREATE INDEX idx_emergency_requests_status
    ON emergency_requests(status);