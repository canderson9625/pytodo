-- was using if not exists which doesn't work
CREATE DATABASE todo_app;
-- but postgres raises an error and then continues if the database is present

\c todo_app;

-- ENTITY TABLES
    CREATE TABLE IF NOT EXISTS todo (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NULL,
        complete BOOL DEFAULT 'f',
        recurring BOOL DEFAULT 'f'
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
        todo_id INT NOT NULL REFERENCES todo(id)
                                    ON DELETE CASCADE,
        tag_id INT NOT NULL REFERENCES tag(id)
                                    ON DELETE CASCADE,
    );
    CREATE TABLE IF NOT EXISTS assoc_todo_due_date (
        id SERIAL PRIMARY KEY,
        todo_id INT NOT NULL REFERENCES todo(id)
                                    ON DELETE CASCADE,
        due_date_id INT NOT NULL REFERENCES due_date(id)
                                    ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS assoc_todo_user (
        id SERIAL PRIMARY KEY,
        todo_id INT NOT NULL REFERENCES todo(id)
                                    ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES app_user(id)
                                    ON DELETE CASCADE,
    )
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

CREATE OR REPLACE PROCEDURE recurring_status_reset()
LANGUAGE SQL
AS $$
    UPDATE todo SET complete = 'f' WHERE recurring = 't'
$$