// for acceptance tests: import from compiled dist (like a real user's node_modules)
// this fixture is DELIBERATELY invalid: it declares a native array of a serial pseudo-type,
// which sql-schema-generator rejects at declare time. it exercises the CLI's negative path.
import { Entity, prop } from '../../../dist/contract/module.js';

const broken = new Entity({
  name: 'broken',
  properties: {
    name: prop.VARCHAR(255),
    // serial pseudo-types have no valid postgres array form -> ARRAY_OF throws at declare time
    counters: prop.ARRAY_OF(prop.BIGSERIAL()),
  },
  unique: ['name'],
});

export const entities = [broken];
