const modalProps = {
  modal: undefined,
  close: undefined,
  //   alert: undefined,
};

export class ModalInteractivity {
  #open = false;
  html = {};

  constructor(props = modalProps) {
    const { modal, close } = props;

    this.html.modal = modal;
    this.html.close = close;
  }

  get open() {
    return this.#open;
  }

  /**
   * @param {boolean} bool
   */
  set open(bool) {
    this.#open = bool;

    if (bool) {
      this.openModal();
    } else {
      this.closeModal();
    }
  }

  /**
   * @param {function} expression
   */
  openModal(expression) {
    //   console.log('openModal')
    const modal = this.html.modal;
    modal.ariaExpanded = true;
    modal.ariaHidden = false;
    modal.inert = "";

    const button = this.html.close;
    button.ariaHidden = false;
    button.focus();
    document.querySelector("main").inert = true;

    expression && expression();
  }

  /**
   * @param {function} expression
   */
  closeModal(expression) {
    const modal = this.html.modal;
    modal.ariaExpanded = false;
    modal.ariaHidden = true;
    modal.inert = true;

    const button = this.html.close;
    button.ariaHidden = true;
    document.querySelector("main").inert = false;

    modal.querySelectorAll('dialog[aria-expanded="true"]').forEach(elem => {
      elem.ariaExpanded = "false";
    })

    expression && expression();
  }
}

export class AlertInteractivity {
  //   html = {};
  constructor(props = modalProps) {
    //  const { alert } = props;
    //  modal.html.alert = alert;

    //  modal.alert.confirm = this.confirm;
    //  modal.alert.dismiss = this.dismiss;

    //  this.html.alert = alert;

    return this;
  }

  confirm() {
    console.log("confirm");
  }

  dismiss() {
    console.log("dismiss");
  }
}
