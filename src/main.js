import Phaser from 'phaser';
import { W, H } from './constants.js';
import BootScene       from './scenes/BootScene.js';
import MainMenuScene   from './scenes/MainMenuScene.js';
import CharSelectScene from './scenes/CharSelectScene.js';
import GameScene       from './scenes/GameScene.js';
import TownScene       from './scenes/TownScene.js';
import GameOverScene   from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#050f05',
  scene: [BootScene, MainMenuScene, CharSelectScene, GameScene, TownScene, GameOverScene],
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: false,
    pixelArt: false,
    roundPixels: true,
  },
};

new Phaser.Game(config);
