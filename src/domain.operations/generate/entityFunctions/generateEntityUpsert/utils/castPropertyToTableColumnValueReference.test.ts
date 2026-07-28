import { Literal } from '@src/domain.objects';
import { prop } from '@src/domain.operations/define';

import { castPropertyToTableColumnValueReference } from './castPropertyToTableColumnValueReference';

describe('castPropertyToTableColumnValueReference', () => {
  const user = new Literal({
    name: 'user',
    properties: { name: prop.VARCHAR(255) },
  });

  it('should reference a scalar property by its input variable directly', () => {
    const reference = castPropertyToTableColumnValueReference({
      name: 'name',
      definition: prop.VARCHAR(),
    });
    expect(reference).toEqual('in_name');
  });

  it('should reference a native array by its input variable directly (no hash)', () => {
    const reference = castPropertyToTableColumnValueReference({
      name: 'tags',
      definition: prop.ARRAY_OF(prop.VARCHAR()),
    });
    // the native array is written to its real array column, so its own value is used
    expect(reference).toEqual('in_tags');
    expect(reference).not.toContain('sha256');
  });

  it('should reduce a join-table array to a sha256 hash of its input value', () => {
    const reference = castPropertyToTableColumnValueReference({
      name: 'participant_ids',
      definition: prop.ARRAY_OF(prop.REFERENCES(user)),
    });
    // a join-table array is change-detected via a sha256 hash column
    expect(reference).toEqual(
      "digest(array_to_string(in_participant_ids, ',', '__NULL__'), 'sha256')",
    );
  });

  it('should reduce a uuid array (join-table) to a sha256 hash as well', () => {
    const reference = castPropertyToTableColumnValueReference({
      name: 'owner_uuids',
      definition: prop.ARRAY_OF(prop.UUID()),
    });
    expect(reference).toContain('sha256');
  });
});
