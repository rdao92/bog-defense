# Bog Defense — Project Context

## Overview
Phaser 3.88 + Vite. Bog-themed top-down tower defense / shooter. Deployed automatically to Vercel via GitHub push.

- **Repo:** https://github.com/rdao92/bog-defense
- **Live:** https://bog-defense.vercel.app/
- **Local dev:** `npm run dev` (Vite)

## Architecture

### Scene Flow
Boot → MainMenu → CharSelect → Game → Town → GameOver

| Scene | File |
|-------|------|
| Boot | `src/scenes/BootScene.js` |
| Main Menu | `src/scenes/MainMenuScene.js` |
| Character Select | `src/scenes/CharSelectScene.js` |
| Game | `src/scenes/GameScene.js` |
| Town | `src/scenes/TownScene.js` |
| Game Over | `src/scenes/GameOverScene.js` |

### Key Constants (`src/constants.js`)
- `W = 960`, `H = 640` — canvas dimensions
- `CASTLE_Y = H - 60` — castle position (enemies attack this)
- `CASTLE_SPAWN_ZONE_Y = 80` — where enemies spawn from the top
- `PLAYER_MOVE_AREA_TOP = H * 0.55` — player is restricted to bottom ~45% of screen
- `C` — color palette object (all hex colors for programmatic art)

### Data Files
- `src/data/classes.js` — 6 player classes (Frog Knight, Swamp Witch, etc.)
- `src/data/weapons.js` — 13 weapons
- `src/data/enemies.js` — 8 enemy types + `buildWave()` function

### Source Structure
```
src/
  constants.js
  main.js
  data/        classes.js, enemies.js, weapons.js
  entities/    player, enemies, projectiles, etc.
  scenes/      all 6 scenes
  systems/     game systems (waves, combat, etc.)
  ui/          HUD, menus, etc.
```

## Art — 100% Programmatic
**No image files exist.** All sprites are drawn in `BootScene.js` using `this.make.graphics()` + `generateTexture()`. When adding new art:
- Draw in `BootScene.js` preload/create phase
- Call `generateTexture('key', w, h)` to bake it into Phaser's texture cache
- Reference by key string everywhere else

## Critical Phaser Gotchas
- **No `quadraticBezierTo`** — this method doesn't exist in Phaser 3. Use `lineTo` or `strokePoints` for curves.
- **Always guard `obj.active`** before calling methods on objects that might be destroyed: `if (enemy.active) enemy.takeDamage(...)`. Destroyed Phaser objects throw on method calls.
- **Never wrap entire `update()` in try/catch** — this swallows errors silently and makes debugging impossible. Guard individual operations instead.
- Phaser Groups: use `group.getChildren()` to iterate; the array mutates on kill so iterate a copy if destroying during iteration.

## Deploy
```bash
npm run build && git add -A && git commit -m "message" && git push
```
Vercel auto-deploys on push to main. No manual deploy step needed.

## Bug Workflow
Bug screenshots go in: `C:\Users\CowEa\Documents\BogDefense\Bugs\`

Current known bugs are documented there as named screenshots (e.g. `freeze.jpg`, `enemiesnotdying.jpg`).
