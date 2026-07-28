import { Entity, Literal } from '@src/domain.objects';
import { prop } from '@src/domain.operations/define';

import { castPropertyToSelector } from './castPropertyToSelector';

describe('castPropertyToSelector', () => {
  const user = new Literal({
    name: 'user',
    properties: { name: prop.VARCHAR(255) },
  });
  const sensor = new Entity({
    name: 'sensor',
    properties: {
      serial_number: prop.VARCHAR(), // scalar static
      labels: prop.ARRAY_OF(prop.VARCHAR()), // native array, static
      tags: { ...prop.ARRAY_OF(prop.VARCHAR()), updatable: true }, // native array, version
      readings: { ...prop.ARRAY_OF(prop.NUMERIC()), updatable: true }, // native array, version
      note: { ...prop.VARCHAR(), updatable: true }, // scalar version
      owner_ids: prop.ARRAY_OF(prop.REFERENCES(user)), // join-table array
    },
    unique: ['serial_number'],
  });

  it('should select a native array (static) via a coalesce to an empty array', () => {
    const selector = castPropertyToSelector({
      entityName: 'sensor',
      name: 'labels',
      definition: sensor.properties.labels!,
    });
    // coalesce a null to array[] so the DAO sees one shape ([], never null)
    expect(selector).toEqual(
      'coalesce(s.labels, array[]::varchar[]) as labels',
    );
  });

  it('should select a native array (updatable) from the version table, coalesced', () => {
    const selector = castPropertyToSelector({
      entityName: 'sensor',
      name: 'tags',
      definition: sensor.properties.tags!,
    });
    expect(selector).toEqual('coalesce(v.tags, array[]::varchar[]) as tags');
  });

  it('should honor the element type of a numeric native array', () => {
    const selector = castPropertyToSelector({
      entityName: 'sensor',
      name: 'readings',
      definition: sensor.properties.readings!,
    });
    expect(selector).toEqual(
      'coalesce(v.readings, array[]::numeric[]) as readings',
    );
  });

  it('should collapse a join-table (reference) array via array_agg', () => {
    const selector = castPropertyToSelector({
      entityName: 'sensor',
      name: 'owner_ids',
      definition: sensor.properties.owner_ids!,
    });
    // a reference array keeps its join-table array_agg collapse (unchanged)
    expect(selector).toContain('array_agg');
    expect(selector).not.toContain('coalesce(s.owner_ids');
    expect(selector).toMatchSnapshot();
  });

  it('should select a scalar static property straight through', () => {
    const selector = castPropertyToSelector({
      entityName: 'sensor',
      name: 'serial_number',
      definition: sensor.properties.serial_number!,
    });
    expect(selector).toEqual('s.serial_number');
  });

  it('should select a scalar updatable property from the version table', () => {
    const selector = castPropertyToSelector({
      entityName: 'sensor',
      name: 'note',
      definition: sensor.properties.note!,
    });
    expect(selector).toEqual('v.note');
  });
});
