from todo_app.todo_db_connect import provides_conn_as_arg
from todo_app.utils import a_list_dict_to_b_list_tuple

# GET related functions
@provides_conn_as_arg
def get_tags(conn):
    with conn as cursor:
        cursor.execute("""
                        SELECT t.id AS tag_id, t.title AS title, t.description AS description
                        FROM tag as t;
                        -- LIMIT 10;
                        """)
        return cursor.fetchall()


# POST related functions
def create_tag(cursor, newlyCreated):
    newlyCreated = a_list_dict_to_b_list_tuple(newlyCreated)
    # statements
    cursor.executemany("INSERT INTO tag (title, description) VALUES (%s, %s)", newlyCreated)
    cursor.execute(f"SELECT id as tag_id, title from tag ORDER BY id DESC LIMIT {len(newlyCreated)}")
    # reverse slice of the results
    newlyCreated = cursor.fetchall()[::-1]
    return newlyCreated

def create_tag_assoc(cursor, todo_id, createAssoc, newlyCreated):
    # convert into (todo_id, tag_id) tuple
    temp_list = []
    for item in createAssoc:
        temp_list.append((todo_id, item["tag_id"]))
    for item in newlyCreated:
        temp_list.append((todo_id, item["tag_id"]))
    createAssoc = temp_list
    # statements
    cursor.executemany("INSERT INTO assoc_todo_tag (todo_id, tag_id) VALUES (%s, %s)", createAssoc)
    cursor.execute(f"SELECT * from assoc_todo_tag ORDER BY id DESC LIMIT {len(createAssoc)}")
    # reverse slice of the results
    createAssoc = cursor.fetchall()[::-1]
    return createAssoc

@provides_conn_as_arg
def insert_tag(conn, todo_id, data):
    with conn as cursor:
        newlyCreated = data["tags"]["created"]
        if newlyCreated:
            newlyCreated = create_tag(cursor, newlyCreated)
            
        createAssoc = data["tags"]["selected"]
        if createAssoc or newlyCreated:
            createAssoc = create_tag_assoc(cursor, todo_id, createAssoc, newlyCreated)
        
        return (newlyCreated, createAssoc)


# PUT related functions
def update_tags(cursor, updateTags):
    temp_list = []
    for item in updateTags:
        temp_list.append((item["title"], item["description"], item["tag_id"]))
    updateTags = temp_list
    cursor.executemany("UPDATE tag SET title=%s, description=%s WHERE id=%s", updateTags)
    cursor.execute(f"""SELECT * FROM tag WHERE id IN ({','.join(str(tag_id) for t,d,tag_id in updateTags)})""")
    updateTags = cursor.fetchall()
    return updateTags

@provides_conn_as_arg
def update_tag_by_todo_id(conn, data):
    (newlyCreated, createAssoc) = insert_tag(data["todo_id"], data)

    with conn as cursor:
        updateTags = data["tags"]["updated"]
        if updateTags:
            # update the title and/or description
            updateTags = update_tags(cursor, updateTags)

        deleteAssoc = data["tags"]["removed"]
        if deleteAssoc:
            # remove an association record
            deleteAssoc = delete_tag_assoc(cursor, data["todo_id"], deleteAssoc)
        
        return {'newlyCreated': newlyCreated, 'createAssoc': createAssoc, 'deleteAssoc': deleteAssoc}


# DELETE related functions
def delete_tag_assoc(cursor, todo_id, deleteAssoc):
    delete=[]
    for item in deleteAssoc:
        delete.append(item["tag_id"])
    
    # statements
    cursor.execute(f"""DELETE FROM assoc_todo_tag WHERE todo_id='{todo_id}' AND tag_id IN ({','.join(str(id) for id in delete)});""")
    return len(deleteAssoc)
