let _audioContext = null;

export const getAudioCtx = () => {
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

export const playSound = (sound, time = 0, loop = false) => {
    const audioCtx = getAudioCtx();
    const soundMixer = getSoundMixer();

    const source = audioCtx.createBufferSource();
    source.buffer = sound;
    source.loop = loop;
    source.connect(soundMixer);
    source.start(0, time);

    return source;
};

export const stopSound = (sound) => {
    sound.stop();
};

export const setVolume = (volume) => {
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
