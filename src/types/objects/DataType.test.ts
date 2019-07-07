import { DataTypeName } from '../constants';
import { DataType } from './DataType';

describe('DataType', () => {
  it('should be instantiatable', () => {
    const type = new DataType({
      name: DataTypeName.ENUM,
      values: ['a', 'b', 'c'],
    });
    expect(type.name).toEqual(DataTypeName.ENUM);
  });
});
