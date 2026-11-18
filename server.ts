import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { GarmentSize, Order, Product, ShippingAddress } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'veltron-store.json');
const SESSION_COOKIE_NAME = 'veltron_session';

const PRODUCTS: Product[] = [
  {
    id: 'vlt-trench-01',
    sku: 'VLT-AW26-01',
    name: 'Monolith Wool-Gabardine Trench',
    category: 'Outerwear',
    price: 780,
    fabricWeight: '440 GSM',
    composition: '100% Virgin Wool Gabardine · Cupro Lining',
    origin: 'Milled in Biella, Italy',
    colorName: 'Obsidian Black',
    fit: 'Structured Relaxed',
    description:
      'Double-breasted architectural storm trench cut from densely woven water-repellent virgin wool gabardine. Features storm welt pockets, horn buttons, and an internal storm tab.',
    care: ['Dry clean only', 'Steam lightly on reverse', 'Store on wide shoulder hanger'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: '/src/assets/images/veltron_trench_coat_1795022473885.jpg',
    availability: 'In Stock',
  },
  {
    id: 'vlt-hoodie-02',
    sku: 'VLT-AW26-02',
    name: 'Heavyweight 520gsm Box Hoodie',
    category: 'Knitwear',
    price: 245,
    fabricWeight: '520 GSM',
    composition: '100% Organic Loopback Cotton',
    origin: 'Knitted in Barcelos, Portugal',
    colorName: 'Ash Slate',
    fit: 'Boxy Dropped Shoulder',
    description:
      'Constructed from custom-knitted 520gsm dry-hand loopback French terry. Finished with double-lined structured hood, flatlock seams, and custom matte anodized metal aglets.',
    care: ['Machine wash cold gentle', 'Dry flat away from heat', 'Do not tumble dry'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: '/src/assets/images/veltron_heavy_hoodie_1795022474590.jpg',
    availability: 'In Stock',
  },
  {
    id: 'vlt-trouser-03',
    sku: 'VLT-AW26-03',
    name: 'Double-Pleat Architectural Trouser',
    category: 'Trousers',
    price: 360,
    fabricWeight: '340 GSM',
    composition: '96% Virgin Wool · 4% Elastane',
    origin: 'Tailored in Porto, Portugal',
    colorName: 'Deep Charcoal',
    fit: 'Wide Tapered Leg',
    description:
      'Deep double front pleats create clean vertical drape from waist to ankle. Tailored with an extended horn-button waistband tab and breathable half-lined knee panels.',
    care: ['Dry clean recommended', 'Press along front crease', 'Hang by cuff clamps'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: '/src/assets/images/veltron_pleated_trouser_1795022474128.jpg',
    availability: 'In Stock',
  },
  {
    id: 'vlt-knit-04',
    sku: 'VLT-AW26-04',
    name: 'Ribbed Undyed Merino Mock-Neck',
    category: 'Knitwear',
    price: 310,
    fabricWeight: '7-Gauge Knit',
    composition: '100% Extra-Fine Australian Merino Wool',
    origin: 'Linked in Modena, Italy',
    colorName: 'Raw Ecru',
    fit: 'Standard Tailored',
    description:
      'Full-cardigan rib knit sweater crafted from undyed extra-fine merino yarns for natural thermal regulation. Features linked raglan sleeves and a high-recovery ribbed collar.',
    care: ['Hand wash cold with wool detergent', 'Reshape and dry flat', 'Fold for storage'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: '/src/assets/images/veltron_merino_knit_1795022474713.jpg',
    availability: 'Limited Run',
  },
  {
    id: 'vlt-jacket-05',
    sku: 'VLT-AW26-05',
    name: 'Cropped Technical Field Jacket',
    category: 'Outerwear',
    price: 540,
    fabricWeight: '310 GSM',
    composition: '68% Recycled Nylon · 32% Organic Cotton Canvas',
    origin: 'Assembled in Osaka, Japan',
    colorName: 'Midnight Navy',
    fit: 'Cropped Utility',
    description:
      'Engineered cropped blouson in high-density Japanese nylon-cotton faille with PFC-free DWR finish. Outfitted with two gusseted chest pockets, two-way YKK Excella zip, and matte snaps.',
    care: ['Spot clean or cold delicate wash', 'Line dry', 'Re-proof finish annually'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image: '/src/assets/images/veltron_field_jacket_1795022475047.jpg',
    availability: 'In Stock',
  },
  {
    id: 'vlt-tote-06',
    sku: 'VLT-AW26-06',
    name: 'Structured Calfskin Studio Tote',
    category: 'Accessories',
    price: 620,
    fabricWeight: '2.2mm Full-Grain',
    composition: '100% Vegetable-Tanned Calfskin · Suede Lining',
    origin: 'Crafted in Ubrique, Spain',
    colorName: 'Matte Onyx',
    fit: 'One Size · 16" Laptop Ready',
    description:
      'Architectural day-to-studio carryall built with crisp hand-painted edges, brushed palladium turn-lock clasp, and an internal padded folio divider.',
    care: ['Condition with neutral balm twice yearly', 'Store in cotton dust bag', 'Avoid prolonged moisture'],
    sizes: ['OS'],
    image: '/src/assets/images/veltron_leather_tote_1795022476007.jpg',
    availability: 'Limited Run',
  },
];

interface StoredUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  preferredSize: GarmentSize;
  shippingAddress: ShippingAddress;
  wishlist: string[];
  orders: Order[];
  memberSince: string;
  passwordSalt: string;
  passwordHash: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  orderNumber?: string;
  message: string;
  createdAt: string;
}

interface StoreData {
  users: StoredUser[];
  sessions: Record<string, { userId: string; createdAt: string }>;
  supportTickets?: SupportTicket[];
}

function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash: derived };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    trackingStatus:
      order.trackingStatus ||
      (order.status === 'Shipped' ? 'Delivered' : 'Processing'),
    trackingNumber: order.trackingNumber || `VLT-TRK-${order.orderNumber.replace(/\D/g, '') || '1000'}`,
    estimatedDelivery:
      order.estimatedDelivery ||
      (order.trackingStatus === 'Delivered' || order.status === 'Shipped'
        ? 'Delivered'
        : 'Est. 3–5 business days'),
  };
}

function sanitizeUser(user: StoredUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    handle: user.handle,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    preferredSize: user.preferredSize,
    shippingAddress: user.shippingAddress,
    wishlist: user.wishlist,
    orders: user.orders.map(normalizeOrder),
    memberSince: user.memberSince,
  };
}

