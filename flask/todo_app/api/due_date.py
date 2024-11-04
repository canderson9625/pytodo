import datetime
from todo_app.todo_db_connect import provides_conn_as_arg

# POST related functions
@provides_conn_as_arg
def insert_due_date(conn, todo_id, data):
    with conn as cursor:
        now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f+00")
        cursor.execute("INSERT INTO due_date (created_at, complete_by) VALUES (%s, %s)", (now, data["complete_by"]))
        cursor.execute("SELECT id FROM due_date ORDER BY id DESC LIMIT 1")
        due_date_id = cursor.fetchall()[0]['id']
        cursor.execute("INSERT INTO assoc_todo_due_date (todo_id, due_date_id) VALUES (%s, %s)", (todo_id, due_date_id))
        cursor.execute("SELECT id from assoc_todo_due_date ORDER BY id DESC LIMIT 1")
        todo_due_date_id = cursor.fetchall()[0]['id']
        return (due_date_id, todo_due_date_id)

# PUT related functions
@provides_conn_as_arg
def update_due_date_by_todo_id(conn, data):
    with conn as cursor:
        cursor.execute("""
                       UPDATE due_date d 
                       SET complete_by=%s
                       WHERE d.id = (
                        SELECT due_date_id
                        FROM assoc_todo_due_date tdd
                        WHERE tdd.todo_id=%s
                       );""", (data["complete_by"], data["todo_id"]))
        cursor.execute("""
                       SELECT * 
                       FROM due_date d
                       WHERE d.id = (
                        SELECT due_date_id
                        FROM assoc_todo_due_date tdd
                        WHERE tdd.todo_id=%s
                       );""", (data["todo_id"], ))
        retVal = cursor.fetchall()[0]
        return retVal
