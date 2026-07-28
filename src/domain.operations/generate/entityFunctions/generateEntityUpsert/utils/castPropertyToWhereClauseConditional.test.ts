import { Entity, Literal } from '@src/domain.objects';
import { prop } from '@src/domain.operations/define';

import { castPropertyToWhereClauseConditional } from './castPropertyToWhereClauseConditional';

describe('castPropertyToWhereClauseConditional', () => {
  const user = new Literal({
    name: 'user',
    properties: { name: prop.VARCHAR(255) },
  });
  const plan = new Entity({
    name: 'plan',
    properties: {
      creator_id: prop.REFERENCES(user),
      participant_ids: prop.ARRAY_OF(prop.REFERENCES(user)),
      tags: prop.ARRAY_OF(prop.VARCHAR()), // native array
      labels: { ...prop.ARRAY_OF(prop.VARCHAR()), nullable: true }, // nullable native array
    },
    unique: ['creator_id'],
  });
  it('should define the conditional accurately for a unit property', () => {
    const definition = castPropertyToWhereClauseConditional({
      name: 'creator_id',
      definition: plan.properties.creator_id!,
      tableAlias: 't',
    });
    expect(definition).toMatchSnapshot();
  });
  it('should define the conditional accurately for a array property', () => {
    const definition = castPropertyToWhereClauseConditional({
      name: 'participant_ids',
      definition: plan.properties.participant_ids!,
      tableAlias: 't',
    });
    expect(definition).toContain(
      "digest(array_to_string(in_participant_ids, ',', '__NULL__'), 'sha256')",
    ); // should convert input array to sha256 hash
    expect(definition).toMatchSnapshot();
  });
  it('should compare a native array column by value with a null-safe operator, not by hash', () => {
    const definition = castPropertyToWhereClauseConditional({
      name: 'tags',
      definition: plan.properties.tags!,
      tableAlias: 't',
    });
    // a native array compares the real column against the input value directly, null-safe
    // (IS NOT DISTINCT FROM handles a NULL whole-array or a NULL element; plain `=` yields NULL)
    expect(definition).toEqual('AND (t.tags IS NOT DISTINCT FROM in_tags)');
    // and never routes through the join-table sha256 hash path
    expect(definition).not.toContain('sha256');
    expect(definition).not.toContain('tags_hash');
    expect(definition).toMatchSnapshot();
  });
  it('should use the same null-safe operator for a nullable native array column', () => {
    const definition = castPropertyToWhereClauseConditional({
      name: 'labels',
      definition: plan.properties.labels!,
      tableAlias: 't',
    });
    // IS NOT DISTINCT FROM already covers the NULL whole-array case, so no extra OR branch
    expect(definition).toEqual('AND (t.labels IS NOT DISTINCT FROM in_labels)');
    expect(definition).not.toContain('sha256');
    expect(definition).toMatchSnapshot();
  });
});
