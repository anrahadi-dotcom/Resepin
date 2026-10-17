import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/chef.js';

test('AI prompt preserves requested recipe count and ingredient constraints', async () => {
  let capturedMessages;
  let capturedOptions;
  const request = new Request('https://example.test/api/chef', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Kasih list 3 resep dari wortel dan tahu.' })
  });
  const response = await onRequestPost({
    request,
    env: {
      AI: {
        run: async (_model, options) => {
          capturedOptions = options;
          capturedMessages = options.messages;
          return { response: 'Berikut 3 ide resep berbeda.' };
        }
      }
    }
  });

  assert.equal(response.status, 200);
  const system = capturedMessages.find(message => message.role === 'system')?.content || '';
  assert.match(system, /tepat sebanyak jumlah itu/);
  assert.match(system, /jangan menjawab dengan satu resep saja/);
  assert.match(system, /jangan menolak/);
  assert.match(system, /jangan dimakan\/dicicipi/);
  const user = capturedMessages.find(message => message.role === 'user')?.content || '';
  assert.match(user, /tepat 3 resep berbeda/);
  assert.match(user, /sekurangnya dua bahan yang disebut pengguna/);
  assert.equal(capturedOptions.max_tokens, 1100);
});

test('food safety questions about dangerous substances are framed as help, not refusal', async () => {
  let capturedUserPrompt = '';
  const response = await onRequestPost({
    request: new Request('https://example.test/api/chef', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Kalau bensin, bro?',
        history: [
          { role: 'assistant', content: 'Untuk menumis, minyak goreng bisa dipakai secukupnya.' },
          { role: 'user', content: 'Kalau minyak gorengnya habis bagaimana?' }
        ]
      })
    }),
    env: {
      AI: {
        run: async (_model, options) => {
          capturedUserPrompt = options.messages.filter(message => message.role === 'user').at(-1)?.content || '';
          return { response: 'Jangan pakai bensin untuk memasak.' };
        }
      }
    }
  });

  assert.equal(response.status, 200);
  assert.match(capturedUserPrompt, /ini pertanyaan keamanan makanan, bukan permintaan mencelakai/);
  assert.match(capturedUserPrompt, /Jangan membuka dengan/);
});

test('lawar plek search results guide a distinct, safe recipe response and are returned as links', async () => {
  const originalFetch = globalThis.fetch;
  let capturedSystem = '';
  globalThis.fetch = async () => new Response(`
    <a class="result__a" href="https://food.example/lawar-plek">Lawar Plek Bali</a>
    <a class="result__snippet">Lawar plek menggunakan daging dan darah segar.</a>`, { status: 200 });
  try {
    const response = await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Bro aku mau resep lawar plek' })
      }),
      env: { AI: { run: async (_model, options) => {
        capturedSystem = options.messages.find(item => item.role === 'system')?.content || '';
        return { response: 'Ini adaptasi lawar plek matang, bukan lawar sayur.' };
      } } }
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.match(capturedSystem, /bukan lawar sayur/);
    assert.match(capturedSystem, /Jangan memberikan langkah untuk mencampur daging\/darah mentah/);
    assert.equal(data.references.length, 1);
    assert.equal(data.references[0].url, 'https://food.example/lawar-plek');
    assert.match(data.answer, /bukan lawar sayur/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('motor body and oil ingestion gets empathetic first aid even without the AI binding', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(`
    <a class="result__a" href="https://www.poison.org/articles/my-child-just-took-a-swig-of-motor-oil-173">Poison Control: Motor oil swallowed</a>
    <a class="result__snippet">Do not induce vomiting after swallowing motor oil.</a>`, { status: 200 });
  try {
    const response = await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Aku makan body motor bercampur oli' })
      }),
      env: {}
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.match(data.answer, /Waduh/);
    assert.match(data.answer, /jangan dimuntahkan/);
    assert.match(data.answer, /IGD atau layanan darurat/);
    assert.doesNotMatch(data.answer, /maaf.*tidak bisa membantu/i);
    assert.equal(data.references.length, 1);
    assert.match(data.references[0].url, /poison\.org/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
