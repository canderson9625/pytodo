
-- ENTITY TABLES
    CREATE TABLE IF NOT EXISTS app_user (
        id SERIAL PRIMARY KEY,
        pass_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_token (
        id SERIAL PRIMARY KEY,
        user_id INT UNIQUE NOT NULL REFERENCES app_user (id)
                            ON DELETE CASCADE,
        token TEXT NOT NULL
    )

    CREATE TYPE enum__contact AS ENUM ('mobile', 'email');
    CREATE TABLE IF NOT EXISTS "ENUM__contact_type" (
        id SERIAL PRIMARY KEY,
        contact_type TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS contact (
        id SERIAL PRIMARY KEY,
        contact TEXT NOT NULL,
        contact_type enum__contact
    );
-- END: ENTITY TABLES


-- ASSOCIATION TABLES
    CREATE TABLE IF NOT EXISTS assoc_user_contact (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES app_user (id) 
                                ON DELETE CASCADE,
        contact_id INT NOT NULL REFERENCES contact (id) 
                                ON DELETE CASCADE
    );

    -- CREATE TABLE IF NOT EXISTS assoc_user_token (
    --     id SERIAL PRIMARY KEY,
    --     user_id INT NOT NULL REFERENCES app_user (id) 
    --                             ON DELETE CASCADE,
    --     token_id INT NOT NULL REFERENCES user_token (id) 
    --                             ON DELETE CASCADE
    -- );
-- END: ASSOCIATION TABLES
