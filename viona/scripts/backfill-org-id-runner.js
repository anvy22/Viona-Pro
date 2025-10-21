require('ts-node').register({
  compilerOptions: { module: 'CommonJS' }
});
require('./backfill-org-id.ts');
