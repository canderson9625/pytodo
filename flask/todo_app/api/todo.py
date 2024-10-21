from todo_app.todo_db_connect import provides_conn_as_arg
from todo_app.utils import dataExists

# GET related functions
@provides_conn_as_arg
def get_todos(conn, fetch=10, offset=0):
    """
        @params fetch=10 variable for defining how many results to return.
        @params offset=0 variable for defining the offset to return results from.
    """;
    with conn as cursor:
        if fetch is None:
            cursor.execute(f"""
                        SELECT t.id AS todo_id, t.title AS title, t.description AS description, t.complete as status, dd.complete_by AS due_date, array_agg(tg.title) as tags
                        FROM todo as t
                        LEFT JOIN assoc_todo_due_date as tdd ON t.id = tdd.todo_id
                        LEFT JOIN due_date as dd ON tdd.due_date_id = dd.id
                        LEFT JOIN assoc_todo_tag tt ON t.id = tt.todo_id
                        LEFT JOIN tag tg ON tt.tag_id = tg.id
                        GROUP BY t.id, t.title, t.description, dd.complete_by
                        LIMIT 100;
                        """)
            retVal = cursor.fetchall();
        elif fetch == "count":
            cursor.execute(f"""
                        SELECT count(*)
                        FROM todo as t
                        """)
            retVal = cursor.fetchall()[0]["count"]
        else:
            cursor.execute(f"""
                        SELECT t.id AS todo_id, t.title AS title, t.description AS description, t.complete as status, dd.complete_by AS due_date, array_agg(tg.title) as tags
                        FROM todo as t
                        LEFT JOIN assoc_todo_due_date as tdd ON t.id = tdd.todo_id
                        LEFT JOIN due_date as dd ON tdd.due_date_id = dd.id
                        LEFT JOIN assoc_todo_tag tt ON t.id = tt.todo_id
                        LEFT JOIN tag tg ON tt.tag_id = tg.id
                        GROUP BY t.id, t.title, t.description, dd.complete_by
                        FETCH FIRST {fetch} ROWS ONLY
                        OFFSET {offset} ROWS;
                        """)
            retVal = cursor.fetchall()
        return retVal or 0

@provides_conn_as_arg
def get_todo(conn, id):
    """
        @params id variable to 
    """;
    with conn as cursor:
        if dataExists(id):
            cursor.execute(f"""
                        SELECT t.id AS todo_id, t.title AS title, t.description AS description, dd.complete_by AS due_date, array_agg(tg.title) as tags
                        FROM todo t
                        LEFT JOIN assoc_todo_due_date atdd ON t.id = atdd.todo_id
                        LEFT JOIN due_date dd ON atdd.due_date_id = dd.id
                        LEFT JOIN assoc_todo_tag tt ON t.id = tt.todo_id
                        LEFT JOIN tag tg ON tt.tag_id = tg.id
                        WHERE t.id = {id}
                        GROUP BY t.id, t.title, t.description, dd.complete_by
                        """)
            
            return cursor.fetchall()[0]


# POST related functions
@provides_conn_as_arg
def insert_todo(conn, data):
    """Insert the data into the db and return the ID """;
    with conn as cursor:
        cursor.execute("INSERT INTO todo (title, description) VALUES (%s, %s)", (data["title"], data["description"]))
        cursor.execute("SELECT id FROM todo ORDER BY id DESC LIMIT 1")
        return cursor.fetchall()[0]['id']

# PUT related functions
@provides_conn_as_arg
def update_todo_by_id(conn, data):
    title = data["title"].replace("'", "''");
    desc = data["description"].replace("'", "''");
    updates = [f"title='{title}'" if data["title"] else '', f"description='{desc}'" if data["description"] else '', f"complete='{data["status"]}'" if data["status"] != None else '']
    
    updates = list(filter(lambda x: x != '', updates))
    updates = updates[0] if len(updates) == 1 else ','.join(updates) if len(updates) > 0 else ''

    if updates == '':
        return False
    
    with conn as cursor:
        cursor.execute(f"UPDATE todo SET {updates} WHERE id='{data["todo_id"]}'")
        cursor.execute(f"SELECT * from todo WHERE id='{data["todo_id"]}'")
        return cursor.fetchall()[0]

# DELETE related functions
@provides_conn_as_arg
def delete_todo_by_id(conn, data):
    with conn as cursor:
        cursor.execute(f"DELETE FROM todo WHERE id={data["todo_id"]}")
        return