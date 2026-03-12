export const ENEMIES = {
  bog_slime: {
    name: 'Bog Slime',
    hp: 40,
    speed: 55,
    damage: 8,       // damage to castle on reach
    gold: 4,
    size: 28,
    color: 0x66ff44,
    darkColor: 0x33bb22,
    xpVal: 2,
    shape: 'slime',
  },
  swamp_rat: {
    name: 'Swamp Rat',
    hp: 25,
    speed: 100,
    damage: 5,
    gold: 3,
    size: 22,
    color: 0x5a4a30,
    darkColor: 0x3a2a18,
    xpVal: 2,
    shape: 'rat',
  },
  bog_sprite: {
    name: 'Bog Sprite',
    hp: 30,
    speed: 130,
    damage: 6,
    gold: 5,
    size: 20,
    color: 0xaaffaa,
    darkColor: 0x44cc44,
    xpVal: 3,
    shape: 'wisp',
    flying: true,
  },
  mud_troll: {
    name: 'Mud Troll',
    hp: 160,
    speed: 45,
    damage: 20,
    gold: 12,
    size: 42,
    color: 0x6b4423,
    darkColor: 0x4a2e18,
    xpVal: 8,
    shape: 'troll',
  },
  bog_witch: {
    name: 'Bog Witch',
    hp: 60,
    speed: 70,
    damage: 15,
    gold: 10,
    size: 30,
    color: 0x2d1b4e,
    darkColor: 0x1a0f2e,
    xpVal: 6,
    shape: 'witch',
    explodeOnDeath: true,
    explodeRadius: 80,
    explodeDamage: 30,
  },
  swamp_drake: {
    name: 'Swamp Drake',
    hp: 300,
    speed: 60,
    damage: 35,
    gold: 25,
    size: 52,
    color: 0x1a5a2a,
    darkColor: 0x0d3018,
    xpVal: 18,
    shape: 'drake',
  },
  armored_troll: {
    name: 'Armored Troll',
    hp: 280,
    speed: 40,
    damage: 30,
    gold: 20,
    size: 46,
    color: 0x888888,
    darkColor: 0x555555,
    armor: 10,       // flat damage reduction
    xpVal: 15,
    shape: 'troll',
  },
  bog_titan: {
    name: 'Bog Titan',
    hp: 800,
    speed: 30,
    damage: 80,
    gold: 60,
    size: 68,
    color: 0x3b1f0a,
    darkColor: 0x1f0f05,
    armor: 20,
    xpVal: 50,
    shape: 'titan',
  },
};

// Wave composition: array of {type, count, delay (ms between spawns)}
export function buildWave(day) {
  const waves = [];
  const diff = Math.pow(1.12, day - 1); // difficulty multiplier

  if (day <= 3) {
    waves.push({ type: 'bog_slime', count: 4 + day * 2, delay: 900 });
  } else if (day <= 6) {
    waves.push({ type: 'bog_slime', count: 5 + day, delay: 800 });
    waves.push({ type: 'swamp_rat', count: 2 + day, delay: 600 });
  } else if (day <= 10) {
    waves.push({ type: 'bog_slime', count: 6 + day, delay: 700 });
    waves.push({ type: 'swamp_rat', count: 3 + day, delay: 500 });
    waves.push({ type: 'bog_sprite', count: Math.floor(day / 2), delay: 500 });
    if (day >= 8) waves.push({ type: 'mud_troll', count: 1, delay: 1200 });
  } else if (day <= 15) {
    waves.push({ type: 'bog_slime', count: 10, delay: 600 });
    waves.push({ type: 'swamp_rat', count: 8, delay: 400 });
    waves.push({ type: 'mud_troll', count: 2 + Math.floor((day-10)/2), delay: 1000 });
    waves.push({ type: 'bog_witch', count: 1 + Math.floor((day-10)/3), delay: 1000 });
  } else if (day <= 20) {
    waves.push({ type: 'swamp_rat', count: 10, delay: 350 });
    waves.push({ type: 'bog_sprite', count: 8, delay: 350 });
    waves.push({ type: 'mud_troll', count: 4, delay: 900 });
    waves.push({ type: 'bog_witch', count: 3, delay: 900 });
    if (day >= 18) waves.push({ type: 'swamp_drake', count: 1, delay: 2000 });
  } else if (day <= 30) {
    waves.push({ type: 'swamp_rat', count: 12, delay: 300 });
    waves.push({ type: 'bog_sprite', count: 10, delay: 300 });
    waves.push({ type: 'mud_troll', count: 5, delay: 800 });
    waves.push({ type: 'bog_witch', count: 4, delay: 800 });
    waves.push({ type: 'swamp_drake', count: 1 + Math.floor((day-20)/5), delay: 1800 });
    if (day >= 25) waves.push({ type: 'armored_troll', count: 2, delay: 1200 });
  } else {
    waves.push({ type: 'swamp_rat', count: 15, delay: 250 });
    waves.push({ type: 'bog_sprite', count: 12, delay: 250 });
    waves.push({ type: 'mud_troll', count: 6, delay: 700 });
    waves.push({ type: 'bog_witch', count: 5, delay: 700 });
    waves.push({ type: 'swamp_drake', count: 2, delay: 1600 });
    waves.push({ type: 'armored_troll', count: 3, delay: 1100 });
    if (day % 10 === 0) waves.push({ type: 'bog_titan', count: 1, delay: 3000 });
  }

  // Apply HP scaling
  return waves.map(w => ({ ...w, hpMult: diff }));
}
