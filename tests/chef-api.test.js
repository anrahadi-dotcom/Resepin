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

test('AI prompt explicitly follows through when a user accepts a recipe offer', async () => {
  let capturedUserPrompt = '';
  let capturedSystemPrompt = '';
  const response = await onRequestPost({
    request: new Request('https://example.test/api/chef', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'gasss',
        history: [
          { role: 'user', content: 'Aku cuma ada mie instan.' },
          { role: 'assistant', content: 'Mau aku kasih resep mie instan yang lebih enak?' }
        ]
      })
    }),
    env: { AI: { run: async (_model, options) => {
      capturedUserPrompt = options.messages.filter(item => item.role === 'user').at(-1)?.content || '';
      capturedSystemPrompt = options.messages.find(item => item.role === 'system')?.content || '';
      return { response: 'Mi goreng sederhana dengan langkah memasak.' };
    } } }
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.match(capturedSystemPrompt, /jangan memuji atau mengulang daftar bahannya/);
  assert.match(capturedSystemPrompt, /tunaikan tawaran itu saat itu juga/);
  assert.match(capturedSystemPrompt, /Jangan pernah mengaku makanan sudah dimasak\/siap/);
  assert.match(capturedUserPrompt, /menanggapi tawaran resep\/langkahmu/i);
  assert.match(capturedUserPrompt, /takaran sederhana/i);
  assert.equal(data.answer, 'Mi goreng sederhana dengan langkah memasak.');
});

test('AI prompt turns offered-recipe ingredient replies into a usable recipe request', async () => {
  let capturedUserPrompt = '';
  const response = await onRequestPost({
    request: new Request('https://example.test/api/chef', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Gasin aku ada Indomie goreng, sosis, sama sayur hijau.',
        history: [{ role: 'assistant', content: 'Mau aku kasih resep mi instan yang lebih enak?' }]
      })
    }),
    env: { AI: { run: async (_model, options) => {
      capturedUserPrompt = options.messages.filter(item => item.role === 'user').at(-1)?.content || '';
      return { response: 'Mi goreng sosis sayur, berikut langkahnya.' };
    } } }
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.match(capturedUserPrompt, /tunaikan sekarang/i);
  assert.match(capturedUserPrompt, /bahan yang pengguna sebut/);
  assert.equal(data.answer, 'Mi goreng sosis sayur, berikut langkahnya.');
});

test('AI recipe grounding uses the actual inventory and checks title/step consistency', async () => {
  let capturedUserPrompt = '';
  const response = await onRequestPost({
    request: new Request('https://example.test/api/chef', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Aku cuma punya Indomie goreng, sosis, sama sayur hijau.',
        history: [{ role: 'assistant', content: 'Ceritakan bahan yang kamu punya di dapur.' }]
      })
    }),
    env: { AI: { run: async (_model, options) => {
      capturedUserPrompt = options.messages.filter(item => item.role === 'user').at(-1)?.content || '';
      return { response: 'Mi goreng sosis dan sayur, tanpa telur.' };
    } } }
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.match(capturedUserPrompt, /Indomie goreng, sosis, sama sayur hijau/);
  assert.match(capturedUserPrompt, /bedakan kata "tidak punya\/tidak ada" dari stok tersedia/);
  assert.match(capturedUserPrompt, /minyak hanya boleh masuk bagian opsional/);
  assert.match(capturedUserPrompt, /masak mi lebih dulu sesuai petunjuk kemasan/);
  assert.match(capturedUserPrompt, /sebutkan bumbu paket di bahan dan langkah/);
  assert.match(capturedUserPrompt, /jangan menamai teknik atau hidangan sebagai "goreng"/);
  assert.match(capturedUserPrompt, /waktu dan porsi/);
  assert.match(capturedUserPrompt, /judul, daftar bahan, dan setiap langkah cocok/);
  assert.match(capturedUserPrompt, /kalau judul menyebut telur rebus, langkah harus merebus telur/);
  assert.equal(data.answer, 'Mi goreng sosis dan sayur, tanpa telur.');
});

