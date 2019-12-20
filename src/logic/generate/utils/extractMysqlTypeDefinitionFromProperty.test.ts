import { DataType, DataTypeName, Property } from '../../../types';
import { extractMysqlTypeDefinitionFromProperty } from './extractMysqlTypeDefinitionFromProperty';

describe('extractMysqlTypeDefinitionFromProperty', () => {
  it('should be able to accurately define varchar with precision', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.VARCHAR,
        precision: 255,
      }),
    });
    const definition = extractMysqlTypeDefinitionFromProperty({ property });
    expect(definition).toEqual(`${DataTypeName.VARCHAR}(255)`);
  });
  it('should be able to accurately define varchar with precision and scale', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.DECIMAL,
        precision: 5,
        scale: 2,
      }),
    });
    const definition = extractMysqlTypeDefinitionFromProperty({ property });
    expect(definition).toEqual(`${DataTypeName.DECIMAL}(5,2)`);
  });
  it('should be able to accurately define enum', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.ENUM,
        values: ['option_one', 'option_two'],
      }),
    });
    const definition = extractMysqlTypeDefinitionFromProperty({ property });
    expect(definition).toEqual(`${DataTypeName.ENUM}('option_one','option_two')`);
  });
  it('should be able to accurately define text without precision', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.TEXT,
      }),
    });
    const definition = extractMysqlTypeDefinitionFromProperty({ property });
    expect(definition).toEqual(`${DataTypeName.TEXT}`);
  });
});
