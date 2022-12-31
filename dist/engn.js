const createCanvas = (width, height, background) => {
    const canvas = document.createElement('canvas');

    canvas.width = width ?? window.innerWidth;
    canvas.height = height ?? window.innerHeight;

    if(background) {
        canvas.style.background = background;
    }

    return canvas;
};

/** @module Emitter */

class Emitter {

    #subscriptions = new Map()
    
    on(type, subscriber) {
        if(!this.#subscriptions.has(type)) {
            this.#subscriptions.set(type, new Set());
        }

        const subscribers = this.#subscriptions.get(type);

        subscribers.add(subscriber);

        return () => this.off(type, subscriber);
    }

    off(type, subscriber) {
        if(!this.#subscriptions.has(type)) {
            return;
        }

        const subscribers = this.#subscriptions.get(type);

        subscribers.delete(subscriber);
    }

    once(type, subscriber) {
        const proxy = (...data) => {
            subscriber(...data);
            
            this.off(type, proxy);
        };
        
        return this.on(type, proxy);
    }

    emit(type, ...data) {
        if(!this.#subscriptions.has(type)) {
            return;
        }

        const subscribers = this.#subscriptions.get(type);

        subscribers.forEach(subscriber => subscriber(...data));
    }

}

/** @module Ticker */

class Ticker extends Emitter {

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
        };
    
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

const game = (init, update, render) => {
    const ticker = new Ticker();

    const loop = dt => {
        update(dt);
        render();
    };

    ticker.on('init', init);

    ticker.on('tick', loop);
};

export { Emitter, Ticker, createCanvas, game };
