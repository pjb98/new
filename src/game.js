// ============================================================
// ChronicCity - Solana Weed Growing Simulator
// ============================================================

// ---------- Game State ----------
const G = {
  wallet: null,
  solBalance: 0,
  cash: 250,          // starting cash
  stash: 0,           // grams on hand
  scene: 'home',      // 'home' | 'street'

  // Current grow
  plant: null,        // { strain, startTime, growTime, yield }

  // Owned items
  owned: {
    strains: ['Regular'],
    equipment: ['Soil Pot'],
    locations: ['Bedroom'],
    cosmetics: [],
  },

  activeStrain: 'Regular',
  activeEquipment: 'Soil Pot',
  activeLocation: 'Bedroom',

  // Multipliers
  yieldMult: 1,
  speedMult: 1,
};

// ---------- Shop Catalog ----------
const SHOP = {
  strains: [
    { id: 'Regular',      name: '🌱 Regular',         desc: 'Basic bag seed',        price: 0,    yield: 5,   time: 30,  speedMult: 1,   yieldMult: 1 },
    { id: 'OG Kush',      name: '🌿 OG Kush',         desc: 'Classic fire OG',       price: 120,  yield: 12,  time: 50,  speedMult: 1,   yieldMult: 1.3 },
    { id: 'Blue Dream',   name: '💙 Blue Dream',       desc: 'High yield sativa',     price: 250,  yield: 20,  time: 60,  speedMult: 1.1, yieldMult: 1.6 },
    { id: 'Girl Scout',   name: '🍪 Girl Scout Cookies', desc: 'Top shelf hybrid',   price: 500,  yield: 30,  time: 80,  speedMult: 1,   yieldMult: 2.2 },
    { id: 'Purple Haze',  name: '💜 Purple Haze',      desc: 'Legendary psychedelic', price: 800,  yield: 25,  time: 65,  speedMult: 1.2, yieldMult: 2 },
    { id: 'White Widow',  name: '❄️ White Widow',      desc: 'Dense crystal nugs',    price: 1200, yield: 45,  time: 100, speedMult: 1,   yieldMult: 3 },
    { id: 'Gorilla Glue', name: '🦍 Gorilla Glue #4',  desc: 'Strongest indica',      price: 2000, yield: 60,  time: 120, speedMult: 0.9, yieldMult: 4 },
  ],
  equipment: [
    { id: 'Soil Pot',     name: '🪴 Soil Pot',         desc: 'Basic starter setup',   price: 0,    speedMult: 1,   yieldMult: 1 },
    { id: 'Hydro Kit',    name: '💧 Hydro Kit',         desc: 'Faster water growth',   price: 300,  speedMult: 1.4, yieldMult: 1.2 },
    { id: 'LED Tent',     name: '🔴 LED Grow Tent',     desc: 'Full spectrum LEDs',    price: 600,  speedMult: 1.6, yieldMult: 1.5 },
    { id: 'Aeroponic',    name: '🌫️ Aeroponic System',  desc: 'Mist root feeding',     price: 1500, speedMult: 2,   yieldMult: 1.8 },
    { id: 'AutoFarm',     name: '🤖 Auto-Farm Module',  desc: 'Fully automated grow',  price: 4000, speedMult: 3,   yieldMult: 2.5 },
  ],
  locations: [
    { id: 'Bedroom',      name: '🛏️ Bedroom Closet',   desc: 'Classic starter spot',  price: 0,    slots: 1 },
    { id: 'Garage',       name: '🏠 Garage',            desc: 'More space, 2 plants',  price: 400,  slots: 2 },
    { id: 'Warehouse',    name: '🏭 Warehouse',          desc: 'Industrial 4 plants',   price: 1200, slots: 4 },
    { id: 'Greenhouse',   name: '🌿 Greenhouse',         desc: 'Natural light bonus',   price: 3000, slots: 6, speedMult: 1.3 },
    { id: 'Lab',          name: '🔬 Secret Lab',         desc: 'Max efficiency',        price: 8000, slots: 8, speedMult: 1.5, yieldMult: 1.5 },
  ],
  cosmetics: [
    { id: 'Neon Sign',    name: '🌟 Neon Leaf Sign',    desc: 'Glowing wall decor',    price: 150 },
    { id: 'Lava Lamp',    name: '🔮 Lava Lamp',         desc: 'Chill vibes only',      price: 80 },
    { id: 'Bob Marley',   name: '🎵 Bob Marley Poster', desc: 'Legendary art',         price: 50 },
    { id: 'Bean Bag',     name: '🛋️ Bean Bag Chair',    desc: 'Ultimate comfort',      price: 200 },
    { id: 'Aquarium',     name: '🐠 Fish Tank',         desc: 'Relaxing atmosphere',   price: 350 },
    { id: 'Gold Bong',    name: '🏆 Gold Bong Trophy',  desc: 'Flex on the block',     price: 1000 },
    { id: 'Disco Ball',   name: '🪩 Disco Ball',        desc: 'Party time always',     price: 500 },
  ],
};

