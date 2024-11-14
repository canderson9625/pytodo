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
            // TODO: Rethink this
            // calling functions from constructor is bad practice I hear.
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

            const formdata = Object.fromEntries(new FormData(this.FORM).entries());

            return this.validateForm({evt, formdata})
        })

        const handleSubmit = (evt) => {
            this.FORM.dispatchEvent(new Event("submit"));
        }
        
        this.FORM.querySelector(':is(button[type="submit"], fieldset + button:last-of-type)').addEventListener("mousedown", handleSubmit)
        this.FORM.querySelector(':is(button[type="submit"], fieldset + button:last-of-type)').addEventListener("touchstart", handleSubmit)
    }

    statusMessage(message, level = "alert") {
        if (!this.STATUS) {
            this.STATUS = {};

            this.STATUS.html = {
                status: document.createElement("div"),
                message: document.createElement("p")
            };

            this.STATUS.html.status.classList.add("status", level);
            this.STATUS.html.status.appendChild(this.STATUS.html.message);

            this.FORM.querySelector('legend').insertAdjacentElement('afterend', this.STATUS.html.status);
        }

        this.STATUS.html.message.innerText = "";
        this.STATUS.html.status.classList.remove("alert", "info", "warning", "success");

        if (message !== false) {
            this.invalid = true;
            this.STATUS.html.message.innerText = message;
            this.STATUS.html.status.classList.add(level);
        }
    }

    /**
     * @public @override
     * @param {Event} evt 
     * @returns {void}
     */
    validateForm(evt) {
        console.warn("Please implement and override the validateForm functionality.")
    }

    /**
     * @public @override
     * @param {FormData} formdata 
     * @returns {void}
     */
    submitForm(formdata) {
        console.warn("Please implement and override the submitForm functionality.")
    }
}