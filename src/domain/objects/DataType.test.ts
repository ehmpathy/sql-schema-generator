import { DataTypeName } from '../constants';
import { DataType } from './DataType';

describe('DataType', () => {
  it('should be instantiable', () => {
    const type = new DataType({
      name: DataTypeName.NUMERIC,
      precision: 5,
      scale: 2,
    });
    expect(type.name).toEqual(DataTypeName.NUMERIC);
  });
});