// NPC street buyers
const NPCS = [
  { name: 'Dude', want: [5, 15],  pricePerG: [8, 14],  dialog: ['Yo what you got?', 'Lemme smell that.', 'Hook it up fam.'] },
  { name: 'Karen', want: [2, 5],   pricePerG: [12, 18], dialog: ['Do you have anything... medicinal?', 'My back has been killing me.'] },
  { name: 'Benny', want: [10, 30], pricePerG: [7, 12],  dialog: ['Tryna stack up for the week.', 'You got bulk prices?'] },
  { name: 'Mia',   want: [3, 8],   pricePerG: [15, 22], dialog: ['Only the good stuff for me.', 'My guy said you got fire.'] },
  { name: 'Hector',want: [15, 40], pricePerG: [6, 10],  dialog: ['I move product, need a supplier.', 'Wholesale pricing?'] },
  { name: 'Gramps',want: [1, 4],   pricePerG: [10, 16], dialog: ['For my glaucoma, son.', 'Back in my day it was free.'] },
];

// ========================
// PHASER GAME
// ========================

const TILE = 32;
const W = 960, H = 640;

// ---- Tilemap helper: draw colored rects as tiles ----
function drawTile(g, x, y, color, border) {
  g.fillStyle(color, 1);
  g.fillRect(x * TILE, y * TILE, TILE, TILE);
  if (border) {
    g.lineStyle(1, border, 0.4);
    g.strokeRect(x * TILE, y * TILE, TILE, TILE);
  }
}

class HomeScene extends Phaser.Scene {
  constructor() { super('HomeScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;

    // ---- Draw room ----
    const g = this.add.graphics();
    this.roomGraphics = g;
    this.drawRoom(g);

    // ---- Player ----
    this.player = this.add.graphics();
    this.drawPlayer(this.player);
    this.player.x = 200;
    this.player.y = 300;

    // ---- Plant sprite ----
    this.plantG = this.add.text(280, 370, '🌱', { fontSize: '28px' }).setDepth(2);
    this.plantG.setInteractive({ useHandCursor: true });
    this.plantG.on('pointerdown', () => this.interactPlant());
    this.updatePlantSprite();

    // ---- Cosmetic items ----
    this.cosmeticSprites = [];
    this.renderCosmetics();

    // ---- Input ----
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.bKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);

    this.eKeyDown = false;
    this.bKeyDown = false;
    this.hKeyDown = false;

    // ---- Grow timer ----
    this.time.addEvent({ delay: 1000, loop: true, callback: this.tickGrow, callbackScope: this });

    // ---- Door label ----
    this.add.text(W - 80, H / 2 - 10, '[ EXIT ]', {
      fontSize: '11px', color: '#4caf50', fontFamily: 'Courier New'
    }).setDepth(3);

    // ---- Shop sign ----
    this.shopZone = this.add.text(60, 60, '🛒 SHOP', {
      fontSize: '14px', color: '#ffd700', fontFamily: 'Courier New',
      backgroundColor: '#1a3a1a', padding: { x: 6, y: 4 }
    }).setInteractive({ useHandCursor: true }).setDepth(3);
    this.shopZone.on('pointerdown', () => openShop());

    // ---- Planting zone label ----
    this.add.text(248, 410, 'Grow Zone', {
      fontSize: '9px', color: '#2d7a2d', fontFamily: 'Courier New'
    }).setDepth(1);

    updateHUD();
  }

