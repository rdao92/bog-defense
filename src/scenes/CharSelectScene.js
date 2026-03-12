import Phaser from 'phaser';
import { W, H, C } from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { WEAPONS } from '../data/weapons.js';

export default class CharSelectScene extends Phaser.Scene {
  constructor() { super('CharSelect'); }

  create() {
    this.selectedIndex = 0;
    this.cards = [];

    this.drawBg();
    this.createHeader();
    this.createClassCards();
    this.createInfoPanel();
    this.createStartBtn();
    this.selectClass(0);
  }

  drawBg() {
    for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64)
      this.add.image(x, y, 'bg_ground').setOrigin(0, 0).setAlpha(0.7);

    const g = this.add.graphics();
    g.fillStyle(C.BOG_DARKEST, 0.5);
    g.fillRect(0, 0, W, H);
  }

  createHeader() {
    this.add.text(W / 2, 36, 'CHOOSE YOUR DEFENDER', {
      fontSize: '28px', fontFamily: 'Georgia, serif',
      color: '#aaff44', stroke: '#0a1a0a', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(W / 2, 68, 'Each class offers a unique playstyle', {
      fontSize: '14px', fontFamily: 'monospace', color: '#90ee90',
    }).setOrigin(0.5);
  }

  createClassCards() {
    const startX = W / 2 - (CLASSES.length * 130) / 2 + 65;
    const cardY = 200;

    for (let i = 0; i < CLASSES.length; i++) {
      const cl = CLASSES[i];
      const x = startX + i * 130;
      const card = this.createCard(x, cardY, cl, i);
      this.cards.push(card);
    }
  }

  createCard(x, y, cl, index) {
    const container = this.add.container(x, y);

    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(C.BOG_DARK, 0.9);
    bg.fillRoundedRect(-54, -100, 108, 200, 10);
    bg.lineStyle(2, C.BOG_LIGHT, 0.6);
    bg.strokeRoundedRect(-54, -100, 108, 200, 10);
    container.add(bg);

    // Class color accent stripe
    const stripe = this.add.graphics();
    stripe.fillStyle(cl.color, 0.8);
    stripe.fillRoundedRect(-54, -100, 108, 8, { tl: 10, tr: 10, bl: 0, br: 0 });
    container.add(stripe);

    // Frog sprite
    const sprite = this.add.image(0, -40, `player_${cl.id}`).setScale(1.4);
    container.add(sprite);

    // Class name
    const nameText = this.add.text(0, 32, cl.name, {
      fontSize: '13px', fontFamily: 'monospace',
      color: '#ffffff', align: 'center',
    }).setOrigin(0.5);
    container.add(nameText);

    // HP/Speed stats
    const statsText = this.add.text(0, 52, `HP: ${cl.hp}  SPD: ${cl.speed}`, {
      fontSize: '10px', fontFamily: 'monospace',
      color: '#88cc88', align: 'center',
    }).setOrigin(0.5);
    container.add(statsText);

    // Starting weapon
    const wep = WEAPONS[cl.startWeapon];
    const wepText = this.add.text(0, 72, `Starts: ${wep.name}`, {
      fontSize: '9px', fontFamily: 'monospace',
      color: '#aaaa44', align: 'center',
    }).setOrigin(0.5);
    container.add(wepText);

    // Make interactive
    bg.setInteractive(new Phaser.Geom.Rectangle(-54, -100, 108, 200), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerover', () => this.selectClass(index));
    bg.on('pointerdown', () => {
      this.selectedIndex = index;
      this.startGame();
    });

    return { container, bg, sprite, index };
  }

  createInfoPanel() {
    this.infoPanel = this.add.container(W / 2, H - 130);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(C.BOG_DARK, 0.92);
    panelBg.fillRoundedRect(-380, -65, 760, 130, 10);
    panelBg.lineStyle(2, C.BOG_LIGHT);
    panelBg.strokeRoundedRect(-380, -65, 760, 130, 10);
    this.infoPanel.add(panelBg);

    this.infoName = this.add.text(-360, -50, '', {
      fontSize: '20px', fontFamily: 'Georgia, serif', color: '#aaff44',
    });
    this.infoDesc = this.add.text(-360, -20, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#90ee90',
    });
    this.infoSkills = this.add.text(-360, 10, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ccccaa',
    });
    this.infoStats = this.add.text(200, -50, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaccaa', lineSpacing: 4,
    });

    this.infoPanel.add([this.infoName, this.infoDesc, this.infoSkills, this.infoStats]);
  }

  createStartBtn() {
    const btn = this.add.image(W / 2, H - 36, 'btn_normal')
      .setScale(1.4, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 36, 'BEGIN DEFENSE', {
      fontSize: '20px', fontFamily: 'monospace', color: '#aaff44',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setTexture('btn_hover'));
    btn.on('pointerout', () => btn.setTexture('btn_normal'));
    btn.on('pointerdown', () => this.startGame());
  }

  selectClass(index) {
    this.selectedIndex = index;
    const cl = CLASSES[index];
    const wep = WEAPONS[cl.startWeapon];

    // Update card highlights
    for (let i = 0; i < this.cards.length; i++) {
      const { container } = this.cards[i];
      if (i === index) {
        this.tweens.add({ targets: container, scaleX: 1.06, scaleY: 1.06, duration: 100 });
        container.setDepth(10);
      } else {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
        container.setDepth(0);
      }
    }

    // Update info panel
    this.infoName.setText(cl.name);
    this.infoDesc.setText(cl.desc);
    const skillLabels = {
      swift_reload: 'Swift Reload', piercing_shot: 'Piercing Shot', twin_shot: 'Twin Shot',
      iron_skin: 'Iron Skin', slam_shot: 'Slam Shot', rally: 'Rally',
      mana_surge: 'Mana Surge', chain_cast: 'Chain Cast', bog_nova: 'Bog Nova',
      double_tap: 'Double Tap', shadow_step: 'Shadow Step', poison_blade: 'Poison Blade',
      eagle_eye: 'Eagle Eye', steady_aim: 'Steady Aim', armor_pierce: 'Armor Pierce',
      inspire: 'Inspire', summon_wisp: 'Summon Wisp', gold_rush: 'Gold Rush',
    };
    const skillNames = cl.skills.map(s => skillLabels[s] || s).join(' · ');
    this.infoSkills.setText(`Skills: ${skillNames}`);
    this.infoStats.setText(
      `HP: ${cl.hp}\nSpeed: ${cl.speed}\nWeapon: ${wep.name}\nDamage: ${wep.damage}/shot`
    );
  }

  startGame() {
    const cl = CLASSES[this.selectedIndex];
    this.scene.start('Game', { classId: cl.id, day: 1, gold: 80 });
  }
}
