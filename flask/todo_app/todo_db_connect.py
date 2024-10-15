from typing import Callable, Any
from functools import wraps
from psycopg2 import connect, DatabaseError
from psycopg2.extras import RealDictCursor

HOST = "localhost"

# decorator
def provides_conn_as_arg(f: Callable[..., Any]) -> Callable[..., Any]:
    """Provides the PostgreSQLConnection object as an argument to the decorated function."""
    @wraps(f)
    def decorator(*args, **kwargs):
        conn = PostgreSQLConnection()
        return f(conn, *args, **kwargs)
    return decorator


def connect_to_postgres(dbname, user, password, host, port):
    """Connects to PostgreSQL database and returns a connection object."""
    try:
        conn = connect(
            database=dbname,
            user=user,
            password=password,
            host=host,
            port=port,
        )
        return conn
    except (Exception, DatabaseError) as error:
        print(error)

def execute_query(conn, query):
    """Executes a query against the specified database."""
    try:
        cur = conn.cursor()
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        return rows
    except (Exception, DatabaseError) as error:
        print(error)

def get_connection(dbname="todo_app", user="postgres", password="example", host=HOST, port="5432"):
    return connect_to_postgres(dbname, user, password, host, port)

class PostgreSQLConnection:
    debug = False
    # debug = True

    def __init__(self, dbname="todo_app", user="postgres", password="example", host=HOST, port="5432"):
        self.conn = connect_to_postgres(dbname, user, password, host, port)
    
    # with keyword enabled
    def __enter__(self):
        self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        return self.cursor
    
    def __exit__(self, exc_type, exc_value, traceback):
        # commit to db
        if exc_type is None:
            if self.debug is False:
                self.conn.commit()
            # end db transaction
            self.cursor.close()
            self.conn.close()
        else:
            # log error
            print(f"Exception occurred in PostgreSQLConnection: {exc_type}")
            print(exc_value)
        
        # Suppress the exception
        return True
    
    def commit(self):
        return self.conn.commit()


if __name__ == "__main__":
    conn = get_connection()

    query = "SELECT * FROM todo LIMIT 100"
    result = execute_query(conn, query)

    print(result)
    # for row in result:
    #     print(row)

    conn.close()
