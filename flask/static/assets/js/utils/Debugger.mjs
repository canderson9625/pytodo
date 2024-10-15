import Singleton from "./Singleton.mjs";

// easily add the same functionality to anything
export const DebugProxy = new Proxy(() => {}, {
    debug: true, // control logging right here
    apply(target, thisARg, argsArray) {
        if (this.debug) {
            argsArray.forEach(any => {
                try {
                    console.log("fn", any())
                } catch {
                    console.log("catch", ...argsArray)
                }
            })
        }
    }
})

// components of the debugger
export class Log {
    log;
    // #logger;

    constructor(log = true) {
        this.log =log

        const logFunc = (any, message) => {
            this.#log(any, message)
        }

        // if (logger) {
        //     return logger
        // }

        // logger = new Proxy(logFunc, {
        //     apply(target, thisArg, [any, message]) {
        //         if (log === false) {
        //             return
        //         }

        //         console.time(message)
        //         const result = Reflect.apply(...arguments)
        //         console.timeEnd(message)
        //         return result
        //     }
        // })

        // return logger;

        return new Proxy(logFunc, {
                apply(target, thisArg, [any, message]) {
                    if (log === false) {
                        return
                    }
    
                    console.time(message)
                    const result = Reflect.apply(...arguments)
                    console.timeEnd(message)
                    return result
                }
            })
    }

    #log(any, message="") {
        if (this.log === false) {
            return
        }

        message = message !== "" ? message + " " : message
        any = {...any}
        const fnName = any.name ?? "No Name Property";
        delete any.name;

        if (!any) {
            console.log(`logged: ${message}${any}`)
            return
        }
        const now = new Date(Date.now());
        const when = `${now.getDate()}/${now.getMonth()}/${now.getFullYear()} T${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}::${now.getMilliseconds()}`;
        const key = `T${now.getMinutes()}:${now.getSeconds()}::${now.getMilliseconds()} - ${message}`
        this.history = {
            ...this.history, 
            [key]: [...(this.history?.[key] ?? []), {when, fnName: fnName ?? "No Name Property", data: any}]
        }
        console.log(this.history);
    }
}

export class Throttle {
    #log;
    #cb;
    #throttle;

    constructor(cb, throttleMS, { prod } = { prod: false}) {
        this.#log = new Log(!prod);
        this.#cb = cb;
        return this.#create(cb, throttleMS);
    }

    #create(cb, throttleMS) {
        const privateLog = this.#log;
        const logging = { name: Boolean(cb.name) ? cb.name : "anonymous", cb, throttleMS }
        privateLog(logging, "Create Throttle:")

        this.#throttle = new Proxy(
            () => {},
            {
                throttleMS,
                prevTime: null,
                // intercepts the function call and we store
                // the throttling behavior in the handler object
                apply(target, thisArg, args) {
                    const now = Date.now();
                    if (this.prevTime === null) {
                        this.prevTime = now
                        privateLog({...logging, now}, "Throttle/prevTime===null:")
                        return cb(...args)
                    }
                    

                    const difference = now - this.prevTime
                    if (difference >= (throttleMS ?? 0)) {
                        this.prevTime = now
                        privateLog({...logging, now, difference}, "Throttle/difference>=throttleMS:")
                        return cb(...args)
                    }

                    privateLog({...logging, now, difference}, "throttled:")
                    return false
                }
            }
        )

        // return function that calls our proxy throttle function
        const func = (...args) => {
            return this.#throttle(...args);
        }

        func.throttle = (throttleMS) => {
            return this.#create(this.#cb, throttleMS);  
        };

        return func
    }
}

export class Cache {
    #log;
    #cache = new Map();
    #throttle;
    #prod;

    constructor(func, {stale, prod} = { stale: -1, prod: false }) {
        this.#prod = prod;
        this.#log = new Log(!prod);
        this.#log(func, "Cache Constructed:")
        this.cb = func;

        const cache = (...args) => {
            let result;
            if (args.length === 0) {
                this.#log(undefined, "Cache/args.length===0:")
                result = this.#get(undefined)
            } else if (args.length === 1) {
                this.#log(args[0], "Cache/args.length===1:")
                result = this.#get(args[0])
            } else {
                this.#log(args, "Cache/args.length/else:")
                result = this.#get(args)
            }

            return result
        }

        cache.throttle = (throttleMS) => {
            this.#throttle = throttleMS;
            return cache
        }

        return cache;
    }

    #get(args) {
        // CachedThrottle - returns cache when throttled
        // ThrottledCache - returns false when throttled
        // Both           - return result when stale

        const key = Array.isArray(args) 
            ? args.join(",")
            : args

