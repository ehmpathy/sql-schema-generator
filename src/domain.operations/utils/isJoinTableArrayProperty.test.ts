import { Literal } from '@src/domain.objects';
import { prop } from '@src/domain.operations/define';

import { isJoinTableArrayProperty } from './isJoinTableArrayProperty';

describe('isJoinTableArrayProperty', () => {
  describe('join-table array elements', () => {
    const user = new Literal({
      name: 'user',
      properties: { name: prop.VARCHAR(255) },
    });
    it('should treat a REFERENCES array as a join-table array', () => {
      expect(
        isJoinTableArrayProperty({
          property: prop.ARRAY_OF(prop.REFERENCES(user)),
        }),
      ).toEqual(true);
    });
    it('should treat a UUID array as a join-table array', () => {
      expect(
        isJoinTableArrayProperty({ property: prop.ARRAY_OF(prop.UUID()) }),
      ).toEqual(true);
    });
  });

  describe('native array elements', () => {
    it('should treat a VARCHAR array as NOT a join-table array (it is native)', () => {
      expect(
        isJoinTableArrayProperty({ property: prop.ARRAY_OF(prop.VARCHAR()) }),
      ).toEqual(false);
    });
    it('should treat an ENUM array as NOT a join-table array (it is native)', () => {
      expect(
        isJoinTableArrayProperty({
          property: prop.ARRAY_OF(prop.ENUM(['ACTIVE', 'OFFLINE'])),
        }),
      ).toEqual(false);
    });
  });

  describe('non-array properties', () => {
    it('should treat a scalar VARCHAR as NOT a join-table array', () => {
      expect(isJoinTableArrayProperty({ property: prop.VARCHAR() })).toEqual(
        false,
      );
    });
  });
});
