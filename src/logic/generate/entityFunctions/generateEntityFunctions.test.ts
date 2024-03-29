import { Entity } from '../../../domain';
import { prop } from '../../define';
import { generateEntityFunctions } from './generateEntityFunctions';

describe('generateEntityFunctions', () => {
  it('should return only the upsert statement for static entity', async () => {
    const address = new Entity({
      name: 'address',
      properties: {
        street: prop.VARCHAR(255),
        suite: {
          ...prop.VARCHAR(255),
          nullable: true,
        },
        city: prop.VARCHAR(255),
        country: prop.ENUM(['US', 'CA', 'MX']),
        weekday_found: {
          // non-unique but static property -> only track the first value
          ...prop.VARCHAR(15),
          nullable: true,
        },
      },
      unique: ['street', 'suite', 'city', 'country'],
    });
    const functions = generateEntityFunctions({ entity: address });
    expect(functions.upsert).toHaveProperty('sql');
    expect(functions.backfillCurrentVersionPointers).toEqual(null);
    expect(functions.utils.length).toEqual(0); // none, since no mapping table
  });
  it('should return upsert and backfillCurrentVersionPointers functions for versioned entity', async () => {
    const car = new Entity({
      name: 'car',
      properties: {
        vin: prop.VARCHAR(255),
        name: {
          ...prop.VARCHAR(255),
          updatable: true,
          nullable: true, // i.e., some people don't name their cars
        },
        wheels: {
          ...prop.SMALLINT(),
          updatable: true,
        },
      },
      unique: ['vin'],
    });
    const functions = generateEntityFunctions({ entity: car });
    expect(functions.upsert).toHaveProperty('sql');
    expect(functions.backfillCurrentVersionPointers).toHaveProperty('sql');
    expect(functions.utils.length).toEqual(0); // none, since no mapping table
  });
});
