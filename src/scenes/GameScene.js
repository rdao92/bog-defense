import Phaser from 'phaser';
import { W, H, C, CASTLE_Y, PLAYER_MOVE_AREA_TOP } from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { WEAPONS } from '../data/weapons.js';
import { ENEMIES, buildWave } from '../data/enemies.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) {
    this.classId   = data.classId || 'ranger';
    this.day       = data.day     || 1;
    this.gold      = data.gold    || 80;
    this.castleHp  = data.castleHp || 300;
    this.castleMaxHp = 300;
    this.inventory = data.inventory || null;
    this.currentWeaponIdx = 0;
  }

  create() {
    this.classDef  = CLASSES.find(c => c.id === this.classId);
    this.waveComplete = false;
    this.paused    = false;
    this.enemies   = [];
    this.projectiles = [];
    this.companions = [];
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.lastFired  = 0;
    this.kills      = 0;
    this.goldEarned = 0;
    this.damageNumbers = [];
    this.fireflies  = [];

    if (!this.inventory) {
      this.inventory = [
        { weaponId: this.classDef.startWeapon, mods: [] },
        null, null, null, null,
      ];
    }

    this.createBackground();
    this.createCastle();
    this.createPlayer();
    this.createHUD();
    this.createCompanions();
    this.setupInput();
    this.buildWaveQueue();
    this.showWaveAnnounce();
    this.createAtmosphere();
  }

  // ── Background ─────────────────────────────────────────────────────────────
  createBackground() {
    for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64)
      this.add.image(x, y, 'bg_ground').setOrigin(0, 0).setDepth(0);

    // Top spawn zone — water
    const topWater = this.add.graphics().setDepth(1);
    topWater.fillStyle(C.WATER_DARK, 0.65);
    topWater.fillRect(0, 0, W, 80);

    // Trees along sides
    const treePos = [40,120, 40,280, 40,440, W-40,120, W-40,280, W-40,440, 40,520, W-40,520];
    for (let i = 0; i < treePos.length; i += 2)
      this.add.image(treePos[i], treePos[i+1], 'tree').setDepth(1).setAlpha(0.65);

    // Lily pads on edges
    const lilyPos = [80,340, W-80,200, 90,480, W-90,400];
    for (let i = 0; i < lilyPos.length; i += 2)
      this.add.image(lilyPos[i], lilyPos[i+1], 'lily_pad').setDepth(1).setAlpha(0.5);

    // Mushrooms
    const mushPos = [160,100, 300,60, 660,70, 800,95, 150,560, 810,560];
    for (let i = 0; i < mushPos.length; i += 2)
      this.add.image(mushPos[i], mushPos[i+1], 'mushroom').setDepth(1).setAlpha(0.75);

    // Dividing line — front of spawn zone
    const divLine = this.add.graphics().setDepth(2);
    divLine.lineStyle(2, C.BOG_LIGHT, 0.25);
    divLine.beginPath(); divLine.moveTo(0, 80); divLine.lineTo(W, 80); divLine.strokePath();

    // Mist at top
    const mist = this.add.graphics().setDepth(3);
    mist.fillStyle(C.WATER_DARK, 0.25);
    mist.fillRect(0, 0, W, 50);
  }

  // ── Castle ─────────────────────────────────────────────────────────────────
  createCastle() {
    this.castle = this.add.image(W / 2, CASTLE_Y, 'castle').setDepth(5);
    this.castle.setScale(1.2);

    // Castle HP bar (above castle)
    this.castleHpBg   = this.add.image(W / 2, CASTLE_Y - 70, 'hpbar_bg').setDepth(10);
    this.castleHpBar  = this.add.image(W / 2, CASTLE_Y - 70, 'hpbar_fill').setDepth(11).setOrigin(0.5);
    this.castleHpText = this.add.text(W / 2, CASTLE_Y - 70, `${this.castleHp}`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(12);
    this.add.text(W / 2, CASTLE_Y - 86, 'BOG SHRINE', {
      fontSize: '10px', fontFamily: 'monospace', color: '#90ee90', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(12);
  }

  updateCastleHpBar() {
    const pct = Math.max(0, this.castleHp / this.castleMaxHp);
    this.castleHpBar.setScaleX(pct);
    this.castleHpBar.setX(W / 2 - 100 * (1 - pct));
    this.castleHpText.setText(`${Math.ceil(this.castleHp)}`);
    if (pct < 0.4) this.castleHpBar.setTexture('hpbar_fill_red');
    else this.castleHpBar.setTexture('hpbar_fill');
  }

  damageCastle(amount) {
    this.castleHp -= amount;
    this.updateCastleHpBar();

    // Screen flash
    const flash = this.add.graphics().setDepth(200);
    flash.fillStyle(0xff0000, 0.18);
    flash.fillRect(0, 0, W, H);
    this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });

    // Impact ring
    const ring = this.add.image(W / 2, CASTLE_Y, 'impact_ring').setDepth(8);
    this.tweens.add({ targets: ring, alpha: 0, scale: 1.4, duration: 400, onComplete: () => ring.destroy() });

    if (this.castleHp <= 0) this.gameOver();
  }

  // ── Player ─────────────────────────────────────────────────────────────────
  createPlayer() {
    this.player = {
      x: W / 2,
      y: H - 160,
      hp: this.classDef.hp,
      maxHp: this.classDef.hp,
      speed: this.classDef.speed,
      sprite: null,
      hpBg: null,
      hpBar: null,
      rampage: 0,        // critical hit streak
      critCount: 0,
    };

    this.player.sprite = this.add.image(this.player.x, this.player.y, `player_${this.classId}`)
      .setDepth(20)
      .setScale(1.1);

    // Player HP bar
    this.player.hpBg  = this.add.image(this.player.x, this.player.y + 30, 'hpbar_bg')
      .setDepth(21).setScale(0.6, 0.9);
    this.player.hpBar = this.add.image(this.player.x, this.player.y + 30, 'hpbar_fill')
      .setDepth(22).setScale(0.6, 0.9).setOrigin(0.5);

    // Selection ring
    this.playerRing = this.add.graphics().setDepth(19);
    this.updatePlayerRing();
  }

  updatePlayerRing() {
    this.playerRing.clear();
    const isRampage = this.player.critCount >= 7;
    this.playerRing.lineStyle(2, isRampage ? 0xff4400 : C.GLOW, 0.5);
    this.playerRing.strokeEllipse(this.player.x, this.player.y, 52, 30);
  }

  // ── Companions ─────────────────────────────────────────────────────────────
  createCompanions() {
    if (this.classId === 'noble') {
      this.spawnCompanion(this.player.x - 70, this.player.y);
    }
  }

  spawnCompanion(x, y) {
    const comp = {
      x, y,
      hp: 60, maxHp: 60,
      sprite: this.add.image(x, y, 'companion_wisp').setDepth(20),
      target: null,
      fireTimer: 0,
    };
    this.companions.push(comp);
    this.tweens.add({ targets: comp.sprite, y: y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // ── Input ──────────────────────────────────────────────────────────────────
  setupInput() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up2: Phaser.Input.Keyboard.KeyCodes.UP,
      down2: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w1: Phaser.Input.Keyboard.KeyCodes.ONE,
      w2: Phaser.Input.Keyboard.KeyCodes.TWO,
      w3: Phaser.Input.Keyboard.KeyCodes.THREE,
      w4: Phaser.Input.Keyboard.KeyCodes.FOUR,
      w5: Phaser.Input.Keyboard.KeyCodes.FIVE,
      fire: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    for (let i = 0; i < 5; i++) {
      const k = ['w1','w2','w3','w4','w5'][i];
      this.keys[k].on('down', () => { if (this.inventory[i]) this.currentWeaponIdx = i; this.updateWeaponSlots(); });
    }
  }

  // ── HUD ────────────────────────────────────────────────────────────────────
  createHUD() {
    // Day / wave counter
    this.hudDay = this.add.text(10, 10, `Day ${this.day}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#aaff44',
      stroke: '#0a1a0a', strokeThickness: 3,
    }).setDepth(50);

    // Enemy counter
    this.hudEnemies = this.add.text(10, 32, 'Enemies: 0', {
      fontSize: '13px', fontFamily: 'monospace', color: '#90ee90',
    }).setDepth(50);

    // Gold
    this.add.image(W - 80, 14, 'icon_gold').setDepth(50);
    this.hudGold = this.add.text(W - 64, 10, `${this.gold}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#0a1a0a', strokeThickness: 3,
    }).setDepth(50);

    // Kills
    this.hudKills = this.add.text(W - 64, 30, 'Kills: 0', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ccaa44',
    }).setDepth(50);

    // Weapon slots
    this.weaponSlots = [];
    this.weaponSlotIcons = [];
    for (let i = 0; i < 5; i++) {
      const slotX = W / 2 - 130 + i * 60;
      const slot = this.add.image(slotX, H - 28, 'weapon_slot').setDepth(50);
      this.weaponSlots.push(slot);

      this.add.text(slotX - 22, H - 42, `${i+1}`, {
        fontSize: '9px', fontFamily: 'monospace', color: '#557755',
      }).setDepth(51);

      const icon = this.inventory[i]
        ? this.add.image(slotX, H - 28, `icon_${this.inventory[i].weaponId}`).setDepth(51).setScale(0.9)
        : null;
      this.weaponSlotIcons.push(icon);
    }
    this.updateWeaponSlots();

    // Player HP bar in HUD
    const hudHpBg = this.add.image(100, H - 28, 'hpbar_bg').setDepth(50).setScale(0.9, 1);
    this.hudHpBar = this.add.image(100, H - 28, 'hpbar_fill').setDepth(51).setScale(0.9, 1).setOrigin(0.5);
    this.hudHpBar.setX(100 - 90 * (1 - 1));
    this.add.text(10, H - 40, 'HP', { fontSize: '10px', fontFamily: 'monospace', color: '#90ee90' }).setDepth(52);

    // Rampage indicator
    this.rampageText = this.add.text(W / 2, 60, '', {
      fontSize: '20px', fontFamily: 'Georgia, serif',
      color: '#ff4400', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(60);
  }

  updateWeaponSlots() {
    for (let i = 0; i < 5; i++) {
      this.weaponSlots[i].setTexture(i === this.currentWeaponIdx ? 'weapon_slot_sel' : 'weapon_slot');
    }
  }

  updateHudGold() { this.hudGold.setText(`${this.gold}`); }
  updateHudKills() { this.hudKills.setText(`Kills: ${this.kills}`); }
  updateHudHp() {
    const pct = Math.max(0, this.player.hp / this.player.maxHp);
    this.hudHpBar.setScaleX(0.9 * pct);
    this.hudHpBar.setX(100 - 90 * (1 - pct));
  }
  updateHudEnemies() {
    const alive = this.enemies.filter(e => e.alive).length;
    const inQueue = this.spawnQueue.reduce((s, g) => s + g.count, 0);
    this.hudEnemies.setText(`Enemies: ${alive + inQueue}`);
  }

  // ── Wave ───────────────────────────────────────────────────────────────────
  buildWaveQueue() {
    const wave = buildWave(this.day);
    // Flatten into spawn events
    this.spawnQueue = [];
    let totalDelay = 0;
    for (const group of wave) {
      const def = ENEMIES[group.type];
      for (let i = 0; i < group.count; i++) {
        totalDelay += group.delay;
        this.spawnQueue.push({
          type: group.type,
          hpMult: group.hpMult || 1,
          time: totalDelay,
        });
      }
    }
    this.totalEnemies = this.spawnQueue.length;
    this.waveStartTime = this.time.now;
  }

  showWaveAnnounce() {
    const banner = this.add.image(W / 2, H / 2 - 80, 'wave_banner').setDepth(100);
    const txt = this.add.text(W / 2, H / 2 - 80, `DAY ${this.day}`, {
      fontSize: '36px', fontFamily: 'Georgia, serif',
      color: '#aaff44', stroke: '#0a1a0a', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(101);
    const sub = this.add.text(W / 2, H / 2 - 56, `Wave incoming! Defend the Shrine!`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#90ee90',
    }).setOrigin(0.5).setDepth(101);

    this.tweens.add({
      targets: [banner, txt, sub],
      alpha: 0,
      delay: 2200,
      duration: 600,
      onComplete: () => { banner.destroy(); txt.destroy(); sub.destroy(); },
    });
  }

  // ── Spawning ───────────────────────────────────────────────────────────────
  spawnEnemy(type, hpMult) {
    const def = ENEMIES[type];
    const x = Phaser.Math.Between(80, W - 80);
    const y = Phaser.Math.Between(-30, 60);

    const scaledHp = Math.ceil(def.hp * hpMult);
    const sprite = this.add.image(x, y, `enemy_${type}`).setDepth(15);
    const hpBg  = this.add.image(x, y - def.size/2 - 6, 'hpbar_bg').setScale(0.5, 0.7).setDepth(16);
    const hpBar = this.add.image(x, y - def.size/2 - 6, 'hpbar_fill').setScale(0.5, 0.7).setOrigin(0.5).setDepth(17);

    const enemy = {
      type, def, x, y,
      hp: scaledHp, maxHp: scaledHp,
      speed: def.speed,
      alive: true,
      sprite, hpBg, hpBar,
      wobblePhase: Math.random() * Math.PI * 2,
    };
    this.enemies.push(enemy);
    return enemy;
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  update(time, delta) {
    if (this.paused || this.waveComplete) return;
    const dt = delta / 1000;

    this.handlePlayerMovement(dt);
    this.handleShooting(time);
    this.updateEnemySpawning(time);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateCompanions(time, dt);
    this.updateDamageNumbers(dt);
    this.checkWaveComplete();
    this.updatePlayerRing();
  }

  handlePlayerMovement(dt) {
    const p = this.player;
    const keys = this.keys;
    let dx = 0, dy = 0;

    if (keys.left.isDown  || keys.left2.isDown)  dx -= 1;
    if (keys.right.isDown || keys.right2.isDown) dx += 1;
    if (keys.up.isDown    || keys.up2.isDown)    dy -= 1;
    if (keys.down.isDown  || keys.down2.isDown)  dy += 1;

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    p.x = Phaser.Math.Clamp(p.x + dx * p.speed * dt, 30, W - 30);
    p.y = Phaser.Math.Clamp(p.y + dy * p.speed * dt, PLAYER_MOVE_AREA_TOP, H - 30);

    p.sprite.setPosition(p.x, p.y);
    p.hpBg.setPosition(p.x, p.y + 30);
    p.hpBar.setPosition(p.x - 60 * 0.6 * (1 - p.hp/p.maxHp), p.y + 30);

    // Face toward nearest enemy
    const nearest = this.getNearestEnemy(p.x, p.y);
    if (nearest) {
      const angle = Phaser.Math.Angle.Between(p.x, p.y, nearest.x, nearest.y);
      p.sprite.setRotation(angle + Math.PI / 2);
    }
  }

  handleShooting(time) {
    const p = this.player;
    const wepSlot = this.inventory[this.currentWeaponIdx];
    if (!wepSlot) return;
    const wep = WEAPONS[wepSlot.weaponId];
    const canFire = this.input.activePointer.isDown || this.keys.fire.isDown;

    if (canFire && time - this.lastFired > wep.fireRate) {
      const target = this.getAimTarget(p.x, p.y);
      if (target) {
        this.fireWeapon(p.x, p.y, target.x, target.y, wep);
        this.lastFired = time;
      }
    }
  }

  getAimTarget(fromX, fromY) {
    // If mouse is above player, aim at mouse pos if there's an enemy in that direction
    const mx = this.input.activePointer.worldX;
    const my = this.input.activePointer.worldY;
    if (my < fromY - 20) return { x: mx, y: my };
    // Otherwise auto-aim at nearest enemy
    return this.getNearestEnemy(fromX, fromY);
  }

  getNearestEnemy(x, y) {
    let nearest = null, minDist = Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < minDist) { minDist = d; nearest = e; }
    }
    return nearest;
  }

  fireWeapon(fx, fy, tx, ty, wep) {
    const angle = Phaser.Math.Angle.Between(fx, fy, tx, ty);
    const spreadRad = Phaser.Math.DegToRad(wep.spread);

    for (let i = 0; i < wep.pellets; i++) {
      const shotAngle = angle + Phaser.Math.FloatBetween(-spreadRad, spreadRad);
      const proj = {
        x: fx, y: fy,
        vx: Math.cos(shotAngle) * wep.projSpeed,
        vy: Math.sin(shotAngle) * wep.projSpeed,
        damage: wep.damage * (Math.random() < 0.15 ? 2 : 1),  // 15% crit
        isCrit: false,
        wep,
        pierce: wep.pierce || 0,
        splashRadius: wep.splashRadius || 0,
        hit: new Set(),
        sprite: this.add.image(fx, fy, wep.projKey).setDepth(25),
        alive: true,
        distTravelled: 0,
      };
      proj.isCrit = proj.damage > wep.damage;
      proj.sprite.setRotation(shotAngle);
      this.projectiles.push(proj);
    }

    // Muzzle flash
    const flash = this.add.graphics().setDepth(30);
    flash.fillStyle(C.GLOW, 0.7);
    flash.fillCircle(fx + Math.cos(angle) * 10, fy + Math.sin(angle) * 10, 6);
    this.time.delayedCall(60, () => flash.destroy());
  }

  updateEnemySpawning(time) {
    const elapsed = time - this.waveStartTime;
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= elapsed) {
      const ev = this.spawnQueue.shift();
      this.spawnEnemy(ev.type, ev.hpMult);
    }
    this.updateHudEnemies();
  }

  updateEnemies(dt) {
    const toRemove = [];
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      // Move toward castle
      const targetX = W / 2 + Math.sin(enemy.wobblePhase) * 30;
      const targetY = CASTLE_Y;
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY);
      enemy.wobblePhase += dt * 1.2;

      enemy.x += Math.cos(angle) * enemy.speed * dt;
      enemy.y += Math.sin(angle) * enemy.speed * dt;

      enemy.sprite.setPosition(enemy.x, enemy.y);
      enemy.sprite.setRotation(angle + Math.PI / 2);
      enemy.hpBg.setPosition(enemy.x, enemy.y - enemy.def.size / 2 - 6);
      enemy.hpBar.setPosition(enemy.x - 50 * 0.5 * (1 - enemy.hp/enemy.maxHp), enemy.y - enemy.def.size / 2 - 6);

      // Reached castle?
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, W/2, CASTLE_Y) < 80) {
        this.damageCastle(enemy.def.damage);
        this.killEnemy(enemy, false);
        if (enemy.def.explodeOnDeath) this.spawnExplosion(enemy.x, enemy.y, enemy.def);
      }
    }
  }

  updateProjectiles(dt) {
    for (const proj of this.projectiles) {
      if (!proj.alive) continue;

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.distTravelled += Math.hypot(proj.vx * dt, proj.vy * dt);
      proj.sprite.setPosition(proj.x, proj.y);

      // Out of range / bounds
      if (proj.distTravelled > (proj.wep.range || 700) || proj.x < -50 || proj.x > W+50 || proj.y < -50 || proj.y > H+50) {
        proj.alive = false;
        proj.sprite.destroy();
        continue;
      }

      // Hit test
      for (const enemy of this.enemies) {
        if (!enemy.alive || proj.hit.has(enemy)) continue;
        const hitRadius = enemy.def.size / 2 + 6;
        if (Phaser.Math.Distance.Between(proj.x, proj.y, enemy.x, enemy.y) < hitRadius) {
          this.hitEnemy(enemy, proj);
          proj.hit.add(enemy);
          if (proj.splashRadius > 0) {
            this.splashDamage(proj.x, proj.y, proj.splashRadius, proj.damage * 0.6, proj.hit);
            this.spawnExplosion(proj.x, proj.y, null, proj.wep.type);
          }
          if (proj.pierce <= 0) {
            proj.alive = false;
            proj.sprite.destroy();
            break;
          } else {
            proj.pierce--;
          }
        }
      }
    }

    this.projectiles = this.projectiles.filter(p => p.alive);
  }

  splashDamage(x, y, radius, damage, exclude) {
    for (const enemy of this.enemies) {
      if (!enemy.alive || exclude.has(enemy)) continue;
      if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
        this.hitEnemy(enemy, { damage, wep: { type: 'magic' }, isCrit: false, hit: exclude });
      }
    }
  }

  hitEnemy(enemy, proj) {
    const armor = enemy.def.armor || 0;
    const dmg = Math.max(1, proj.damage - armor);
    enemy.hp -= dmg;

    // Damage number
    const isCrit = proj.isCrit;
    this.spawnDamageNumber(enemy.x, enemy.y, dmg, isCrit);

    // Hit spark
    const spark = this.add.image(enemy.x, enemy.y, 'hit_spark').setDepth(30).setScale(isCrit ? 1.5 : 1);
    this.tweens.add({ targets: spark, alpha: 0, scale: 0.5, duration: 200, onComplete: () => spark.destroy() });

    // Update HP bar
    const pct = Math.max(0, enemy.hp / enemy.maxHp);
    enemy.hpBar.setScaleX(0.5 * pct);

    if (enemy.hp <= 0) {
      this.killEnemy(enemy, true);
      // Crit tracking
      if (isCrit) {
        this.player.critCount++;
        if (this.player.critCount >= 7) this.activateRampage();
      } else {
        this.player.critCount = Math.max(0, this.player.critCount - 1);
        if (this.player.critCount < 7) this.rampageText.setText('');
      }
    }
  }

  killEnemy(enemy, giveRewards) {
    enemy.alive = false;
    if (giveRewards) {
      this.kills++;
      const goldGain = enemy.def.gold + Phaser.Math.Between(-1, 2);
      this.gold += goldGain;
      this.goldEarned += goldGain;
      this.updateHudGold();
      this.updateHudKills();
      this.spawnGoldFloat(enemy.x, enemy.y, goldGain);
    }

    // Death splat
    const splat = this.add.image(enemy.x, enemy.y, 'splat_green').setDepth(5).setScale(1.5);
    this.tweens.add({ targets: splat, alpha: 0, duration: 800, delay: 400, onComplete: () => splat.destroy() });

    if (enemy.def.explodeOnDeath && giveRewards) {
      this.spawnExplosion(enemy.x, enemy.y, enemy.def);
    }

    enemy.sprite.destroy();
    enemy.hpBg.destroy();
    enemy.hpBar.destroy();
  }

  spawnExplosion(x, y, def, wepType) {
    const radius = def ? def.explodeRadius : 80;
    const key = wepType === 'magic' ? 'explosion_magic' : wepType === 'shotgun' ? 'explosion_spore' : 'explosion';
    const expl = this.add.image(x, y, key).setDepth(28).setScale(0.5);
    this.tweens.add({ targets: expl, scale: radius / 32, alpha: 0, duration: 350, onComplete: () => expl.destroy() });

    if (def) {
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
          this.hitEnemy(enemy, { damage: def.explodeDamage, isCrit: false, wep: {}, hit: new Set() });
        }
      }
    }
  }

  activateRampage() {
    this.rampageText.setText('⚡ RAMPAGE! ⚡');
    this.cameras.main.shake(150, 0.006);
    this.tweens.add({
      targets: this.rampageText,
      scaleX: 1.2, scaleY: 1.2, duration: 200, yoyo: true, repeat: 1,
    });
  }

  updateCompanions(time, dt) {
    for (const comp of this.companions) {
      const target = this.getNearestEnemy(comp.x, comp.y);
      if (target) {
        comp.sprite.setPosition(comp.sprite.x, comp.sprite.y);
        comp.fireTimer += dt;
        if (comp.fireTimer > 1.2) {
          comp.fireTimer = 0;
          const angle = Phaser.Math.Angle.Between(comp.x, comp.y, target.x, target.y);
          const proj = {
            x: comp.x, y: comp.y,
            vx: Math.cos(angle) * 400,
            vy: Math.sin(angle) * 400,
            damage: 20, isCrit: false,
            wep: { range: 600, type: 'magic' },
            pierce: 0, splashRadius: 0,
            hit: new Set(),
            sprite: this.add.image(comp.x, comp.y, 'proj_orb').setDepth(25).setScale(0.7),
            alive: true, distTravelled: 0,
          };
          proj.sprite.setRotation(angle);
          this.projectiles.push(proj);
        }
      }
    }
  }

  // ── Floating damage numbers ─────────────────────────────────────────────────
  spawnDamageNumber(x, y, amount, isCrit) {
    const color = isCrit ? '#ffaa00' : '#ffffff';
    const size = isCrit ? '18px' : '14px';
    const txt = this.add.text(x, y - 10, `-${Math.ceil(amount)}`, {
      fontSize: size, fontFamily: 'monospace', color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(60);

    this.tweens.add({
      targets: txt, y: y - 50, alpha: 0, duration: 900,
      onComplete: () => txt.destroy(),
    });
  }

  spawnGoldFloat(x, y, amount) {
    const txt = this.add.text(x + 20, y, `+${amount}g`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffd700',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
  }

  updateDamageNumbers(dt) {
    // handled by tweens
  }

  // ── Wave completion ─────────────────────────────────────────────────────────
  checkWaveComplete() {
    if (this.waveComplete) return;
    const aliveCount = this.enemies.filter(e => e.alive).length;
    if (this.spawnQueue.length === 0 && aliveCount === 0) {
      this.waveComplete = true;
      this.time.delayedCall(1200, () => this.showVictoryBanner());
    }
  }

  showVictoryBanner() {
    const banner = this.add.image(W / 2, H / 2, 'wave_banner').setDepth(100);
    const txt = this.add.text(W / 2, H / 2 - 10, `Day ${this.day} Complete!`, {
      fontSize: '30px', fontFamily: 'Georgia, serif', color: '#aaff44',
      stroke: '#0a1a0a', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(101);
    const sub = this.add.text(W / 2, H / 2 + 22, `Gold earned: ${this.goldEarned}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0.5).setDepth(101);

    this.time.delayedCall(1800, () => {
      banner.destroy(); txt.destroy(); sub.destroy();
      this.goToTown();
    });
  }

  goToTown() {
    // Clean up sprites for enemies/projectiles still alive
    this.enemies.forEach(e => { if (e.alive) { e.sprite?.destroy(); e.hpBg?.destroy(); e.hpBar?.destroy(); } });
    this.projectiles.forEach(p => { if (p.alive) p.sprite?.destroy(); });

    this.scene.start('Town', {
      classId: this.classId,
      day: this.day,
      gold: this.gold,
      castleHp: this.castleHp,
      castleMaxHp: this.castleMaxHp,
      inventory: this.inventory,
      kills: this.kills,
    });
  }

  gameOver() {
    this.paused = true;
    this.scene.start('GameOver', {
      day: this.day,
      kills: this.kills,
      gold: this.gold,
      reason: 'castle',
    });
  }

  // ── Atmosphere ──────────────────────────────────────────────────────────────
  createAtmosphere() {
    this.add.particles(0, 0, 'firefly', {
      x: { min: 50, max: W - 50 },
      y: { min: 80, max: H - 80 },
      speedY: { min: -8, max: 8 },
      speedX: { min: -8, max: 8 },
      alpha: { start: 0, end: 0, ease: 'Sine.easeInOut' },
      scale: { start: 0.6, end: 0 },
      lifespan: { min: 2000, max: 5000 },
      quantity: 1,
      frequency: 300,
    }).setDepth(2);

    this.add.particles(0, 0, 'glow_particle', {
      x: { min: 0, max: W },
      y: { min: 0, max: 60 },
      speedY: { min: 5, max: 15 },
      alpha: { start: 0.1, end: 0 },
      scale: { start: 1.5, end: 3 },
      lifespan: 3500,
      quantity: 1,
      frequency: 600,
    }).setDepth(1);
  }
}
