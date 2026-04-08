'use strict';

process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'sqlite';
process.env.DB_PATH = './data/test_database.db';
process.env.API_KEY = 'test-api-key';
process.env.PORT = '3001';

const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Clean up any stale DB files from previous runs before loading modules
['.db', '.db-shm', '.db-wal'].forEach(ext => {
  const p = path.resolve(`./data/test_database${ext}`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

// Initialize DB before loading app
const { initDatabase } = require('../../src/config/database');
const ProductModel = require('../../src/models/product.model');

let app;
let server;

beforeAll(async () => {
  await initDatabase();

  // Seed test products
  await ProductModel.create({
    name: 'Test Basic', description: 'Test product', price: 49,
    category: 'audio', tags: ['budget', 'wired'], features: ['basic'], images: [], stock: 10,
  });
  await ProductModel.create({
    name: 'Test Premium', description: 'Premium test', price: 199,
    category: 'audio', tags: ['premium', 'audiophile'], features: ['noise-canceling', 'wireless'], images: [], stock: 5,
  });

  // Import app WITHOUT starting the server (app.js only starts if require.main === module)
  app = require('../../src/app');
  // Supertest handles binding internally when passed an express app — no need to listen
});

afterAll(() => {
  // Clean up test database and WAL files
  ['.db', '.db-shm', '.db-wal'].forEach(ext => {
    const p = path.resolve(`./data/test_database${ext}`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
});

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('GET /api/products', () => {
  it('returns products list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/products?category=audio');
    expect(res.status).toBe(200);
    res.body.products.forEach(p => expect(p.category).toBe('audio'));
  });

  it('validates limit query param', async () => {
    const res = await request(app).get('/api/products?limit=9999');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/webhook/web', () => {
  let sessionId;

  it('starts a new conversation with "start"', async () => {
    const res = await request(app)
      .post('/api/webhook/web')
      .send({ userId: 'test-user-1', message: 'start', language: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.response).toBeDefined();
    expect(res.body.isComplete).toBe(false);

    sessionId = res.body.sessionId;
  });

  it('continues conversation with a numeric answer', async () => {
    const res = await request(app)
      .post('/api/webhook/web')
      .send({ userId: 'test-user-1', message: '1', sessionId, language: 'en' });

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe(sessionId);
    expect(res.body.isComplete).toBe(false);
  });

  it('returns 400 for missing userId', async () => {
    const res = await request(app)
      .post('/api/webhook/web')
      .send({ message: 'hello' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation error');
  });

  it('returns 400 for missing message', async () => {
    const res = await request(app)
      .post('/api/webhook/web')
      .send({ userId: 'test-user-1' });

    expect(res.status).toBe(400);
  });

  it('completes a full conversation flow and returns offers', async () => {
    const userId = 'test-complete-user';
    let sid;

    // Send "start"
    let res = await request(app).post('/api/webhook/web').send({ userId, message: 'start', language: 'en' });
    sid = res.body.sessionId;

    // Answer all questions (category + up to 3 branch + budget + urgency + specific = up to 7)
    for (let i = 0; i < 10; i++) {
      res = await request(app).post('/api/webhook/web').send({ userId, message: '1', sessionId: sid, language: 'en' });
      sid = res.body.sessionId;
      if (res.body.isComplete) break;
    }

    expect(res.body.isComplete).toBe(true);
    expect(res.body.offers).toBeDefined();
    expect(res.body.offers.basic).toBeDefined();
    expect(res.body.offers.intermediate).toBeDefined();
    expect(res.body.offers.premium).toBeDefined();
  });
});

describe('GET /api/session/:id', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app).get('/api/session/some-uuid-here');
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid UUID format', async () => {
    const res = await request(app)
      .get('/api/session/not-a-uuid')
      .set('x-api-key', 'test-api-key');
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent session', async () => {
    const res = await request(app)
      .get('/api/session/00000000-0000-0000-0000-000000000000')
      .set('x-api-key', 'test-api-key');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/session/reset/:id', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app).post('/api/session/reset/some-id');
    expect(res.status).toBe(401);
  });
});
