// Stub 'server-only' for standalone scripts (seed, migrations) that import schema.ts
// server-only throws when imported outside Next.js — this no-ops it
require('module')._cache[require.resolve('server-only')] = {
  id: 'server-only',
  filename: require.resolve('server-only'),
  loaded: true,
  exports: {},
}
