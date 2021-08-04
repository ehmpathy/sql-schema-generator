import { DataType, DataTypeName, Property } from '../../../../domain';
import { extractDataTypeDefinitionFromProperty } from '../../utils/extractDataTypeDefinitionFromProperty';
import { generateColumn } from './generateColumn';

jest.mock('../../utils/extractDataTypeDefinitionFromProperty');
const extractDataTypeDefinitionFromPropertyMock = extractDataTypeDefinitionFromProperty as jest.Mock;
extractDataTypeDefinitionFromPropertyMock.mockReturnValue('__MOCKED_TYPE_DEFINITION__');

describe('generateColumn', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should define column name accurately', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.INT,
      }),
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(sql).toContain('user_id');
    expect(sql).toMatchSnapshot(); // to log an example, not to actualy test logic
  });
  it('should define data_type definition accurately', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.INT,
      }),
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(extractDataTypeDefinitionFromPropertyMock.mock.calls.length).toEqual(1);
    expect(extractDataTypeDefinitionFromPropertyMock.mock.calls[0][0]).toMatchObject({ property });
    expect(sql).toContain('__MOCKED_TYPE_DEFINITION__');
  });
  it('should specify NOT NULL by default', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.INT,
      }),
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(sql).toContain('NOT NULL');
    expect(sql).toMatchSnapshot(); // to log an example, not to actualy test logic
  });
  it('should specify NULL if nullable', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.INT,
      }),
      nullable: true,
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(sql).toContain('NULL');
    expect(sql).not.toContain('NOT NULL');
    expect(sql).toMatchSnapshot(); // to log an example, not to actualy test logic
  });
  it('should be able to specify a default value', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.TIMESTAMPTZ,
      }),
      default: 'now()',
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(sql).toContain('DEFAULT now()');
    expect(sql).toMatchSnapshot(); // to log an example, not to actualy test logic
  });
});
