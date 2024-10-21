from typing import Callable, Any
from functools import wraps
from json import loads
from todo_app.api.todo import insert_todo, update_todo_by_id, delete_todo_by_id
from todo_app.api.tag import insert_tag, update_tag_by_todo_id
from todo_app.api.due_date import insert_due_date, update_due_date_by_todo_id
from todo_app.utils import dataExists

# decorator
def parse_data_as_arg(f: Callable[..., Any]) -> Callable[..., Any]:
    """returns the parsed data as an argument"""
    @wraps(f)
    def decorator(*args, **kwargs):
        (req,) = args
        data_str = req.data.decode('utf-8')
        parsed_data = loads(data_str)
        return f(parsed_data, *args, **kwargs)
    
    return decorator


# POST API route handler
@parse_data_as_arg
def create_todo(data, req):
    """PUT API route handler"""
    result = {}
    # create todo
    if dataExists(data["title"]):
        result["todo_id"] = insert_todo(data)
        data["todo_id"] = result["todo_id"]
    
    # create due_date
    # TODO: partition due_dates
    if dataExists(data["complete_by"]) and result["todo_id"] > -1:
        result["due_date_tuple"] = insert_due_date(result["todo_id"], data)

    # create new tags, and create & update tag association records
    try:
        if dataExists(data["tags"]):
            result["tags"] = update_tag_by_todo_id(data)
    except:
        pass

    
    return {'message': 'Success', "result": result}


# PUT API route handler
@parse_data_as_arg
def update_todo(data, req):
    """PUT API route handler"""
    result = {}
    data["status"] = data.get("status", None);
    data["todo_id"] = data.get("todo_id", req.path.split("/")[-1])
    
    # update todo
    if dataExists(data["title"]):
        result["todo"] = update_todo_by_id(data)
    
    # update due_date
    try:
        if dataExists(data["complete_by"]):
            result["due_date"] = update_due_date_by_todo_id(data)
    except:
        pass
    
    # create new tags, and create & update tag association records
    try:
        if dataExists(data["tags"]):
            result["tags"] = update_tag_by_todo_id(data)
    except:
        pass
    
    return {'message': 'Success', 'result': result}


# DELETE API route handler
@parse_data_as_arg
def delete_todo(data, req):
    """DELETE API route handler"""
    result = {}
    # delete todo
    try:
        if dataExists(data["todo_id"]):
            result["todo_id"] = delete_todo_by_id(data)
    except:
        pass
    return {'message': 'dev', 'result': result}