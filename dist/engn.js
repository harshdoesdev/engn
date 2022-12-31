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

    ticker.run();
};

let _audioContext = null;

const getAudioCtx = () => {
    return _audioContext ??= new AudioContext();
};

let _soundMixer = null;

const getSoundMixer = () => {
    if(!_soundMixer) {
        const audioCtx = getAudioCtx();

        _soundMixer = audioCtx.createGain();

        _soundMixer.connect(audioCtx.destination);
    }
    
    return _soundMixer;
};

const playSound = (sound, time = 0, loop = false) => {
    const audioCtx = getAudioCtx();
    const soundMixer = getSoundMixer();

    const source = audioCtx.createBufferSource();
    source.buffer = sound;
    source.loop = loop;
    source.connect(soundMixer);
    source.start(0, time);

    return source;
};

const stopSound = (sound) => {
    sound.stop();
};

const setVolume = (volume) => {
    const soundMixer = getSoundMixer();

    soundMixer.gain = volume;
};

const resumeAudioCtx = () => {
  const audioCtx = getAudioCtx();
  
  if(/interrupted|suspended/.test(audioCtx.state)) {
    audioCtx.resume();
  }

  window.removeEventListener('mousedown', resumeAudioCtx);
};

window.addEventListener('mousedown', resumeAudioCtx);

const ASSET_TYPE = {
    IMAGE: 'image',
    SOUND: 'sound',
    JSON: 'json'
};

const img = (name, src) => {
    return new Promise((resolve, reject) => {
        fetch(src)
            .then(res => res.blob())
            .then(blob => {
                const image = new Image();

                image.onload = () => resolve({ type: ASSET_TYPE.IMAGE, name, value: image });

                image.src = URL.createObjectURL(blob);
            })
            .catch(() => reject(`Could not load image: ${name}`));
    });
};

const sound = async (name, src) => {
    const audioCtx = getAudioCtx();

    const res = await fetch(src);

    if(!res.ok) {
        throw `Could not load sound: ${name}`;
    }

    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    return { type: ASSET_TYPE.SOUND, name, value: audioBuffer };
};

const json = async (name, src) => {
    const res = await fetch(src);

    if(!res.ok) {
        throw `Could not load json: ${name}`;
    }

    const data = await res.json();

    return { name, value: data };
};

const reduceAssets = (assets, { type, name, value }) => {
    assets[type] ??= {};

    assets[type][name] = value;

    return assets;
};

const load = async (list) => {
    const response = await Promise.all(list);
    const assets = response.reduce(reduceAssets, {});

    return assets;
};

export { Emitter, Ticker, createCanvas, game, getAudioCtx, img, json, load, playSound, setVolume, sound, stopSound };
