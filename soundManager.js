const soundManager = {
  sounds: {
    click: new Audio("./assets/sfx/click.mp3"),
    treasure: new Audio("./assets/sfx/treasure.mp3"),
    bomb: new Audio("./assets/sfx/bomb.mp3"),
    nuclear: new Audio("./assets/sfx/nuclear.mp3"),
    life: new Audio("./assets/sfx/life.mp3"),
    bg: new Audio("./assets/sfx/bg.mp3"),
    start: new Audio("./assets/sfx/start.mp3"),
    lose: new Audio("./assets/sfx/lose.mp3"),
  },
  play(name) {
    const sound = this.sounds[name];
    if (sound) {
      try {
        sound.currentTime = 0;
      } catch (e) {
        // ignore if currentTime not writable yet
      }
      const p = sound.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  },
  loop(name) {
    const sound = this.sounds[name];
    if (sound) {
      sound.loop = true;
      const p = sound.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  },
  stop(name) {
    const sound = this.sounds[name];
    if (sound) {
      sound.pause();
      try {
        sound.currentTime = 0;
      } catch (e) {
        // ignore
      }
    }
  },
};

export default soundManager;
