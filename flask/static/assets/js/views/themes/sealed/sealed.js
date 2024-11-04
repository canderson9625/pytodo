import abstractTheme, { abstractProps } from "../../abstract.js";
import SealedForm from "./components/forms/form.js";
import { ModalInteractivity } from "../../../components/modal.js";
import universalMenu from "../../../components/universalMenu.js";
import {
  todo_select,
  completeTodo,
  todo_update_cb,
  delete_todo,
} from "./functions/todos.js";

const API = '';
const ORIGIN = window.location.origin + API;

window.fetchMain = async () => {
  return fetch(`${ORIGIN}`).then((res) => {
    return res.text();
  });
};

const sealedProps = {
  ...abstractProps,
  autoInit: true,
};

/**
 * The entry point to the theme
 */
export default class Sealed extends abstractTheme {
  ORIGIN = ORIGIN;

  constructor(props = sealedProps) {
    super({ ...sealedProps, ...props });

    const { autoInit } = props;

    if (autoInit === false) {
      console.log("Abstract not intialized");
    } else {
      this.init();
    }
  }

  init() {
    // register content
    this.content.nav = document.getElementById("universal-menu");

    const sealedForms = document.querySelectorAll('form[is="sealed-form"]');
    try {
      if (sealedForms.length > 1) {
        this.content.forms = [];
        for (const form of sealedForms) {
          const interactive = new SealedForm({ form: form });
          this.content.forms.push(interactive);
        }
      } else {
        this.content.forms = new SealedForm({ form: sealedForms[0] });
      }
    } catch (err) {
      // no form
      console.error("No formInteractivity created.", err);
    }

    this.content.modal = new ModalInteractivity({
      modal: document.getElementById("modal"),
      close: document.getElementById("close-dialog"),
    });

    // component updates
    this.brand();

    // register functionality
    this.interactive();
  }

  brand() {
    // define brand props here

    // branding functions
    addColorToTags();

    // rename to match branding
    this.rename();

    return this;
  }

  rename() {
    // change reset button text
    document.querySelectorAll(".reset").forEach((elem) => {
      elem.innerText = "Timeless";
    });

    // change raw time to themed time
    formatDBTimestamp();
  }

  todo() {
    // select a todo to update
    todo_select();
    completeTodo();
    delete_todo();
  }

  interactive() {
    // define universalMenu
    this.content.nav = universalMenu();

    //  todo interactivity
    this.todo();

    // define theme functionality
    this.#filter();
    this.#create();
  }

  #filter() {
    const FORM =
      this.content.forms?.find?.((form) => {
        return form.FORM?.parentElement?.id === "modal--search";
      }) ?? this.content.forms.FORM;

    FORM.validateForm = (any) => {
      const formdata = Object.fromEntries(new FormData(any.target).entries());
      return FORM.submitForm(formdata);
    };

