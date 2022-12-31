/** @module Ticker */

import Emitter from "./emitter.js";

export default class Ticker extends Emitter {

    running = false
    #lastStep = null
    #frameRequest = null

    /**
     * Kickstart the game
     */
    run() {
        if(this.running) {
            return;
        }
        
        this.running = true;
        
        this.emit('init');

        this.#lastStep = performance.now();
    
        const loop = () => {
            this.step();
            this.#lastStep = performance.now();
            this.#frameRequest = requestAnimationFrame(loop);
        }
    
        requestAnimationFrame(loop);
    }

    stop() {
        if(this.#frameRequest) {
            cancelAnimationFrame(this.#frameRequest);
        }

        this.#frameRequest = null;
        this.running = false;
    }

    /**
     * @ignore
     * Internal function called on each frame.
     */
    step() {
        const now = performance.now();
        const dt = (now - this.#lastStep) / 1000;
        this.#lastStep = now;
        this.emit('tick', dt);
    }

}