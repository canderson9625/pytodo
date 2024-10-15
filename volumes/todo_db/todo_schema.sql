-- was using if not exists which doesn't work
CREATE DATABASE todo_app;
-- but postgres raises an error and then continues if the database is present

\c todo_app;

-- ENTITY TABLES
    CREATE TABLE IF NOT EXISTS todo (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NULL,
        completed BOOL DEFAULT 'f'
    );

    CREATE TABLE IF NOT EXISTS tag (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS due_date (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL,
        complete_by TIMESTAMPTZ NULL
    );
-- END: ENTITY TABLES


-- ASSOCIATION TABLES
    CREATE TABLE IF NOT EXISTS assoc_todo_tag (
        id SERIAL PRIMARY KEY,
        todo_id INTEGER NOT NULL REFERENCES todo(id)
                                    ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tag(id)
                                    ON DELETE CASCADE,
    );
    CREATE TABLE IF NOT EXISTS assoc_todo_due_date (
        id SERIAL PRIMARY KEY,
        todo_id INTEGER NOT NULL REFERENCES todo(id)
                                    ON DELETE CASCADE,
        due_date_id INTEGER NOT NULL REFERENCES due_date(id)
                                    ON DELETE CASCADE
    );
-- END: ASSOCIATION TABLES

-- Sample Procedure 
-- CREATE OR REPLACE PROCEDURE procedure_name(parameter_list)
-- LANGUAGE plpgsql
-- AS $$
-- DECLARE
-- -- variable declaration
-- BEGIN
-- -- stored procedure body
-- END; $$