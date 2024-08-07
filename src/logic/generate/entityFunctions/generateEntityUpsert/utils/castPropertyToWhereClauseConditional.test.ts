import { Entity, Literal } from '../../../../../domain';
import { prop } from '../../../../define';
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
});
