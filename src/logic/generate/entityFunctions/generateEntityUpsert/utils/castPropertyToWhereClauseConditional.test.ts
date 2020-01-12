import { Entity, prop, ValueObject } from '../../../../../contract/module';
import { castPropertyToWhereClauseConditional } from './castPropertyToWhereClauseConditional';

describe('castPropertyToWhereClauseConditional', () => {
  const user = new ValueObject({ name: 'user', properties: { name: prop.VARCHAR(255) } });
  const plan = new Entity({
    name: 'plan',
    properties: { creator_id: prop.REFERENCES(user), participant_ids: prop.ARRAY_OF(prop.REFERENCES(user)) },
    unique: ['creator_id'],
  });
  it('should define the conditional accurately for a unit property', () => {
    const definition = castPropertyToWhereClauseConditional({
      name: 'creator_id',
      definition: plan.properties.creator_id,
    });
    expect(definition).toMatchSnapshot();
  });
  it('should define the conditional accurately for a array property', () => {
    const definition = castPropertyToWhereClauseConditional({
      name: 'participant_ids',
      definition: plan.properties.participant_ids,
    });
    expect(definition).toContain('SHA2('); // it should include a hashing function
    expect(definition).toMatchSnapshot();
  });
});