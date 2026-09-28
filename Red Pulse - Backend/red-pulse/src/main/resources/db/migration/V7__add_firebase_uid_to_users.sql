ALTER TABLE users
    ADD COLUMN firebase_uid VARCHAR(128);

CREATE UNIQUE INDEX ux_users_firebase_uid
    ON users (firebase_uid)
    WHERE firebase_uid IS NOT NULL;
