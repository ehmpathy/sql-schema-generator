import { DataType, DataTypeName, Property } from '../../../../types';
import { generateColumn } from './generateColumn';

describe('generateColumn', () => {
  it('should define column name accurately', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.INT,
      }),
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(sql).toContain('`user_id`');
    expect(sql).toMatchSnapshot(); // to log an example, not to actualy test logic
  });
  it('should define type name accurately', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.INT,
      }),
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(sql).toContain('int');
  });
  it('should define precision accurately, when specified', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.INT,
        precision: 11,
      }),
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(sql).toContain('int(11)');
    expect(sql).toMatchSnapshot(); // to log an example, not to actualy test logic
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
  it('should be able to specify a comment', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.INT,
      }),
      comment: 'hey there',
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(sql).toContain("COMMENT 'hey there'");
    expect(sql).toMatchSnapshot(); // to log an example, not to actualy test logic
  });
  it('should be able to specify a default value', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.DATETIME,
        precision: 6,
      }),
      default: 'CURRENT_TIMESTAMP(6)',
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(sql).toContain('DEFAULT CURRENT_TIMESTAMP(6)');
    expect(sql).toMatchSnapshot(); // to log an example, not to actualy test logic
  });
  it('should be able to specify a default value while nullable', () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.ENUM,
        values: ['option_one', 'option_two'],
      }),
      nullable: true,
      default: 'CURRENT_TIMESTAMP(6)',
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    expect(sql).toContain('DEFAULT CURRENT_TIMESTAMP(6)');
    expect(sql).toMatchSnapshot(); // to log an example, not to actualy test logic
  });
  it('should be able to specify an enum column', () => {

  });
});