    FORM.submitForm = (formdata) => {
      window
        .fetchMain()
        .then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const content = doc.body.querySelector("main > *");

          const result = [...content.children].filter((t) => {
            const todo = JSON.parse(t.dataset.todo ?? "");

            let passes = true;

            // filter by name
            if (formdata?.title && formdata.title !== "") {
              passes = todo.title.toLowerCase().includes(formdata.title.toLowerCase());
            }

            // filter by status
            if (
              formdata?.completion_status !== undefined &&
              formdata?.completion_status !== null
            ) {
              passes = todo.status === true;
            }

            // TODO: filter by date
            // TODO: filter by tags

            return passes;
          });

          const section = document.getElementById("main").children[0];

          // remove children
          [...section.children].forEach((child) => {
            child.remove();
          });
          // append filtered children
          section.append(...result);
        })
        .then(() => {
          this.content.modal.open = false;
          this.brand();
        });
    };
  }

  #create() {
    const FORM =
      this.content.forms?.find?.((form) => {
        return form.FORM?.parentElement?.id === "modal--create";
      }) ?? this.content.forms.FORM;

    FORM.validateForm = (any) => {
      const formdata = Object.fromEntries(new FormData(any.target).entries());
      if (formdata["title"]?.trim?.() === "") {
        alert("Please Enter A Title.");
      }
      formdata["tags"] = FORM.tagsInteractivity.sortedTags;

      return FORM.submitForm(formdata);
    };

    FORM.submitForm = (formdata) => {
      fetch(ORIGIN + "/create", {
        method: "post",
        body: JSON.stringify(formdata),
      })
        .then((res) => {
          return res.json();
        })
        .then((data) => {
          const newElem = document.createElement("article");

          newElem.classList.add("todo");
          todo_update_cb(newElem);
          const blur = document.createElement("div");
          blur.classList.add("blur");
          newElem.append(blur);

          const status = `
                    <button class="complete-btn" aria-label="Complete Todo">done_outline</button>
                    <p class="toggle-todo">Status: Incomplete</p>
                    <button class="delete-todo material-symbols-outlined" aria-label="Delete Todo">delete</button>
                `;
          const statusDiv = document.createElement("div");
          statusDiv.innerHTML = status;
          newElem.append(statusDiv);

          const h2 = document.createElement("h2");
          if (formdata?.complete_by) {
            const date = document.createElement("span");
            date.classList.add("complete_by");
            date.innerText = formdata.complete_by;
            h2.innerText = formdata.title + " | ";
            h2.append(date);
          } else {
            h2.innerText = formdata.title;
            FORM.FORM.querySelector('input').value = "";
          }
          newElem.append(h2);

          if (formdata?.tags) {
            // const formdataTags = formdata.tags.split(",");
            const formdataTags = [...formdata.tags.selected.map(t => t.title), ...formdata.tags.created.map(t => t.title)];
            const tags = document.createElement("p");
            tags.classList.add("tags");
            for (let i = 0; i < formdataTags.length; i++) {
              const tag = document.createElement("span");
              tag.innerText = formdataTags[i];
              tags.append(tag);
            }
            newElem.append(tags);

            // TODO: reset tags
            FORM.tagsInteractivity.tags
          }

          if (formdata?.description) {
            const desc = document.createElement("p");
            desc.innerText = formdata.description;
            newElem.append(desc);
          }

          newElem.dataset.todo = JSON.stringify({
            todo_id: data.result.todo_id,
            title: formdata.title,
            desc: formdata?.description,
            status: false,
          });

          document.querySelector("main > section").append(newElem);

          this.content.modal.open = false;
          this.brand();
        });
    };
  }
}

/**
 * function wrapper for declarative expresssion
 */
function addColorToTags() {
  const colors = ["red", "pink", "blue", "green", "yellow", "purple"];
  let used = [];

  const getColor = () => {
    const idx = Math.floor(Math.random() * colors.length);
    return [idx, colors[idx]];
  };

  document.querySelectorAll(".tags span").forEach((elem) => {
    let [idx, color] = getColor();

    for (let i = 0; i < colors.length; i++) {
      if (used.length === colors.length) {
        used = [];
      }
      if (used.includes(i)) {
        continue;
      }
      if (used.includes(idx) === false) {
        break;
      }

      idx = i;
      color = colors[i];
    }

    used.push(idx);

    elem.style.backgroundImage = `linear-gradient(62deg, var(--${color}) 50%, var(--${
      colors[idx + 1] ?? colors[idx - 1]
    }) )`;
    elem.style.borderColor = `var(--${color})`;
  });
}

/**
 * function wrapper for declarative expresssion
 */
function formatDBTimestamp() {
  document.querySelectorAll(".todo .complete_by").forEach((elem) => {
    const now = new Date(Date.now());
    const date = new Date(elem.innerText);

    if (date.getFullYear() === now.getFullYear()) {
      if (date.getMonth() === now.getMonth()) {
        const daysleft = date.getDate() - now.getDate();
        if (daysleft > 0) {
          return (elem.innerText = `${daysleft} Days left`);
        } else if (daysleft === 0) {
          return (elem.innerText = `Due Today`);
        }
        return (elem.innerText = `Due ${
          now.getDate() - date.getDate()
        } Days ago`);
      }
    }

    return (elem.innerText = `Due ${date.getMonth() + 1}/${date.getDate()}`);
  });
}