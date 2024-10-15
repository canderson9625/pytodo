def find_dict_by_id_loop(data_list, search_id):
    for item in data_list:
        # print(item['todo_id'], search_id, item['todo_id'] == search_id)
        if item['todo_id'] == int(search_id):
            return item
    return None

def a_list_dict_to_b_list_tuple(data_list, properties=["title", "description"]):
    return_list = []
    for dict in data_list:
        becomes_tuple = []
        for property in properties:
            try:
                becomes_tuple.append(dict[property])
            except Exception:
                becomes_tuple.append(None)
        return_list.append(tuple(becomes_tuple))
    return return_list

def update_list_with_latest(data_list, new_list, property):
    if not dataExists(data_list):
        return new_list
    
    return_list = []
    if dataExists(new_list): 
        for item in data_list:
            for new_item in new_list:
                #  ___general___    _____general_____
                if item["title"] == new_item["title"]:
                    appendable = item
                    appendable[property] = new_item[property]
                    return_list.append(appendable)
                else:
                    return_list.append(item)
            return return_list
    else:
        return data_list
    
    return return_list if len(return_list) > 0 else data_list

def dataExists(any) -> bool:
    return bool(any)