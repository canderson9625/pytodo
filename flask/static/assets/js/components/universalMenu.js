
/**
 * function wrapper for declarative expressions
 */
export default function universalMenu() {
    const UM = document.querySelector('#universal-menu');
    const TIME_MS = {
        MAX_TIME: 500,
        CLICK_LENGTH: 200
    }
    const calculateRect = () => {
        const rect = UM.getBoundingClientRect();
        return {left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height, hypotenuse: Math.sqrt(rect.width**2 + rect.height ** 2)}
    }
    const state = {
        origin: null,
        bounds: null,
        tracking: false,
        firstX: null,
        firstY: null,
        start: null,
        timeoutId: null,
        rect: calculateRect(),
        // TODO: create a function that jitters the menu based on the value
        jitter: 0,
        history: {
            MAX_LENGTH: 10,
            entries: null,
        },
        quadrant: {
            x: 1,
            y: 2
        }
    }

    const calculateOrigin = (offsetX = 0, offsetY = offsetX) => {
        const { rect } = state;
        const scrollBar = 15;
        const x = (window.innerWidth - scrollBar) - offsetX - rect.width
        const y = window.innerHeight - offsetY - rect.height
        const offset = {x: offsetX, y: offsetY}
        const objRet = {
            x,
            y,
            offset,
            centerX: x + (rect.width / 2),
            centerY: y + (rect.height / 2),
        }
        
        return objRet
    }
    if (state.origin === null) {
        state.origin = calculateOrigin(50);
    }
    const calculateBounds = () => {
        const { origin, rect } = state;
        return { 
            max: {
                x: 0,
                y: 0,
            },
            min: {
                x: (rect.left - origin.offset.x) * -1,
                y: (rect.top - origin.offset.y) * -1
            }
        }
    }
    if (state.bounds === null) {
        state.bounds = calculateBounds();
    }

    const coordsInBounds = (x, y) => {
        const { origin, rect } = state;

        const halfWidth = (rect.width / 2);
        const halfHeight = (rect.height / 2);

        const xVal = x - origin.centerX;
        const yVal = y - origin.centerY;
        const xMin = (rect.left - origin.offset.x) * -1;
        const yMin = (rect.top - origin.offset.y) * -1;

        const xRet = x >= origin.centerX
            ? 0 // xMax
            : x < origin.offset.x + halfWidth
                ? xMin
                : xVal;

        const yRet = y >= origin.centerY
            ? 0 // yMax
            : y < origin.offset.y + halfHeight
                ? yMin
                : yVal;

        return {x: xRet, y: yRet}
    }

    const calculateMenuQuadrant = (x, y) => {
        state.quadrant.x = x < window.innerWidth / 2 
            ? 1 // quadrant 1, 2
            : 0 // quadrant 0, 3
            
        state.quadrant.y = x < window.innerWidth / 2 
            // quadrant 1, 2
            ? y < window.innerHeight / 2
                ? 0
                : 1
            // quadrant 0, 3
            : y < window.innerHeight / 2
                ? 0
                : 3

        return state.quadrant.x + state.quadrant.y
    }

    const placeMenuInQuadrant = (x, y) => {
        const cache = state.quadrant.x + state.quadrant.y
        const quadrant = calculateMenuQuadrant(x, y);

        if (cache === quadrant) {
            return
        }

        const list = UM.querySelector('ul');
        
        new Promise((resolve) => {
            list.style.scale = 1;
            setTimeout(() => {
                resolve()
            }, 150);
        }).then(() => {

            return new Promise((resolve) => {
                const listRect = list.getBoundingClientRect();
                const listChildren = [...list.children];
        
                listChildren.forEach((child, idx) => {
                    child.style.transitionDuration = `${idx * (Math.random() * 50) + 250}ms`
                    const childRectWidth = child.getBoundingClientRect().width - listRect.width
                    // const padding = 4;
                    const offsetX = childRectWidth + listRect.width - state.rect.width;
                    const placeInQuadrant = () => {
                        switch (quadrant) {
                            case 0:
                                child.style.transform = `translate(0px, ${state.rect.height + listRect.height}px)`;
                                break;
                            case 1:
                                child.style.transform = `translate(${offsetX}px, ${state.rect.height + listRect.height}px)`;
                                break;
                            case 2:
                                child.style.transform = `translate(${offsetX}px, 0px)`;
                                break;
                            default:
                                child.style.transform = 'translate(0px, 0px)';
                                break;
                        }
                    }

                    if (UM.ariaExpanded === "true") {
                        setTimeout(placeInQuadrant, idx * (Math.random() * 50) + 50)
                    } else {
                        placeInQuadrant()
                    }
                });
                resolve()
            }).then(() => {
                list.style.scale = "";
            })
        })
    }

    const click = (evt) => {
        let shouldContinue = false;

        determineEvtTarget(evt, () => {
            shouldContinue = true
        });

        if (shouldContinue === false) {
            return;
        }

        // prepare for drag
        state.start = Date.now();
        evt.preventDefault()
        UM.style.setProperty('--cursor', 'inherit')
        document.body.style.cursor = "grabbing";
        
        const {x: clientX, y: clientY} = extractXYCoords(evt);
        const { x, y } = coordsInBounds(clientX, clientY);

        state.firstX = clientX;
        state.firstY = clientY;
        state.relativeX = x;
        state.relativeY = y;
        state.tracking = true

        // one click should pull button to center of x, y
        // with velocity and some bounces
        const velocityDecay = () => {
            const { MAX_TIME } = TIME_MS;
            const { rect: { width, height, hypotenuse } } = state;
            const threshold = hypotenuse / 3;
            const distance = Math.sqrt(Math.abs(x)**2 + Math.abs(y)**2);
            const velocityNormal = distance / threshold;
            const velocity = velocityNormal * MAX_TIME;
            const time = MAX_TIME - Math.min(MAX_TIME - 100, Math.max(velocity, 150));

            UM.style.transition = `transform ${time}ms cubic-bezier(.53,.6,.22,1.35)`;

            
            new Promise((resolve) => {
                console.log(x, y)
                const veloX = x < 0
                    ? width / -8
                    : 0;
                const veloY = y < 0
                    ? height / -8
                    : 0;

                UM.style.transform = `translate(${x + veloX}px, ${y + veloY}px)`;
                resolve()
            }).then(() => {
                setTimeout(() => {
                    UM.style.transition = `transform ${MAX_TIME}ms cubic-bezier(.53,.6,.22,1.35)`;
                    UM.style.transform = `translate(${x}px, ${y}px)`;
                }, time)
            })
        }
        state.timeoutId = setTimeout(velocityDecay,
            TIME_MS.CLICK_LENGTH
        );
    }

    const click__animIdle = ({state, x, y}) => {
        let start;
        let timeout;
        const amplitude = 3;
        const { MAX_TIME } = TIME_MS;
        const step = (timestamp) => {
            if (start === undefined) {
                start = timestamp;
            }
            const elapsed = (timestamp - start);
            
            if (state.tracking) {
                const time = MAX_TIME + ((Math.random() * MAX_TIME) - (MAX_TIME / 4));
                UM.style.transition = `transform ${time}ms ease-out`;

                const circleX = Math.round(amplitude * Math.sin(elapsed));
                const circleY = Math.round(amplitude * Math.cos(elapsed));

                // console.log("animIdle", elapsed, x, circleX);
                
                timeout = setTimeout(() => {
                    if (state.tracking === false) {
                        return;
                    }
                    UM.style.transform = `translate(${x + circleX}px, ${y + circleY}px)`;
                    requestAnimationFrame(step)
                }, time)
            } else {
                clearTimeout(timeout);
            }
        }
        requestAnimationFrame(step)
    }

    const determineEvtTarget = (evt, callback) => {
        if (evt.target.parentElement.localName === 'nav') {
            // custom behavior
            callback()
        } else {
            // normal behavior
            return
        }
    }

    const release = (evt) => {
        // prevent clicking anywhere moving the menu
        if (state.tracking === false) {
            return
        }
        if (state.timeoutId) {
            clearTimeout(state.timeoutId)
            state.timeoutId = null;
        }

        const updateState = () => {
            document.body.style.cursor = "";
            UM.style.setProperty('--cursor', 'grab');
            state.tracking = false;
        }

        const animate = () => {
            const {x: clientX, y: clientY} = extractXYCoords(evt);
            placeMenuInQuadrant(clientX, clientY);
            UM.style.transition = `transform 0.3s`;
                
            const { bounds } = state;
            const x = clientX > (window.innerWidth / 2) 
                ? bounds.max.x
                : bounds.min.x;
    
            const y = coordsInBounds(0, clientY).y;
            
            UM.style.transform = `translate(${x}px, ${y}px)`
        }

        const expandCollapseMenu = () => {
            if (state.start && Date.now() - state.start < 200) {
                a11y()
                return;
            }
        }

        updateState()
        animate()

        determineEvtTarget(evt, expandCollapseMenu)
    }

    const movementStrategy = (x, y) => {
        const { rect, firstX, firstY, relativeX, relativeY, origin: { x: originX, y: originY, centerX, centerY }, history: { entries } } = state;
        const threshold = rect.hypotenuse / 2;
        if (Math.abs(x - firstX) > threshold || Math.abs(y - firstY) > threshold) {
            UM.style.transition = `transform 300ms`;
            return coordsInBounds(x, y);
        } else {
            // strategy below threshold

            // the relative x is where the coords in bounds places the menu on click
            // so the x - first gives us a similar relative value
            // this divided by the threshold constrains the value of 1 to be equal to the threshold
            const normalX = (x - firstX) / threshold;
            const normalY = (y - firstY) / threshold;

            
            // here we multiply by a quarter of the rectangles width making the mouse
            // break from the center of the menu
            const xRet = isNaN(normalX) ? 0 : relativeX + (normalX * (rect.width / 4));

            // here we multiply by a quarter of the rectangles height
            const yRet = isNaN(normalY) ? 0 : relativeY + (normalY * (rect.height / 4));
            
            return { x: xRet, y: yRet }
        }
    }
    const populateHistory = (x, y) => {
        const { history } = state;
        const { MAX_LENGTH } = history;
        let { entries } = history;

        if (entries === null) {
            entries = [{
                x,
                y
            }]
        } else {
            if (entries.length >= MAX_LENGTH) {
                entries.pop()
            }
            entries.unshift({
                x,
                y
            })
        }

        state.history = {...history, entries}
    }
    const extractXYCoords = (evt) => {
        const x = evt.clientX ?? evt.changedTouches[0].clientX;
        const y = evt.clientY ?? evt.changedTouches[0].clientY;

        return {x, y}
    }

    const throttle = () => new Proxy(
        (cb, throttleMS) => {}, 
        {
            prevTime: null,
            // intercepts the function call and we store
            // the throttling behavior in the handler object
            apply(target, thisArg, [cb, throttleMS]) {
                const now = Date.now();
                if (this.prevTime === null) {
                    this.prevTime = now
                    return true
                }
                
                const difference = now - this.prevTime
                if (difference > throttleMS) {
                    this.prevTime = now
                    cb()
                }
                return true
            }
        }
    )

    const throttledConfetti = throttle()

    const throttledDrag = throttle()

    const drag = (evt) => {
        if (state.tracking === false) {
            return
        }

        if (state.timeoutId) {
            clearTimeout(state.timeoutId);
            state.timeoutId = null;
        }

        const { x: clientX, y: clientY } = extractXYCoords(evt);

        const x = clientX / window.innerWidth;
        const y = clientY / window.innerHeight;

        const minX = state.origin.offset.x / window.innerWidth;
        const maxX = (window.innerWidth - state.origin.offset.x) / window.innerWidth;

        window.confetti({
            startVelocity: 1,
            particleCount: 1,
            spread: 1,
            gravity: 1,
            angle: 270,
            origin: { 
                x: minX > x 
                    ? minX 
                    : x > maxX
                        ? maxX
                        : x, 
                y: y
            },
        });

        // throttledConfetti(() => {
    
        //     for (let i = 0; i < 20; i++) {
        //         setTimeout(() => {
                    
        //         }, i * 50) 
        //     }
        // }, 1000)

        throttledDrag(() => {
            if (UM.ariaExpanded === "true") {
                placeMenuInQuadrant(clientX, clientY)
            }
    
            const xVal = clientX;
            const yVal = clientY;
    
            populateHistory(xVal, yVal);
    
            const {x, y} = movementStrategy(xVal, yVal);
            UM.style.transform = `translate(${x > 0 ? 0 : x}px, ${y > 0 ? 0 : y}px)`;
    
            // TODO: fix idle animation
            // state.timeoutId = setTimeout(() => {
            //     click__animIdle({state, x, y});
            // }, 100);
        }, 50)
    }

    // draggable menu
    UM.addEventListener("mousedown", click)
    UM.addEventListener("touchstart", click, { passive: false })
    document.addEventListener("mouseup", release)
    document.addEventListener("touchend", release)
    document.addEventListener("touchcancel", release)
    document.addEventListener("mousemove", drag)
    document.addEventListener("touchmove", drag, { passive: true })
    // document.addEventListener("keydown", () => {
    //     console.log("down", document.activeElement)
    // })
    // document.addEventListener("keyup", () => {
    //     console.log("up", document.activeElement)
    // })

    // expand menu
    const a11y = () => {
        const shouldExpand = UM.ariaExpanded === "true" ? false : true
        UM.ariaExpanded = shouldExpand
        UM.querySelector("ul").inert = shouldExpand ? "" : true;
    }
    const ExpandBTN = UM.querySelector('button')
    ExpandBTN.addEventListener("keyup", (evt) => {
        evt.preventDefault()
        if ([" ", "Enter"].includes(evt.key)) {
            a11y()
        }
    })

    // animate menu
    const MENU = UM.querySelector('ul')
    MENU.addEventListener("click", (evt) => {
        if (["create-todo", "search-todo"].includes(evt.target.id)) {
            a11y();
        }
    })

    dialogs()

    return {
        toggleExpanded: a11y,
        html: {
            UM,
            MENU
        },
    }
}

