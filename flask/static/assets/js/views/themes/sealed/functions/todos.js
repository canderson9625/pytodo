"use strict";
import { AlertInteractivity } from "../../../../components/modal.js";
import SealedForm from "../components/forms/form.js";

export const todo_select = () => {
  document.querySelectorAll("[data-todo]").forEach((elem) => {
    todo_update_cb(elem);
  });
};

export function completeTodo() {
  document.addEventListener("click", (evt) => {
    const elem = evt.target.parentElement.parentElement;
    if (
      elem?.localName !== "article" ||
      evt.target.classList.contains("complete-btn") === false
    ) {
      return;
    }

    const todo = JSON.parse(elem.dataset.todo);
    const formdata = new FormData();
    formdata["todo_id"] = todo.todo_id;
    formdata["status"] = !todo.status ?? true;
    formdata["title"] = todo.title;
    formdata["description"] = todo.description;

    fetch(Sealed.ORIGIN + `/update/${todo.todo_id}`, {
      method: "put",
      body: JSON.stringify(formdata),
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        if (data.message.includes("uccess")) {
          window.fetchMain().then((html) => {
            const parser = new DOMParser();

            const doc = parser.parseFromString(html, "text/html");

            const content = doc.body.querySelector("main > *");

            const result = [...content.children].filter((t) => {
              const todo = JSON.parse(t.dataset.todo ?? "");
              return todo.todo_id === formdata.todo_id;
            });

            result.forEach((elem) => {
              todo_update_cb(elem);
            });

            const section = document.getElementById("main").children[0];

            let i = 0;
            [...section.children].forEach((child) => {
              const todo = JSON.parse(child.dataset.todo ?? "{}");
              if (todo.todo_id === formdata.todo_id) {
                section.replaceChild(result[i], child);
                i++;
              }
            });

            Sealed.brand();
          });
        }
      });
  });
}

export function todo_update_cb(elem) {
  elem.addEventListener("click", (evt) => {
    const todo = JSON.parse(elem.dataset.todo);
    if (evt.target.localName === "button") {
      return;
    }

    const dialog = document.querySelector("#modal--update");
    // hide all other update sections
    dialog.querySelectorAll("section").forEach((section) => {
      section.inert = true;
      section.style.display = "none";
    });

    dialog.ariaHidden = false;
    dialog.ariaExpanded = true;
    dialog.inert = "";

    // check if work has been done before making the network call
    const todoFound = dialog.querySelector(
      `section[data-todo_id="${todo.todo_id}"]`
    );
    if (todoFound === null) {
      fetch(`${Sealed.ORIGIN}/update/${todo.todo_id}`)
        .then((res) => {
          return res.text();
        })
        .then((html) => {
          const parser = new DOMParser();

          const doc = parser.parseFromString(html, "text/html");

          const content = doc.body.querySelector("main > *");
          content.dataset.todo_id = todo.todo_id;

          dialog.appendChild(content);

          descriptionResize(content.querySelector('textarea[name="description"]'));

          const FORM = new SealedForm({ form: content.querySelector("form") });

          FORM.validateForm = () => {
            const formdata = Object.fromEntries(
              new FormData(FORM.FORM).entries()
            );
            formdata["tags"] = FORM.tagsInteractivity.sortedTags;

            FORM.submitForm(formdata);
          };
          FORM.submitForm = (formdata) => {
            fetch(`${Sealed.ORIGIN}/update/${todo.todo_id}`, {
              method: "put",
              body: JSON.stringify(formdata),
            })
              .then((res) => {
                return res.json();
              })
              .then(() => {
                window.fetchMain().then((html) => {
                  const parser = new DOMParser();

                  const doc = parser.parseFromString(html, "text/html");

                  const content = doc.body.querySelector("main > *");

                  const result = [...content.children].filter((t) => {
                    const todoTitle = JSON.parse(t.dataset.todo ?? "").title.toLowerCase();
                    return todoTitle.includes(formdata.title.toLowerCase());
                  })[0];

                  const section = document.getElementById("main").children[0];
                  todo_update_cb(result);

                  [...section.children].forEach((child) => {
                    const dataTodo = JSON.parse(child.dataset.todo);
                    dataTodo.todo_id == todo.todo_id &&
                      section.replaceChild(result, child);
                  });

                  // close dialog
                  document.getElementById("close-dialog").click();
                });
              });
          };
        });
    } else {
      todoFound.style.display = "block";
      todoFound.inert = "";
      const legend = todoFound?.querySelector?.("legend");

      if (legend) {
        legend.innerText = todo.title;
      }
    }

    Sealed.content.modal.open = true;
  });
}

