import { DataType, DataTypeName, Property } from '../../../types';
import { extractDataTypeDefinitionFromProperty } from './extractDataTypeDefinitionFromProperty';

describe('extractDataTypeDefinitionFromProperty', () => {
  it('should be able to accurately define varchar with precision', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.VARCHAR,
        precision: 255,
      }),
    });
    const definition = extractDataTypeDefinitionFromProperty({ property });
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
    const definition = extractDataTypeDefinitionFromProperty({ property });
    expect(definition).toEqual(`${DataTypeName.DECIMAL}(5,2)`);
  });
  it('should be able to accurately define text without precision', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.TEXT,
      }),
    });
    const definition = extractDataTypeDefinitionFromProperty({ property });
    expect(definition).toEqual(`${DataTypeName.TEXT}`);
  });
  it('should be able to accurately create an array type', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.BIGINT,
      }),
      array: true,
    });
    const definition = extractDataTypeDefinitionFromProperty({ property });
    expect(definition).toEqual(`${DataTypeName.BIGINT}[]`);
  });
});
