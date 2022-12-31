import { getAudioCtx } from "./sound.js";

const ASSET_TYPE = {
    IMAGE: 'image',
    SOUND: 'sound',
    JSON: 'json'
};

export const img = (name, src) => {
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

export const sound = async (name, src) => {
    const audioCtx = getAudioCtx();

    const res = await fetch(src);

    if(!res.ok) {
        throw `Could not load sound: ${name}`;
    }

    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    return { type: ASSET_TYPE.SOUND, name, value: audioBuffer };
};

export const json = async (name, src) => {
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

export const load = async (list) => {
    const response = await Promise.all(list);
    const assets = response.reduce(reduceAssets, {});

    return assets;
};