function dialogs() {
    const state = {
        open: false,
        interactions: [{
            x: null,
            y: null,
        }],
        intervalId: null,

    }
    const modal = document.querySelector('#modal')
    const close = modal.querySelector('#close-dialog')

    // populate views
    const views = [];
    modal.querySelectorAll('dialog').forEach(elem => {
        const btn = document.querySelector('#' + elem.id.split("--")[1]+ '-todo')
        views.push({elem, btn})
    })

    // populate view properties and event listeners
    views.forEach(({elem, btn}) => {
        elem.ariaHidden = true
        btn?.addEventListener("click", (evt) => {
            state.open = true
            views.forEach(({elem}) => {
                elem.ariaHidden = true
                elem.inert = true
            })
            elem.ariaHidden = false
            elem.inert = ""
            render(evt.target.id)
        })
    })

    const render = () => {
        // opens and closes the modal
        modal.ariaExpanded = state.open ?? false
        modal.ariaHidden = !state.open ?? true
        modal.inert = state.open ? "" : true
        const button = modal.querySelector('button')
        button.ariaHidden = !state.open ?? false
        button.focus();
        document.querySelector('main').inert = !state.open ? "" : true

        // modal.querySelectorAll('button, input, [role=combobox]').forEach((child) => {
        //     child.inert = state.open ? "" : true;
        //     child.setAttribute("aria-hidden", !state.open ?? true);
        // })
    }

    render()

    close.addEventListener("click", () => {
        state.open = false
        views.forEach(({elem}) => {
            elem.ariaHidden = true
            elem.ariaExpanded = false;
            elem.inert = true;
        })
        render()
    })
}