  drawRoom(g) {
    const cols = Math.ceil(W / TILE), rows = Math.ceil(H / TILE);
    // Floor
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
      const c = (x + y) % 2 === 0 ? 0x0d1f0d : 0x0a180a;
      drawTile(g, x, y, c, 0x1a3a1a);
    }
    // Walls
    for (let x = 0; x < cols; x++) {
      drawTile(g, x, 0, 0x0f2a0f, 0x2d5a2d);
      drawTile(g, x, rows - 1, 0x0f2a0f, 0x2d5a2d);
    }
    for (let y = 0; y < rows; y++) {
      drawTile(g, 0, y, 0x0f2a0f, 0x2d5a2d);
      drawTile(g, cols - 1, y, 0x0f2a0f, 0x2d5a2d);
    }
    // Door on right wall
    for (let y = 9; y <= 11; y++) drawTile(g, cols - 1, y, 0x1a4a1a, 0x4caf50);
    // Grow patch (darker soil)
    for (let x = 7; x <= 10; x++) for (let y = 10; y <= 13; y++) drawTile(g, x, y, 0x1a1200, 0x3a2a00);
    // Rug / carpet area
    for (let x = 2; x <= 5; x++) for (let y = 6; y <= 9; y++) drawTile(g, x, y, 0x111a11, 0x1a2d1a);
  }

  drawPlayer(g) {
    g.clear();
    // Body
    g.fillStyle(0x2d8a2d, 1);
    g.fillRect(-10, -14, 20, 26);
    // Head
    g.fillStyle(0xd4a373, 1);
    g.fillCircle(0, -20, 10);
    // Eyes
    g.fillStyle(0x111, 1);
    g.fillCircle(-4, -21, 2);
    g.fillCircle(4, -21, 2);
    g.setDepth(5);
  }

  updatePlantSprite() {
    if (!G.plant) {
      this.plantG.setText('🪴');
      return;
    }
    const pct = this.growPercent();
    if (pct < 0.25) this.plantG.setText('🌱');
    else if (pct < 0.6) this.plantG.setText('🌿');
    else if (pct < 1) this.plantG.setText('🌳');
    else this.plantG.setText('🌲');
  }

  growPercent() {
    if (!G.plant) return 0;
    const elapsed = (Date.now() - G.plant.startTime) / 1000;
    return Math.min(elapsed / G.plant.growTime, 1);
  }

  tickGrow() {
    if (!G.plant) return;
    const pct = this.growPercent();
    document.getElementById('grow-bar').style.width = (pct * 100) + '%';
    document.getElementById('grow-status').textContent = pct >= 1
      ? '✅ Ready to harvest!'
      : `Growing... ${Math.floor(pct * 100)}%`;
    document.getElementById('harvest-btn').style.display = pct >= 1 ? 'block' : 'none';
    this.updatePlantSprite();
    updateHUD();
  }

  interactPlant() {
    if (!G.plant) {
      // Start grow
      const strain = SHOP.strains.find(s => s.id === G.activeStrain);
      const equip  = SHOP.equipment.find(e => e.id === G.activeEquipment);
      const loc    = SHOP.locations.find(l => l.id === G.activeLocation);
      const growTime = Math.floor(
        strain.time / (strain.speedMult * equip.speedMult * (loc.speedMult || 1))
      );
      G.plant = {
        strain: strain.id,
        startTime: Date.now(),
        growTime,
        yieldG: Math.floor(strain.yield * equip.yieldMult * (loc.yieldMult || 1)),
      };
      notify(`🌱 Planted ${strain.name}! Grows in ~${growTime}s`);
      document.getElementById('strain-name').textContent = strain.name;
    } else if (this.growPercent() >= 1) {
      this.harvest();
    } else {
      notify(`Still growing... ${Math.floor(this.growPercent() * 100)}%`);
    }
  }

  harvest() {
    if (!G.plant || this.growPercent() < 1) return;
    const y = G.plant.yieldG;
    G.stash += y;
    G.plant = null;
    document.getElementById('grow-bar').style.width = '0%';
    document.getElementById('grow-status').textContent = 'No plant growing';
    document.getElementById('harvest-btn').style.display = 'none';
    document.getElementById('strain-name').textContent = '—';
    this.plantG.setText('🪴');
    notify(`🌿 Harvested ${y}g!`);
    updateHUD();
  }

  renderCosmetics() {
    this.cosmeticSprites.forEach(s => s.destroy());
    this.cosmeticSprites = [];
    const POSITIONS = {
      'Neon Sign':  [600, 80],
      'Lava Lamp':  [700, 200],
      'Bob Marley': [100, 120],
      'Bean Bag':   [150, 430],
      'Aquarium':   [750, 380],
      'Gold Bong':  [650, 300],
      'Disco Ball': [500, 90],
    };
    const EMOJIS = {
      'Neon Sign': '🌟', 'Lava Lamp': '🔮', 'Bob Marley': '🎵',
      'Bean Bag': '🛋️', 'Aquarium': '🐠', 'Gold Bong': '🏆', 'Disco Ball': '🪩',
    };
    G.owned.cosmetics.forEach(id => {
      const pos = POSITIONS[id] || [400, 300];
      const t = this.add.text(pos[0], pos[1], EMOJIS[id] || '⭐', { fontSize: '28px' }).setDepth(2);
      this.cosmeticSprites.push(t);
    });
  }

  update() {
    const speed = 2.5;
    let dx = 0, dy = 0;

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  dx -= speed;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += speed;
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    dy -= speed;
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  dy += speed;

    const nx = Phaser.Math.Clamp(this.player.x + dx, TILE, W - TILE);
    const ny = Phaser.Math.Clamp(this.player.y + dy, TILE, H - TILE);
    this.player.x = nx;
    this.player.y = ny;

    // Flip sprite on horizontal move
    if (dx < 0) this.player.scaleX = -1;
    else if (dx > 0) this.player.scaleX = 1;

    // Door: right side
    if (nx > W - 80 && ny > H / 2 - 60 && ny < H / 2 + 60) {
      if (!this.hKeyDown) {
        this.hKeyDown = true;
        this.scene.start('StreetScene');
        return;
      }
    } else this.hKeyDown = false;

    // E key: interact with plant
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.interactPlant();

    // B key: shop
    if (Phaser.Input.Keyboard.JustDown(this.bKey)) openShop();

    // H key: go to street
    if (Phaser.Input.Keyboard.JustDown(this.hKey)) this.scene.start('StreetScene');
  }
}

