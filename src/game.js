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

  // Last house entered (index into STREET_HOUSES)
  lastHouseIdx: 0,
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
// CHARACTER & PLANT DRAWING
// ========================

const PLAYER_STYLE = {
  body: 0x2d7a2d, bodyDark: 0x1f5a1f,
  pants: 0x1a1a3a, shoes: 0xffffff, shoeLace: 0x333333,
  skin: 0xd4a373, hair: 0x111111, hat: true, glasses: false,
};

const NPC_STYLES = [
  { body:0x2a5a9a, bodyDark:0x1a3a7a, pants:0x111133, shoes:0xee3333, shoeLace:0xffffff, skin:0xd4a373, hair:0x111111, hat:true,  glasses:false },
  { body:0x9a2a2a, bodyDark:0x7a1a1a, pants:0x22224a, shoes:0xeeeeee, shoeLace:0x333333, skin:0x8d5524, hair:0x1a0800, hat:false, glasses:true  },
  { body:0x7a2a9a, bodyDark:0x5a1a7a, pants:0x112211, shoes:0x111111, shoeLace:0x44cc44, skin:0xffdbac, hair:0x885533, hat:false, glasses:false },
  { body:0x9a9a22, bodyDark:0x7a7a11, pants:0x111111, shoes:0x4444dd, shoeLace:0xffffff, skin:0xf1c27d, hair:0x443322, hat:true,  glasses:false },
  { body:0x229a6a, bodyDark:0x117a4a, pants:0x221100, shoes:0xcc8800, shoeLace:0xffffff, skin:0xe0ac69, hair:0x111111, hat:false, glasses:false },
  { body:0x9a4422, bodyDark:0x7a3311, pants:0x001122, shoes:0x22cc22, shoeLace:0x111111, skin:0xd4a373, hair:0x220000, hat:true,  glasses:true  },
];

function drawChar(g, style, depth) {
  g.clear();
  const s = style;

  // Shoes
  g.fillStyle(s.shoes, 1);
  g.fillRoundedRect(-13, 8, 11, 7, {tl:1, tr:3, bl:1, br:2});
  g.fillRoundedRect(2,   8, 11, 7, {tl:3, tr:1, bl:2, br:1});
  g.fillStyle(0x888888, 1);
  g.fillRect(-14, 13, 13, 2);
  g.fillRect(1,   13, 13, 2);
  g.fillStyle(s.shoeLace || 0xffffff, 1);
  g.fillRect(-12, 9, 8, 1); g.fillRect(-12, 11, 8, 1);
  g.fillRect(3,   9, 8, 1); g.fillRect(3,   11, 8, 1);

  // Pants
  g.fillStyle(s.pants, 1);
  g.fillRect(-12, -3, 10, 13);
  g.fillRect(2,   -3, 10, 13);
  g.fillStyle(0x2a1500, 1);
  g.fillRect(-12, -5, 24, 3);
  g.fillStyle(0xaa8844, 1);
  g.fillRect(-3, -5, 6, 3);

  // Hoodie body
  g.fillStyle(s.body, 1);
  g.fillRoundedRect(-13, -18, 26, 18, 4);
  g.fillStyle(s.bodyDark, 1);
  g.fillTriangle(0, -11, -8, -18, 8, -18);
  g.fillRoundedRect(-7, -12, 14, 9, 2);

  // Arms
  g.fillStyle(s.body, 1);
  g.fillRoundedRect(-22, -17, 10, 14, {tl:3, tr:2, bl:4, br:2});
  g.fillRoundedRect(12,  -17, 10, 14, {tl:2, tr:3, bl:2, br:4});
  g.fillStyle(s.bodyDark, 1);
  g.fillRect(-22, -5, 10, 2);
  g.fillRect(12,  -5, 10, 2);

  // Hands
  g.fillStyle(s.skin, 1);
  g.fillRoundedRect(-22, -3, 10, 7, 3);
  g.fillRoundedRect(12,  -3, 10, 7, 3);

  // Neck
  g.fillStyle(s.skin, 1);
  g.fillRect(-4, -22, 8, 6);

  // Head
  g.fillStyle(s.skin, 1);
  g.fillRoundedRect(-12, -42, 24, 23, 8);

  // Hat or hair
  g.fillStyle(s.hair, 1);
  if (s.hat) {
    g.fillRoundedRect(-13, -42, 26, 11, {tl:8, tr:8, bl:0, br:0});
    g.fillRoundedRect(-17, -33, 34, 5,  {tl:1, tr:1, bl:2, br:2});
    g.fillStyle(0x4caf50, 1);
    g.fillCircle(0, -40, 2);
  } else {
    g.fillRoundedRect(-12, -42, 24, 12, {tl:8, tr:8, bl:0, br:0});
  }

  // Glasses (drawn before eyes so eyes render on top)
  if (s.glasses) {
    g.lineStyle(2, 0xccaa44, 1);
    g.strokeRoundedRect(-10, -36, 9, 8, 2);
    g.strokeRoundedRect(1,   -36, 9, 8, 2);
    g.lineBetween(-1, -32, 1, -32);
    g.lineBetween(-14, -32, -10, -32);
    g.lineBetween(10,  -32, 14,  -32);
    g.fillStyle(0xaaddff, 0.2);
    g.fillRoundedRect(-10, -36, 9, 8, 2);
    g.fillRoundedRect(1,   -36, 9, 8, 2);
  }

  // Eyes
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(-5, -31, 8, 7);
  g.fillEllipse(5,  -31, 8, 7);
  g.fillStyle(0x3a2a1a, 1);
  g.fillCircle(-5, -31, 2.8);
  g.fillCircle(5,  -31, 2.8);
  g.fillStyle(0x000000, 1);
  g.fillCircle(-5, -31, 1.4);
  g.fillCircle(5,  -31, 1.4);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-4, -32, 0.8);
  g.fillCircle(6,  -32, 0.8);

  // Eyebrows
  g.lineStyle(2, s.hair, 0.9);
  g.lineBetween(-9, -37, -2, -36);
  g.lineBetween(2,  -36,  9, -37);

  // Mouth
  g.lineStyle(1.5, 0x7a4a2a, 1);
  g.arc(0, -25, 4, 0.2, Math.PI - 0.2, false);
  g.strokePath();

  if (depth !== undefined) g.setDepth(depth);
}