function createInitialStore(): StoreData {
  const demoCreds = hashPassword('veltron2026');
  const demoUser: StoredUser = {
    id: 'usr_demo_elena',
    name: 'Elena Vance',
    email: 'elena@veltron.studio',
    handle: 'elenavance',
    bio: 'Architectural silhouettes, heavy Italian gabardine, and monochrome layering.',
    avatarUrl: null,
    preferredSize: 'M',
    shippingAddress: {
      fullName: 'Elena Vance',
      line1: '42 Redchurch Street, Shoreditch',
      city: 'London',
      postalCode: 'E2 7DP',
      country: 'United Kingdom',
    },
    wishlist: ['vlt-trench-01', 'vlt-tote-06'],
    orders: [
      {
        id: 'ord_seed_1042',
        orderNumber: 'VLT-1042',
        createdAt: '2026-10-14T14:22:00.000Z',
        status: 'Shipped',
        trackingStatus: 'Delivered',
        trackingNumber: 'VLT-TRK-884120',
        estimatedDelivery: 'Delivered Oct 18, 2026',
        subtotal: 555,
        shippingFee: 0,
        total: 555,
        paymentMethod: {
          provider: 'card',
          label: 'Credit / Debit Card',
          summary: 'Card •••• 4242',
        },
        shippingAddress: {
          fullName: 'Elena Vance',
          line1: '42 Redchurch Street, Shoreditch',
          city: 'London',
          postalCode: 'E2 7DP',
          country: 'United Kingdom',
        },
        items: [
          {
            productId: 'vlt-hoodie-02',
            sku: 'VLT-AW26-02',
            name: 'Heavyweight 520gsm Box Hoodie',
            size: 'M',
            quantity: 1,
            unitPrice: 245,
            image: '/src/assets/images/veltron_heavy_hoodie_1795022474590.jpg',
          },
          {
            productId: 'vlt-knit-04',
            sku: 'VLT-AW26-04',
            name: 'Ribbed Undyed Merino Mock-Neck',
            size: 'M',
            quantity: 1,
            unitPrice: 310,
            image: '/src/assets/images/veltron_merino_knit_1795022474713.jpg',
          },
        ],
      },
    ],
    memberSince: '2025-09-12T09:00:00.000Z',
    passwordSalt: demoCreds.salt,
    passwordHash: demoCreds.hash,
  };
  return {
    users: [demoUser],
    sessions: {},
  };
}

function loadStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const initial = createInitialStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as StoreData;
    if (!Array.isArray(parsed.users) || typeof parsed.sessions !== 'object') {
      throw new Error('Malformed store');
    }
    return parsed;
  } catch {
    const initial = createInitialStore();
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

let store: StoreData = loadStore();

function saveStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME] || null;
}

function getAuthenticatedUser(req: Request): { user: StoredUser; token: string } | null {
  const token = extractToken(req);
  if (!token) return null;
  const session = store.sessions[token];
  if (!session) return null;
  const user = store.users.find((u) => u.id === session.userId);
  if (!user) return null;
  return { user, token };
}

function setSessionCookie(res: Response, token: string) {
  const isProdOrHttps = process.env.NODE_ENV === 'production' || Boolean(process.env.APP_URL?.startsWith('https://'));
  const attrs = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Max-Age=2592000',
    isProdOrHttps ? 'SameSite=None; Secure' : 'SameSite=Lax',
  ];
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearSessionCookie(res: Response) {
  const isProdOrHttps = process.env.NODE_ENV === 'production' || Boolean(process.env.APP_URL?.startsWith('https://'));
  const attrs = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
    isProdOrHttps ? 'SameSite=None; Secure' : 'SameSite=Lax',
  ];
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function isValidAvatarPayload(val: unknown): val is string | null {
  if (val === null || val === '') return true;
  if (typeof val !== 'string') return false;
  if (val.length > 1_500_000) return false;
  return /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(val);
}

