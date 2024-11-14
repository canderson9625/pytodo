from functools import wraps
from flask import request, make_response
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from todo_app.todo_db_connect import provides_conn_as_arg
from todo_app.api.user import get_or_insert_user, get_user_pass_hash
import jwt

def handle_authorization(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        auth_response = make_response()
        auth_response.headers.set("X-Authenticated", "false")
        auth_response.headers.set("Access-Control-Expose-Headers", "X-Authenticated, X-Token")
        
        try:
            if (request.authorization.type == 'bearer'):
                # verify and refresh jwt
                auth_response.headers.set("X-Authenticated", "token")
                return f(refresh_jwt(auth_response, request.authorization.token), *args, **kwargs)
            elif (request.authorization.type == 'basic'):
                (mobile, password) = (request.authorization.parameters["username"], request.authorization.parameters["password"])
                if (mobile == "" or len(mobile) < 10 or password == ""):
                    # invalid auth
                    return f(auth_response, *args, **kwargs)

                return f(register_user(auth_response, mobile, password), *args, **kwargs)
        except:
            # ignore missing authorization property on request object
            return f(auth_response, *args, **kwargs)
        
    return decorator

def register_user(auth_response, mobile, password):
    user_id = get_or_insert_user(mobile, password)
    pass_hash = get_user_pass_hash(user_id)
    return login(auth_response, user_id, pass_hash, password)

def login(auth_response, user_id, pass_hash, password):
    if check_password_hash(pass_hash, password):
        # give jwt
        auth_response.headers.set("X-Authenticated", "true")
        encoded_jwt = make_jwt(user_id)
        auth_response.headers.set("X-Token", encoded_jwt)
        return auth_response
    else:
        auth_response.headers.set("X-Authenticated", "false")
        return auth_response

@provides_conn_as_arg
def make_jwt(conn, user_id):
    with conn as cursor:
        cursor.execute("""
                        SELECT u.name, a.permission 
                        FROM app_user u 
                        JOIN assoc_user_auth aua ON u.id = aua.user_id 
                        JOIN \"authorization\" a ON a.id = aua.auth_id 
                        WHERE u.id = %s
        ;""", (user_id, ));
        user = cursor.fetchall()[0]

        payload = {
            "exp": datetime.now(tz=timezone.utc) + timedelta(minutes = 15), 
            "name": user["name"], 
            "permission": user["permission"]
        }

        token = jwt.encode(payload, "secret", algorithm="HS256")

        cursor.execute("""
                        INSERT INTO user_token (user_id, token) VALUES ( %s, %s ) 
                        ON CONFLICT (user_id) DO UPDATE SET token = excluded.token
                        -- RETURNING *
        ;""", (user_id, token))
    
        return token

@provides_conn_as_arg
def refresh_jwt(conn, auth_response, token):
    # print(token)
    def reject():
        auth_response.headers.set("X-Authenticated", "rejected")
        return auth_response
    with conn as cursor:
        cursor.execute("SELECT user_id, token FROM user_token WHERE token = %s;", (token,))
        try:
            row = cursor.fetchall()[0]
            encoded = row["token"]
            compare = jwt.decode(encoded, "secret", algorithms="HS256")
            now = int(datetime.now(tz=timezone.utc).timestamp())

            if compare["exp"] > now:
                token = make_jwt(row["user_id"])
                auth_response.headers.set("X-Token", token)
                return auth_response
            else:
                reject()
        except:
            reject()

def reset_pw():
    # email
    pass

def magic_link():
    
    pass

def oauth2():
    pass

if __name__ == '__main__':
    pw = generate_password_hash('test')
    print( check_password_hash(pw, 'test') );