test('recipe grounding carries the earlier ingredient list through an accepted offer', async () => {
  let capturedUserPrompt = '';
  const response = await onRequestPost({
    request: new Request('https://example.test/api/chef', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'gasss',
        history: [
          { role: 'user', content: 'Aku cuma punya mi instan dan sosis.' },
          { role: 'assistant', content: 'Mau aku kasih resep mi instan yang lebih enak?' }
        ]
      })
    }),
    env: { AI: { run: async (_model, options) => {
      capturedUserPrompt = options.messages.filter(item => item.role === 'user').at(-1)?.content || '';
      return { response: 'Mi goreng sosis.' };
    } } }
  });
  assert.equal(response.status, 200);
  assert.match(capturedUserPrompt, /mi instan dan sosis/);
  assert.match(capturedUserPrompt, /Bahan tersedia yang benar-benar disebut pengguna/);
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
    const searchResponse = await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', message: 'Bro aku mau resep lawar plek' })
      }),
      env: {}
    });
    const searched = await searchResponse.json();
    assert.equal(searched.references.length, 1);
    const response = await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Bro aku mau resep lawar plek', references: searched.references })
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
  const response = await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Aku makan body motor bercampur oli', references: [{
          title: 'Poison Control: Motor oil swallowed',
          url: 'https://www.poison.org/articles/my-child-just-took-a-swig-of-motor-oil-173',
          snippet: 'Do not induce vomiting after swallowing motor oil.'
        }] })
      }),
      env: {}
    });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.match(data.answer, /Waduh/);
  assert.match(data.answer, /jangan dimuntahkan|jangan paksa muntah/);
  assert.match(data.answer, /Hubungi tenaga kesehatan\/IGD|layanan darurat/);
  assert.doesNotMatch(data.answer, /maaf.*tidak bisa membantu/i);
  assert.equal(data.references.length, 1);
  assert.match(data.references[0].url, /poison\.org/);
});

test('a symptom follow-up remembers a previously reported oil ingestion', async () => {
  const response = await onRequestPost({
    request: new Request('https://example.test/api/chef', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Sekarang aku mual dan sakit, harus gimana?',
        history: [{ role: 'user', content: 'Aku tadi makan oli motor.' }]
      })
    }),
    env: {}
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.match(data.answer, /sudah menelan oli\/bahan bodi motor lalu sekarang merasa sakit/);
  assert.match(data.answer, /jangan tunggu chat ini/);
  assert.match(data.answer, /IGD/);
});

