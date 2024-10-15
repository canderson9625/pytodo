import FormInteractivity, { formProps } from "../../../../../components/forms/form.js";
import SealedTags from "./tags.js"
import DatepickerInteractivity from "../../../../../components/forms/datepicker.js"

const sealedFormProps = {
    ...formProps,
}

export default class SealedForm extends FormInteractivity {
    /**
     * 
     */
    constructor(props = sealedFormProps) {
        super({...sealedFormProps, ...props});

        this.#init();
    }

    #init() {
        this.FORM.classList.add("form", "sealed-form");

        this.FORM.querySelectorAll('input, textarea').forEach((entry) => {
            entry.addEventListener("input", (evt) => {
                const target = evt.currentTarget;
                const parent = target.parentElement;
                
                if (parent.classList.contains('unsealed')) {
                    return;
                } else {
                    parent.classList.add('unsealed');
                    try {
                        parent.querySelector('ul').inert = '';
                    } catch {}
                }
            })
        })

        this.FORM.querySelectorAll('.placeholder-label, .multi-select').forEach((entry) => {
            entry.classList.add("sealed");
        })

        const tags = this.FORM.querySelector('.multi-select:has(#tags, .tags) input');
        if (tags) {
            this.tagsInteractivity = new SealedTags(tags);
        }

        const datepicker = this.FORM.querySelector('.multi-select:has(input[type*="date"]) [role="combobox"] > input');
        if (datepicker) {
            this.datepickerInteractivity = new DatepickerInteractivity(datepicker);
        }
    }
}

class SealedFormElement extends HTMLFormElement {
    constructor() {
        super()
    }

    inputs = []

    connectedCallback() {
        this.classList.add("form", "sealed-form")
        this.querySelectorAll('fieldset > *:not(legend)').forEach((child) => {
            this.inputs.push(new SealedInput(child));
        })
    }
}

class SealedInput {
    constructor(element) {  
        this.element = element;
        element.classList.add("sealed");
    }
}

customElements.define('sealed-form', SealedFormElement, {define: 'form'});