
-- ENTITY TABLES
    CREATE TABLE IF NOT EXISTS unique_visitor (
        id SERIAL PRIMARY KEY,
        host TEXT NOT NULL,
        ua TEXT NOT NULL,
        sec_ua_plat TEXT,
        sec_ua TEXT,
        sec_ua_mobile TEXT,
        referer TEXT,
        cookie TEXT
    );

    CREATE TABLE IF NOT EXISTS unique_ip_address (
        id SERIAL PRIMARY KEY,
        ip_address TEXT NOT NULL
    );
-- END: ENTITY TABLES


-- ASSOCIATION TABLES
    CREATE TABLE IF NOT EXISTS assoc_ip_visitor (
        id SERIAL PRIMARY KEY,
        visitor INT NOT NULL REFERENCES unique_visitor(id) 
                                ON DELETE CASCADE,
        ip_address INT NOT NULL REFERENCES unique_ip_address(id) 
                                ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assoc_user_ip (
        id SERIAL PRIMARY KEY,
        user INT NOT NULL REFERENCES unique_visitor(id) 
                                ON DELETE CASCADE,
        ip_address INT NOT NULL REFERENCES unique_ip_address(id)
                                ON DELETE CASCADE
    );
-- END: ASSOCIATION TABLES
