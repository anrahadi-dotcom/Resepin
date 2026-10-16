import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/chef.js';

test('AI system prompt preserves the exact requested number of recipe options', async () => {
  let capturedMessages;
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
});
