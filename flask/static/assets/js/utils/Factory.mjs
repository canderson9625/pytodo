import Singleton from "./Singleton.mjs";

class Factory {
    #instance;

    constructor() {
        if (this.#instance) {
            return this.#instance
        }

        // this.#instance = new AbstractFactory()
        return this.#instance;
    }

    // i dont know actually




    // declare methods I guess. I kinda am lost

    // that's right the abstract factory was a previous guess
    // but in actuality the debugger is the factory and this is the abstract


}

// export class AbstractFactory {
//     chain = [];

//     constructor() {
//         // discrete problem: create a singleton of a logger

//         this.chain.push()
//     }

//     static method() {

//     }
// }

// export default Factory = new Singleton(Factory);

// console.log(new Factory());