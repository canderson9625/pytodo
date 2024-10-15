"use strict";

export const formProps = {
    form: undefined, 
    autoInit: true,
}

export default class FormInteractivity {

    /**
     * @public
     * @returns {HTMLElement}
     */
    FORM

    /**
     * @constructor
     * @param {formProps} props
     */
    constructor(props = formProps) {

        const {
            autoInit,
            form
        } = props;

        if (autoInit === false) { 
            console.log("Form not initialized");
        } else if (autoInit !== true) {
            try {
                this.init(autoInit)
            } catch (err) {
                console.warn("Form constructed but not initialized.", err);
            }
        } else {
            this.init(form)
        }
    }

    init(form) {
        this.FORM = form ?? document.querySelector('form');
        this.#attachHandlers();
    }

    /**
     * @private
     * declarative expression to attach handlers
     */
    #attachHandlers() {
        // form submit handler
        this.FORM.addEventListener("submit", (evt) => {
            evt.preventDefault()
            // only fire the add or remove button when it's the active element
            if (document.activeElement !== evt.submitter) {
                return
            }
            this.validateForm(evt)
        })

        this.FORM.querySelector(':is(button[type="submit"], fieldset + button:last-of-type)').addEventListener("mousedown", (evt) => {
            this.FORM.dispatchEvent(new Event("submit"));
        })
    }

    /**
     * @public
     * @param {Event} evt 
     * @returns {void}
     */
    validateForm(evt) {
        console.warn("Please implement the validateForm functionality.")
    }

    /**
     * @public
     * @param {FormData} formdata 
     * @returns {void}
     */
    submitForm(formdata) {
        console.warn("Please implement the submitForm functionality.")
    }
}