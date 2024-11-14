from flask import Flask, render_template, request, redirect, url_for
from todo_app.api import create_todo, update_todo, delete_todo
from todo_app.api.todo import get_todo, get_todos
from todo_app.api.tag import get_tags
from todo_app.api.auth import handle_authorization
from todo_app.utils import dataExists
from math import ceil
import json

indexRouteStringLeadingTrailingSlash = '/';
app = Flask(__name__, static_url_path=indexRouteStringLeadingTrailingSlash + '/static')

# renders the passed template on GET otherwise applies the passed callback
class req_method_handler:
    def __init__(self, templateCallback):
        self.render_template = templateCallback

    def render(self, callback):
        if request.method == "GET":
            return self.render_template()
        else:
            return callback()

def get_paged():        
    page = request.args.get("page")
    page = int(page) if dataExists(page) else 1
    pagesize = request.args.get("pagesize")
    pagesize = int(pagesize) if dataExists(pagesize) else 5
    lastpage = ceil(get_todos("count") / pagesize)
    lastpage = int(lastpage) if lastpage else 0
    return (page, pagesize, lastpage)

@app.route(indexRouteStringLeadingTrailingSlash, methods=["GET"])
@app.route('/' + indexRouteStringLeadingTrailingSlash[1:-1], methods=["GET"])
@handle_authorization
def index_route(auth = None):
    page = request.args.get("page")
    tags = get_tags()

    if page == None:
        (page, pagesize, lastpage) = (0, 0, 0);
        title = f"Todos | All"
        list = get_todos(None)

        list = [] if list == 0 else list
    else:
        (page, pagesize, lastpage) = get_paged()
        title = f"Todos | Page {page}"
        list = get_todos(pagesize, pagesize * (page - 1))

    if auth.data != None:
        auth.data = render_template("index.html", title=title, list=list, tags=tags, paged=(page, pagesize, lastpage), json=json) 
    else:
        return render_template("index.html", title=title, list=list, tags=tags, paged=(page, pagesize, lastpage), json=json) 

    return auth


@app.route(indexRouteStringLeadingTrailingSlash + '<operation>/', methods=["GET", "POST", "DELETE"])
@app.route(indexRouteStringLeadingTrailingSlash + '<operation>', methods=["GET", "POST", "DELETE"])
def route_handler(operation):
    route = operation.lower()
    tags = get_tags()
    (page, pagesize, lastpage) = get_paged()
    title = f"{route} | Page {page}"
    todos = get_todos(pagesize, pagesize * (page - 1))
    handleRoute = req_method_handler(lambda : render_template(f"views/{route}.html", title=title, list=todos, tags=tags, dir=dir, json=json, paged=(page, pagesize, lastpage)))
    match route:
        case "create": # GET uses render_template, POST uses lambda
            return handleRoute.render(lambda : create_todo(request))
        case "read": # GET
            return get_todos()
        case "update": # GET, PUT
            return handleRoute.render(lambda : update_todo(request))
        case "delete": # GET, DELETE
            return handleRoute.render(lambda : delete_todo(request))
        case _:
            return redirect(url_for("index_route"))


@app.route(indexRouteStringLeadingTrailingSlash + '<operation>/<id>/', methods=["GET", "PUT", "DELETE"])
@app.route(indexRouteStringLeadingTrailingSlash + '<operation>/<id>', methods=["GET", "PUT", "DELETE"])
def single_route_handler(operation, id):
    route = operation.lower()
    todo = get_todo(id)
    tags = get_tags()
    if todo:
        handleRoute = req_method_handler(lambda : render_template(f"views/{route}_single.html", title=f"{route} single", todo=todo, tags=tags, dir=dir, json=json))
        match route:
            case "read": # GET
                return todo
            case "update": # GET, PUT
                return handleRoute.render(lambda : update_todo(request))
            case "delete": # GET, DELETE
                return handleRoute.render(lambda : delete_todo(request))
            case _:
                return handleRoute.render()
    else:
        return redirect(url_for("index_route"))



@app.route(indexRouteStringLeadingTrailingSlash + 'dev/<misc>', methods=["GET"])
def dev_route(misc):
    tags = get_tags()
    title = f"Todos | Dev: {misc}"
    list = get_todos()

    return render_template("dev.html", title=title, list=list, tags=tags, paged=(0, 0, 0), json=json)
