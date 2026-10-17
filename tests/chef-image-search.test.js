import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, buildWebSearchQuery, shouldContinueRecipeOffer } from '../functions/api/chef.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('TikTok and named-site searches keep the requested platform in the query', () => {
  assert.match(buildWebSearchQuery('Bro, cariin resep nasi goreng di TikTok dong'), /^site:tiktok\.com .*nasi goreng/i);
  assert.match(buildWebSearchQuery('tolong cari video tumis kangkung di YouTube'), /^site:youtube\.com .*tumis kangkung/i);
  assert.equal(buildWebSearchQuery('Aku tidak tahu lawar plek itu apa'), 'lawar plek Bali daging darah tradisional keamanan pangan');
});

test('a new TikTok lookup is not mistaken for accepting an earlier recipe offer', () => {
  const history = [
    { role: 'user', content: 'Aku bingung mau masak apa.' },
    { role: 'assistant', content: 'Mau aku kasih resep mi instan yang lebih enak?' }
  ];
  assert.equal(shouldContinueRecipeOffer('bisa cari resep di TikTok ga bro?', history), false);
  assert.equal(shouldContinueRecipeOffer('carikan resep nasi sisa di TikTok', [
    { role: 'assistant', content: 'Ceritakan bahan yang ada, nanti aku bisa kasih resep.' }
  ]), false);
  assert.equal(shouldContinueRecipeOffer('gas bro', history), true);
  assert.equal(shouldContinueRecipeOffer('aku ada Indomie dan sosis', history), true);
});

test('image requests use a vision model with the uploaded image while keeping provider credentials server-side', async () => {
  let modelUsed = '';
  let capturedOptions;
  const response = await onRequestPost({
    request: new Request('https://example.test/api/chef', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Bahan apa yang kelihatan di foto ini?',
        image: { mimeType: 'image/png', base64: 'iVBORw0KGgo=' }
      })
    }),
    env: { AI: { run: async (model, options) => {
      modelUsed = model;
      capturedOptions = options;
      return { response: 'Aku melihat kemungkinan sayuran hijau, tetapi fotonya kurang jelas.' };
    } } }
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(modelUsed, '@cf/meta/llama-4-scout-17b-16e-instruct');
  assert.equal(capturedOptions.image, 'data:image/png;base64,iVBORw0KGgo=');
  assert.match(capturedOptions.messages.find(item => item.role === 'user').content, /nyatakan jika objek\/bahan tidak jelas/);
  assert.match(data.answer, /sayuran hijau/);
  assert.doesNotMatch(JSON.stringify(data), /GEMINI_API_KEY|iVBORw0KGgo/);
});

test('image upload rejects unsupported media and broken base64 before model invocation', async () => {
  let modelCalls = 0;
  const request = image => new Request('https://example.test/api/chef', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Lihat ini', image })
  });
  for (const image of [
    { mimeType: 'image/gif', base64: 'R0lGODlh' },
    { mimeType: 'image/png', base64: 'not base64!' }
  ]) {
    const response = await onRequestPost({ request: request(image), env: { AI: { run: async () => { modelCalls++; return { response: 'no' }; } } } });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /JPG, PNG, atau WebP/);
  }
  assert.equal(modelCalls, 0);
});

test('Gemini image requests use inline image data and return no provider secret', async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl = '';
  let requestHeaders;
  let requestBody;
  globalThis.fetch = async (url, options) => {
    requestUrl = String(url);
    requestHeaders = options.headers;
    requestBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Di foto tampak nasi dan sayuran.' }] } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const response = await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Apa yang terlihat?', image: { mimeType: 'image/jpeg', base64: '/9j/2Q==' }
        })
      }),
      env: { GEMINI_API_KEY: 'test-only-secret-value' }
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.match(requestUrl, /models\/gemini-3\.5-flash-lite:generateContent/);
    assert.equal(requestHeaders['x-goog-api-key'], 'test-only-secret-value');
    const finalUserParts = requestBody.contents.at(-1).parts;
    assert.equal(finalUserParts.at(-1).inline_data.mime_type, 'image/jpeg');
    assert.equal(finalUserParts.at(-1).inline_data.data, '/9j/2Q==');
    assert.equal(data.answer, 'Di foto tampak nasi dan sayuran.');
    assert.doesNotMatch(JSON.stringify(data), /test-only-secret-value|\/9j\/2Q==/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('search-platform capability questions get a direct answer without consuming a model call', async () => {
  let modelCalls = 0;
  const response = await onRequestPost({
    request: new Request('https://example.test/api/chef', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Bisa cari di TikTok dan situs lain nggak, bro?' })
    }),
    env: { AI: { run: async () => { modelCalls++; return { response: 'unexpected' }; } } }
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.match(data.answer, /bisa cari halaman yang terindeks/i);
  assert.match(data.answer, /nggak bakal pura-pura sudah menonton/i);
  assert.equal(modelCalls, 0);
});

test('free chat memory expires after 24 hours and does not restore image bytes', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  const context = vm.createContext({ localStorage: storage });
  for (const file of ['src/legacy/recipes.js', 'src/legacy/chef-prompts.js', 'src/legacy/chatbot.js']) {
    vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context);
  }
  vm.runInContext(`
    globalThis.testWrite = writeChefChatMemory;
    globalThis.testRead = readChefChatMemory;
    globalThis.testHistory = getChefModelHistory;
  `, context);
  context.testWrite([
    { role: 'user', content: 'Apa ini?', imageAttached: true },
    { role: 'assistant', content: 'Mungkin kangkung.' }
  ]);
  assert.equal(context.testRead().length, 2);
  assert.match(context.testHistory()[0].content, /Foto dari pesan lama tidak disimpan/);
  assert.doesNotMatch(values.get('resepin-chef-chat-v1'), /base64|data:image/);
  const expired = JSON.parse(values.get('resepin-chef-chat-v1'));
  expired.updatedAt -= 24 * 60 * 60 * 1000 + 1;
  values.set('resepin-chef-chat-v1', JSON.stringify(expired));
  assert.equal(context.testRead().length, 0);
  assert.equal(values.has('resepin-chef-chat-v1'), false);
});

test('free chat memory clears automatically after one idle day while the page stays open', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  const timers = new Map();
  let nextTimerId = 0;
  let now = 1_800_000_000_000;
  class TestDate extends Date { static now() { return now; } }
  const restoredBubble = { removed: false, remove() { this.removed = true; } };
  const suggestions = { hidden: true };
  const document = {
    querySelectorAll: () => [restoredBubble],
    getElementById: id => id === 'miniChatSuggestions' ? suggestions : null,
    addEventListener() {}
  };
  const window = {
    addEventListener() {},
    setTimeout(callback, delay) { const id = ++nextTimerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  const context = vm.createContext({ localStorage: storage, document, window, Date: TestDate });
  for (const file of ['src/legacy/recipes.js', 'src/legacy/chef-prompts.js', 'src/legacy/chatbot.js']) {
    vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context);
  }
  vm.runInContext(`globalThis.testWrite = writeChefChatMemory;`, context);
  context.testWrite([{ role: 'user', content: 'Hai Chef' }]);

  const [timerId, { callback, delay }] = [...timers.entries()][0];
  assert.equal(delay, 24 * 60 * 60 * 1000 + 25);
  now += 24 * 60 * 60 * 1000;
  timers.delete(timerId); // A browser removes a timer once its callback fires.
  callback();

  assert.equal(values.has('resepin-chef-chat-v1'), false);
  assert.equal(restoredBubble.removed, true);
  assert.equal(suggestions.hidden, false);
  assert.equal(timers.size, 0);
});
