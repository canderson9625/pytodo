const SingletonMap = new Map();

export default class Singleton {
    #instance;
    #debug = new Proxy(() => {}, {
        debug: !true,
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

    constructor(any) {
        if (this.#instance === undefined) {
            try {
                const input = any ?? { input: any, name: any?.name }
                const key = any?.toString?.() ?? input?.toString?.() ?? input;
                this.#instance = key;

                try {
                    SingletonMap.set(key, new any());
                } catch {

                }
                try {
                    SingletonMap.set(key, any());
                } catch {

                }
                try {
                    SingletonMap.set(key, input);
                } catch (err) {
                    throw new Error(err)
                }
            } catch (err) {
                throw new Error(err)
            } finally {
                // key handed over for the value
                this.#instance = SingletonMap.get(this.#instance);
            }
        }

        this.#debug(() => {
            const d = Object.assign(SingletonMap, {});
            return [d, d.get(any?.toString?.() ?? { input: any })]
        });
        
        return this.#instance
    }
}

export class SingletonClass {
    #instance;

    constructor(instance) {
        if (SingletonMap.has(instance)) {
            return SingletonMap.get(instance);
        }

        try {
            this.#instance = new instance();
        } catch (err) {
            console.error("Provided instance must be instantiable. Instance not created");
            return () => false;
        }

        SingletonMap.set(instance, this.#instance);
        
        return this.#instance;
    }
}