// ========================
// STREET SCENE
// ========================

class StreetScene extends Phaser.Scene {
  constructor() { super('StreetScene'); }

  create() {
    const g = this.add.graphics();
    this.drawStreet(g);

    // Player
    this.player = this.add.graphics();
    this.drawPlayer(this.player);
    this.player.x = 100;
    this.player.y = 380;

    // NPCs
    this.npcSprites = [];
    this.spawnNPCs();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.bKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    this.nearNPC = null;

    // NPC wander timer
    this.time.addEvent({ delay: 2000, loop: true, callback: this.wanderNPCs, callbackScope: this });

    // Door back home
    this.add.text(60, 360, '[ HOME ]', {
      fontSize: '11px', color: '#4caf50', fontFamily: 'Courier New'
    }).setDepth(3);

    // Interaction hint
    this.interactHint = this.add.text(0, 0, 'E: Talk', {
      fontSize: '11px', color: '#ffd700', fontFamily: 'Courier New',
      backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 4, y: 2 }
    }).setDepth(10).setVisible(false);

    updateHUD();
  }

  drawStreet(g) {
    // Sky / buildings bg
    g.fillStyle(0x101820, 1);
    g.fillRect(0, 0, W, 260);

    // Buildings
    const bldgs = [
      [30, 60, 120, 200, 0x1a1a2a],
      [170, 40, 100, 220, 0x1a2a1a],
      [290, 80, 130, 180, 0x2a1a1a],
      [450, 50, 90, 210, 0x1a2a2a],
      [570, 70, 110, 190, 0x1a1a3a],
      [710, 30, 140, 230, 0x2a2a1a],
      [880, 60, 80, 200, 0x1a2a1a],
    ];
    bldgs.forEach(([x, y, w, h, c]) => {
      g.fillStyle(c, 1);
      g.fillRect(x, y, w, h);
      // Windows
      g.fillStyle(0xffff88, 0.4);
      for (let wy = y + 10; wy < y + h - 10; wy += 25)
        for (let wx = x + 10; wx < x + w - 8; wx += 22)
          if (Math.random() > 0.4) g.fillRect(wx, wy, 12, 14);
    });

    // Sidewalk
    g.fillStyle(0x2a2a2a, 1); g.fillRect(0, 260, W, 30);
    g.fillStyle(0x3a3a3a, 1);
    for (let x = 0; x < W; x += 60) g.fillRect(x, 260, 30, 3);

    // Road
    g.fillStyle(0x1a1a1a, 1); g.fillRect(0, 290, W, 260);
    // Lane markings
    g.fillStyle(0xffd700, 0.6);
    for (let x = 0; x < W; x += 80) g.fillRect(x, 418, 50, 6);

    // Curb
    g.fillStyle(0x555, 1); g.fillRect(0, 290, W, 6);

    // Street lamps
    [100, 300, 500, 700, 900].forEach(x => {
      g.fillStyle(0x444, 1); g.fillRect(x, 200, 5, 90);
      g.fillStyle(0xffff88, 0.8); g.fillCircle(x + 2, 200, 14);
    });

    // Home door (left)
    g.fillStyle(0x1a4a1a, 1); g.fillRect(30, 290, 50, 80);
    g.fillStyle(0x4caf50, 1); g.fillRect(50, 330, 8, 8);
  }

  drawPlayer(g) {
    g.clear();
    g.fillStyle(0x1a5c1a, 1); g.fillRect(-10, -14, 20, 26);
    g.fillStyle(0xd4a373, 1); g.fillCircle(0, -20, 10);
    g.fillStyle(0x111, 1); g.fillCircle(-4, -21, 2); g.fillCircle(4, -21, 2);
    g.setDepth(5);
  }

  drawNPC(g, npc) {
    g.clear();
    const colors = [0x2a4a8a, 0x8a2a2a, 0x5a2a8a, 0x8a6a2a, 0x2a6a6a, 0x6a4a2a];
    g.fillStyle(colors[npc.colorIdx % colors.length], 1); g.fillRect(-9, -13, 18, 24);
    g.fillStyle(npc.skinColor, 1); g.fillCircle(0, -19, 9);
    g.fillStyle(0x111, 1); g.fillCircle(-3, -20, 1.5); g.fillCircle(3, -20, 1.5);
    g.setDepth(4);
  }

  spawnNPCs() {
    this.npcSprites = NPCS.map((npc, i) => {
      const g = this.add.graphics();
      const data = {
        npc, g,
        x: 150 + i * 130,
        y: 320 + (i % 2) * 30,
        dx: (Math.random() - 0.5) * 0.5,
        dy: 0,
        colorIdx: i,
        skinColor: [0xd4a373, 0x8d5524, 0xffdbac, 0xf1c27d, 0xe0ac69][i % 5],
      };
      g.x = data.x; g.y = data.y;
      this.drawNPC(g, data);

      // Name label
      const label = this.add.text(data.x, data.y - 35, npc.name, {
        fontSize: '10px', color: '#7fff7f', fontFamily: 'Courier New',
        backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 3, y: 1 }
      }).setOrigin(0.5).setDepth(6);
      data.label = label;
      return data;
    });
  }

  wanderNPCs() {
    this.npcSprites.forEach(d => {
      d.dx = (Math.random() - 0.5) * 1.2;
      d.x = Phaser.Math.Clamp(d.x + d.dx * 40, 80, W - 80);
      d.g.x = d.x;
      d.label.x = d.x;
    });
  }

  findNearbyNPC() {
    let closest = null, minDist = 70;
    this.npcSprites.forEach(d => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, d.x, d.y);
      if (dist < minDist) { closest = d; minDist = dist; }
    });
    return closest;
  }

  update() {
    const speed = 2.5;
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  dx -= speed;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += speed;
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    dy -= speed;
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  dy += speed;

    // Constrain to sidewalk/road area
    this.player.x = Phaser.Math.Clamp(this.player.x + dx, 30, W - 30);
    this.player.y = Phaser.Math.Clamp(this.player.y + dy, 280, 540);

    if (dx < 0) this.player.scaleX = -1;
    else if (dx > 0) this.player.scaleX = 1;

    // Door home
    if (this.player.x < 90 && this.player.y > 290 && this.player.y < 380) {
      if (Phaser.Input.Keyboard.JustDown(this.hKey) || Phaser.Input.Keyboard.JustDown(this.eKey)) {
        this.scene.start('HomeScene');
        return;
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.hKey)) { this.scene.start('HomeScene'); return; }
    if (Phaser.Input.Keyboard.JustDown(this.bKey)) openShop();

    // NPC proximity
    const near = this.findNearbyNPC();
    if (near) {
      this.interactHint.setPosition(near.x - 20, near.y - 50).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.talkToNPC(near.npc);
    } else {
      this.interactHint.setVisible(false);
    }
  }

  talkToNPC(npc) {
    if (G.stash <= 0) {
      showDialog(npc.name, npc.dialog[Math.floor(Math.random() * npc.dialog.length)] + '\n\n"...but you don\'t have anything on you."', [
        { text: 'Later homie', action: closeDialog },
      ]);
      return;
    }
    const wantMin = npc.want[0], wantMax = npc.want[1];
    const want = Math.min(G.stash, Math.floor(Math.random() * (wantMax - wantMin + 1)) + wantMin);
    const pricePerG = Math.floor(Math.random() * (npc.pricePerG[1] - npc.pricePerG[0] + 1)) + npc.pricePerG[0];
    const total = want * pricePerG;

    showDialog(npc.name,
      `${npc.dialog[Math.floor(Math.random() * npc.dialog.length)]}\n\n"I'll take ${want}g for $${pricePerG}/g — that's $${total} total."`,
      [
        {
          text: `Sell ${want}g ($${total})`, action: () => {
            G.stash -= want;
            G.cash += total;
            closeDialog();
            notify(`💵 Sold ${want}g for $${total}!`);
            updateHUD();
          }
        },
        { text: 'No deal', action: closeDialog },
      ]
    );
  }
}

