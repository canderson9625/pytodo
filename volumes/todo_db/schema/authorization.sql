-- ENTITY TABLES
    CREATE TYPE app_operation AS ENUM ("create", "read", "update", "delete", "super");
    CREATE TABLE IF NOT EXISTS authorization (
        id SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        permission app_operation[] NOT NULL
    );
    -- SEED TABLE authorization
        INSERT INTO authorization ("name", permission) VALUES 
            ("viewer", 'read'),
            ("basic", "{'read', 'create', 'update'}"),
            ("owner", "{'read', 'create', 'update', 'delete'}"),
            ("admin", 'super')
        ;
-- END: ENTITY TABLES

-- ASSOCIATION TABLES
    CREATE TABLE IF NOT EXISTS assoc_user_auth (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES app_user (id) 
                                ON DELETE CASCADE,
        auth_id INT NOT NULL REFERENCES authorization (id)
                                ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assoc_user_todo_auth (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES app_user (id) 
                                ON DELETE CASCADE,
        auth_id INT NOT NULL REFERENCES authorization (id)
                                ON DELETE CASCADE
        todo_id INT NOT NULL REFERENCES todo (id)
                                ON DELETE CASCADE
    );
-- END: ASSOCIATION TABLES
