"use strict";

export default class TagsInteractivity {
    /**
     * @type {{
     *  [number]: any
     * }}
     */
    tags

    /**
     * object to hold html references
     */
    html;

    /**
     * @constructor
     * @param {boolean} autoInit whether to automatically initialize when constructed
     */
    constructor(input, autoInit = true) {
        // autoInit && this.init()

        // woudlnt it be cool if I could do
        // this.html.multiSelect.input 
        // i could do a proxy that when it returns an object, it returns the highest property or something
        this.html = {
            multiSelect: input.parentElement.parentElement,
            input,
            combobox: input.parentElement,
            listbox: input.parentElement.querySelector('[role="listbox"]'),
            tags: input.parentElement.querySelectorAll('[role="listbox"] li'),
        }

        autoInit && this.init();
    }

    init() {
        this.updateMode = window.location.pathname.includes("update")
        this.tags = []
        // iterate over the list and synchronize status of tags
        this.html.tags.forEach((elem, idx) => {
            const data = elem.querySelector('button').dataset
            const tag = {...JSON.parse(data.tag), selected: Boolean(data.selected), default: Boolean(data.selected), elem }
            this.tags.push(tag)

            // attach handlers to the input
            const InputElement = elem.querySelector('span')
            InputElement.addEventListener("input", () => {
                this.updateTag(InputElement)
            })
            InputElement.dataset.update = JSON.stringify(tag)
        })

        this.#attachHandlers()
        return this
    }

    /**
     * @private
     */
    #renderTags() {
        
        this.html.tags.forEach((elem, idx) => {
            const button = elem.querySelector('button')
            // const elemTag = JSON.parse(button.dataset.tag)
            if (this.tags[idx].selected) {
                elem.classList.add("selected")
                button.innerText = '';
            } else {
                elem.classList.remove("selected")
                button.innerText = '';
            }
        })
        return
    }

    /**
     * @private
     */
    #attachHandlers() {
        // tags input handler
        const input = this.html.input
        input.addEventListener("keyup", (evt) => {
            // add tag in memory
            if (evt.key === "Enter") {
                this.addTag(evt.target.value.trim())
                evt.target.value = ""
            }
        })

        this.html.combobox.addEventListener("focusout", (evt) => {
            // focusout shows active element as body
            setTimeout(() => {
                // console.log(evt, this.html.multiSelect.contains(document.activeElement), document.activeElement)
                if (this.html.multiSelect.contains(document.activeElement)) {
                    return
                }
    
                const selected = this.tags.filter(tag => tag.selected)
                    .map(tag => tag.title)
                    .join(', ')
    
                if (selected.length > 25) {
                    const value = selected.slice(0, 25) + ' . . .'
                    input.value = value;
                } else {
                    input.value = selected;
                }
            }, 50)
        })

        input.addEventListener("focus", () => {
            input.value = '';
        })

        this.html.combobox.addEventListener("click", (evt) => {
            let target = evt.srcElement ?? evt.target;

            switch(target.localName){
                case 'li':
                    target = target.querySelector('button');
                    break;
                case 'span':
                    target = target.parentElement.querySelector('button');
                default:
            }

            if (Boolean(target?.dataset?.tag) === false ) {
                return;
            }

            if (this.tags.find(tag => tag.tag_id === target?.dataset?.tag?.tag_id)?.selected) {
                return;
            }

            const tag = JSON.parse(target.dataset.tag)
            this.selectTag(tag)
        })

        // create tag button
        const createTag = (evt) => {

            const focusElement = () => {
                // this.html.input.focus();
                document.removeEventListener("mouseup", focusElement);
                document.removeEventListener("touchend", focusElement);
            }

            document.addEventListener("mouseup", focusElement);
            document.addEventListener("touchend", focusElement);

            this.addTag(evt.target.previousElementSibling.value.trim())
            evt.target.previousElementSibling.value = ""
        }
        this.html.combobox.querySelector('button').addEventListener("mousedown", createTag)
        this.html.combobox.querySelector('button').addEventListener("touchend", createTag)

        return this.#renderTags();
    }

    /**
     * Add a tag
     * @param {string} input - The value of the tags input
     */
    addTag(input) {
        if (input === "") {
            return
        }
        const alreadyPresent = this.tags.find((tag) => tag.title === input)
        if (alreadyPresent) {
            return this.selectTag(alreadyPresent)
        }

        const tag = {tag_id: (this.tags.length + 1) * -1, title: input, selected: true, created: true}

        this.tags.push(tag)

        const option = new TagItem({input, tag});
        option.querySelector('button').addEventListener("click", (evt) => {
            this.removeTag(evt)
        })
        this.html.listbox.appendChild(option)
        this.#renderTags()
    }

    /**
     * 
     * @param {*} tag 
     */
    selectTag(tag) {
        for (let i = 0; i < this.tags.length; i++) {
            const currentTag = this.tags[i]
            currentTag.tag_id === tag.tag_id && (
                this.tags[i] = {...currentTag, selected: !currentTag.selected ?? true } 
            )
        }
        this.#renderTags()
    }

    updateTag(target) {
        const tag = JSON.parse(target.dataset.update)

        for (let i = 0; i < this.tags.length; i++) {
            const currentTag = this.tags[i]
            currentTag.tag_id === tag.tag_id && (
                this.tags[i] = {...currentTag, title: target.value ?? target.innerText, updated: true, selected: true } 
            )
        }
        this.#renderTags()
    }

    removeTag(evt) {
        const target = evt.srcElement ?? evt.target;
        const tag = JSON.parse(target.dataset.update ?? target.dataset.tag);
        // console.log(tag);
        for (let i = 0; i < this.tags.length; i++) {
            const currentTag = this.tags[i]
            if (tag.created) {
                delete this.tags[i]
                this.tags = this.tags.filter(x => Boolean(x));
            } else {
                currentTag.tag_id === tag.tag_id && (
                    this.tags[i] = {...currentTag, remove: true } 
                )
            }
        }
    }

    get sortedTags() {
        const removeSelectedProperty = (x) => x.map((x) => ({...x, selected: undefined}))
        const tags = this.tags
        const selectedTags = tags.filter(x => Boolean(x?.default) === false && x.selected)
        const updatedTags = selectedTags.filter(x => x.updated)
        const removedTags = tags.filter(x => Boolean(x?.default) && x.selected === false)
        
        return {
            created: removeSelectedProperty(selectedTags.filter(x => x.tag_id < 0)),
            selected: removeSelectedProperty(selectedTags.filter(x => x.tag_id > 0)),
            updated: removeSelectedProperty(updatedTags),
            removed: removeSelectedProperty(removedTags),
        }
    }
}

class TagItem {

    constructor({input, tag}) {
        return this.init({input, tag});
    }

    init({input, tag}) {
        // add tag to list
        const option = document.createElement('li')
        option.classList.add("selected");
        
        const InputElement = document.createElement("span")
        InputElement.addEventListener("input", (evt) => {
            // TODO: throttle
            this.updateTag(InputElement.parentElement)
        })

        InputElement.innerText = input
        InputElement.dataset.update = JSON.stringify(tag)

        option.appendChild(InputElement)
        
        // add button to option
        const removeBtn = document.createElement('button')
        removeBtn.dataset.tag = JSON.stringify(tag)
        removeBtn.type = "button"
        removeBtn.classList.add("adornment", "adornment--end")

        option.appendChild(removeBtn)

        return option;
    }
}