// Single pointed cannabis leaflet drawn from its base (cx,cy) outward
function drawLeaflet(g, cx, cy, angleDeg, length, width) {
  const rad  = Phaser.Math.DegToRad(angleDeg);
  const cos  = Math.cos(rad), sin = Math.sin(rad);
  const pcos = Math.cos(rad + Math.PI / 2);
  const psin = Math.sin(rad + Math.PI / 2);
  g.fillPoints([
    { x: cx, y: cy },
    { x: cx + cos * length * 0.5 + pcos * width * 0.5, y: cy + sin * length * 0.5 + psin * width * 0.5 },
    { x: cx + cos * length, y: cy + sin * length },
    { x: cx + cos * length * 0.5 - pcos * width * 0.5, y: cy + sin * length * 0.5 - psin * width * 0.5 },
  ], true);
  g.lineStyle(0.7, 0x1a5a00, 0.7);
  g.lineBetween(cx, cy, cx + cos * length * 0.8, cy + sin * length * 0.8);
}

// Fan of leaflets radiating from (cx,cy), centered on dirDeg
function drawFanLeaf(g, cx, cy, dirDeg, size, leaflets) {
  const spread = 140;
  const leafColors = [0x2d9a00, 0x259500, 0x2a8a00, 0x228800, 0x1f7a00, 0x2d9000, 0x229500];
  for (let i = 0; i < leaflets; i++) {
    const t = leaflets > 1 ? i / (leaflets - 1) - 0.5 : 0;
    const angleDeg = dirDeg + t * spread;
    const len = size * (1 - Math.abs(t) * 0.28);
    g.fillStyle(leafColors[i % leafColors.length], 1);
    drawLeaflet(g, cx, cy, angleDeg, len, len * 0.22);
  }
}

