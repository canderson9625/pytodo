from routes import app, request
from todo_app.todo_db_connect import provides_conn_as_arg

memory = dict()
@provides_conn_as_arg
def populate_memory(conn): 
    if len(memory) != 0:
        return
    
    with conn as cursor:
        cursor.execute("SELECT ip_address FROM unique_ip_address;")
        rows = cursor.fetchall()
        for row in rows:
            # no need to bloat memory, just to cause the early return later
            memory[row["ip_address"]] = "retrieved from db"
populate_memory()

@app.before_request
@provides_conn_as_arg
def log_connection(conn):
    rem = request.remote_addr;

    with conn as cursor:
        cursor.execute("SELECT ip_address FROM unique_ip_address WHERE ip_address = %s;", (rem, ))
        record = cursor.fetchall()[0]
        if (len(record)):
            # early return if we have their record
            return
        
        cursor.execute("INSERT INTO unique_visitors (host, ua, sec_ua_plat, sec_ua, sec_ua_mobile, referer, cookie) VALUES ( %s, %s, %s, %s, %s, %s, %s );", tuple(memory[rem].values()))
        cursor.execute("INSERT INTO unique_ip_address (ip_address) VALUES ( %s );", (rem, ))

        cursor.execute("SELECT * FROM unique_visitors;")
        vis_id = cursor.fetchall()[0]["visitor_id"]
        
        cursor.execute("SELECT * FROM unique_ip_address;")
        ip_id = cursor.fetchall()[0]["id"]

        cursor.execute("insert into assoc_ip_visitor (visitor, ip_address) VALUES ( %s, %s );", (vis_id, ip_id))

# both importable and executable as standalone script
if __name__ == '__main__':
    # app.run(host='0.0.0.0', port=9080)
    app.run(host='localhost', port=9080, debug=True)
