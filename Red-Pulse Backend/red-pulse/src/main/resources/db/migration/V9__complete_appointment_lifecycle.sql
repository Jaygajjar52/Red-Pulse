ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_donor_request_status
    ON appointments(donor_id, blood_request_id, status);
