"use strict";
// const exposeVariableToCallbackPattern = (
//     // callback
// ) => {
//     // return function(callback) { callback(interval) }
//     // usage: exposeVariableToCallback()((interval) => {})
// }

import sealed from "./js/views/themes/sealed/sealed.js"
// import createView from "./js/views/create.js"
// import updateView from "./js/views/update.js"

if (window) {
    const tryCatchShallowCheckForExistence = (callback) => {
        // this function assumes the file exists and doesn't do any extra network calls to 
        // double check the network response and verify it's existence. Maybe it should...
        try {
            return callback()
        } catch (err) {
            (function retryCheckForExistence(callback, tries = 1, MAX_TRIES = 10) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        try {
                            const result = callback()
                            result && resolve()
                        } catch (err) {
                            console.error(err)
                            if (tries >= MAX_TRIES) {
                                return reject(err)
                            }
                            retryCheckForExistence(callback, ++tries, MAX_TRIES)
                        }
                    }, 300 * tries)
                })
            })(callback)
                .catch((err) => console.error("Could not find requested resource.", err))
        }
    }

    // doesn't load if the constructor throws an error
    let loaded = false;
    const loadScripts = () => {
        if (loaded) {
            return;
        }

        loaded = true;

        switch(true) {
            // case window.location.pathname.includes("update"):
            //     tryCatchShallowCheckForExistence(() => {
            //         try {
            //             new updateView()
            //             console.log("update.js loaded")
            //             return true
            //         } catch (err) {

            //             throw err
            //             // TODO: attempt to load it and run it
            //             // if ([...document.querySelectorAll('script')].filter(elem => elem.src.includes("update")).length === 0) {
            //             //     // document.createElement(script)
            //             // }
            //             // throw new Error("Requested resource not found. Attempting recovery...", err)
            //         }
            //     })
            //     break;
            // case window.location.pathname.includes("create"):
            //     tryCatchShallowCheckForExistence(() => {
            //         try {
            //             new createView()
            //             console.log("create.js loaded")
            //             return true
            //         } catch (err) {
            //             throw err
            //         }
            //     })
            //     break;
            default:
                tryCatchShallowCheckForExistence(() => {
                    try {
                        window.Sealed = new sealed();
                        console.log("Theme loaded: Sealed")
                        return true
                    } catch (err) {
                        // exposing the error
                        throw err
                        
                        // doesn't expose the error
                        // throw new Error("Requested resource not found. Attempting recovery...", err)
                    }
                })
        }
    }
    
    // fixes loadScripts happenning during document.readyState = interactive
    window.addEventListener("load", () => {
        loadScripts();
    })

    let interval = setInterval(() => {
        if (loaded) {
            clearInterval(interval);
            return
        }
        loadScripts()
    }, 200)
}