export function delete_todo() {
  document.addEventListener("click", (evt) => {
    const elem = evt.target.parentElement.parentElement;
    if (
      elem?.localName !== "article" ||
      evt.target.classList.contains("delete-todo") === false
    ) {
      return;
    }

    const todo = JSON.parse(elem.dataset.todo);
    const formdata = new FormData();
    formdata["todo_id"] = todo.todo_id;

    if (Sealed.content.modal.html.alert === undefined) {
      const alert = document.createElement("dialog");

      alert.id = "modal--alert";
      alert.ariaModal = "true";
      alert.ariaExpanded = "true";
      alert.ariaHidden = "false";

      const buttonYes = document.createElement("button");
      buttonYes.type = "button";
      buttonYes.innerText = "Yes";
      buttonYes.classList.add("alert");

      const buttonNo = buttonYes.cloneNode(true);
      buttonNo.innerText = "No";

      alert.innerHTML = `
         <form is="sealed-form" class="form sealed-form">
            <div class="blurred-bg"></div>
            <fieldset>
               <legend>Are You Sure?</legend>
               ${buttonYes.outerHTML}
               ${buttonNo.outerHTML}
            </fieldset>
         </form>
      `;

      Sealed.content.modal.html.alert = alert;
      Sealed.content.modal.html.modal.append(alert);
      Sealed.content.modal.alert = new AlertInteractivity({
        alert: alert,
      });

      Sealed.content.modal.open = true;
    } else {
      Sealed.content.modal.open = true;

      const alert = Sealed.content.modal.html.alert;
      alert.ariaExpanded = "true";
      alert.ariaHidden = "false";
      alert.inert = "";
    }

    const helper = (evt) => {
      deleteTodo({ evt, todo, formdata, elem });
      document.removeEventListener("click", helper);
    };

    document.addEventListener("click", helper);
  });
}

const deleteTodo = ({ evt, todo, formdata, elem }) => {
  const alert = Sealed.content.modal.html.alert;
  if (alert.ariaExpanded === "true" && evt.target.classList.contains("alert")) {
    new Promise((resolve, reject) => {
      if (evt.target.innerText === "Yes") {
        resolve();
      } else {
        reject();
      }
    })
      .then(() => {
        fetch(Sealed.ORIGIN + `/delete/${todo.todo_id}`, {
          method: "delete",
          body: JSON.stringify(formdata),
        })
          .then((res) => {
            return res.json();
          })
          .then((data) => {
            if (data.result) {
              elem.remove();

              alert.ariaExpanded = "false";
              alert.ariaHidden = "true";
              alert.inert = "true";
              Sealed.content.modal.open = false;
            }
          });
      })
      .catch(() => {
        alert.ariaExpanded = "false";
        alert.ariaHidden = "true";
        alert.inert = "true";
        Sealed.content.modal.open = false;
      });
  }
};

const descriptionResize = (description) => {

  const state = {
    rect: null,
  }

  const yVal = {
    start: null,
    curr: null
  }

  description.parentElement.addEventListener("touchstart", (evt) => {
    let { rect } = state;
    if ( rect === null ) {
      rect = description.getBoundingClientRect();
      state.rect = rect;
    }
  
    const bound = 50;
    const xMin = rect.left + rect.width - bound;
    const xMax = rect.left + rect.width + bound;
    const yMin = rect.top + rect.height - bound;
    const yMax = rect.top + rect.height + bound;

    const xCurr = evt.targetTouches[0].clientX;
    const yStart = evt.targetTouches[0].clientY;

    if (
      xCurr > xMin && xCurr < xMax
      && yStart > yMin && yStart < yMax
    ) {
      yVal.start = yStart;
    }
  }, {passive: false})

  description.parentElement.addEventListener("touchmove", (evt) => {
    if (yVal.start) {
      const { rect } = state;

      const yCurr = evt.targetTouches[0].clientY;
      yVal.curr = yCurr - yVal.start;
      
      description.style.height = rect.height + yVal.curr + "px";
    }
  }, {passive: true})

  document.addEventListener("touchend", () => {
    yVal.start = null;
    yVal.curr = null;
    state.rect = null;
  }, {passive: true})
} 
document.querySelectorAll('textarea[name="description"]').forEach(elem => descriptionResize(elem))