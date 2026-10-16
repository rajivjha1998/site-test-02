// Lets plain Node scripts import the TypeScript schemas in packages/ui (written without file
// extensions, the way Astro and Vite expect). Node strips the types itself; this hook only adds
// the missing ".ts". Use:  node --import ./scripts/register-ts.mjs scripts/some-script.mjs
import { register } from 'node:module';

register('./ts-resolve-hook.mjs', import.meta.url);
