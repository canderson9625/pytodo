import TagsInteractivity from "../../../../../components/forms/tags.js";

export default class SealedTags extends TagsInteractivity {
    constructor(props) {
        super(props);

        this.html.combobox.addEventListener("focusin", (evt) => {
            if (this.html.multiSelect.classList.contains('unsealed') === false) {
                this.html.multiSelect.classList.add('unsealed')
                this.html.listbox.inert = false;
            }
        })
    }
}