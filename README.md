# Technology Stack
- Python3.13 Server
    - API 
    - Jinja2 HTML templating
- Client
    - Javascript
        - confettiJS imported
    - CSS3
    - Semantic HTML5

# Server
## Python
### start 
#### dev
```
activate venv
python flask/app.py
```

#### prod
```
docker compose up todo -d
```

### routes
- GET
    - '/todo' - index route
    - '/todo/create' - DEPRECATED: create todo form
    - '/todo/read' - todo JSON
    - '/todo/update' - DEPRECATED: update todo form
    - '/todo/delete' - DEPRECATED: delete todo form
- POST
    - '/todo/create'
    ```
    /**
      * @param {string} title 
      * @param {string} description 
      * @param {datetimetz} complete_by datetimetz is assumed UTC0 and will be localized by the client
      * @param {Array<{title: string}>} tags
      * @returns {
      *   message: string,
      *   result: ***
      * } 
      */
    ```
- PUT
    - '/todo/update/<id>'
    ```
    /**
      * @param {int} todo_id
      * @param {string} title 
      * @param {string} description 
      * @param {datetimetz} complete_by datetimetz is UTC0
      * @param {boolean} status
      * @param {tags} tags 
      * @returns {
      *   message: string,
      *   result: ***
      * } 
      */
    ```
- DELETE
    - '/todo/delete/<id>'
    ```
    /**
      * @param {int} todo_id
      * ?param {tags} tags 
      * @returns {
      *   message: string,
      *   result: ***
      * } 
      */
    ```


# Client
## Javascript
### view
### theme
### interactive
### brand