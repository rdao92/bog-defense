import Phaser from 'phaser';
import { W, H, C } from '../constants.js';
import { WEAPONS, SHOP_WEAPONS } from '../data/weapons.js';
import { CLASSES } from '../data/classes.js';

const TAB_SHOP    = 0;
const TAB_BARRACKS = 1;
const TAB_CASTLE  = 2;
const TAB_INN     = 3;

export default class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }

  init(data) {
    this.classId    = data.classId;
    this.day        = data.day;
    this.gold       = data.gold;
    this.castleHp   = data.castleHp;
    this.castleMaxHp= data.castleMaxHp || 300;
    this.inventory  = data.inventory;
    this.kills      = data.kills || 0;
    this.currentTab = TAB_SHOP;
    this.classDef   = CLASSES.find(c => c.id === this.classId);
    this.innVisited = false;
  }

  create() {
    this.drawBg();
    this.createTopBar();
    this.createTabs();
    this.createMainPanel();
    this.createBottomBar();
    this.createInventoryDisplay();

    // Auto-show inn event sometimes
    if (Math.random() < 0.4 && !this.innVisited) {
      this.time.delayedCall(400, () => this.switchTab(TAB_INN));
    } else {
      this.switchTab(TAB_SHOP);
    }
  }

  drawBg() {
    for (let y = 0; y < H; y += 64) for (let x = 0; x < W; x += 64)
      this.add.image(x, y, 'bg_ground').setOrigin(0, 0).setAlpha(0.5);
    const g = this.add.graphics();
    g.fillStyle(C.BOG_DARKEST, 0.55);
    g.fillRect(0, 0, W, H);
  }

  createTopBar() {
    const g = this.add.graphics();
    g.fillStyle(C.BOG_DARK, 0.95);
    g.fillRect(0, 0, W, 56);
    g.lineStyle(2, C.BOG_LIGHT, 0.5);
    g.lineBetween(0, 56, W, 56);

    this.add.text(20, 16, `THE BOG MARKET  —  After Day ${this.day}`, {
      fontSize: '18px', fontFamily: 'Georgia, serif', color: '#aaff44',
    });

    this.add.image(W - 80, 28, 'icon_gold');
    this.goldText = this.add.text(W - 65, 18, `${this.gold}`, {
      fontSize: '18px', fontFamily: 'monospace', color: '#ffd700',
    });
  }

  createTabs() {
    const tabs = ['SHOP', 'BARRACKS', 'CASTLE', 'INN'];
    this.tabBtns = [];
    this.tabLabels = [];
    for (let i = 0; i < tabs.length; i++) {
      const x = 220 + i * 130;
      const btn = this.add.image(x, 78, 'tab_normal').setInteractive({ useHandCursor: true });
      const lbl = this.add.text(x, 78, tabs[i], {
        fontSize: '13px', fontFamily: 'monospace', color: '#90ee90',
      }).setOrigin(0.5);
      btn.on('pointerdown', () => this.switchTab(i));
      btn.on('pointerover', () => { if (this.currentTab !== i) { btn.setAlpha(0.85); } });
      btn.on('pointerout', () => { if (this.currentTab !== i) btn.setAlpha(1); });
      this.tabBtns.push(btn);
      this.tabLabels.push(lbl);
    }
  }

  createMainPanel() {
    this.panelContainer = this.add.container(W / 2, 320);
    const bg = this.add.graphics();
    bg.fillStyle(C.BOG_DARK, 0.94);
    bg.fillRoundedRect(W/2 - 470, 100, 940, 380, 10);
    bg.lineStyle(2, C.BOG_LIGHT, 0.6);
    bg.strokeRoundedRect(W/2 - 470, 100, 940, 380, 10);
    this.panelBg = bg;
    this.panelContent = [];
  }

  clearPanel() {
    this.panelContent.forEach(o => o.destroy());
    this.panelContent = [];
  }

  createBottomBar() {
    const g = this.add.graphics();
    g.fillStyle(C.BOG_DARK, 0.95);
    g.fillRect(0, H - 56, W, 56);
    g.lineStyle(2, C.BOG_LIGHT, 0.5);
    g.lineBetween(0, H - 56, W, H - 56);

    const continueBtn = this.add.image(W / 2, H - 28, 'btn_normal')
      .setScale(1.2, 1)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 28, `CONTINUE TO DAY ${this.day + 1}`, {
      fontSize: '18px', fontFamily: 'monospace', color: '#aaff44',
    }).setOrigin(0.5);
    continueBtn.on('pointerover', () => continueBtn.setTexture('btn_hover'));
    continueBtn.on('pointerout', () => continueBtn.setTexture('btn_normal'));
    continueBtn.on('pointerdown', () => this.nextDay());
  }

  createInventoryDisplay() {
    const startX = 30;
    const y = H - 28;
    this.add.text(startX, H - 52, 'LOADOUT:', {
      fontSize: '10px', fontFamily: 'monospace', color: '#557755',
    });
    this.invSlots = [];
    this.invIcons = [];
    for (let i = 0; i < 5; i++) {
      const x = startX + i * 60;
      const slot = this.add.image(x + 25, y, 'weapon_slot').setInteractive({ useHandCursor: true });
      const icon = this.inventory[i]
        ? this.add.image(x + 25, y, `icon_${this.inventory[i].weaponId}`).setScale(0.85)
        : null;
      this.invSlots.push(slot);
      this.invIcons.push(icon);
      this.add.text(x + 5, y - 15, `${i+1}`, { fontSize: '9px', fontFamily: 'monospace', color: '#557755' });

      // Click to unequip
      const idx = i;
      slot.on('pointerdown', () => this.unequipWeapon(idx));
    }
  }

  refreshInventory() {
    for (let i = 0; i < 5; i++) {
      this.invIcons[i]?.destroy();
      this.invIcons[i] = this.inventory[i]
        ? this.add.image(this.invSlots[i].x, this.invSlots[i].y, `icon_${this.inventory[i].weaponId}`).setScale(0.85)
        : null;
    }
    this.goldText.setText(`${this.gold}`);
  }

  unequipWeapon(idx) {
    // Just clear the slot (drop weapon)
    if (this.inventory[idx]) {
      this.inventory[idx] = null;
      this.refreshInventory();
      this.switchTab(this.currentTab);  // refresh panel
    }
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  switchTab(tab) {
    this.currentTab = tab;
    for (let i = 0; i < this.tabBtns.length; i++) {
      this.tabBtns[i].setTexture(i === tab ? 'tab_active' : 'tab_normal');
      this.tabLabels[i].setColor(i === tab ? '#aaff44' : '#90ee90');
    }
    this.clearPanel();
    switch (tab) {
      case TAB_SHOP:     this.renderShop(); break;
      case TAB_BARRACKS: this.renderBarracks(); break;
      case TAB_CASTLE:   this.renderCastle(); break;
      case TAB_INN:      this.renderInn(); break;
    }
  }

  renderShop() {
    const panelX = W/2 - 460;
    const panelY = 116;

    this.panelContent.push(this.add.text(panelX, panelY, 'BOG MARKET  —  Weapons for sale', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#aaff44',
    }));
    this.panelContent.push(this.add.text(panelX, panelY + 24, 'Click a weapon to buy it. It will fill your next empty slot.', {
      fontSize: '12px', fontFamily: 'monospace', color: '#90ee90',
    }));

    const cols = 3;
    const perRow = Math.ceil(SHOP_WEAPONS.length / cols);
    SHOP_WEAPONS.forEach((wId, i) => {
      const wep = WEAPONS[wId];
      const col = Math.floor(i / perRow);
      const row = i % perRow;
      const cx = panelX + col * 310;
      const cy = panelY + 60 + row * 80;

      // Card
      const cardBg = this.add.graphics();
      const canAfford = this.gold >= wep.cost;
      const alreadyOwned = this.inventory.some(s => s?.weaponId === wId);
      cardBg.fillStyle(canAfford && !alreadyOwned ? 0x112211 : 0x111111, 0.9);
      cardBg.fillRoundedRect(cx, cy, 290, 68, 6);
      cardBg.lineStyle(2, canAfford && !alreadyOwned ? C.BOG_LIGHT : 0x444444, 0.8);
      cardBg.strokeRoundedRect(cx, cy, 290, 68, 6);
      this.panelContent.push(cardBg);

      // Icon
      const icon = this.add.image(cx + 34, cy + 34, `icon_${wId}`).setScale(0.9);
      this.panelContent.push(icon);

      // Name & stats
      const nameColor = alreadyOwned ? '#44aa44' : (canAfford ? '#ffffff' : '#666666');
      this.panelContent.push(this.add.text(cx + 60, cy + 8, wep.name + (alreadyOwned ? ' ✓' : ''), {
        fontSize: '14px', fontFamily: 'monospace', color: nameColor,
      }));
      this.panelContent.push(this.add.text(cx + 60, cy + 28, `DMG:${wep.damage}  RATE:${(1000/wep.fireRate).toFixed(1)}/s  ${wep.desc}`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
        wordWrap: { width: 220 },
      }));

      // Price
      const priceColor = canAfford ? '#ffd700' : '#884400';
      this.panelContent.push(this.add.text(cx + 60, cy + 50, `Cost: ${wep.cost}g`, {
        fontSize: '12px', fontFamily: 'monospace', color: priceColor,
      }));

      // Buy button (interactive zone)
      if (canAfford && !alreadyOwned) {
        cardBg.setInteractive(new Phaser.Geom.Rectangle(cx, cy, 290, 68), Phaser.Geom.Rectangle.Contains);
        cardBg.on('pointerover', () => { cardBg.clear(); cardBg.fillStyle(0x224422, 0.95); cardBg.fillRoundedRect(cx, cy, 290, 68, 6); cardBg.lineStyle(2, C.GLOW); cardBg.strokeRoundedRect(cx, cy, 290, 68, 6); });
        cardBg.on('pointerout', () => { cardBg.clear(); cardBg.fillStyle(0x112211, 0.9); cardBg.fillRoundedRect(cx, cy, 290, 68, 6); cardBg.lineStyle(2, C.BOG_LIGHT, 0.8); cardBg.strokeRoundedRect(cx, cy, 290, 68, 6); });
        cardBg.on('pointerdown', () => this.buyWeapon(wId, wep.cost));
      }
    });
  }

  buyWeapon(weaponId, cost) {
    if (this.gold < cost) return;
    const emptySlot = this.inventory.findIndex(s => s === null);
    if (emptySlot === -1) {
      this.showMessage('No empty weapon slot! Remove a weapon first.');
      return;
    }
    this.gold -= cost;
    this.inventory[emptySlot] = { weaponId, mods: [] };
    this.refreshInventory();
    this.switchTab(TAB_SHOP);
    this.showMessage(`Purchased ${WEAPONS[weaponId].name}!`);
  }

  renderBarracks() {
    const px = W/2 - 460, py = 116;
    const companionTypes = [
      { name: 'Bog Wisp', cost: 120, desc: 'Floating spirit, fires magic orbs', key: 'companion_wisp' },
      { name: 'Mud Toad', cost: 200, desc: 'Tanky melee fighter, slows enemies', key: 'player_knight' },
    ];

    this.panelContent.push(this.add.text(px, py, 'BARRACKS  —  Hire Companions', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#aaff44',
    }));
    this.panelContent.push(this.add.text(px, py + 24, 'Companions fight alongside you automatically.', {
      fontSize: '12px', fontFamily: 'monospace', color: '#90ee90',
    }));

    companionTypes.forEach((comp, i) => {
      const cx = px + i * 320;
      const cy = py + 70;
      const canAfford = this.gold >= comp.cost;

      const bg = this.add.graphics();
      bg.fillStyle(canAfford ? 0x112211 : 0x111111, 0.9);
      bg.fillRoundedRect(cx, cy, 290, 200, 8);
      bg.lineStyle(2, canAfford ? C.BOG_LIGHT : 0x444444);
      bg.strokeRoundedRect(cx, cy, 290, 200, 8);
      this.panelContent.push(bg);

      const spr = this.add.image(cx + 145, cy + 70, comp.key).setScale(1.8);
      this.panelContent.push(spr);
      this.panelContent.push(this.add.text(cx + 145, cy + 130, comp.name, {
        fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(0.5));
      this.panelContent.push(this.add.text(cx + 145, cy + 152, comp.desc, {
        fontSize: '11px', fontFamily: 'monospace', color: '#90ee90', align: 'center', wordWrap: { width: 270 },
      }).setOrigin(0.5));
      this.panelContent.push(this.add.text(cx + 145, cy + 174, `Cost: ${comp.cost}g`, {
        fontSize: '13px', fontFamily: 'monospace', color: canAfford ? '#ffd700' : '#884400',
      }).setOrigin(0.5));

      if (canAfford) {
        bg.setInteractive(new Phaser.Geom.Rectangle(cx, cy, 290, 200), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerdown', () => {
          this.gold -= comp.cost;
          this.refreshInventory();
          this.showMessage(`${comp.name} will join you next wave!`);
          this.switchTab(TAB_BARRACKS);
        });
      }
    });

    this.panelContent.push(this.add.text(px, py + 300, 'More companions unlock on later days.', {
      fontSize: '12px', fontFamily: 'monospace', color: '#557755',
    }));
  }

  renderCastle() {
    const px = W/2 - 460, py = 116;
    this.panelContent.push(this.add.text(px, py, 'CASTLE UPGRADES  —  Strengthen the Shrine', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#aaff44',
    }));

    const castlePct = this.castleHp / this.castleMaxHp;
    this.panelContent.push(this.add.text(px, py + 28, `Shrine HP: ${Math.ceil(this.castleHp)} / ${this.castleMaxHp}  (${Math.round(castlePct*100)}%)`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#90ee90',
    }));

    const spr = this.add.image(W/2 + 200, py + 140, 'castle').setScale(1.4);
    this.panelContent.push(spr);

    const upgrades = [
      { name: 'Repair Shrine',    cost: 60,  desc: 'Restore 50 HP to the Shrine',    action: 'repair' },
      { name: 'Reinforce Walls',  cost: 200, desc: 'Increase max HP by 50',          action: 'maxhp' },
      { name: 'Bog Thorns',       cost: 150, desc: 'Thorns deal 5 dmg to attackers', action: 'thorns' },
    ];

    upgrades.forEach((upg, i) => {
      const cx = px;
      const cy = py + 70 + i * 90;
      const canAfford = this.gold >= upg.cost;

      const bg = this.add.graphics();
      bg.fillStyle(canAfford ? 0x112211 : 0x111111, 0.9);
      bg.fillRoundedRect(cx, cy, 380, 76, 6);
      bg.lineStyle(2, canAfford ? C.BOG_LIGHT : 0x444444);
      bg.strokeRoundedRect(cx, cy, 380, 76, 6);
      this.panelContent.push(bg);

      this.panelContent.push(this.add.text(cx + 14, cy + 10, upg.name, { fontSize: '15px', fontFamily: 'monospace', color: canAfford ? '#ffffff' : '#666666' }));
      this.panelContent.push(this.add.text(cx + 14, cy + 32, upg.desc, { fontSize: '11px', fontFamily: 'monospace', color: '#aaaaaa' }));
      this.panelContent.push(this.add.text(cx + 14, cy + 52, `Cost: ${upg.cost}g`, { fontSize: '12px', fontFamily: 'monospace', color: canAfford ? '#ffd700' : '#884400' }));

      if (canAfford) {
        bg.setInteractive(new Phaser.Geom.Rectangle(cx, cy, 380, 76), Phaser.Geom.Rectangle.Contains);
        bg.on('pointerover', () => { bg.clear(); bg.fillStyle(0x224422, 0.95); bg.fillRoundedRect(cx, cy, 380, 76, 6); bg.lineStyle(2, C.GLOW); bg.strokeRoundedRect(cx, cy, 380, 76, 6); });
        bg.on('pointerout', () => { bg.clear(); bg.fillStyle(0x112211, 0.9); bg.fillRoundedRect(cx, cy, 380, 76, 6); bg.lineStyle(2, C.BOG_LIGHT); bg.strokeRoundedRect(cx, cy, 380, 76, 6); });
        bg.on('pointerdown', () => this.buyCastleUpgrade(upg));
      }
    });
  }

  buyCastleUpgrade(upg) {
    this.gold -= upg.cost;
    if (upg.action === 'repair') {
      this.castleHp = Math.min(this.castleMaxHp, this.castleHp + 50);
      this.showMessage('Shrine repaired! +50 HP');
    } else if (upg.action === 'maxhp') {
      this.castleMaxHp += 50;
      this.castleHp = Math.min(this.castleMaxHp, this.castleHp + 50);
      this.showMessage('Shrine reinforced! Max HP +50');
    } else {
      this.showMessage('Bog Thorns activated!');
    }
    this.refreshInventory();
    this.switchTab(TAB_CASTLE);
  }

  renderInn() {
    this.innVisited = true;
    const px = W/2 - 460, py = 116;
    this.panelContent.push(this.add.text(px, py, 'THE MURKY INN  —  Travellers\' Tales', {
      fontSize: '16px', fontFamily: 'Georgia, serif', color: '#aaff44',
    }));

    const events = this.getInnEvents();
    const ev = events[Math.floor(Math.random() * events.length)];
    this.currentInnEvent = ev;

    const wisp = this.add.image(W/2 + 240, py + 160, 'companion_wisp').setScale(3);
    this.panelContent.push(wisp);
    this.tweens.add({ targets: wisp, y: wisp.y - 10, duration: 1000, yoyo: true, repeat: -1 });

    this.panelContent.push(this.add.text(px, py + 30, `"${ev.text}"`, {
      fontSize: '14px', fontFamily: 'Georgia, serif', color: '#ccddcc',
      wordWrap: { width: 440 }, lineSpacing: 6,
    }));

    if (ev.choices) {
      ev.choices.forEach((choice, i) => {
        const cy = py + 180 + i * 80;
        const canChoose = !choice.cost || this.gold >= choice.cost;
        const btn = this.add.image(px + 210, cy, 'btn_normal').setScale(1.3, 1).setInteractive({ useHandCursor: true });
        const lbl = this.add.text(px + 210, cy, choice.label, {
          fontSize: '14px', fontFamily: 'monospace',
          color: canChoose ? '#aaff44' : '#666666',
        }).setOrigin(0.5);
        this.panelContent.push(btn, lbl);

        if (choice.cost) {
          this.panelContent.push(this.add.text(px + 290, cy + 16, `(${choice.cost}g)`, {
            fontSize: '11px', fontFamily: 'monospace', color: '#ffd700',
          }).setOrigin(0.5));
        }

        if (canChoose) {
          btn.on('pointerover', () => btn.setTexture('btn_hover'));
          btn.on('pointerout', () => btn.setTexture('btn_normal'));
          btn.on('pointerdown', () => {
            this.applyInnChoice(choice);
            this.clearPanel();
            this.panelContent.push(this.add.text(W/2, H/2, choice.result, {
              fontSize: '18px', fontFamily: 'monospace', color: '#aaff44',
              align: 'center',
            }).setOrigin(0.5));
          });
        }
      });
    }
  }

  getInnEvents() {
    return [
      {
        text: 'A hooded figure slides a glowing vial across the table. "Drink this," they rasp, "the bog\'s energy will strengthen you." Do you trust them?',
        choices: [
          { label: 'Drink the vial (free)', cost: 0, effect: 'hp_boost', result: 'You feel the bog\'s power surge through you!\n+30 HP restored.' },
          { label: 'Refuse politely', cost: 0, effect: 'none', result: 'You decline. Probably wise.' },
        ],
      },
      {
        text: 'An old mud troll sits in the corner, surrounded by gleaming weapons. "I found these in the deep bog," he mutters. "Not much use to me..."',
        choices: [
          { label: 'Trade for gold', cost: 80, effect: 'random_weapon', result: 'You receive a bog weapon!' },
          { label: 'Leave him be', cost: 0, effect: 'none', result: 'You leave the troll to his treasures.' },
        ],
      },
      {
        text: 'The innkeeper leans close. "I hear the enemy forces have a weakness — their armored ones crumble in the mud." A tip that might save your life.',
        choices: [
          { label: 'Thank them', cost: 0, effect: 'none', result: 'Useful intelligence noted. Armored foes take extra damage in mud.' },
        ],
      },
      {
        text: 'A young bog sprite flickers in through the window. "Help! My family is trapped beyond the next wave!" it cries. It seems to want to join you...',
        choices: [
          { label: 'Accept the sprite as an ally', cost: 0, effect: 'companion', result: 'The bog sprite joins your cause!' },
          { label: 'You fight alone', cost: 0, effect: 'none', result: 'The sprite flickers sadly and departs.' },
        ],
      },
      {
        text: 'Rain pounds the murky windows. The barmaid slides over a steaming bowl of bog stew. "On the house," she winks. "Bog defenders eat free."',
        choices: [
          { label: 'Eat the stew', cost: 0, effect: 'hp_boost', result: 'Warm and fortified!\n+40 HP restored.' },
        ],
      },
    ];
  }

  applyInnChoice(choice) {
    if (!choice.effect || choice.effect === 'none') return;
    if (choice.cost) this.gold -= choice.cost;
    switch (choice.effect) {
      case 'hp_boost':
        this.castleHp = Math.min(this.castleMaxHp, this.castleHp + 35);
        break;
      case 'random_weapon':
        const available = Object.keys(WEAPONS).filter(k => !this.inventory.some(s => s?.weaponId === k));
        if (available.length > 0) {
          const pick = available[Math.floor(Math.random() * available.length)];
          const slot = this.inventory.findIndex(s => s === null);
          if (slot !== -1) { this.inventory[slot] = { weaponId: pick, mods: [] }; this.refreshInventory(); }
        }
        break;
    }
    this.refreshInventory();
  }

  showMessage(msg) {
    const txt = this.add.text(W / 2, H / 2, msg, {
      fontSize: '20px', fontFamily: 'monospace',
      color: '#aaff44', stroke: '#000000', strokeThickness: 4,
      backgroundColor: '#0a1a0a',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: txt, alpha: 0, y: H/2 - 60, duration: 1800, delay: 600, onComplete: () => txt.destroy() });
  }

  nextDay() {
    // Ensure at least one weapon
    const hasWeapon = this.inventory.some(s => s !== null);
    if (!hasWeapon) {
      this.inventory[0] = { weaponId: this.classDef.startWeapon, mods: [] };
    }
    this.scene.start('Game', {
      classId: this.classId,
      day: this.day + 1,
      gold: this.gold,
      castleHp: this.castleHp,
      castleMaxHp: this.castleMaxHp,
      inventory: this.inventory,
    });
  }
}
