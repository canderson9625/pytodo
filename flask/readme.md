# templates
```
- base
    - loads assets and general base layout
    - provides links to the other views in footer

- index 
    - shows the todo items and pagination

- create
    - shows the form for creating a new todo

- update
    - shows the todo items and pagination
    - single view
        - shows the form for updating a todo

- delete
    - archives the todo and is kept in the archive partition
    - archives the tag and is kept in the archive partition
    - multi select tags, drag and select
```

## components
```
- forms
    - import the macros or as an object
    - fieldset macro, creates legend with the passed type
    - input macro, creates an input with the passed type, name, and optional value

- pagination
    - needs the page, pagesize, and lastpage variables
    - optionally you can set the show_first_last_btns to true access them before the or conditional
    - optionally you can set the show_page_btns to true access them before the or conditional

- todo
    - functionality provided by the page script
    - shows the title, description, due_date, and tags
```

## views
```
- index 
    - shows the todo items and provides links to the other views

- create
    - shows the form for creating a new todo

- update
    - lets you change parameters about the todo task

- delete
    - archives the todo and is kept in the partitioned archive
```

# python api
## decorators
```
- @provides_conn_as_arg
    - you do not have to call the decorated function with the conn: PostgreSQLConnection object
    - the decorated function must take in conn as the first argument
    - warning, not yet tested multiple decorators with this

- @parse_data_as_arg
    - the decorated function must take in parsed_data as the first argument
```

## get
```
- get_todos -> todo[] | number
    - overload_1: () -> todo[] // default todo_app functionality
    - overload_2: (pagesize: number, offset: number) // fetch a page of todos
    - overload_3: ("fetch") // fetch all todos
    - overload_4: ("count") -> number // fetch all with SELECT count(*)
- get_todo(id: number) -> todo
- get_tags -> tag[] | number
    - overloads 1 and 4 only
```

## post
```
- insert_todo({title, description?} = todo) -> todo_id: number
- insert_tag(todo_id, tag) -> (createdTags, createdAssocRecords)
- insert_due_date(todo_id, {complete_by: datetime|timestamptz}) -> todo_id: number
```

# js
```
- client
    - loads after the page specific scripts to initiate
    - loads successfully on slow 3G with disabled cache, can we automate this test? #TESTED: Aug 13, 2024

- create
    - a monolith that will hopefully bear some loading weight for update
    - ideally we refactor into a few more focused abstractions

- update
    - 
```