'use client';

import { useEffect } from 'react';

const scriptLoads = globalThis.__resepScriptLoads || (globalThis.__resepScriptLoads = new Map());
const scripts = [
  '/src/legacy/recipes.js',
  '/src/legacy/chef-prompts.js',
  '/src/legacy/main.js',
  '/src/legacy/chatbot.js',
  '/src/app.js'
];

function loadClassicScript(src) {
  if (scriptLoads.has(src)) return scriptLoads.get(src);
  const alreadyLoaded = [...document.scripts].some(script => script.dataset.resepinSrc === src && script.dataset.loaded === 'true');
  if (alreadyLoaded) return Promise.resolve();
  const loading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.resepinSrc = src;
    script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
    script.onerror = () => { scriptLoads.delete(src); reject(new Error(`Gagal memuat ${src}`)); };
    document.body.appendChild(script);
  });
  scriptLoads.set(src, loading);
  return loading;
}

export default function ResepinShell({ markup }) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        for (const src of scripts) {
          if (cancelled) return;
          await loadClassicScript(src);
        }
        await import('/src/recipe-utils.mjs');
      } catch (error) {
        console.error('[Resepin] Gagal memulai aplikasi', error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <div id="next-app-shell" dangerouslySetInnerHTML={{ __html: markup }} />;
}