// ========================
// PHASER CONFIG
// ========================
const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  parent: 'game-container',
  backgroundColor: '#0a0f0a',
  scene: [HomeScene, StreetScene],
};

let game;

function startGame() {
  if (game) return;
  game = new Phaser.Game(config);
  document.getElementById('splash').style.display = 'none';
  updateHUD();
}

// ========================
// UI HELPERS
// ========================

function updateHUD() {
  document.getElementById('sol-badge').textContent = `◎ ${G.solBalance.toFixed(2)}`;
  document.getElementById('cash-badge').textContent = `💵 $${G.cash}`;
  document.getElementById('stash-badge').textContent = `🌿 ${G.stash}g`;
}

function notify(msg) {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.opacity = '0', 3000);
}

function showDialog(name, text, choices) {
  const box = document.getElementById('dialog-box');
  document.getElementById('dialog-npc-name').textContent = name;
  document.getElementById('dialog-text').textContent = text;
  const cc = document.getElementById('dialog-choices');
  cc.innerHTML = '';
  choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'dialog-choice';
    btn.textContent = c.text;
    btn.onclick = c.action;
    cc.appendChild(btn);
  });
  box.style.display = 'block';
}

function closeDialog() {
  document.getElementById('dialog-box').style.display = 'none';
}

