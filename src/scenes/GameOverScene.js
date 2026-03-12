import Phaser from 'phaser';
import { W, H, C } from '../constants.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  init(data) {
    this.day    = data.day   || 1;
    this.kills  = data.kills || 0;
    this.gold   = data.gold  || 0;
    this.reason = data.reason || 'castle';
    this.won    = data.won   || false;
  }

  create() {
    // Dark bg
    for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64)
      this.add.image(x, y, 'bg_ground').setOrigin(0, 0).setAlpha(0.3);
    const g = this.add.graphics();
    g.fillStyle(this.won ? C.BOG_DARKEST : 0x0d0000, 0.85);
    g.fillRect(0, 0, W, H);

    // Atmospheric particles
    this.add.particles(0, 0, 'glow_particle', {
      x: { min: 0, max: W }, y: { min: -20, max: H/2 },
      speedY: { min: 10, max: 30 },
      alpha: { start: 0.2, end: 0 },
      scale: { start: 2, end: 4 },
      lifespan: 4000,
      quantity: 1, frequency: 200,
    });

    this.time.delayedCall(200, () => this.buildUI());
  }

  buildUI() {
    const won = this.won;

    // Header
    const headerColor = won ? '#aaff44' : '#ff4444';
    const headerText  = won ? 'THE BOG IS SAFE!' : 'THE BOG HAS FALLEN';
    this.add.text(W / 2, 100, headerText, {
      fontSize: '52px', fontFamily: 'Georgia, serif',
      color: headerColor, stroke: '#0a0a0a', strokeThickness: 8,
      shadow: { offsetX: 2, offsetY: 2, color: won ? '#003300' : '#330000', blur: 16, fill: true },
    }).setOrigin(0.5).setAlpha(0);

    const headerObj = this.children.list[this.children.list.length - 1];
    this.tweens.add({ targets: headerObj, alpha: 1, y: 110, duration: 600, ease: 'Back.easeOut' });

    // Sub
    const subText = won
      ? `You defended the Shrine for ${this.day} days!`
      : `The Shrine fell on Day ${this.day}.`;
    this.add.text(W / 2, 168, subText, {
      fontSize: '18px', fontFamily: 'monospace', color: '#cccccc',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: this.children.list[this.children.list.length - 1], alpha: 1, duration: 600, delay: 300 });

    // Stats panel
    this.time.delayedCall(500, () => {
      const panelY = 210;
      const panelG = this.add.graphics();
      panelG.fillStyle(C.BOG_DARK, 0.92);
      panelG.fillRoundedRect(W/2 - 260, panelY, 520, 200, 12);
      panelG.lineStyle(2, won ? C.GLOW : 0xff4444, 0.7);
      panelG.strokeRoundedRect(W/2 - 260, panelY, 520, 200, 12);

      const stats = [
        { label: 'Days Survived',  value: this.day },
        { label: 'Enemies Killed', value: this.kills },
        { label: 'Gold Collected', value: this.gold },
        { label: 'Bog Rating',     value: this.getRating() },
      ];

      stats.forEach((stat, i) => {
        this.add.text(W/2 - 230, panelY + 20 + i * 42, stat.label, {
          fontSize: '16px', fontFamily: 'monospace', color: '#90ee90',
        });
        this.add.text(W/2 + 230, panelY + 20 + i * 42, `${stat.value}`, {
          fontSize: '18px', fontFamily: 'monospace', color: '#ffffff',
        }).setOrigin(1, 0);
      });
    });

    // Buttons
    this.time.delayedCall(700, () => {
      const btnY = H - 130;
      this.createBtn(W/2 - 100, btnY, 'PLAY AGAIN', () => this.scene.start('CharSelect'));
      this.createBtn(W/2 + 100, btnY, 'MAIN MENU',  () => this.scene.start('MainMenu'));
    });

    // Frog sprite
    this.time.delayedCall(400, () => {
      const spr = this.add.image(W/2, H - 220, won ? 'companion_wisp' : 'enemy_bog_slime')
        .setScale(won ? 3 : 2.5)
        .setAlpha(0);
      this.tweens.add({ targets: spr, alpha: 0.6, duration: 800 });
      if (!won) {
        this.tweens.add({ targets: spr, angle: { from: -5, to: 5 }, duration: 600, yoyo: true, repeat: -1 });
      } else {
        this.tweens.add({ targets: spr, y: spr.y - 12, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    });
  }

  createBtn(x, y, label, cb) {
    const btn = this.add.image(x, y, 'btn_normal').setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontSize: '17px', fontFamily: 'monospace', color: '#aaff44',
    }).setOrigin(0.5);
    btn.on('pointerover', () => { btn.setTexture('btn_hover'); txt.setColor('#ffffff'); });
    btn.on('pointerout',  () => { btn.setTexture('btn_normal'); txt.setColor('#aaff44'); });
    btn.on('pointerdown', cb);
  }

  getRating() {
    const score = this.day * 10 + this.kills * 2;
    if (score >= 300) return 'BOG LEGEND ★★★★★';
    if (score >= 200) return 'GREAT DEFENDER ★★★★';
    if (score >= 120) return 'WORTHY FIGHTER ★★★';
    if (score >= 60)  return 'NOVICE HERO ★★';
    return 'FRESH RECRUIT ★';
  }
}
