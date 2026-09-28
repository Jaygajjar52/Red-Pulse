
CREATE TABLE appointments (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                              donor_id UUID NOT NULL,
                              hospital_id UUID NOT NULL,

                              blood_request_id UUID,

                              appointment_date DATE NOT NULL,
                              appointment_time TIME NOT NULL,

                              status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',

                              notes VARCHAR(1000),

                              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                              CONSTRAINT fk_appointment_donor
                                  FOREIGN KEY (donor_id)
                                      REFERENCES users(id)
                                      ON DELETE CASCADE,

                              CONSTRAINT fk_appointment_hospital
                                  FOREIGN KEY (hospital_id)
                                      REFERENCES hospitals(id)
                                      ON DELETE CASCADE,

                              CONSTRAINT fk_appointment_blood_request
                                  FOREIGN KEY (blood_request_id)
                                      REFERENCES blood_requests(id)
                                      ON DELETE SET NULL
);


CREATE TABLE donations (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

                           donor_id UUID NOT NULL,
                           hospital_id UUID NOT NULL,

                           appointment_id UUID,

                           blood_group VARCHAR(20) NOT NULL,

                           donation_date DATE NOT NULL,

                           quantity_units INTEGER NOT NULL DEFAULT 1,

                           status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',

                           notes VARCHAR(1000),

                           created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                           CONSTRAINT fk_donation_donor
                               FOREIGN KEY (donor_id)
                                   REFERENCES users(id)
                                   ON DELETE CASCADE,

                           CONSTRAINT fk_donation_hospital
                               FOREIGN KEY (hospital_id)
                                   REFERENCES hospitals(id)
                                   ON DELETE CASCADE,

                           CONSTRAINT fk_donation_appointment
                               FOREIGN KEY (appointment_id)
                                   REFERENCES appointments(id)
                                   ON DELETE SET NULL,

                           CONSTRAINT chk_donation_quantity
                               CHECK (quantity_units > 0)
);


CREATE INDEX idx_appointments_donor
    ON appointments(donor_id);

CREATE INDEX idx_appointments_hospital
    ON appointments(hospital_id);

CREATE INDEX idx_appointments_status
    ON appointments(status);

CREATE INDEX idx_appointments_date
    ON appointments(appointment_date);

CREATE INDEX idx_donations_donor
    ON donations(donor_id);

CREATE INDEX idx_donations_hospital
    ON donations(hospital_id);

CREATE INDEX idx_donations_date
    ON donations(donation_date);

CREATE INDEX idx_donations_status
    ON donations(status);