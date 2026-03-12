import Phaser from 'phaser';
import { C } from '../constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    this.generateBackground();
    this.generateCastle();
    this.generatePlayerClasses();
    this.generateEnemies();
    this.generateProjectiles();
    this.generateUI();
    this.generateEffects();
    this.scene.start('MainMenu');
  }

  // ── Helper ────────────────────────────────────────────────────────────────
  g(w, h) {
    return this.make.graphics({ x: 0, y: 0, add: false });
  }

  tex(key, w, h, drawFn) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    drawFn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ── Background ────────────────────────────────────────────────────────────
  generateBackground() {
    // Main bog ground tile (64x64)
    this.tex('bg_ground', 64, 64, g => {
      g.fillStyle(C.BOG_MID);
      g.fillRect(0, 0, 64, 64);
      // Moss patches
      for (let i = 0; i < 6; i++) {
        const x = (i * 17 + 5) % 60;
        const y = (i * 23 + 8) % 60;
        const r = 4 + (i % 3) * 2;
        g.fillStyle(C.BOG_LIGHT, 0.6);
        g.fillCircle(x, y, r);
      }
      // Dark cracks
      g.lineStyle(1, C.BOG_DARK, 0.5);
      g.beginPath();
      g.moveTo(10, 5); g.lineTo(20, 20); g.lineTo(35, 15);
      g.strokePath();
      g.beginPath();
      g.moveTo(40, 35); g.lineTo(55, 50);
      g.strokePath();
    });

    // Swamp water tile (64x64)
    this.tex('bg_water', 64, 64, g => {
      g.fillStyle(C.WATER_DARK);
      g.fillRect(0, 0, 64, 64);
      // Ripple lines
      g.lineStyle(1, C.WATER_MID, 0.7);
      for (let i = 0; i < 3; i++) {
        const y = 10 + i * 20;
        g.beginPath();
        g.moveTo(5, y);
        g.lineTo(28, y - 3);
        g.lineTo(50, y + 2);
        g.lineTo(60, y - 1);
        g.strokePath();
      }
      // Light reflection spots
      g.fillStyle(C.WATER_LIGHT, 0.3);
      g.fillEllipse(20, 20, 12, 5);
      g.fillEllipse(45, 45, 8, 4);
    });

    // Lily pad decoration (48x48)
    this.tex('lily_pad', 48, 48, g => {
      g.fillStyle(C.LILY);
      g.fillEllipse(24, 26, 40, 32);
      // Notch
      g.fillStyle(C.WATER_DARK);
      g.fillTriangle(24, 10, 18, 26, 30, 26);
      // Veins
      g.lineStyle(1, C.LILY_DARK, 0.8);
      g.beginPath(); g.moveTo(24, 14); g.lineTo(24, 42); g.strokePath();
      g.beginPath(); g.moveTo(24, 26); g.lineTo(8, 20); g.strokePath();
      g.beginPath(); g.moveTo(24, 26); g.lineTo(40, 20); g.strokePath();
      // Small flower bud
      g.fillStyle(0xffddee, 0.9);
      g.fillCircle(24, 18, 4);
    });

    // Full scrolling background (960x640)
    this.tex('bg_full', 960, 640, g => {
      // Sky/far zone - dark bog atmosphere
      for (let y = 0; y < 80; y += 64) {
        for (let x = 0; x < 960; x += 64) {
          g.fillStyle(C.BOG_DARK);
          g.fillRect(x, y, 64, 64);
        }
      }
      // Ground area
      for (let y = 80; y < 640; y += 64) {
        for (let x = 0; x < 960; x += 64) {
          g.fillStyle(C.BOG_MID);
          g.fillRect(x, y, 64, 64);
        }
      }
      // Water channels
      g.fillStyle(C.WATER_DARK);
      g.fillRect(0, 0, 960, 80);      // top spawn zone = dark water
      g.fillRect(0, 560, 960, 80);    // castle zone

      // Fog at top
      for (let x = 0; x < 960; x += 40) {
        g.fillStyle(0x1a3a2a, 0.4);
        g.fillEllipse(x + 20, 30, 80, 40);
      }
      // Path lane markings (subtle)
      g.lineStyle(2, C.BOG_DARK, 0.3);
      g.beginPath(); g.moveTo(480, 0); g.lineTo(480, 640); g.strokePath();
    });

    // Gnarled tree (top-down silhouette, 60x60)
    this.tex('tree', 60, 60, g => {
      // Shadow
      g.fillStyle(C.BOG_DARKEST, 0.5);
      g.fillEllipse(32, 32, 52, 44);
      // Canopy
      g.fillStyle(C.BOG_LIGHT);
      g.fillCircle(30, 30, 22);
      g.fillStyle(C.BOG_MID);
      g.fillCircle(22, 24, 12);
      g.fillCircle(38, 28, 10);
      // Highlight
      g.fillStyle(C.LILY, 0.5);
      g.fillCircle(24, 22, 6);
    });

    // Mushroom (24x24)
    this.tex('mushroom', 24, 24, g => {
      g.fillStyle(0x880000);
      g.fillEllipse(12, 10, 20, 14);
      g.fillStyle(C.WHITE, 0.8);
      g.fillCircle(8, 8, 3);
      g.fillCircle(15, 7, 2);
      g.fillStyle(0xddccbb);
      g.fillRect(10, 13, 4, 8);
    });
  }

  // ── Castle ────────────────────────────────────────────────────────────────
  generateCastle() {
    // Bog Shrine - mossy stone structure, top-down (160x100)
    this.tex('castle', 160, 100, g => {
      // Stone base
      g.fillStyle(0x888880);
      g.fillRoundedRect(10, 10, 140, 80, 8);
      // Moss coverage
      g.fillStyle(C.BOG_LIGHT, 0.8);
      g.fillRoundedRect(14, 14, 132, 72, 6);
      // Stone blocks
      g.lineStyle(2, 0x666660, 0.6);
      for (let x = 30; x < 140; x += 30) {
        g.beginPath(); g.moveTo(x, 14); g.lineTo(x, 86); g.strokePath();
      }
      for (let y = 35; y < 80; y += 25) {
        g.beginPath(); g.moveTo(14, y); g.lineTo(146, y); g.strokePath();
      }
      // Central altar pool
      g.fillStyle(C.WATER_DARK);
      g.fillEllipse(80, 50, 60, 40);
      g.fillStyle(C.GLOW, 0.4);
      g.fillEllipse(80, 50, 40, 26);
      // Lily pads on pool
      g.fillStyle(C.LILY, 0.7);
      g.fillEllipse(66, 48, 16, 10);
      g.fillEllipse(94, 54, 14, 9);
      // Glow effect
      g.fillStyle(C.GLOW, 0.15);
      g.fillCircle(80, 50, 50);
    });

    // Damaged castle
    this.tex('castle_damaged', 160, 100, g => {
      g.fillStyle(0x665858);
      g.fillRoundedRect(10, 10, 140, 80, 8);
      g.fillStyle(0x884444, 0.6);
      g.fillRoundedRect(14, 14, 132, 72, 6);
      g.lineStyle(3, 0x442222, 0.8);
      g.beginPath(); g.moveTo(30, 14); g.lineTo(45, 50); g.strokePath();
      g.beginPath(); g.moveTo(110, 20); g.lineTo(95, 60); g.strokePath();
      g.fillStyle(C.WATER_DARK);
      g.fillEllipse(80, 50, 50, 34);
      g.fillStyle(0xff3300, 0.3);
      g.fillEllipse(80, 50, 36, 24);
    });
  }

  // ── Player Classes ────────────────────────────────────────────────────────
  generatePlayerClasses() {
    const classes = [
      { id: 'ranger',  shirt: 0xff8c00, hat: null,      trim: 0x3d8a30 },
      { id: 'knight',  shirt: 0xc8c8d0, hat: 'helm',    trim: 0x888888 },
      { id: 'mage',    shirt: 0x7b2fbe, hat: 'wizard',  trim: 0xd4a0ff },
      { id: 'rogue',   shirt: 0x1a1a2e, hat: null,      trim: 0x44aaff },
      { id: 'sniper',  shirt: 0x2d5a27, hat: 'hood',    trim: 0x8b5e3c },
      { id: 'noble',   shirt: 0xffd700, hat: 'crown',   trim: 0x8b2500 },
    ];

    for (const cl of classes) {
      this.tex(`player_${cl.id}`, 48, 48, g => {
        this.drawFrog(g, 24, 26, cl.shirt, cl.hat, cl.trim);
      });
    }

    // Also draw companions (smaller)
    this.tex('companion_wisp', 32, 32, g => {
      g.fillStyle(C.GLOW, 0.3);
      g.fillCircle(16, 16, 14);
      g.fillStyle(C.GLOW, 0.6);
      g.fillCircle(16, 16, 10);
      g.fillStyle(C.WHITE, 0.9);
      g.fillCircle(16, 16, 6);
      // Face
      g.fillStyle(C.BOG_DARK);
      g.fillCircle(13, 14, 2);
      g.fillCircle(19, 14, 2);
      // Smile
      g.lineStyle(1.5, C.BOG_DARK);
      g.beginPath();
      g.arc(16, 16, 4, 0.2, Math.PI - 0.2);
      g.strokePath();
    });
  }

  drawFrog(g, cx, cy, shirtColor, hatType, trimColor) {
    // Shadow
    g.fillStyle(C.BOG_DARKEST, 0.4);
    g.fillEllipse(cx, cy + 4, 36, 12);

    // Body - top-down, slightly oval
    g.fillStyle(C.FROG_DARK);
    g.fillEllipse(cx, cy, 38, 34);
    g.fillStyle(C.FROG);
    g.fillEllipse(cx, cy - 1, 34, 30);

    // Shirt/clothes (lower body, visible from top)
    g.fillStyle(shirtColor);
    g.fillEllipse(cx, cy + 5, 26, 18);

    // Belly highlight
    g.fillStyle(C.FROG_BELLY, 0.5);
    g.fillEllipse(cx, cy + 4, 16, 12);

    // Trim
    g.lineStyle(2, trimColor, 0.9);
    g.strokeEllipse(cx, cy + 5, 26, 18);

    // Arms (small bumps on sides)
    g.fillStyle(C.FROG);
    g.fillCircle(cx - 17, cy + 2, 7);
    g.fillCircle(cx + 17, cy + 2, 7);

    // Head bump (top of frog, visible from above)
    g.fillStyle(C.FROG);
    g.fillEllipse(cx, cy - 12, 22, 16);

    // Eyes (top of head, two bumps)
    g.fillStyle(C.FROG_DARK);
    g.fillCircle(cx - 7, cy - 16, 6);
    g.fillCircle(cx + 7, cy - 16, 6);
    g.fillStyle(C.EYE_WHITE);
    g.fillCircle(cx - 7, cy - 16, 4);
    g.fillCircle(cx + 7, cy - 16, 4);
    g.fillStyle(C.EYE_PUPIL);
    g.fillCircle(cx - 7, cy - 17, 2);
    g.fillCircle(cx + 7, cy - 17, 2);
    // Eye shine
    g.fillStyle(C.WHITE, 0.9);
    g.fillCircle(cx - 6, cy - 18, 1);
    g.fillCircle(cx + 8, cy - 18, 1);

    // Hat / headgear
    if (hatType === 'helm') {
      g.fillStyle(C.SILVER);
      g.fillEllipse(cx, cy - 16, 20, 14);
      g.lineStyle(2, 0x888888);
      g.strokeEllipse(cx, cy - 16, 20, 14);
    } else if (hatType === 'wizard') {
      g.fillStyle(0x7b2fbe);
      g.fillEllipse(cx, cy - 19, 18, 10);
      g.fillTriangle(cx, cy - 32, cx - 8, cy - 19, cx + 8, cy - 19);
      // Stars on hat
      g.fillStyle(C.GOLD);
      g.fillCircle(cx - 2, cy - 26, 1.5);
      g.fillCircle(cx + 4, cy - 22, 1.5);
    } else if (hatType === 'hood') {
      g.fillStyle(0x2d5a27, 0.9);
      g.fillEllipse(cx, cy - 17, 22, 16);
      g.fillStyle(0x1a3a18, 0.7);
      g.fillEllipse(cx, cy - 20, 18, 10);
    } else if (hatType === 'crown') {
      g.fillStyle(C.GOLD);
      g.fillRect(cx - 9, cy - 24, 18, 6);
      // Crown points
      g.fillTriangle(cx - 9, cy - 24, cx - 6, cy - 30, cx - 3, cy - 24);
      g.fillTriangle(cx - 1, cy - 24, cx + 2, cy - 30, cx + 5, cy - 24);
      g.fillTriangle(cx + 5, cy - 24, cx + 8, cy - 30, cx + 11, cy - 24);
    }
  }

  // ── Enemies ───────────────────────────────────────────────────────────────
  generateEnemies() {
    // Bog Slime (28x28) - green blob from top
    this.tex('enemy_bog_slime', 36, 36, g => {
      g.fillStyle(C.SLIME_DARK, 0.5);
      g.fillEllipse(19, 21, 30, 18);
      g.fillStyle(C.SLIME);
      g.fillEllipse(18, 18, 28, 22);
      // Wobble bumps
      g.fillStyle(C.SLIME, 0.7);
      g.fillCircle(10, 14, 8);
      g.fillCircle(26, 12, 7);
      g.fillCircle(18, 10, 9);
      // Highlight
      g.fillStyle(0xddffcc, 0.6);
      g.fillEllipse(14, 12, 12, 8);
      // Eyes
      g.fillStyle(C.EYE_WHITE);
      g.fillCircle(13, 16, 4);
      g.fillCircle(23, 15, 4);
      g.fillStyle(C.EYE_PUPIL);
      g.fillCircle(13, 17, 2);
      g.fillCircle(23, 16, 2);
    });

    // Swamp Rat (22x22) - small fast creature
    this.tex('enemy_swamp_rat', 32, 28, g => {
      g.fillStyle(0x3a2a18);
      g.fillEllipse(17, 17, 26, 18);
      g.fillStyle(0x5a4a30);
      g.fillEllipse(16, 16, 22, 14);
      // Snout (front = top in top-down)
      g.fillStyle(0x6a5a3a);
      g.fillEllipse(16, 8, 10, 8);
      // Ears
      g.fillStyle(0x7a6a4a);
      g.fillCircle(8, 10, 5);
      g.fillCircle(24, 10, 5);
      g.fillStyle(0xff9999, 0.7);
      g.fillCircle(8, 10, 3);
      g.fillCircle(24, 10, 3);
      // Eyes
      g.fillStyle(C.EYE_WHITE);
      g.fillCircle(12, 13, 3);
      g.fillCircle(21, 13, 3);
      g.fillStyle(0xff0000, 0.9);
      g.fillCircle(12, 13, 1.5);
      g.fillCircle(21, 13, 1.5);
      // Tail
      g.lineStyle(2, 0x5a4a30);
      g.beginPath(); g.moveTo(22, 22); g.quadraticBezierTo(30, 28, 28, 26); g.strokePath();
    });

    // Bog Sprite / Wisp - flying glowing ball
    this.tex('enemy_bog_sprite', 30, 30, g => {
      g.fillStyle(C.GLOW, 0.2);
      g.fillCircle(15, 15, 14);
      g.fillStyle(C.GLOW, 0.5);
      g.fillCircle(15, 15, 10);
      g.fillStyle(0xccffaa, 0.9);
      g.fillCircle(15, 15, 7);
      g.fillStyle(C.WHITE, 0.8);
      g.fillCircle(15, 15, 4);
      // Tiny face
      g.fillStyle(C.BOG_DARK);
      g.fillCircle(12, 14, 1.5);
      g.fillCircle(18, 14, 1.5);
      g.lineStyle(1, C.BOG_DARK);
      g.beginPath(); g.arc(15, 16, 3, 0.1, Math.PI - 0.1); g.strokePath();
    });

    // Mud Troll (42x42)
    this.tex('enemy_mud_troll', 54, 54, g => {
      // Shadow
      g.fillStyle(C.BOG_DARKEST, 0.4);
      g.fillEllipse(28, 32, 48, 22);
      // Body
      g.fillStyle(C.TROLL_DARK);
      g.fillEllipse(27, 27, 46, 40);
      g.fillStyle(C.TROLL);
      g.fillEllipse(27, 26, 42, 36);
      // Mud texture spots
      g.fillStyle(C.TROLL_DARK, 0.6);
      g.fillCircle(18, 20, 6);
      g.fillCircle(34, 24, 5);
      g.fillCircle(22, 32, 4);
      // Arms (stumpy)
      g.fillStyle(C.TROLL);
      g.fillEllipse(10, 27, 14, 10);
      g.fillEllipse(44, 27, 14, 10);
      // Head
      g.fillStyle(C.TROLL);
      g.fillEllipse(27, 12, 22, 16);
      // Eyes (angry)
      g.fillStyle(0xffaa00);
      g.fillCircle(21, 11, 4);
      g.fillCircle(33, 11, 4);
      g.fillStyle(C.EYE_PUPIL);
      g.fillCircle(21, 11, 2);
      g.fillCircle(33, 11, 2);
      // Mouth (grin)
      g.lineStyle(2, C.BOG_DARKEST);
      g.beginPath(); g.moveTo(20, 17); g.lineTo(27, 20); g.lineTo(34, 17); g.strokePath();
    });

    // Bog Witch (30x30) - explodes on death
    this.tex('enemy_bog_witch', 40, 44, g => {
      // Robe (body)
      g.fillStyle(0x1a0f2e);
      g.fillEllipse(20, 26, 30, 26);
      g.fillStyle(0x2d1b4e);
      g.fillEllipse(20, 25, 26, 22);
      // Purple glow
      g.fillStyle(0x9900ff, 0.2);
      g.fillEllipse(20, 25, 20, 18);
      // Head
      g.fillStyle(0x553333);
      g.fillCircle(20, 12, 10);
      // Hat (visible from top)
      g.fillStyle(0x1a0f2e);
      g.fillEllipse(20, 10, 22, 12);
      g.fillTriangle(20, -2, 12, 10, 28, 10);
      // Hat rim
      g.lineStyle(2, 0x2d1b4e);
      g.strokeEllipse(20, 10, 22, 12);
      // Eyes (glowing)
      g.fillStyle(0xff00ff, 0.9);
      g.fillCircle(16, 12, 3);
      g.fillCircle(24, 12, 3);
      // Cauldron/bomb she carries
      g.fillStyle(0x222222);
      g.fillCircle(20, 30, 5);
      g.fillStyle(0x66ff00, 0.8);
      g.fillCircle(20, 30, 3);
    });

    // Swamp Drake (52x45)
    this.tex('enemy_swamp_drake', 64, 56, g => {
      // Wings (spread out, visible from top)
      g.fillStyle(0x0d3018);
      g.fillEllipse(12, 28, 28, 16);
      g.fillEllipse(52, 28, 28, 16);
      g.fillStyle(0x1a4a28, 0.7);
      g.fillEllipse(12, 28, 22, 12);
      g.fillEllipse(52, 28, 22, 12);
      // Body
      g.fillStyle(0x1a5a2a);
      g.fillEllipse(32, 28, 36, 28);
      g.fillStyle(0x2a7a3a);
      g.fillEllipse(32, 27, 30, 22);
      // Scale texture
      g.fillStyle(0x1a5a2a, 0.8);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          g.fillEllipse(22 + c * 10, 22 + r * 8, 8, 5);
        }
      }
      // Head
      g.fillStyle(0x2a7a3a);
      g.fillEllipse(32, 11, 24, 18);
      // Snout
      g.fillStyle(0x1a5a2a);
      g.fillEllipse(32, 4, 14, 10);
      // Eyes
      g.fillStyle(0xffff00);
      g.fillCircle(24, 10, 4);
      g.fillCircle(40, 10, 4);
      g.fillStyle(C.EYE_PUPIL);
      g.fillCircle(24, 10, 2);
      g.fillCircle(40, 10, 2);
      // Tail
      g.lineStyle(4, 0x1a5a2a);
      g.beginPath(); g.moveTo(32, 42); g.quadraticBezierTo(50, 54, 54, 50); g.strokePath();
    });

    // Armored Troll
    this.tex('enemy_armored_troll', 58, 58, g => {
      g.fillStyle(C.BOG_DARKEST, 0.4);
      g.fillEllipse(30, 34, 52, 24);
      g.fillStyle(0x4a4a4a);
      g.fillEllipse(29, 29, 50, 44);
      // Armor plates
      g.fillStyle(0x888888);
      g.fillEllipse(29, 28, 44, 38);
      g.lineStyle(2, 0x555555);
      g.strokeEllipse(29, 28, 44, 38);
      // Plate lines
      g.lineStyle(2, 0x666666);
      g.beginPath(); g.moveTo(16, 20); g.lineTo(42, 20); g.strokePath();
      g.beginPath(); g.moveTo(12, 32); g.lineTo(46, 32); g.strokePath();
      // Glowing eyes
      g.fillStyle(0xff4400);
      g.fillCircle(22, 16, 5);
      g.fillCircle(36, 16, 5);
      g.fillStyle(0xff8800, 0.6);
      g.fillCircle(22, 16, 3);
      g.fillCircle(36, 16, 3);
    });

    // Bog Titan (68x55) - massive boss
    this.tex('enemy_bog_titan', 80, 70, g => {
      g.fillStyle(C.BOG_DARKEST, 0.6);
      g.fillEllipse(42, 46, 72, 30);
      // Body
      g.fillStyle(0x1f0f05);
      g.fillEllipse(40, 38, 70, 58);
      g.fillStyle(0x3b1f0a);
      g.fillEllipse(40, 36, 62, 50);
      // Armor/shell segments
      g.fillStyle(0x2d1505);
      for (let i = 0; i < 5; i++) {
        g.fillEllipse(20 + i * 10, 30, 14, 18);
      }
      // Huge arms
      g.fillStyle(0x3b1f0a);
      g.fillEllipse(10, 40, 20, 14);
      g.fillEllipse(70, 40, 20, 14);
      // Giant head
      g.fillStyle(0x4a2800);
      g.fillEllipse(40, 12, 34, 24);
      // Horns
      g.fillStyle(0x222200);
      g.fillTriangle(28, 5, 22, -5, 34, 5);
      g.fillTriangle(52, 5, 46, 5, 58, -5);
      // Glowing eyes
      g.fillStyle(0xff0000, 0.9);
      g.fillCircle(32, 12, 6);
      g.fillCircle(48, 12, 6);
      g.fillStyle(0xff6600);
      g.fillCircle(32, 12, 3);
      g.fillCircle(48, 12, 3);
      // Mouth
      g.lineStyle(3, 0xff2200, 0.8);
      g.beginPath(); g.moveTo(30, 20); g.lineTo(40, 22); g.lineTo(50, 20); g.strokePath();
    });
  }

  // ── Projectiles ───────────────────────────────────────────────────────────
  generateProjectiles() {
    // Arrow (16x6)
    this.tex('proj_arrow', 16, 6, g => {
      g.fillStyle(0x8b5e3c);
      g.fillRect(0, 2, 12, 2);
      g.fillStyle(0x4a9a30);
      g.fillTriangle(12, 0, 16, 3, 12, 6);
      // Fletching
      g.fillStyle(0xdddddd, 0.8);
      g.fillTriangle(0, 0, 4, 3, 0, 5);
    });

    // Bullet (10x4)
    this.tex('proj_bullet', 10, 4, g => {
      g.fillStyle(0xaaaa44);
      g.fillRoundedRect(0, 0, 10, 4, 2);
      g.fillStyle(0xffff88, 0.6);
      g.fillCircle(8, 2, 2);
    });

    // Spore (12x12) - greenish blob
    this.tex('proj_spore', 12, 12, g => {
      g.fillStyle(0x44aa22, 0.8);
      g.fillCircle(6, 6, 5);
      g.fillStyle(0x88ff44, 0.9);
      g.fillCircle(6, 6, 3);
      g.fillStyle(C.WHITE, 0.6);
      g.fillCircle(4, 4, 1.5);
    });

    // Sniper shot (18x4)
    this.tex('proj_sniper', 18, 4, g => {
      g.fillStyle(0x22aaff);
      g.fillRoundedRect(0, 0, 18, 4, 2);
      g.fillStyle(C.WHITE, 0.7);
      g.fillRect(2, 1, 14, 2);
    });

    // Magic orb (20x20)
    this.tex('proj_orb', 20, 20, g => {
      g.fillStyle(0x6600aa, 0.4);
      g.fillCircle(10, 10, 10);
      g.fillStyle(0x9900ff, 0.8);
      g.fillCircle(10, 10, 7);
      g.fillStyle(0xcc44ff, 0.9);
      g.fillCircle(10, 10, 4);
      g.fillStyle(C.WHITE, 0.8);
      g.fillCircle(8, 8, 2);
    });

    // Vine tendril (14x5)
    this.tex('proj_vine', 14, 5, g => {
      g.lineStyle(3, 0x2d8a00);
      g.beginPath();
      g.moveTo(0, 2);
      g.quadraticBezierTo(7, 0, 14, 2);
      g.strokePath();
      g.lineStyle(2, 0x4cbb17);
      g.beginPath();
      g.moveTo(0, 3);
      g.quadraticBezierTo(7, 1, 14, 3);
      g.strokePath();
    });

    // Explosion (64x64)
    this.tex('explosion', 64, 64, g => {
      g.fillStyle(0xff6600, 0.2);
      g.fillCircle(32, 32, 32);
      g.fillStyle(0xff8800, 0.5);
      g.fillCircle(32, 32, 22);
      g.fillStyle(0xffcc00, 0.8);
      g.fillCircle(32, 32, 14);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(32, 32, 6);
    });

    // Magic explosion (64x64)
    this.tex('explosion_magic', 64, 64, g => {
      g.fillStyle(0x6600aa, 0.2);
      g.fillCircle(32, 32, 32);
      g.fillStyle(0x9900ff, 0.5);
      g.fillCircle(32, 32, 22);
      g.fillStyle(0xcc44ff, 0.8);
      g.fillCircle(32, 32, 14);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(32, 32, 6);
    });

    // Spore explosion (64x64)
    this.tex('explosion_spore', 64, 64, g => {
      g.fillStyle(0x22aa00, 0.2);
      g.fillCircle(32, 32, 32);
      g.fillStyle(0x44cc22, 0.5);
      g.fillCircle(32, 32, 22);
      g.fillStyle(0x88ff44, 0.8);
      g.fillCircle(32, 32, 14);
      g.fillStyle(0xccffaa, 0.9);
      g.fillCircle(32, 32, 6);
    });
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  generateUI() {
    // HP bar background (200x16)
    this.tex('hpbar_bg', 200, 16, g => {
      g.fillStyle(0x222222);
      g.fillRoundedRect(0, 0, 200, 16, 4);
      g.lineStyle(1, 0x444444);
      g.strokeRoundedRect(0, 0, 200, 16, 4);
    });

    // HP bar fill (200x16)
    this.tex('hpbar_fill', 200, 16, g => {
      g.fillStyle(C.HP_GREEN);
      g.fillRoundedRect(0, 0, 200, 16, 4);
      g.fillStyle(0x88ffaa, 0.4);
      g.fillRect(4, 3, 190, 5);
    });

    // HP bar fill red
    this.tex('hpbar_fill_red', 200, 16, g => {
      g.fillStyle(C.HP_RED);
      g.fillRoundedRect(0, 0, 200, 16, 4);
      g.fillStyle(0xff8888, 0.4);
      g.fillRect(4, 3, 190, 5);
    });

    // Gold coin (20x20)
    this.tex('icon_gold', 20, 20, g => {
      g.fillStyle(C.GOLD);
      g.fillCircle(10, 10, 9);
      g.fillStyle(0xffee88, 0.7);
      g.fillCircle(10, 9, 6);
      g.fillStyle(0xaa7700);
      g.lineStyle(1.5, 0xaa7700);
      g.strokeCircle(10, 10, 9);
      // Lily symbol
      g.fillStyle(0xaa7700, 0.6);
      g.fillEllipse(10, 10, 8, 5);
    });

    // Wave icon (20x20)
    this.tex('icon_wave', 20, 20, g => {
      g.fillStyle(C.WATER_MID);
      g.fillCircle(10, 10, 9);
      g.lineStyle(2, C.WATER_LIGHT);
      g.beginPath(); g.moveTo(3, 10); g.lineTo(7, 7); g.lineTo(13, 13); g.lineTo(17, 10); g.strokePath();
    });

    // Weapon slot (52x52)
    this.tex('weapon_slot', 52, 52, g => {
      g.fillStyle(0x111811);
      g.fillRoundedRect(0, 0, 52, 52, 6);
      g.lineStyle(2, C.BOG_LIGHT, 0.8);
      g.strokeRoundedRect(0, 0, 52, 52, 6);
    });

    // Weapon slot selected
    this.tex('weapon_slot_sel', 52, 52, g => {
      g.fillStyle(0x112211);
      g.fillRoundedRect(0, 0, 52, 52, 6);
      g.lineStyle(2, C.GLOW);
      g.strokeRoundedRect(0, 0, 52, 52, 6);
      g.fillStyle(C.GLOW, 0.1);
      g.fillRoundedRect(2, 2, 48, 48, 5);
    });

    // Firefly particle (8x8)
    this.tex('firefly', 8, 8, g => {
      g.fillStyle(C.GOLD, 0.6);
      g.fillCircle(4, 4, 4);
      g.fillStyle(0xffffaa, 0.9);
      g.fillCircle(4, 4, 2);
    });

    // Glow particle (12x12)
    this.tex('glow_particle', 12, 12, g => {
      g.fillStyle(C.GLOW, 0.3);
      g.fillCircle(6, 6, 6);
      g.fillStyle(C.GLOW, 0.8);
      g.fillCircle(6, 6, 3);
    });

    // Weapon icons for inventory
    const weaponIcons = {
      lily_bow:      { shape: 'bow',     color: 0x8b5e3c },
      wind_reed:     { shape: 'bow',     color: 0x4a9a30 },
      thorn_pistol:  { shape: 'pistol',  color: 0x446644 },
      spore_pistol:  { shape: 'pistol',  color: 0x44aa22 },
      bog_rifle:     { shape: 'rifle',   color: 0x4a6a3a },
      reed_sniper:   { shape: 'sniper',  color: 0x2244aa },
      swamp_assault: { shape: 'rifle',   color: 0x3a5a2a },
      spore_shotgun: { shape: 'shotgun', color: 0x44aa22 },
      bog_blaster:   { shape: 'shotgun', color: 0x228844 },
      bog_orb:       { shape: 'orb',     color: 0x9900ff },
      swamp_cannon:  { shape: 'cannon',  color: 0x664422 },
      vine_whip:     { shape: 'whip',    color: 0x2d8a00 },
      chain_spore:   { shape: 'rifle',   color: 0x22aa44 },
    };

    for (const [key, def] of Object.entries(weaponIcons)) {
      this.tex(`icon_${key}`, 40, 40, g => {
        this.drawWeaponIcon(g, def.shape, def.color);
      });
    }

    // Skill icons (simple colored circles with symbol)
    const skillColors = [C.GLOW, 0x4488ff, 0xff8800, 0xcc44ff, 0xff4444, 0x44ffcc];
    for (let i = 0; i < skillColors.length; i++) {
      this.tex(`skill_icon_${i}`, 36, 36, g => {
        g.fillStyle(0x111111);
        g.fillCircle(18, 18, 17);
        g.lineStyle(2, skillColors[i]);
        g.strokeCircle(18, 18, 17);
        g.fillStyle(skillColors[i], 0.8);
        g.fillCircle(18, 18, 10);
        g.fillStyle(C.WHITE, 0.7);
        g.fillCircle(13, 13, 4);
      });
    }

    // Button background (160x44)
    this.tex('btn_normal', 160, 44, g => {
      g.fillStyle(0x1a3a1a);
      g.fillRoundedRect(0, 0, 160, 44, 8);
      g.lineStyle(2, C.BOG_LIGHT);
      g.strokeRoundedRect(0, 0, 160, 44, 8);
    });
    this.tex('btn_hover', 160, 44, g => {
      g.fillStyle(0x2a5a2a);
      g.fillRoundedRect(0, 0, 160, 44, 8);
      g.lineStyle(2, C.GLOW);
      g.strokeRoundedRect(0, 0, 160, 44, 8);
    });
  }

  drawWeaponIcon(g, shape, color) {
    g.fillStyle(0x111811);
    g.fillRoundedRect(0, 0, 40, 40, 4);
    g.fillStyle(color);
    switch (shape) {
      case 'bow':
        g.lineStyle(3, color);
        g.beginPath(); g.arc(20, 20, 12, -1.3, 1.3); g.strokePath();
        g.lineStyle(1.5, 0xdddddd);
        g.beginPath(); g.moveTo(20, 8); g.lineTo(20, 32); g.strokePath();
        g.fillStyle(0xdddddd);
        g.fillRect(18, 19, 14, 2);
        break;
      case 'pistol':
        g.fillRoundedRect(8, 16, 20, 8, 3);
        g.fillRect(22, 12, 10, 6);
        g.fillRect(12, 22, 6, 6);
        break;
      case 'rifle':
        g.fillRoundedRect(4, 18, 32, 6, 2);
        g.fillRect(28, 14, 6, 5);
        g.fillRect(10, 22, 8, 5);
        break;
      case 'sniper':
        g.fillRoundedRect(2, 19, 36, 4, 2);
        g.fillRect(30, 16, 8, 4);
        g.fillStyle(0x2244aa, 0.8);
        g.fillRect(18, 14, 10, 6);
        break;
      case 'shotgun':
        g.fillRoundedRect(4, 17, 28, 8, 2);
        g.fillRect(26, 12, 8, 7);
        g.fillRect(8, 23, 10, 5);
        break;
      case 'orb':
        g.fillStyle(color, 0.3);
        g.fillCircle(20, 20, 14);
        g.fillStyle(color, 0.8);
        g.fillCircle(20, 20, 9);
        g.fillStyle(C.WHITE, 0.7);
        g.fillCircle(15, 15, 4);
        break;
      case 'cannon':
        g.fillEllipse(18, 20, 24, 14);
        g.fillRect(28, 17, 10, 6);
        g.fillStyle(0x222222);
        g.fillCircle(32, 20, 3);
        break;
      case 'whip':
        g.lineStyle(4, color);
        g.beginPath(); g.moveTo(8, 32); g.quadraticBezierTo(20, 10, 32, 20); g.strokePath();
        g.lineStyle(2, 0x2d8a00);
        g.beginPath(); g.moveTo(28, 18); g.lineTo(34, 14); g.strokePath();
        break;
    }
  }

  // ── Effects ───────────────────────────────────────────────────────────────
  generateEffects() {
    // Hit spark (16x16)
    this.tex('hit_spark', 16, 16, g => {
      g.fillStyle(C.YELLOW, 0.9);
      g.fillCircle(8, 8, 5);
      g.lineStyle(2, C.WHITE, 0.8);
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        g.beginPath();
        g.moveTo(8 + Math.cos(angle) * 5, 8 + Math.sin(angle) * 5);
        g.lineTo(8 + Math.cos(angle) * 8, 8 + Math.sin(angle) * 8);
        g.strokePath();
      }
    });

    // Blood/slime splatter (20x20)
    this.tex('splat_green', 20, 20, g => {
      g.fillStyle(C.SLIME, 0.7);
      g.fillCircle(10, 10, 8);
      g.fillStyle(C.SLIME_DARK, 0.5);
      g.fillCircle(6, 7, 4);
      g.fillCircle(14, 13, 3);
    });

    // Castle impact ring
    this.tex('impact_ring', 80, 80, g => {
      g.lineStyle(4, C.HP_RED, 0.8);
      g.strokeCircle(40, 40, 38);
      g.lineStyle(2, 0xff6666, 0.5);
      g.strokeCircle(40, 40, 30);
    });

    // Wave announce banner (600x60)
    this.tex('wave_banner', 600, 60, g => {
      g.fillStyle(C.BOG_DARK, 0.85);
      g.fillRoundedRect(0, 0, 600, 60, 10);
      g.lineStyle(2, C.GLOW, 0.7);
      g.strokeRoundedRect(0, 0, 600, 60, 10);
    });

    // Panel background (for town UI)
    this.tex('panel', 480, 380, g => {
      g.fillStyle(C.BOG_DARK, 0.95);
      g.fillRoundedRect(0, 0, 480, 380, 12);
      g.lineStyle(2, C.BOG_LIGHT);
      g.strokeRoundedRect(0, 0, 480, 380, 12);
    });

    // Tab button (120x36)
    this.tex('tab_normal', 120, 36, g => {
      g.fillStyle(0x0d1f0d);
      g.fillRoundedRect(0, 0, 120, 36, { tl: 8, tr: 8, bl: 0, br: 0 });
      g.lineStyle(1, C.BOG_LIGHT, 0.6);
      g.strokeRoundedRect(0, 0, 120, 36, { tl: 8, tr: 8, bl: 0, br: 0 });
    });
    this.tex('tab_active', 120, 36, g => {
      g.fillStyle(0x1a3a1a);
      g.fillRoundedRect(0, 0, 120, 36, { tl: 8, tr: 8, bl: 0, br: 0 });
      g.lineStyle(2, C.GLOW);
      g.strokeRoundedRect(0, 0, 120, 36, { tl: 8, tr: 8, bl: 0, br: 0 });
    });

    // Title logo bg (700x140)
    this.tex('title_bg', 700, 140, g => {
      g.fillStyle(C.BOG_DARK, 0.85);
      g.fillRoundedRect(0, 0, 700, 140, 16);
      g.lineStyle(3, C.GLOW, 0.6);
      g.strokeRoundedRect(0, 0, 700, 140, 16);
      // Decorative moss vines along border
      g.lineStyle(2, C.BOG_LIGHT, 0.5);
      for (let x = 20; x < 680; x += 30) {
        g.beginPath();
        g.moveTo(x, 0);
        g.quadraticBezierTo(x + 8, 12, x + 15, 8);
        g.strokePath();
      }
    });
  }
}
