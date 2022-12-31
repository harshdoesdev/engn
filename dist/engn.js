const createCanvas = (width, height, background) => {
    const canvas = document.createElement('canvas');

    canvas.width = width ?? window.innerWidth;
    canvas.height = height ?? window.innerHeight;

    if(bg) {
        canvas.style.background = background;
    }

    return canvas;
};

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

const game = (init, update, render) => {};

export { Emitter, createCanvas, game };