// ========================
// SHOP
// ========================

let activeShopTab = 'strains';

function openShop() {
  document.getElementById('shop-panel').style.display = 'block';
  renderShopTab(activeShopTab);
}

function renderShopTab(tab) {
  activeShopTab = tab;
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const container = document.getElementById('shop-items-container');
  container.innerHTML = '';
  const items = SHOP[tab];
  items.forEach(item => {
    const owned = G.owned[tab].includes(item.id);
    const div = document.createElement('div');
    div.className = 'shop-item' + (owned ? ' owned' : '');

    let extra = '';
    if (tab === 'strains' && item.yield) extra = `Yield: ${item.yield}g | Time: ${item.time}s`;
    if (tab === 'equipment') extra = `Speed: x${item.speedMult} | Yield: x${item.yieldMult}`;
    if (tab === 'locations') extra = `Slots: ${item.slots}`;

    div.innerHTML = `
      <div class="name">${item.name}</div>
      <div class="desc">${item.desc}${extra ? '<br><span style="color:#5a9a5a">' + extra + '</span>' : ''}</div>
      <div class="price">${item.price === 0 ? '✅ FREE / STARTER' : owned ? '✅ OWNED' : `$${item.price}`}</div>
    `;
    if (!owned && item.price > 0) {
      div.onclick = () => buyItem(tab, item);
    }
    container.appendChild(div);
  });
}