test('a request for web sources after an oil ingestion gets first-aid guidance, not a substitution response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(`
    <a class="result__a" href="https://www.poison.org/articles/my-child-just-took-a-swig-of-motor-oil-173">My child drank motor oil | Poison Control</a>
    <a class="result__snippet">If motor oil is swallowed, do not induce vomiting.</a>`, { status: 200 });
  try {
    const history = [{ role: 'user', content: 'Aku habis makan oli bro' }];
    const search = await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', message: 'Coba cari di sumber bro pertolongan pertamanya gimana ya', history })
      }), env: {}
    });
    const references = (await search.json()).references;
    const response = await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Coba cari di sumber bro pertolongan pertamanya gimana ya', history, references })
      }), env: {}
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.match(data.answer, /jangan paksa muntah/);
    assert.match(data.answer, /Hubungi tenaga kesehatan/);
    assert.doesNotMatch(data.answer, /pengganti|bahan masakan/i);
    assert.match(data.references[0].url, /poison\.org/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('web search carries recent user context for a symptom follow-up', async () => {
  const originalFetch = globalThis.fetch;
  let searchUrl = '';
  globalThis.fetch = async url => {
    searchUrl = String(url);
    return new Response('', { status: 503 });
  };
  try {
    await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search', message: 'Sekarang aku mual dan sakit, harus gimana?',
          history: [{ role: 'user', content: 'Aku tadi makan oli motor.' }]
        })
      }),
      env: {}
    });
    assert.match(decodeURIComponent(searchUrl), /motor oil swallowed do not induce vomiting/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('general-knowledge questions can use the model and search result context', async () => {
  let capturedSystem = '';
  let capturedUser = '';
  const response = await onRequestPost({
    request: new Request('https://example.test/api/chef', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Siapa presiden pertama Amerika Serikat?',
        references: [{ title: 'White House History', url: 'https://www.whitehouse.gov/about-the-white-house/presidents/george-washington/', snippet: 'George Washington was the first president of the United States.' }]
      })
    }),
    env: { AI: { run: async (_model, options) => {
      capturedSystem = options.messages.find(item => item.role === 'system')?.content || '';
      capturedUser = options.messages.filter(item => item.role === 'user').at(-1)?.content || '';
      return { response: 'George Washington adalah presiden pertama Amerika Serikat.' };
    } } }
  });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.match(capturedSystem, /pertanyaan pengetahuan umum/);
  assert.doesNotMatch(capturedSystem, /pertanyaan di luar makanan.*arahkan kembali/);
  assert.match(capturedSystem, /White House History/);
  assert.match(capturedUser, /Siapa presiden pertama/);
  assert.equal(data.references.length, 1);
  assert.match(data.answer, /George Washington/);
});

test('web search action accepts a general question and returns source cards before generation', async () => {
  const originalFetch = globalThis.fetch;
  let searchUrl = '';
  globalThis.fetch = async url => {
    searchUrl = String(url);
    return new Response(`
      <a class="result__a" href="https://history.example/washington">George Washington</a>
      <a class="result__snippet">The first president of the United States.</a>`, { status: 200 });
  };
  try {
    const response = await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', message: 'Siapa presiden pertama USA?' })
      }),
      env: {}
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.match(decodeURIComponent(searchUrl), /Siapa presiden pertama USA/);
    assert.equal(data.references[0].title, 'George Washington');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Gemini Flash-Lite stays a server-side fallback after both Workers AI models fail', async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = '';
  let capturedHeaders = {};
  let capturedBody = {};
  const workerModels = [];
  globalThis.fetch = async (url, options) => {
    capturedUrl = String(url);
    capturedHeaders = options.headers;
    capturedBody = JSON.parse(options.body);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Nah iya, kita bikin French fries dari kentang.' }] } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const response = await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': 'qa-gemini-fallback' },
        body: JSON.stringify({
          message: 'Bukan keripik kentang, maksudku French fries. Wortelnya tidak usah.',
          history: [
            { role: 'user', content: 'Aku punya wortel sama kentang.' },
            { role: 'assistant', content: 'Kamu bisa bikin keripik kentang.' }
          ]
        })
      }),
      env: {
        GEMINI_API_KEY: 'test-server-secret',
        AI: { run: async model => {
          workerModels.push(model);
          throw new Error('Workers AI unavailable');
        } }
      }
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(workerModels, ['@cf/qwen/qwen3-30b-a3b-fp8', '@cf/meta/llama-3.1-8b-instruct-fp8']);
    assert.equal(capturedUrl, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
    assert.equal(capturedHeaders['x-goog-api-key'], 'test-server-secret');
    assert.doesNotMatch(capturedUrl, /test-server-secret/);
    assert.match(capturedBody.systemInstruction.parts[0].text, /Koreksi terbaru pengguna mengalahkan tebakan/);
    assert.deepEqual(capturedBody.contents.map(item => item.role), ['user', 'model', 'user']);
    assert.match(capturedBody.contents.at(-1).parts[0].text, /French fries/);
    assert.equal(data.answer, 'Nah iya, kita bikin French fries dari kentang.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('pronoun follow-up web search is grounded in the latest assistant turn', async () => {
  const originalFetch = globalThis.fetch;
  let searchUrl = '';
  globalThis.fetch = async url => {
    searchUrl = String(url);
    return new Response('', { status: 503 });
  };
  try {
    await onRequestPost({
      request: new Request('https://example.test/api/chef', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search', message: 'Kapan dia menjabat, bro?',
          history: [
            { role: 'user', content: 'Siapa presiden pertama Amerika Serikat?' },
            { role: 'assistant', content: 'George Washington adalah presiden pertama AS.' },
            { role: 'user', content: 'George Bush itu presiden ke berapa?' },
            { role: 'assistant', content: 'George W. Bush adalah presiden ke-43 AS dan menjabat 2001–2009.' }
          ]
        })
      }),
      env: {}
    });
    const query = decodeURIComponent(searchUrl);
    assert.match(query, /George W\. Bush/);
    assert.match(query, /Kapan dia menjabat/);
    assert.doesNotMatch(query, /George Washington/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
