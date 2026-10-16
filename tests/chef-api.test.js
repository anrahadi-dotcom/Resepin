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
      body: JSON.stringify({ message: 'Kalau minyak goreng habis, bisa diganti bensin buat menumis?' })
    }),
    env: {
      AI: {
        run: async (_model, options) => {
          capturedUserPrompt = options.messages.find(message => message.role === 'user')?.content || '';
          return { response: 'Jangan pakai bensin untuk memasak.' };
        }
      }
    }
  });

  assert.equal(response.status, 200);
  assert.match(capturedUserPrompt, /ini pertanyaan keamanan makanan, bukan permintaan mencelakai/);
  assert.match(capturedUserPrompt, /Jangan membuka dengan/);
});