// Dedicated player sprite: hood up, shades, gold chain, Jordans
function drawDealer(g, depth) {
  g.clear();

  // === HIGH-TOP JORDANS ===
  // Left
  g.fillStyle(0x111111, 1);
  g.fillRect(-14, -2, 11, 10);           // high ankle
  g.fillStyle(0xcc2200, 1);
  g.fillRoundedRect(-15, 5, 13, 9, {tl:1,tr:3,bl:2,br:2});
  g.fillStyle(0x111111, 1);
  g.fillRoundedRect(-15, 5, 13, 5, {tl:1,tr:3,bl:0,br:0});
  g.fillStyle(0xeeeeee, 1);
  g.fillRoundedRect(-16, 12, 15, 3, 2);  // sole
  g.fillStyle(0xdddddd, 0.9);
  g.fillRect(-13, 6, 8, 1); g.fillRect(-13, 8, 8, 1); g.fillRect(-13, 10, 8, 1);
  // Right
  g.fillStyle(0x111111, 1);
  g.fillRect(3, -2, 11, 10);
  g.fillStyle(0xcc2200, 1);
  g.fillRoundedRect(2, 5, 13, 9, {tl:3,tr:1,bl:2,br:2});
  g.fillStyle(0x111111, 1);
  g.fillRoundedRect(2, 5, 13, 5, {tl:3,tr:1,bl:0,br:0});
  g.fillStyle(0xeeeeee, 1);
  g.fillRoundedRect(1, 12, 15, 3, 2);
  g.fillStyle(0xdddddd, 0.9);
  g.fillRect(5, 6, 8, 1); g.fillRect(5, 8, 8, 1); g.fillRect(5, 10, 8, 1);

  // === SWEATPANTS (baggy black, white stripe) ===
  g.fillStyle(0x111111, 1);
  g.fillRect(-14, -7, 12, 11);
  g.fillRect(2,   -7, 12, 11);
  g.fillStyle(0xffffff, 1);
  g.fillRect(-14, -7, 2, 11);   // left stripe
  g.fillRect(12,  -7, 2, 11);   // right stripe

  // === BAGGY HOODIE BODY ===
  g.fillStyle(0x151515, 1);
  g.fillRoundedRect(-15, -23, 30, 19, 5);
  // Kangaroo pocket
  g.fillStyle(0x0a0a0a, 1);
  g.fillRoundedRect(-9, -16, 18, 12, 3);
  g.fillStyle(0x1f1f1f, 1);
  g.fillRect(-1, -16, 2, 12);   // pocket divider seam
  // Drawstring holes
  g.fillStyle(0x333333, 1);
  g.fillCircle(-3, -24, 1.5);
  g.fillCircle(3,  -24, 1.5);
  // Drawstrings hanging down
  g.lineStyle(1, 0x555555, 1);
  g.lineBetween(-3, -22, -5, -14);
  g.lineBetween(3,  -22,  5, -14);

  // === ARMS (baggy) ===
  g.fillStyle(0x151515, 1);
  g.fillRoundedRect(-26, -22, 12, 18, {tl:4,tr:2,bl:5,br:2});
  g.fillRoundedRect(14,  -22, 12, 18, {tl:2,tr:4,bl:2,br:5});
  g.fillStyle(0x0a0a0a, 1);
  g.fillRect(-26, -6, 12, 3);   // left cuff
  g.fillRect(14,  -6, 12, 3);   // right cuff

  // === HANDS ===
  g.fillStyle(0xc49060, 1);
  g.fillRoundedRect(-26, -3, 12, 7, 3);
  g.fillRoundedRect(14,  -3, 12, 7, 3);

  // === GOLD CHAIN ===
  g.fillStyle(0xffd700, 1);
  for (let i = -9; i <= 9; i += 3) {
    g.fillCircle(i, -19 + Math.abs(i) * 0.25, 1.6);
  }
  // Pendant (leaf shape)
  g.fillStyle(0xffaa00, 1);
  g.fillCircle(0, -13, 4);
  g.fillStyle(0xffd700, 1);
  g.fillCircle(0, -13, 2.5);
  g.fillStyle(0x1a1a00, 0.5);
  g.fillCircle(0, -13, 1);     // inner engraving

  // === NECK ===
  g.fillStyle(0xc49060, 1);
  g.fillRect(-4, -27, 8, 7);

  // === HEAD (skin) ===
  g.fillStyle(0xc49060, 1);
  g.fillRoundedRect(-12, -48, 24, 24, 8);

  // === HOOD UP ===
  // Outer hood
  g.fillStyle(0x111111, 1);
  g.fillRoundedRect(-16, -52, 32, 22, {tl:14,tr:14,bl:0,br:0});
  // Hood side panels (cover sides of face)
  g.fillRect(-16, -42, 6, 20);
  g.fillRect(10,  -42, 6, 20);
  // Inner hood shadow
  g.fillStyle(0x080808, 1);
  g.fillRoundedRect(-13, -50, 26, 16, {tl:12,tr:12,bl:0,br:0});
  // Face opening (reveal skin)
  g.fillStyle(0xc49060, 1);
  g.fillRoundedRect(-9, -46, 18, 22, 5);

  // === DARK SUNGLASSES ===
  // Lenses
  g.fillStyle(0x0a1520, 1);
  g.fillRoundedRect(-10, -41, 9, 7, {tl:2,tr:3,bl:2,br:1});
  g.fillRoundedRect(1,  -41, 9, 7, {tl:3,tr:2,bl:1,br:2});
  // Blue tint reflections
  g.fillStyle(0x1a4a7a, 0.6);
  g.fillRoundedRect(-10, -41, 9, 7, {tl:2,tr:3,bl:2,br:1});
  g.fillRoundedRect(1,  -41, 9, 7, {tl:3,tr:2,bl:1,br:2});
  // Glare streak
  g.fillStyle(0xffffff, 0.22);
  g.fillRoundedRect(-9, -41, 4, 2, 1);
  g.fillRoundedRect(2,  -41, 4, 2, 1);
  // Gold frames
  g.lineStyle(1.8, 0xccaa22, 1);
  g.strokeRoundedRect(-10, -41, 9, 7, {tl:2,tr:3,bl:2,br:1});
  g.strokeRoundedRect(1,  -41, 9, 7, {tl:3,tr:2,bl:1,br:2});
  g.lineBetween(-1, -37, 1, -37);    // nose bridge
  g.lineBetween(-14, -37, -10, -37); // left temple
  g.lineBetween(10,  -37, 14, -37);  // right temple

  // === STUBBLE / BEARD SHADOW ===
  g.fillStyle(0x4a3020, 0.45);
  for (let sx = -5; sx <= 5; sx += 2) g.fillRect(sx, -32, 1, 2);
  for (let sx = -4; sx <= 4; sx += 2) g.fillRect(sx, -30, 1, 1);
  // Mustache area
  g.fillStyle(0x3a2010, 0.5);
  g.fillRoundedRect(-5, -34, 10, 3, 1);

  // === MOUTH (mean mug) ===
  g.lineStyle(1.5, 0x6a3a1a, 1);
  g.lineBetween(-4, -29, 4, -29);   // flat tough expression

  if (depth !== undefined) g.setDepth(depth);
}



const TILE = 32;
const W = 960, H = 640;

