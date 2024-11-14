from werkzeug.security import generate_password_hash, check_password_hash
from todo_app.todo_db_connect import provides_conn_as_arg

@provides_conn_as_arg
def get_mobile(conn, mobile):
    with conn as cursor:
        cursor.execute("SELECT id FROM contact WHERE contact_type = 'mobile' and contact like %s;", (mobile, ))
        rows = cursor.fetchall()
        return rows

@provides_conn_as_arg
def insert_mobile(conn, mobile):
    with conn as cursor:
        cursor.execute("INSERT INTO contact (contact, contact_type) VALUES ( %s, %s );", (mobile, "mobile"))
        cursor.execute("SELECT id FROM contact ORDER BY id DESC LIMIT 1;")
        rows = cursor.fetchall()
        return rows

@provides_conn_as_arg
def get_user(conn, contact_id):
    with conn as cursor:
        cursor.execute("SELECT u.id FROM app_user u JOIN assoc_user_contact auc ON u.id = auc.user_id WHERE auc.contact_id = %s;", (contact_id, ))
        rows = cursor.fetchall()
        return rows
    
@provides_conn_as_arg
def get_user_pass_hash(conn, user_id):
    with conn as cursor:
        cursor.execute("SELECT pass_hash FROM app_user WHERE id = %s;", (user_id, ))
        return cursor.fetchall()[0]["pass_hash"]
    
@provides_conn_as_arg
def insert_user(conn, password):
    with conn as cursor:
        cursor.execute("INSERT INTO app_user (pass_hash) VALUES ( %s );", (generate_password_hash(password), ))
        cursor.execute("SELECT id FROM app_user ORDER BY id DESC LIMIT 1;")
        rows = cursor.fetchall()
        return rows
    
@provides_conn_as_arg
def get_or_insert_user(conn, mobile, password):
    rows = get_mobile(mobile)
    contact_id = -1
    if (len(rows) > 0):
        contact_id = rows[0]["id"]
    else:
        contact_id = insert_mobile(mobile)[0]["id"]

    rows = get_user(contact_id)
    user_id = -1
    if (len(rows) > 0):
        return rows[0]["id"]
    else:
        user_id = insert_user(password)[0]["id"]

        with conn as cursor:
            cursor.execute("INSERT INTO assoc_user_contact (user_id, contact_id) VALUES ( %s, %s );", (user_id, contact_id))
            cursor.execute("SELECT id FROM assoc_user_contact ORDER BY id DESC LIMIT 1;")
            rows = cursor.fetchall()
        
        return user_id
    
@provides_conn_as_arg
def get_user_token(conn, mobile):
    contact_id = get_mobile(mobile)
    with conn as cursor:
        cursor.execute("""
                        SELECT t.token 
                        FROM user u 
                        JOIN assoc_user_contact auc ON u.id = auc.user_id 
                        JOIN assoc_user_token aut ON u.id = aut.user_id 
                        WHERE auc.contact_id = %s
        ;""", (contact_id, ))
        token = cursor.fetchall()[0]['token']
        return token
    
@provides_conn_as_arg
def insert_user_token(conn, user_id):
    contact_id = get_mobile(mobile)
    with conn as cursor:
        cursor.execute("""
                        SELECT t.token 
                        FROM user u 
                        JOIN assoc_user_contact auc ON u.id = auc.user_id 
                        JOIN assoc_user_token aut ON u.id = aut.user_id 
                        WHERE auc.contact_id = %s
        ;""", (contact_id, ))
        token = cursor.fetchall()[0]['token']
        return token