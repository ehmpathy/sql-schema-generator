import { Entity, prop, ValueObject } from '../../../contract/module';
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
          ...prop.TINYINT(),
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
  describe('getFromDelimiterSplitString util function', () => {
    it('should return the getFromDelimiterSplitString util function if has a static array property', () => {
      const lock = new ValueObject({
        name: 'lock',
        properties: {
          manufacturer: prop.VARCHAR(255),
          manufacturerId: prop.VARCHAR(255),
        },
      });
      const door = new ValueObject({
        name: 'door',
        properties: {
          color: prop.ENUM(['red', 'green', 'blue']),
          lock_ids: prop.ARRAY_OF(prop.REFERENCES(lock)), // e.g., can have one lock or two locks
        },
      });
      const functions = generateEntityFunctions({ entity: door });
      expect(functions.utils.length).toEqual(1);
      expect(functions.utils[0].name).toEqual('get_from_delimiter_split_string');
    });
    it('should return the getFromDelimiterSplitString util function if has a updatable array property', () => {
      const name = new ValueObject({ name: 'name', properties: { value: prop.VARCHAR(255) } });
      const buddy = new Entity({
        name: 'buddy',
        properties: {
          social_security_number: prop.CHAR(11),
          nick_name_ids: prop.ARRAY_OF(prop.REFERENCES(name)),
        },
        unique: ['social_security_number'],
      });
      const functions = generateEntityFunctions({ entity: buddy });
      expect(functions.utils.length).toEqual(1);
      expect(functions.utils[0].name).toEqual('get_from_delimiter_split_string');
    });
  });
});