// ========================
// STREET HOUSES & COLLIDERS
// ========================
const STREET_HOUSES = [
  { x:1,  y:1, w:4, h:5, name:'Casa Verde',   wall:0xcc8844, wallB:0xaa6622, roof:0x993322, roofB:0xcc5533 },
  { x:7,  y:0, w:5, h:6, name:'Blue House',   wall:0xccaa66, wallB:0xaa8844, roof:0x336699, roofB:0x4488cc },
  { x:14, y:1, w:4, h:5, name:'Peach Place',  wall:0xdd9966, wallB:0xbb7744, roof:0x336633, roofB:0x44aa44 },
  { x:20, y:1, w:5, h:5, name:'Beige Manor',  wall:0xccbbaa, wallB:0xaa9988, roof:0x993322, roofB:0xcc5533 },
  { x:27, y:2, w:3, h:4, name:'Yellow Brick', wall:0xeedd99, wallB:0xccbb66, roof:0x774422, roofB:0xaa6633 },
];
const HOUSE_COLLIDERS = STREET_HOUSES.map(h => ({
  left: h.x * TILE, top: h.y * TILE,
  right: (h.x + h.w) * TILE, bottom: (h.y + h.h) * TILE,
}));
const HOUSE_DOORS = STREET_HOUSES.map((h, i) => ({
  x: (h.x + Math.floor(h.w / 2)) * TILE + 16,
  y: (h.y + h.h) * TILE,
  houseIdx: i,
  name: h.name,
}));

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
    this.plantG = this.add.graphics().setDepth(2);
    this.plantG.x = 290;
    this.plantG.y = 430;
    this.plantG.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-44, -90, 88, 120),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.plantG.on('pointerdown', () => this.interactPlant());
    this.plantTween = null;
    this.drawPlantStage(0);

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

    // ---- Click to move ----
    this.moveTarget = null;
    this.clickMarker = this.add.graphics().setDepth(10);
    this.input.on('pointerdown', (ptr) => {
      // Ignore clicks on HTML overlay elements
      if (ptr.event.target !== this.sys.game.canvas) return;
      this.moveTarget = { x: ptr.x, y: ptr.y };
      this.clickMarker.clear();
      this.clickMarker.lineStyle(2, 0x4caf50, 0.8);
      this.clickMarker.strokeCircle(ptr.x, ptr.y, 8);
      this.clickMarker.lineStyle(1, 0x4caf50, 0.4);
      this.clickMarker.strokeCircle(ptr.x, ptr.y, 14);
    });

    // ---- Grow timer ----
    this.time.addEvent({ delay: 1000, loop: true, callback: this.tickGrow, callbackScope: this });

    // ---- Door label ----
    this.add.text(W - 80, H / 2 - 10, '[ EXIT ]', {
      fontSize: '11px', color: '#44cc44', fontFamily: 'Courier New',
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(3);

    // ---- Shop sign ----
    this.shopZone = this.add.text(60, 60, '🛒 SHOP', {
      fontSize: '14px', color: '#ffffff', fontFamily: 'Courier New',
      backgroundColor: '#cc5500', padding: { x: 6, y: 4 },
    }).setInteractive({ useHandCursor: true }).setDepth(3);
    this.shopZone.on('pointerdown', () => openShop());

    // ---- Planting zone label ----
    this.add.text(248, 410, 'Grow Zone', {
      fontSize: '9px', color: '#ffffff', fontFamily: 'Courier New',
      stroke: '#553300', strokeThickness: 2,
    }).setDepth(1);

    updateHUD();
  }

  drawRoom(g) {
    const cols = Math.ceil(W / TILE), rows = Math.ceil(H / TILE);
    // Warm wooden floor
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
      const c = (x + y) % 2 === 0 ? 0xcc7a2a : 0xb86820;
      drawTile(g, x, y, c, 0x9a5018);
    }
    // Cream/warm walls
    for (let x = 0; x < cols; x++) {
      drawTile(g, x, 0, 0xe8c888, 0xc4a455);
      drawTile(g, x, rows - 1, 0xe8c888, 0xc4a455);
    }
    for (let y = 0; y < rows; y++) {
      drawTile(g, 0, y, 0xe8c888, 0xc4a455);
      drawTile(g, cols - 1, y, 0xe8c888, 0xc4a455);
    }
    // Door on right wall (bright green)
    for (let y = 9; y <= 11; y++) drawTile(g, cols - 1, y, 0x44cc44, 0x88ff88);
    // Rich dark soil grow patch
    for (let x = 7; x <= 10; x++) for (let y = 10; y <= 13; y++) drawTile(g, x, y, 0x3a1a00, 0x6a3a10);
    // Colorful red rug
    for (let x = 2; x <= 5; x++) for (let y = 6; y <= 9; y++) {
      const c = (x + y) % 2 === 0 ? 0xcc2233 : 0xaa1122;
      drawTile(g, x, y, c, 0xee4455);
    }
  }

  drawPlayer(g) { drawDealer(g, 5); }

  updatePlantSprite() {
    this.drawPlantStage(G.plant ? this.growPercent() : 0);
  }

  drawPlantStage(pct) {
    const g = this.plantG;
    g.clear();

    // Ceramic pot
    g.fillStyle(0xaa6633, 1);
    g.fillPoints([{x:-19,y:30},{x:19,y:30},{x:15,y:8},{x:-15,y:8}], true);
    g.fillStyle(0xcc8844, 1);
    g.fillRect(-21, 5, 42, 6);
    g.fillStyle(0x8a4a22, 1);
    g.fillEllipse(0, 30, 40, 11);
    // Soil surface
    g.fillStyle(0x3a2000, 1);
    g.fillEllipse(0, 8, 30, 8);
    g.fillStyle(0x4a2a00, 1);
    g.fillEllipse(-5, 7, 9, 3);
    g.fillEllipse(6, 9, 6, 2);

    if (!G.plant && pct === 0) return;

    if (pct < 0.15) {
      // Seedling — two cotyledon leaves
      g.lineStyle(2, 0x2a7a00, 1);
      g.lineBetween(0, 6, 0, -12);
      g.fillStyle(0x3aaa00, 1);
      g.fillEllipse(-8, -9, 13, 5);
      g.fillEllipse(8,  -9, 13, 5);
      g.fillStyle(0x5acc00, 1);
      g.fillCircle(0, -12, 3);

    } else if (pct < 0.4) {
      // Young plant — first true fan leaves
      g.lineStyle(3, 0x2a7a00, 1);
      g.lineBetween(0, 6, 0, -32);
      drawFanLeaf(g, 0, -10, -90, 18, 3);
      drawFanLeaf(g, 0, -24, -90, 14, 3);
      g.fillStyle(0x3aaa00, 1);
      g.fillCircle(0, -32, 4);

    } else if (pct < 0.8) {
      // Mature veg — branching, 5-leaflet fans
      g.lineStyle(4, 0x2a7a00, 1);
      g.lineBetween(0, 6, 0, -55);
      g.lineStyle(2, 0x2a7a00, 0.9);
      g.lineBetween(0, -18, -14, -32);
      g.lineBetween(0, -18, 14, -32);
      drawFanLeaf(g, 0,   -6, -90, 26, 5);
      drawFanLeaf(g, 0,  -28, -90, 22, 5);
      drawFanLeaf(g, -14, -32, -135, 16, 3);
      drawFanLeaf(g,  14, -32,  -45, 16, 3);
      drawFanLeaf(g, 0,  -48, -90, 16, 3);
      g.fillStyle(0x3aaa00, 1);
      g.fillCircle(0, -55, 5);

    } else {
      // Flowering — full plant with colas + trichomes
      // Glow halo
      g.fillStyle(0x00ff44, 0.07);
      g.fillCircle(0, -38, 58);
      g.fillStyle(0x00ff44, 0.04);
      g.fillCircle(0, -38, 72);

      g.lineStyle(5, 0x2a7a00, 1);
      g.lineBetween(0, 6, 0, -65);
      g.lineStyle(3, 0x2a7a00, 0.9);
      g.lineBetween(0, -18, -16, -34);
      g.lineBetween(0, -18,  16, -34);
      g.lineBetween(-16, -34, -20, -50);
      g.lineBetween( 16, -34,  20, -50);

      // Full fan leaves (7-leaflet)
      drawFanLeaf(g, 0,    -6, -90, 30, 7);
      drawFanLeaf(g, 0,   -30, -90, 26, 7);
      drawFanLeaf(g, -16, -34, -140, 20, 5);
      drawFanLeaf(g,  16, -34,  -40, 20, 5);
      drawFanLeaf(g, -20, -50, -145, 15, 3);
      drawFanLeaf(g,  20, -50,  -35, 15, 3);
      drawFanLeaf(g, 0,   -56, -90, 18, 5);

      // Main cola
      g.fillStyle(0x3d8c00, 1);
      g.fillEllipse(0, -68, 14, 20);
      g.fillStyle(0x4aaa00, 1);
      g.fillEllipse(0, -74, 10, 12);
      g.fillStyle(0x5acc00, 1);
      g.fillCircle(0, -78, 6);
      // Side colas
      g.fillStyle(0x3d8c00, 1);
      g.fillEllipse(-20, -55, 10, 14);
      g.fillEllipse( 20, -55, 10, 14);
      // Orange pistils
      g.lineStyle(1.2, 0xff8800, 0.9);
      g.lineBetween(-2, -66, -5, -74);
      g.lineBetween(2,  -66,  5, -74);
      g.lineBetween(-1, -72, -4, -79);
      g.lineBetween(1,  -72,  4, -79);
      // Trichomes (white crystals)
      g.fillStyle(0xffffff, 0.75);
      [{x:-4,y:-66},{x:4,y:-66},{x:-6,y:-72},{x:6,y:-72},
       {x:0,y:-78},{x:-2,y:-60},{x:2,y:-60},{x:-8,y:-55},{x:8,y:-55}]
        .forEach(d => g.fillCircle(d.x, d.y, 1.6));
    }
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
    // Start pulsing glow tween when ready
    if (pct >= 1 && !this.plantTween) {
      this.plantTween = this.tweens.add({
        targets: this.plantG, alpha: { from: 1, to: 0.65 },
        yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut',
      });
    }
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
      this.drawPlantStage(0);
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
    if (this.plantTween) { this.plantTween.stop(); this.plantTween = null; this.plantG.alpha = 1; }
    this.drawPlantStage(0);
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
    let usingKeys = false;

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx -= speed; usingKeys = true; }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { dx += speed; usingKeys = true; }
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy -= speed; usingKeys = true; }
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy += speed; usingKeys = true; }

    // Click-to-move: keys override click target
    if (usingKeys) {
      this.moveTarget = null;
      this.clickMarker.clear();
    } else if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y);
      if (dist < 4) {
        this.moveTarget = null;
        this.clickMarker.clear();
      } else {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y);
        dx = Math.cos(angle) * speed;
        dy = Math.sin(angle) * speed;
      }
    }

    const nx = Phaser.Math.Clamp(this.player.x + dx, TILE, W - TILE);
    const ny = Phaser.Math.Clamp(this.player.y + dy, TILE, H - TILE);
    this.player.x = nx;
    this.player.y = ny;

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

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.interactPlant();
    if (Phaser.Input.Keyboard.JustDown(this.bKey)) openShop();
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
    this.player.x = 120;
    this.player.y = 305;

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

    // Click to move
    this.moveTarget = null;
    this.clickMarker = this.add.graphics().setDepth(10);
    this.input.on('pointerdown', (ptr) => {
      if (ptr.event.target !== this.sys.game.canvas) return;
      // Check if clicking near an NPC to talk
      const near = this.findNearbyNPCAt(ptr.x, ptr.y);
      if (near) {
        this.talkToNPC(near.npc);
        return;
      }
      this.moveTarget = { x: ptr.x, y: ptr.y };
      this.clickMarker.clear();
      this.clickMarker.lineStyle(2, 0x4caf50, 0.8);
      this.clickMarker.strokeCircle(ptr.x, ptr.y, 8);
      this.clickMarker.lineStyle(1, 0x4caf50, 0.4);
      this.clickMarker.strokeCircle(ptr.x, ptr.y, 14);
    });

    // NPC wander timer
    this.time.addEvent({ delay: 2000, loop: true, callback: this.wanderNPCs, callbackScope: this });

    // Door back home label
    this.add.text(6, 274, '[ HOME ]', {
      fontSize: '10px', color: '#ffffff', fontFamily: 'Courier New',
      stroke: '#226622', strokeThickness: 3,
    }).setDepth(3);

    // Interaction hint
    this.interactHint = this.add.text(0, 0, 'E: Talk', {
      fontSize: '11px', color: '#ffd700', fontFamily: 'Courier New',
      backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 4, y: 2 }
    }).setDepth(10).setVisible(false);

    updateHUD();
  }

  drawStreet(g) {
    const cols = Math.ceil(W / TILE), rows = Math.ceil(H / TILE);

    // === BRIGHT GRASS (rows 0-9) ===
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < 10; y++) {
        const c = (x + y) % 2 === 0 ? 0x55cc22 : 0x44aa1a;
        drawTile(g, x, y, c, 0x33991a);
      }
    }

    // === STONE PATH / SIDEWALK (rows 8-9) ===
    for (let x = 0; x < cols; x++) {
      for (let y = 8; y <= 9; y++) {
        const c = (x + y) % 2 === 0 ? 0x9a9080 : 0x8a8070;
        drawTile(g, x, y, c, 0xb0a898);
      }
    }

    // === CURB (row 10) ===
    for (let x = 0; x < cols; x++) {
      drawTile(g, x, 10, 0x7a7a6a, 0x9a9a88);
    }

    // === ROAD (rows 11-19) ===
    for (let x = 0; x < cols; x++) {
      for (let y = 11; y < rows; y++) {
        const c = (x + y) % 3 === 0 ? 0x5a5a50 : 0x4e4e44;
        drawTile(g, x, y, c, 0x6a6a5a);
      }
    }
    // Lane dashes
    for (let x = 1; x < cols; x += 4) {
      drawTile(g, x, 14, 0x7a7a68, 0x9a9a80);
    }

    // === HOUSES (tile walls + roofs) ===
    STREET_HOUSES.forEach((h, hi) => {
      // Roof row
      for (let x = h.x; x < h.x + h.w; x++) drawTile(g, x, h.y, h.roof, h.roofB);
      // Walls
      for (let x = h.x; x < h.x + h.w; x++)
        for (let y = h.y + 1; y < h.y + h.h; y++) drawTile(g, x, y, h.wall, h.wallB);
      // Windows (row below roof)
      for (let x = h.x; x < h.x + h.w; x++) drawTile(g, x, h.y + 1, 0xaaddff, 0x5599cc);
      // Door (center, bottom row)
      const doorTileX = Math.floor(h.x + h.w / 2);
      drawTile(g, doorTileX, h.y + h.h - 1, 0x5a3010, 0x8a5030);
      // Door knob
      g.fillStyle(0xffd700, 1);
      g.fillCircle((doorTileX + 0.7) * TILE + 6, (h.y + h.h - 0.35) * TILE, 3);
    });

    // === TREES (drawn over tiles) ===
    [
      [105,90],[225,55],[390,70],[555,95],[700,60],[860,80],
      [55,185],[310,190],[480,155],[755,185],[920,115],[160,195],[635,170],
    ].forEach(([tx, ty]) => {
      g.fillStyle(0x1a6608, 0.3);
      g.fillEllipse(tx, ty + 26, 48, 14);           // shadow
      g.fillStyle(0x7a4a1a, 1);
      g.fillRect(tx - 5, ty + 8, 10, 22);           // trunk
      g.fillStyle(0x338811, 1);
      g.fillCircle(tx, ty, 28);                     // base canopy
      g.fillStyle(0x44aa22, 1);
      g.fillCircle(tx - 8, ty - 4, 20);
      g.fillCircle(tx + 8, ty - 4, 20);
      g.fillStyle(0x55cc33, 1);
      g.fillCircle(tx, ty - 10, 16);               // top
      g.fillStyle(0x88ee55, 0.55);
      g.fillCircle(tx - 5, ty - 14, 7);            // highlight
    });

    // === FOUNTAIN PLAZA (right of path) ===
    // Plaza stone tiles
    for (let px = 23; px <= 28; px++)
      for (let py = 7; py <= 9; py++) {
        const c = (px + py) % 2 === 0 ? 0xbbbbaa : 0xaaa990;
        drawTile(g, px, py, c, 0xccccaa);
      }
    // Fountain
    const fx = 820, fy = 300;
    g.fillStyle(0xaaaaaa, 1); g.fillCircle(fx, fy, 44);   // stone outer
    g.fillStyle(0x999988, 1); g.fillCircle(fx, fy, 37);
    g.fillStyle(0x4499cc, 1); g.fillCircle(fx, fy, 29);   // water
    g.fillStyle(0x66bbee, 1); g.fillCircle(fx, fy, 20);
    g.fillStyle(0x99ddff, 0.9); g.fillCircle(fx, fy - 3, 10);
    g.fillStyle(0xbbeeFF, 0.7); g.fillCircle(fx, fy - 8, 6);
    g.fillStyle(0xddf5ff, 0.5); g.fillCircle(fx, fy - 12, 4);
    g.lineStyle(3, 0x888888, 1); g.strokeCircle(fx, fy, 44);

    // === HOME DOOR (bright green, left of path) ===
    drawTile(g, 0, 8, 0x44cc44, 0x88ff88);
    drawTile(g, 0, 9, 0x44cc44, 0x88ff88);
    drawTile(g, 1, 8, 0x33aa33, 0x55dd55);
    drawTile(g, 1, 9, 0x33aa33, 0x55dd55);
  }

  drawPlayer(g) { drawDealer(g, 5); }

  drawNPC(g, npc) { drawChar(g, NPC_STYLES[npc.colorIdx % NPC_STYLES.length], 4); }

  spawnNPCs() {
    this.npcSprites = NPCS.map((npc, i) => {
      const g = this.add.graphics();
      const data = {
        npc, g,
        x: 150 + i * 130,
        y: 295 + (i % 2) * 25,
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

  findNearbyNPCAt(px, py) {
    let closest = null, minDist = 40;
    this.npcSprites.forEach(d => {
      const dist = Phaser.Math.Distance.Between(px, py, d.x, d.y);
      if (dist < minDist) { closest = d; minDist = dist; }
    });
    return closest;
  }

  update() {
    const speed = 2.5;
    let dx = 0, dy = 0;
    let usingKeys = false;

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx -= speed; usingKeys = true; }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { dx += speed; usingKeys = true; }
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy -= speed; usingKeys = true; }
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy += speed; usingKeys = true; }

    if (usingKeys) {
      this.moveTarget = null;
      this.clickMarker.clear();
    } else if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y);
      if (dist < 4) {
        this.moveTarget = null;
        this.clickMarker.clear();
      } else {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y);
        dx = Math.cos(angle) * speed;
        dy = Math.sin(angle) * speed;
      }
    }

    let nx = Phaser.Math.Clamp(this.player.x + dx, 30, W - 30);
    let ny = Phaser.Math.Clamp(this.player.y + dy, 100, 500);

    // House collision — slide along walls
    const PR = 16;
    for (const col of HOUSE_COLLIDERS) {
      const inX = nx + PR > col.left && nx - PR < col.right;
      const inY = ny + PR > col.top  && ny - PR < col.bottom;
      if (inX && inY) {
        const oxInX = this.player.x + PR > col.left && this.player.x - PR < col.right;
        const oyInY = this.player.y + PR > col.top  && this.player.y - PR < col.bottom;
        if (!oxInX) nx = this.player.x;
        if (!oyInY) ny = this.player.y;
        if (oxInX && oyInY) { nx = this.player.x; ny = this.player.y; }
      }
    }

    this.player.x = nx;
    this.player.y = ny;

    if (dx < 0) this.player.scaleX = -1;
    else if (dx > 0) this.player.scaleX = 1;

    // House door proximity — enter with E or click
    let nearDoor = null, nearDoorDist = 50;
    for (const door of HOUSE_DOORS) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y);
      if (dist < nearDoorDist) { nearDoor = door; nearDoorDist = dist; }
    }
    if (nearDoor) {
      this.interactHint.setPosition(nearDoor.x - 20, nearDoor.y - 50).setVisible(true).setText('[E] Enter');
      if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
        G.lastHouseIdx = nearDoor.houseIdx;
        this.scene.start('IndoorScene'); return;
      }
      if (this.moveTarget && Math.abs(this.moveTarget.x - nearDoor.x) < 60 && Math.abs(this.moveTarget.y - nearDoor.y) < 60) {
        this.moveTarget = null; this.clickMarker.clear();
        G.lastHouseIdx = nearDoor.houseIdx;
        this.scene.start('IndoorScene'); return;
      }
    }

    // Door home — click on it or press H/E near it
    if (this.player.x < 90 && this.player.y > 290 && this.player.y < 380) {
      if (Phaser.Input.Keyboard.JustDown(this.hKey) || (!nearDoor && Phaser.Input.Keyboard.JustDown(this.eKey))) {
        this.scene.start('HomeScene'); return;
      }
      if (this.moveTarget && this.moveTarget.x < 90) {
        this.moveTarget = null; this.clickMarker.clear();
        this.scene.start('HomeScene'); return;
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.hKey)) { this.scene.start('HomeScene'); return; }
    if (Phaser.Input.Keyboard.JustDown(this.bKey)) openShop();

    // NPC proximity
    const near = this.findNearbyNPC();
    if (near) {
      if (!nearDoor) this.interactHint.setPosition(near.x - 20, near.y - 50).setVisible(true).setText('[E] Talk');
      if (Phaser.Input.Keyboard.JustDown(this.eKey) && !nearDoor) this.talkToNPC(near.npc);
    } else if (!nearDoor) {
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
// INDOOR SCENE
// ========================
class IndoorScene extends Phaser.Scene {
  constructor() { super('IndoorScene'); }

  create() {
    const h = STREET_HOUSES[G.lastHouseIdx] || STREET_HOUSES[0];

    const bg = this.add.graphics();
    this.drawRoom(bg, h);

    // Player starts near the bottom door
    this.player = this.add.graphics();
    this.player.x = W / 2;
    this.player.y = H - 100;
    drawDealer(this.player, 5);
    this.player.setDepth(5);

    // Indoor NPC
    const npcInfo = NPCS[G.lastHouseIdx % NPCS.length];
    const npcStyle = NPC_STYLES[G.lastHouseIdx % NPC_STYLES.length];
    this.npcX = W / 2 + 140;
    this.npcY = H / 2 + 20;
    const npcG = this.add.graphics();
    npcG.x = this.npcX; npcG.y = this.npcY;
    drawChar(npcG, npcStyle, 4);
    npcG.setDepth(4);

    this.add.text(this.npcX, this.npcY - 42, npcInfo.name, {
      fontSize: '10px', color: '#7fff7f', fontFamily: 'Courier New',
      backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(6);

    // House name
    this.add.text(W / 2, 18, h.name, {
      fontSize: '14px', color: '#ffeeaa', fontFamily: 'Courier New',
      backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 6, y: 3 },
    }).setOrigin(0.5).setDepth(10);

    // Interact / exit hint
    this.interactHint = this.add.text(0, 0, '[E]', {
      fontSize: '11px', color: '#ffff88', fontFamily: 'Courier New',
      backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(10).setVisible(false);

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      left:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      up:    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    };
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.npcInfo = npcInfo;

    // Click-to-move
    this.moveTarget = null;
    this.clickMarker = this.add.graphics();
    this.input.on('pointerdown', (ptr) => {
      this.moveTarget = { x: ptr.x, y: ptr.y };
      this.clickMarker.clear();
      this.clickMarker.lineStyle(2, 0x44cc44, 0.8);
      this.clickMarker.strokeCircle(ptr.x, ptr.y, 8);
    });
  }

  drawRoom(g, h) {
    // Floor — warm wood planks
    for (let tx = 0; tx < 30; tx++)
      for (let ty = 0; ty < 20; ty++)
        drawTile(g, tx, ty, (tx + ty) % 2 === 0 ? 0xcc7a2a : 0xb86820, 0x8a4a10);

    // Walls — use house colors
    for (let tx = 0; tx < 30; tx++) {
      for (let ty = 0; ty < 3; ty++) drawTile(g, tx, ty, h.wall, h.wallB);
      drawTile(g, tx, 18, h.wall, h.wallB);
      drawTile(g, tx, 19, h.wall, h.wallB);
    }
    for (let ty = 0; ty < 20; ty++) {
      drawTile(g, 0,  ty, h.wall, h.wallB);
      drawTile(g, 1,  ty, h.wall, h.wallB);
      drawTile(g, 28, ty, h.wall, h.wallB);
      drawTile(g, 29, ty, h.wall, h.wallB);
    }
    // Door gap in bottom wall (center)
    for (let tx = 13; tx <= 16; tx++) {
      drawTile(g, tx, 18, 0x44cc44, 0x88ff88);
      drawTile(g, tx, 19, 0x44cc44, 0x88ff88);
    }
    // Rug
    g.fillStyle(0x993322, 0.55);
    g.fillRoundedRect(160, 160, 480, 240, 12);
    g.fillStyle(0xcc4433, 0.35);
    g.fillRoundedRect(180, 180, 440, 200, 8);
    // Table
    g.fillStyle(0x8b5a2b, 1);
    g.fillRoundedRect(W / 2 - 80, H / 2 - 30, 160, 60, 6);
    g.lineStyle(2, 0x5a3010, 1);
    g.strokeRoundedRect(W / 2 - 80, H / 2 - 30, 160, 60, 6);
    // Chairs
    g.fillStyle(0x6b3a1b, 1);
    g.fillRoundedRect(W / 2 - 112, H / 2 - 20, 28, 40, 4);
    g.fillRoundedRect(W / 2 + 84,  H / 2 - 20, 28, 40, 4);
    // Windows on top wall
    [W / 4, 3 * W / 4].forEach(wx => {
      g.fillStyle(0xaaddff, 1);
      g.fillRect(wx - 24, 36, 48, 40);
      g.lineStyle(2, 0x5599cc, 1);
      g.strokeRect(wx - 24, 36, 48, 40);
      g.lineStyle(1, 0x5599cc, 0.7);
      g.lineBetween(wx, 36, wx, 76);
      g.lineBetween(wx - 24, 56, wx + 24, 56);
    });
    // Decorative plant in corner
    g.fillStyle(0x3a1a00, 1); g.fillCircle(96, H - 140, 18);
    g.fillStyle(0x338811, 1); g.fillCircle(96, H - 175, 20);
    g.fillStyle(0x44aa22, 1); g.fillCircle(86, H - 170, 14); g.fillCircle(106, H - 170, 14);
    g.fillStyle(0x55cc33, 1); g.fillCircle(96, H - 185, 12);
  }

  update() {
    const speed = 2.5;
    let dx = 0, dy = 0;
    let usingKeys = false;

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx -= speed; usingKeys = true; }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { dx += speed; usingKeys = true; }
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy -= speed; usingKeys = true; }
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy += speed; usingKeys = true; }

    if (usingKeys) {
      this.moveTarget = null;
      this.clickMarker.clear();
    } else if (this.moveTarget) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y);
      if (dist < 4) { this.moveTarget = null; this.clickMarker.clear(); }
      else {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.moveTarget.x, this.moveTarget.y);
        dx = Math.cos(angle) * speed;
        dy = Math.sin(angle) * speed;
      }
    }

    this.player.x = Phaser.Math.Clamp(this.player.x + dx, 70, W - 70);
    this.player.y = Phaser.Math.Clamp(this.player.y + dy, 100, H - 50);

    if (dx < 0) this.player.scaleX = -1;
    else if (dx > 0) this.player.scaleX = 1;

    // Exit through door at bottom center
    const atDoor = this.player.y > H - 82 && this.player.x > W / 2 - 80 && this.player.x < W / 2 + 80;
    if (atDoor) {
      this.interactHint.setPosition(W / 2, H - 95).setVisible(true).setText('[E] Exit');
      if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
        this.scene.start('StreetScene'); return;
      }
      if (this.moveTarget && this.moveTarget.y > H - 100) {
        this.moveTarget = null; this.clickMarker.clear();
        this.scene.start('StreetScene'); return;
      }
    } else {
      // NPC proximity
      const distNPC = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npcX, this.npcY);
      if (distNPC < 70) {
        this.interactHint.setPosition(this.npcX, this.npcY - 52).setVisible(true).setText('[E] Talk');
        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
          showDialog(this.npcInfo.name,
            this.npcInfo.dialog[Math.floor(Math.random() * this.npcInfo.dialog.length)],
            [{ text: 'Peace out', action: closeDialog }]
          );
        }
      } else {
        this.interactHint.setVisible(false);
      }
    }
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
  scene: [HomeScene, StreetScene, IndoorScene],
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