        // if there's such key in cache read the result from it
        if (this.#cache.has(key)) {
            if (this.#throttle !== undefined) {
                this.#log(key, "Cache has key:")
                return this.#cache.get(key).result;
            } else {
                this.#log(key, "Cache has key:")
                return this.#cache.get(key);
            }
        }

        // store result or throttle function
        let result
        try {
            result = this.#throttle !== undefined 
                ? new Throttle(this.cb, this.#throttle, { prod: this.#prod })
                : this.cb(...args);
        } catch {
            result = this.cb(args);
        }

        if (this.#throttle !== undefined) {
            this.#log({[key]: {fn: result, result: result(...args)}}, "Cache set key:")
            this.#cache.set(key, {fn: result, result: result(...args)})
        } else {
            this.#log({[key]: result}, "Cache set key:")
            this.#cache.set(key, result)
        }
        return result;
    }
}

class FunctionPerformanceDebugger {
    #log; // advanced logging with timing
    #cache;
    #throttle;

    options = {
        order: [
            function cache(...args) { return this.#cache(...args) }.bind(this),
            function throttle(...args) { return this.#throttle?.(...args) ?? { throttle: false } }.bind(this),
        ]
    };

    // also control logging right here through prop drilling
    constructor(cb, prod=true) {
        this.#log = new Log(!prod);
        this.#log(cb, "Debugger constructed:")

        // cache the throttled proxy function
        this.#cache = new Cache(cb, {throttle: false, prod});

        const func = (...args) => {
            return this.executeStrategy(...args);
        }

        func.throttle = (throttleMS) => {
            // create a proxy of the function with throttling behavior
            // this.#cache = this.#cache.throttle(throttleMS);
            this.#throttle = new Throttle(cb, throttleMS, { prod });

            return this.#cache
        };

        func.updateStrategy = (...args) => this.updateStrategy(...args);

        return func
    }

    executeStrategy(...args) {
        const result = [];
        console.log(this.options.order);
        for (const strat of this.options.order) {
            result.push({name: strat?.name, result: strat(...args)})
        }

        // result.reduce((a, b) => {
        //     // truthy, one truth will provide the result
        //     // we need a tiny bit more rigor like dataExists function
        //     return a || b
        // }, false)


        this.#log(result, "Executed Strategy");
        return result[0].result;
    }

    updateStrategy(order) {
        const newOrder = []
        order.forEach((strat) => {
            newOrder.push(this.options.order.find(fn => fn.name?.includes(strat)));
        })        

        this.options.order = newOrder;

        this.#log(newOrder, "updated order");
    }
}

export default FunctionPerformanceDebugger = new Singleton(FunctionPerformanceDebugger);

// const test = new Singleton(FunctionPerformanceDebugger);
// console.log(FunctionPerformanceDebugger === test) // true

// Log, Cache, Throttle
// export default class FunctionPerformanceDebugger {
//     #log; // advanced logging with timing
//     #cache;

//     // also control logging right here through prop drilling
//     constructor(cb, prod=false) {
//         this.#log = new Log(!prod);
//         this.#log(cb, "Debugger constructed:")

//         // cache the throttled proxy function
//         this.#cache = new Cache(cb, {throttle: false, prod});

//         const func = (...args) => {
//             return this.#cache(...args);
//         }

//         func.throttle = (throttleMS) => {
//             // create a proxy of the function with throttling behavior
//             this.#cache = this.#cache.throttle(throttleMS);

//             return this.#cache
//         };

//         return func
//     }
// }

// export default class Debugger {
//     log = false;
//     #cache;
//     #throttle;

//     constructor(cb) {
//         this.#log(cb, "Debugger constructed with:")
//         // create a proxy of the function with throttling behavior
//         this.#throttle = new Throttle(cb);
//         // cache the throttled proxy function
//         this.#cache = new Cache(this.#throttle);

//         const func = (...args) => {
//             return this.#cache(...args);
//         }

//         func.throttle = (throttleMS) => {
//             const throttle = new Throttle(cb, throttleMS)
//             this.#cache = new Cache(throttle);

//             return this.#cache
//         };

//         return func
//     }

//     #log(any, message="") {
//         if (this.log === false) {
//             return
//         }

//         message = message !== "" ? message + " " : message
//         if (!any) {
//             console.log(`logged: ${message}undefined`)
//             return
//         }
//         const now = new Date(Date.now());
//         const key = `${now.getDate()}/${now.getMonth()}/${now.getFullYear()} T${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}::${now.getMilliseconds()} - `
//         this.history = {
//             ...this.history, 
//             [key]: [...(this.history?.[key] ?? []), {fn: any.name, debug: `${message}${any}`}]
//         }
//         console.log(this.history);
//     }
// }