const VALID_SIZES: GarmentSize[] = ['XS', 'S', 'M', 'L', 'XL', 'OS'];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '3mb' }));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', brand: 'REXOBEL' });
  });

  // Catalog
  app.get('/api/products', (_req, res) => {
    res.json({ products: PRODUCTS });
  });

  // Sign Up
  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, avatarUrl = null, preferredSize = 'M' } = req.body ?? {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password : '';

    if (cleanName.length < 2 || cleanName.length > 80) {
      res.status(400).json({ error: 'Please enter your full name (2 to 80 characters).' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (cleanPassword.length < 6 || cleanPassword.length > 128) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    if (!isValidAvatarPayload(avatarUrl)) {
      res.status(400).json({ error: 'Profile image must be a valid PNG, JPEG, or WebP under 1MB.' });
      return;
    }
    if (store.users.some((u) => u.email === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists. Try signing in.' });
      return;
    }

    const baseHandle = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 18) || 'member';
    const suffix = crypto.randomInt(10, 99);
    const handle = store.users.some((u) => u.handle === baseHandle) ? `${baseHandle}${suffix}` : baseHandle;

    const { salt, hash } = hashPassword(cleanPassword);
    const chosenSize: GarmentSize = VALID_SIZES.includes(preferredSize) ? preferredSize : 'M';

    const newUser: StoredUser = {
      id: `usr_${crypto.randomUUID().slice(0, 12)}`,
      name: cleanName,
      email: cleanEmail,
      handle,
      bio: '',
      avatarUrl: avatarUrl || null,
      preferredSize: chosenSize,
      shippingAddress: {
        fullName: cleanName,
        line1: '',
        city: '',
        postalCode: '',
        country: '',
      },
      wishlist: [],
      orders: [],
      memberSince: new Date().toISOString(),
      passwordSalt: salt,
      passwordHash: hash,
    };

    const token = crypto.randomBytes(32).toString('hex');
    store.users.push(newUser);
    store.sessions[token] = { userId: newUser.id, createdAt: new Date().toISOString() };
    saveStore();

    setSessionCookie(res, token);
    res.status(201).json({ user: sanitizeUser(newUser), token });
  });

  // Sign In
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password : '';

    if (!cleanEmail || !cleanPassword) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = store.users.find((u) => u.email === cleanEmail);
    if (!user || !verifyPassword(cleanPassword, user.passwordSalt, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    store.sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
    saveStore();

    setSessionCookie(res, token);
    res.json({ user: sanitizeUser(user), token });
  });

  // One-click Demo Member Sign In
  app.post('/api/auth/demo', (_req, res) => {
    let demoUser = store.users.find((u) => u.id === 'usr_demo_elena');
    if (!demoUser) {
      const seeded = createInitialStore();
      demoUser = seeded.users[0];
      store.users.push(demoUser);
    }
    const token = crypto.randomBytes(32).toString('hex');
    store.sessions[token] = { userId: demoUser.id, createdAt: new Date().toISOString() };
    saveStore();

    setSessionCookie(res, token);
    res.json({ user: sanitizeUser(demoUser), token });
  });

  // Sign Out
  app.post('/api/auth/logout', (req, res) => {
    const token = extractToken(req);
    if (token && store.sessions[token]) {
      delete store.sessions[token];
      saveStore();
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  // Current Member Profile
  app.get('/api/auth/me', (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      res.status(401).json({ error: 'Not signed in' });
      return;
    }
    res.json({ user: sanitizeUser(auth.user) });
  });

  // Update Profile & Profile Picture
  app.patch('/api/profile', (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      res.status(401).json({ error: 'Please sign in to update your profile.' });
      return;
    }

    const { name, handle, bio, avatarUrl, preferredSize, shippingAddress } = req.body ?? {};
    const user = auth.user;

    if (name !== undefined) {
      const cleanName = typeof name === 'string' ? name.trim() : '';
      if (cleanName.length < 2 || cleanName.length > 80) {
        res.status(400).json({ error: 'Name must be between 2 and 80 characters.' });
        return;
      }
      user.name = cleanName;
    }

    if (handle !== undefined) {
      const cleanHandle = typeof handle === 'string' ? handle.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '') : '';
      if (cleanHandle.length < 2 || cleanHandle.length > 30) {
        res.status(400).json({ error: 'Handle must be 2 to 30 alphanumeric characters.' });
        return;
      }
      if (store.users.some((u) => u.id !== user.id && u.handle === cleanHandle)) {
        res.status(409).json({ error: 'That handle is already taken.' });
        return;
      }
      user.handle = cleanHandle;
    }

    if (bio !== undefined) {
      user.bio = typeof bio === 'string' ? bio.trim().slice(0, 220) : '';
    }

    if (avatarUrl !== undefined) {
      if (!isValidAvatarPayload(avatarUrl)) {
        res.status(400).json({ error: 'Invalid profile picture format or size exceeds 1MB.' });
        return;
      }
      user.avatarUrl = avatarUrl || null;
    }

    if (preferredSize !== undefined && VALID_SIZES.includes(preferredSize)) {
      user.preferredSize = preferredSize;
    }

    if (shippingAddress !== undefined && typeof shippingAddress === 'object' && shippingAddress !== null) {
      user.shippingAddress = {
        fullName: String(shippingAddress.fullName ?? user.shippingAddress.fullName).slice(0, 80),
        line1: String(shippingAddress.line1 ?? user.shippingAddress.line1).slice(0, 120),
        city: String(shippingAddress.city ?? user.shippingAddress.city).slice(0, 60),
        postalCode: String(shippingAddress.postalCode ?? user.shippingAddress.postalCode).slice(0, 24),
        country: String(shippingAddress.country ?? user.shippingAddress.country).slice(0, 60),
      };
    }

    saveStore();
    res.json({ user: sanitizeUser(user) });
  });

  // Toggle Wishlist
  app.post('/api/wishlist/toggle', (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      res.status(401).json({ error: 'Sign in to save items to your wishlist.' });
      return;
    }
    const { productId } = req.body ?? {};
    if (typeof productId !== 'string' || !PRODUCTS.some((p) => p.id === productId)) {
      res.status(400).json({ error: 'Invalid product ID.' });
      return;
    }
    const idx = auth.user.wishlist.indexOf(productId);
    if (idx >= 0) {
      auth.user.wishlist.splice(idx, 1);
    } else {
      auth.user.wishlist.unshift(productId);
    }
    saveStore();
    res.json({ wishlist: auth.user.wishlist });
  });

  // Place Order (Strict Sign-In & Payment Provider Required)
  app.post('/api/orders', (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      res.status(401).json({ error: 'You must be signed in to check out.' });
      return;
    }

    const { items, shippingAddress, paymentMethod } = req.body ?? {};
    const validProviders = ['card', 'apple_pay', 'paypal', 'klarna'];

    if (
      !paymentMethod ||
      typeof paymentMethod !== 'object' ||
      !validProviders.includes(paymentMethod.provider) ||
      typeof paymentMethod.label !== 'string' ||
      !paymentMethod.label.trim() ||
      typeof paymentMethod.summary !== 'string' ||
      !paymentMethod.summary.trim()
    ) {
      res.status(400).json({ error: 'Please select and confirm a valid payment provider before checkout.' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your bag is empty.' });
      return;
    }
    if (
      !shippingAddress ||
      typeof shippingAddress.fullName !== 'string' ||
      !shippingAddress.fullName.trim() ||
      typeof shippingAddress.line1 !== 'string' ||
      !shippingAddress.line1.trim() ||
      typeof shippingAddress.city !== 'string' ||
      !shippingAddress.city.trim() ||
      typeof shippingAddress.postalCode !== 'string' ||
      !shippingAddress.postalCode.trim()
    ) {
      res.status(400).json({ error: 'Please complete all shipping address fields.' });
      return;
    }

    const verifiedItems: Order['items'] = [];
    let subtotal = 0;

    for (const rawItem of items) {
      const product = PRODUCTS.find((p) => p.id === rawItem?.productId);
      const quantity = Number(rawItem?.quantity);
      const size = rawItem?.size;
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20 || !product.sizes.includes(size)) {
        res.status(400).json({ error: 'Invalid item or quantity in bag.' });
        return;
      }
      subtotal += product.price * quantity;
      verifiedItems.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        size,
        quantity,
        unitPrice: product.price,
        image: product.image,
      });
    }

    const shippingFee = subtotal >= 350 ? 0 : 18;
    const total = subtotal + shippingFee;
    const orderNum = `VLT-${crypto.randomInt(1050, 9999)}`;

    const estDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const order: Order = {
      id: `ord_${crypto.randomUUID().slice(0, 10)}`,
      orderNumber: orderNum,
      createdAt: new Date().toISOString(),
      status: 'Preparing Dispatch',
      trackingStatus: 'Processing',
      trackingNumber: `VLT-TRK-${crypto.randomInt(100000, 999999)}`,
      estimatedDelivery: `Est. ${estDate}`,
      subtotal,
      shippingFee,
      total,
      paymentMethod: {
        provider: paymentMethod.provider,
        label: paymentMethod.label.trim().slice(0, 50),
        summary: paymentMethod.summary.trim().slice(0, 80),
      },
      shippingAddress: {
        fullName: shippingAddress.fullName.trim().slice(0, 80),
        line1: shippingAddress.line1.trim().slice(0, 120),
        city: shippingAddress.city.trim().slice(0, 60),
        postalCode: shippingAddress.postalCode.trim().slice(0, 24),
        country: String(shippingAddress.country || 'United Kingdom').trim().slice(0, 60),
      },
      items: verifiedItems,
    };

    auth.user.orders.unshift(order);
    auth.user.shippingAddress = order.shippingAddress;
    saveStore();

    res.status(201).json({
      order,
      user: sanitizeUser(auth.user),
    });
  });

  // Advance Simulated Order Tracking Status
  app.post('/api/orders/:orderId/advance-tracking', (req, res) => {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const order = auth.user.orders.find((o) => o.id === req.params.orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const current = normalizeOrder(order).trackingStatus;
    if (current === 'Processing') {
      order.trackingStatus = 'In Transit';
      order.status = 'Shipped';
    } else if (current === 'In Transit') {
      order.trackingStatus = 'Delivered';
      order.status = 'Shipped';
      order.estimatedDelivery = `Delivered ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    } else {
      order.trackingStatus = 'Delivered';
    }

    if (!order.trackingNumber) {
      order.trackingNumber = `VLT-TRK-${crypto.randomInt(100000, 999999)}`;
    }

    saveStore();
    res.json({
      order: normalizeOrder(order),
      user: sanitizeUser(auth.user),
    });
  });

  // Contact Support Enquiry
  app.post('/api/support', (req, res) => {
    const { name, email, orderNumber, message } = req.body ?? {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';

    if (cleanName.length < 2 || cleanName.length > 80) {
      res.status(400).json({ error: 'Please enter your name.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (cleanMessage.length < 5 || cleanMessage.length > 1500) {
      res.status(400).json({ error: 'Please enter a message (at least 5 characters).' });
      return;
    }

    const ticketNumber = `VLT-SUP-${crypto.randomInt(1000, 9999)}`;
    const ticket: SupportTicket = {
      id: `sup_${crypto.randomUUID().slice(0, 10)}`,
      ticketNumber,
      name: cleanName,
      email: cleanEmail,
      orderNumber: typeof orderNumber === 'string' && orderNumber.trim() ? orderNumber.trim().slice(0, 32) : undefined,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(store.supportTickets)) {
      store.supportTickets = [];
    }
    store.supportTickets.unshift(ticket);
    saveStore();

    res.status(201).json({ ticketNumber });
  });

  // Error handler for payload too large or malformed JSON
  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (err) {
      res.status(400).json({ error: err.message || 'Invalid request payload.' });
      return;
    }
    next();
  });

  // Serve Vite or built dist
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REXOBEL server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
