import { Literal } from '../../../../../domain';
import { prop } from '../../../../define';
import { castPropertyToFunctionInputDefinition } from './castPropertyToFunctionInputDefinition';

describe('castPropertyToFunctionInputDefinition', () => {
  it('should define the definition accurately for a unit property', () => {
    const definition = castPropertyToFunctionInputDefinition({
      name: 'age',
      definition: prop.INT(),
    });
    expect(definition).toMatchSnapshot();
  });
  it('should define the definition accurately for an array property', () => {
    const tag = new Literal({
      name: 'tag',
      properties: { name: prop.VARCHAR(255) },
    });
    const definition = castPropertyToFunctionInputDefinition({
      name: 'tag_ids',
      definition: prop.ARRAY_OF(prop.REFERENCES(tag)),
    });
    expect(definition).toContain('bigint[]'); // it should be a string, since we're getting a comma separated value; e.g., '5,21,12,3'
    expect(definition).toMatchSnapshot();
  });
});