function buyItem(tab, item) {
  if (G.cash < item.price) { notify('❌ Not enough cash!'); return; }
  G.cash -= item.price;
  G.owned[tab].push(item.id);

  // Auto-equip
  if (tab === 'strains')    G.activeStrain = item.id;
  if (tab === 'equipment')  G.activeEquipment = item.id;
  if (tab === 'locations')  G.activeLocation = item.id;

  // Re-render cosmetics if in home
  if (tab === 'cosmetics' && game) {
    const home = game.scene.getScene('HomeScene');
    if (home && home.scene.isActive()) home.renderCosmetics();
  }

  notify(`✅ Bought ${item.name}!`);
  updateHUD();
  renderShopTab(tab);
}

document.querySelectorAll('.shop-tab').forEach(btn => {
  btn.addEventListener('click', () => renderShopTab(btn.dataset.tab));
});
document.getElementById('close-shop').addEventListener('click', () => {
  document.getElementById('shop-panel').style.display = 'none';
});
document.getElementById('harvest-btn').addEventListener('click', () => {
  const home = game?.scene.getScene('HomeScene');
  if (home) home.harvest();
});

// ========================
// WALLET
// ========================

async function connectWallet() {
  try {
    if (!window.solana || !window.solana.isPhantom) {
      alert('Phantom wallet not found! Opening demo mode.');
      startGame();
      return;
    }
    const resp = await window.solana.connect();
    G.wallet = resp.publicKey.toString();
    // Fetch balance
    const conn = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
    const lamports = await conn.getBalance(new solanaWeb3.PublicKey(G.wallet));
    G.solBalance = lamports / 1e9;
    notify(`✅ Wallet connected! ◎${G.solBalance.toFixed(3)} SOL`);
    startGame();
    updateHUD();
  } catch (e) {
    console.error(e);
    notify('Wallet connection failed. Starting demo.');
    startGame();
  }
}

document.getElementById('splash-connect-btn').addEventListener('click', connectWallet);
document.getElementById('demo-btn').addEventListener('click', () => {
  G.cash = 500;
  startGame();
});
