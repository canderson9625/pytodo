import abstractTheme, { abstractProps } from "../../abstract.js";
import SealedForm from "./components/forms/form.js";
import { ModalInteractivity } from "../../../components/modal.js";
import universalMenu from "../../../components/universalMenu.js";
import {
  get_todos,
  complete_todo,
  todo_update_cb,
  delete_todo,
  description_resize
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
  PERMISSIONS = ["viewer", "basic", "owner"];

  permission = "";

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
    document.querySelectorAll('textarea[name="description"]').forEach(elem => description_resize(elem))

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

  authorization() {
    const permission_guard = (operation) => new Promise((resolve, reject) => {
      const todos = get_todos();
      todos.forEach((elem) => {
        elem.removeEventListener("click", click_login)
      });
      switch(this.permission) {
        case "{super}":
          resolve();
          break;
        case this.PERMISSIONS[0]:
          ['read'].includes(operation) && resolve();
          reject(`${operation} permission denied`);
          break;
        case this.PERMISSIONS[1]:
          ['create', 'read', 'update'].includes(operation) && resolve();
          reject(`${operation} permission denied`);
          break;
        case this.PERMISSIONS[2]:
          ['create', 'read', 'update', 'delete'].includes(operation) && resolve();
          break;
        case "":
          todos.forEach((elem) => {
            elem.addEventListener("click", click_login)
          });
        default:
          reject(`${operation} permission denied`);
          break;
      }
    })

    const operations = {
      // Todo Interactivity
      // create() {
      //   permission_guard("create")
      //     .then(() => {
      //       console.log("create permission denied")
      //     })
      //     .catch((err) => {
      //       console.log(err)
      //     })
      // },
      async read() {
        permission_guard("read")
          .then(() => {
            
          })
          .catch((err) => {
            console.log(err)
          })
      },
      async update() {
        permission_guard("update")
          .then(() => {
            get_todos().forEach((elem) => {
              todo_update_cb({elem, init: true});
              complete_todo({elem: elem.querySelector('.complete-btn'), init: true});
            });
          })
          .catch((err) => {
            console.log(err)
          })
      },
      async delete() {
        permission_guard("delete")
          .then(() => {
            get_todos().forEach((elem) => {
              delete_todo({elem, init: true})
            });
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }

    for ( const operation in operations ) {
      operations[operation].apply(this)
    }

    // doesn't prevent user from completing actions on todos they own
    // doesn't perform unless logged in
    // switch(this.permission) {
    //   case this.PERMISSIONS[0]:
    //     return {
    //       create: false,
    //       read: operations.read,
    //       update: false,
    //       delete: false,
    //     }
    //   case this.PERMISSIONS[1]:
    //     return {
    //       create: operations.create,
    //       read: operations.read,
    //       update: operations.update,
    //       delete: false,
    //     }
    //   case this.PERMISSIONS[2]:
    //     return {
    //       create: operations.create,
    //       read: operations.read,
    //       update: operations.update,
    //       delete: operations.delete,
    //     }
    //   default:
    //     return {
    //       create: operations.login,
    //       read: operations.read,
    //       update: operations.login,
    //       delete: operations.login,
    //     }
    // }
  }

  interactive() {
    // define universalMenu
    this.content.nav = universalMenu();

    // define todo interactivity
    this.authorization()

    // define theme functionality
    new Promise(() => {
      this.#filter();
      this.#create();
      this.#login();
    })
    

    // Push Notifications
    // Notification.requestPermission().then((result) => {
    //   new Notification("To do list", { body: "blah", icon: `${ORIGIN}/favicon.ico` });
    // });
  }

  #filter() {
    const FORM =
      this.content.forms?.find?.((form) => {
        return form.FORM?.parentElement?.id === "modal--search";
      }) ?? this.content.forms.FORM;

    FORM.validateForm = ({evt: any}) => {
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
              passes = todo.status === formdata?.completion_status;
            }

            // TODO: filter by date

            // filter by tags
            if (formdata?.tags) {
              passes = false;
              t.querySelectorAll('.tags span').forEach((tag, index) => {
                // console.log(formdata.tags, todo.title, tag.innerText);
                if (index === 0 || index > 0 && passes === false) {
                  passes = formdata.tags.includes(tag.innerText);
                }
              })
            }

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

    FORM.validateForm = ({evt: any}) => {
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

  #login() {
    const FORM =
      this.content.forms?.find?.((form) => {
        return form.FORM?.parentElement?.id === "modal--login";
      }) ?? this.content.forms.FORM;

    const login = (formdata) => {
      fetch(ORIGIN, {
        headers: {
          'Authorization': 'Basic ' + formdata
        }
      })
        .then((res) => {
          return res.headers.entries();
        })
        .then((headers) => {

          for ( const [key, val] of headers ) {
            if (key.includes("authenticated") && val == false) {
              return FORM.statusMessage("Invalid Login.");
            }

            if (key.includes("token")) {
              this.token = parseJwt(val);
              this.permission = this.token.permission;
              FORM.statusMessage("Welcome " + this.token.name, "Success");
              localStorage.setItem("token", val);
              this.authorization();
            }
          }
        })
        .catch((err) => {
          console.log(err);
          if (String(err).includes("SyntaxError")) {
            return FORM.statusMessage("Invalid Login.");
          }
          // TODO: network error
          FORM.statusMessage("Unknown Error Caught.", "warning");
        });
    };

    if (localStorage.getItem("mobile")) {
      FORM.FORM.querySelector("input[name=mobile]").value = localStorage.getItem("mobile");
    }

    if (localStorage.getItem("token")) {
      const token = localStorage.getItem("token");
      this.token = parseJwt(token);
      const expiration = this.token.exp * 1000;
      const now = Date.now()
      
      if (expiration > now) {
        fetch(ORIGIN, {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        }).then((res) => {
          return res.headers.entries();
        }).then((headers) => {
          for ( const [key, val] of headers ) {
            if (key.includes("authenticated") && val == false) {
              return FORM.statusMessage("Invalid Login.");
            }

            if (key.includes("token")) {
              this.token = parseJwt(val);
              this.permission = this.token.permission;
              FORM.statusMessage("Welcome " + this.token.name, "Success");
              localStorage.setItem("token", val);
              this.authorization();
            }
          }
        })
        .catch((err) => {
          console.log(err);
          if (String(err).includes("SyntaxError")) {
            return FORM.statusMessage("Invalid Login.");
          }
          // TODO: network error
          FORM.statusMessage("Unknown Error Caught.", "warning");
        });
      } else {
        console.log("expired");
      }
    }

    // stop input from allowing non digit characters
    FORM.FORM.querySelector("input[name=mobile]").addEventListener("input", (evt) => {
      if ( evt?.data && isNaN( parseInt(evt.data) ) ) {
        evt.target.value = evt.target?.value?.slice(0, -1);
      }
    })

    const fields = {
      "mobile": {
        attempts: 0,
        inc: () => {
          fields["mobile"].attempts += 1;
        }
      }, 
      "pass": {
        attempts: 0,
        inc: () => {
          fields["pass"].attempts += 1;

          // Field specific error
          // FORM.statusMessage("Please Enter Password");

          if (fields["pass"].attempts > 2) {
            FORM.statusMessage("Change your password?");
            FORM.FORM.querySelector("button[type='submit']").innerText = "Reset Password?";
          }
        }
      }
    }

    FORM.validateForm = ({evt, formdata}) => {
      // only passes if all required fields populated
      let falsy = true;
      for (const [field, value] of Object.entries(fields)) {
        if ( formdata[field] == "" ) {
          falsy = false;
          FORM.statusMessage("Please Enter All Fields.");
        } else {
          value?.inc?.()
        }
      }
      
      if (falsy) {
        const login = btoa(`${formdata["mobile"]}:${formdata["pass"]}`);
        localStorage.setItem("mobile", formdata["mobile"]);
        return FORM.submitForm(login);
      }
    };

    FORM.submitForm = login
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

function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

export const click_login = () => new Promise(() => {
  document.getElementById("login").click();
}) 