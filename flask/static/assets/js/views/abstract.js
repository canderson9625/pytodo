"use strict";

// import Pagination from "../components/pagination.js";

// extensible props
export const abstractProps = {
    // autoInit: true,
    pagination: false,
}

// extensible base for a view
export class abstractView {
    content = {
        header: document.querySelector('body > header'),
        main: document.getElementById('main'),
        nav: document.querySelector('nav'),
        modal: undefined,
    }

    /**
     * @constructor
     * @param {boolean} autoInit whether to automatically initialize when constructed
     */
    constructor(props = abstractProps) {
        const {
            pagination,
        } = props

        if (pagination) {
            // this.pagination = new Pagination()
        }
    }
}

// extensible base for a theme
// you could maybe do document rerendering and store all views 
// on your particular theme or have separate view files that share
// the same theme.
export default class abstractTheme extends abstractView {
    // skeleton
    constructor(props = abstractProps) {
        super(props);
    }

    init() {
        console.warn("Theme not Initialized.");
    }
}