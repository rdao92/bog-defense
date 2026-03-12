import Phaser from 'phaser';
import { W, H, C } from '../constants.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    this.drawBogBackground();
    this.createTitle();
    this.createButtons();
    this.createFireflies();
    this.createAtmosphere();
  }

  drawBogBackground() {
    // Tiled ground
    for (let y = 0; y < H; y += 64) {
      for (let x = 0; x < W; x += 64) {
        const tile = this.add.image(x, y, 'bg_ground').setOrigin(0, 0).setAlpha(0.9);
      }
    }
    // Top water strip
    const water = this.add.graphics();
    water.fillStyle(C.WATER_DARK, 0.6);
    water.fillRect(0, 0, W, 80);

    // Trees scattered around
    const treePositions = [60,80, 140,90, 820,75, 900,95, 50,500, 900,480, 780,540, 100,540];
    for (let i = 0; i < treePositions.length; i += 2) {
      this.add.image(treePositions[i], treePositions[i+1], 'tree').setAlpha(0.7);
    }
    // Mushrooms
    const mushroomPos = [200,120, 350,90, 600,100, 750,120, 180,530, 780,500];
    for (let i = 0; i < mushroomPos.length; i += 2) {
      this.add.image(mushroomPos[i], mushroomPos[i+1], 'mushroom').setAlpha(0.8);
    }
    // Lily pads
    const lilyPos = [80,200, 860,180, 120,400, 840,350];
    for (let i = 0; i < lilyPos.length; i += 2) {
      this.add.image(lilyPos[i], lilyPos[i+1], 'lily_pad').setAlpha(0.6);
    }

    // Mist overlay at bottom
    const mist = this.add.graphics();
    mist.fillStyle(C.BOG_DARK, 0.3);
    mist.fillRect(0, H - 120, W, 120);
  }

  createTitle() {
    // Title backing
    this.add.image(W / 2, 140, 'title_bg');

    // Subtitle
    this.add.text(W / 2, 96, 'THE BOG NEEDS YOU', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#90ee90',
      letterSpacing: 6,
    }).setOrigin(0.5);

    // Main title
    this.add.text(W / 2, 142, 'BOG DEFENSE', {
      fontSize: '72px',
      fontFamily: 'Georgia, serif',
      color: '#aaff44',
      stroke: '#0a1a0a',
      strokeThickness: 8,
      shadow: { offsetX: 3, offsetY: 3, color: '#003300', blur: 12, fill: true },
    }).setOrigin(0.5);

    // Glow pulse on title
    this.tweens.add({
      targets: this.children.list[this.children.list.length - 1],
      alpha: { from: 0.85, to: 1 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Version
    this.add.text(W / 2, 188, 'WAVE SURVIVAL · WEAPON MASTERY · BOG GLORY', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#4cbb17',
      letterSpacing: 3,
    }).setOrigin(0.5);
  }

  createButtons() {
    const btnY = H / 2 + 40;
    const gap = 64;

    this.createBtn(W / 2, btnY, 'PLAY', () => this.scene.start('CharSelect'));
    this.createBtn(W / 2, btnY + gap, 'HOW TO PLAY', () => this.showHelp());
  }

  createBtn(x, y, label, cb) {
    const btn = this.add.image(x, y, 'btn_normal').setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#aaff44',
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setTexture('btn_hover');
      txt.setColor('#ffffff');
      this.tweens.add({ targets: [btn, txt], scaleX: 1.04, scaleY: 1.04, duration: 80 });
    });
    btn.on('pointerout', () => {
      btn.setTexture('btn_normal');
      txt.setColor('#aaff44');
      this.tweens.add({ targets: [btn, txt], scaleX: 1, scaleY: 1, duration: 80 });
    });
    btn.on('pointerdown', cb);
    return btn;
  }

  showHelp() {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, W, H);

    const panel = this.add.graphics();
    panel.fillStyle(C.BOG_DARK, 0.97);
    panel.fillRoundedRect(W/2-300, H/2-220, 600, 440, 12);
    panel.lineStyle(2, C.GLOW, 0.7);
    panel.strokeRoundedRect(W/2-300, H/2-220, 600, 440, 12);

    const helpText = [
      'HOW TO PLAY',
      '',
      'Defend the Bog Shrine from waves of enemies!',
      '',
      'CONTROLS',
      '  WASD / Arrow Keys — Move your hero',
      '  Mouse — Aim',
      '  Left Click / Space — Shoot',
      '  1-5 — Switch weapons',
      '',
      'GAMEPLAY',
      '  Kill enemies before they reach the Shrine.',
      '  Collect gold and spend it between waves.',
      '  Buy weapons and upgrades at the Bog Market.',
      '  Hire companions at the Barracks.',
      '',
      'Between waves: visit the Town to resupply.',
      '',
      'Good luck, Bog Defender!',
    ];

    const helpBody = this.add.text(W/2, H/2 - 200, helpText.join('\n'), {
      fontSize: '15px',
      fontFamily: 'monospace',
      color: '#90ee90',
      lineSpacing: 6,
    }).setOrigin(0.5, 0);

    const closeBtn = this.add.text(W/2, H/2 + 200, '[ CLOSE ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#aaff44',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      [overlay, panel, helpBody, closeBtn].forEach(o => o.destroy());
    });
  }

  createFireflies() {
    const numFireflies = 18;
    for (let i = 0; i < numFireflies; i++) {
      const ff = this.add.image(
        Phaser.Math.Between(50, W - 50),
        Phaser.Math.Between(100, H - 100),
        'firefly'
      ).setAlpha(0);

      this.tweens.add({
        targets: ff,
        x: ff.x + Phaser.Math.Between(-80, 80),
        y: ff.y + Phaser.Math.Between(-60, 60),
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.4, 1) },
        duration: Phaser.Math.Between(1500, 3500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut',
      });
    }
  }

  createAtmosphere() {
    // Mist particles drifting from top
    const particles = this.add.particles(0, 0, 'glow_particle', {
      x: { min: 0, max: W },
      y: { min: -10, max: 60 },
      speedY: { min: 8, max: 20 },
      speedX: { min: -5, max: 5 },
      alpha: { start: 0.15, end: 0 },
      scale: { start: 2, end: 4 },
      lifespan: { min: 4000, max: 7000 },
      quantity: 1,
      frequency: 400,
    });
  }
}
