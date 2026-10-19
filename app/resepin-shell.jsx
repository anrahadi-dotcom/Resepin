'use client';

import { useEffect } from 'react';

const scripts = [
  '/src/legacy/recipes.js',
  '/src/legacy/chef-prompts.js',
  '/src/legacy/main.js',
  '/src/legacy/chatbot.js',
  '/src/app.js'
];

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Gagal memuat ${src}`));
    document.body.appendChild(script);
  });
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
