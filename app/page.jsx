import { readFileSync } from 'node:fs';
import path from 'node:path';
import ResepinShell from './resepin-shell';

function getPageMarkup() {
  const source = readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const body = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
  return body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\/?\s*>/gi, '')
    .replace(/<\/script\s*>/gi, '')
    .replace(/<\/?(?:transition|Transition)\b[^>]*>/g, '')
    .replace(/\s+v-cloak(?:="[^"]*")?/g, '')
    .replace(/\s+v-[\w-]+(?:="[^"]*")?/g, '')
    .replace(/\s+:[\w-]+="[^"]*"/g, '')
    .replace(/\s+@([\w.]+)="([^"]*)"/g, (_match, eventName, expression) => {
      const [event, ...modifiers] = eventName.split('.');
      return ` data-app-event-${event}="${expression.replaceAll('&quot;', '&amp;quot;')}"${modifiers.includes('prevent') ? ' data-app-prevent="true"' : ''}${modifiers.includes('stop') ? ' data-app-stop="true"' : ''}${modifiers.includes('esc') ? ' data-app-key-esc="true"' : ''}`;
    })
    .replace(/\{\{[\s\S]*?\}\}/g, '');
}

export default function HomePage() {
  return <ResepinShell markup={getPageMarkup()} />;
}
