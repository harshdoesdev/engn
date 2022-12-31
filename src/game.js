import Ticker from "./ticker.js";

export const game = (init, update, render) => {
    const ticker = new Ticker();

    const loop = dt => {
        update(dt);
        render();
    };

    ticker.on('init', init);

    ticker.on('tick', loop);

    ticker.run();
};