import { Literal } from '@src/domain.objects';
import { prop } from '@src/domain.operations/define';

import { isNativeArrayProperty } from './isNativeArrayProperty';

describe('isNativeArrayProperty', () => {
  describe('native array elements', () => {
    it('should treat a VARCHAR array as native', () => {
      expect(
        isNativeArrayProperty({ property: prop.ARRAY_OF(prop.VARCHAR()) }),
      ).toEqual(true);
    });
    it('should treat a NUMERIC array as native', () => {
      expect(
        isNativeArrayProperty({ property: prop.ARRAY_OF(prop.NUMERIC()) }),
      ).toEqual(true);
    });
    it('should treat a BOOLEAN array as native', () => {
      expect(
        isNativeArrayProperty({ property: prop.ARRAY_OF(prop.BOOLEAN()) }),
      ).toEqual(true);
    });
    it('should treat a TIMESTAMPTZ array as native', () => {
      expect(
        isNativeArrayProperty({ property: prop.ARRAY_OF(prop.TIMESTAMPTZ()) }),
      ).toEqual(true);
    });
    it('should treat an ENUM array as native', () => {
      expect(
        isNativeArrayProperty({
          property: prop.ARRAY_OF(prop.ENUM(['ACTIVE', 'OFFLINE'])),
        }),
      ).toEqual(true);
    });
  });

  describe('join-table array elements', () => {
    const user = new Literal({
      name: 'user',
      properties: { name: prop.VARCHAR(255) },
    });
    it('should treat a REFERENCES array as NOT native (it stays a join table)', () => {
      expect(
        isNativeArrayProperty({
          property: prop.ARRAY_OF(prop.REFERENCES(user)),
        }),
      ).toEqual(false);
    });
    it('should treat a UUID array as NOT native (it stays a join table)', () => {
      // this also locks the order invariant: a uuid array IS an array, but the
      //   uuid check fires before the native fallthrough, so it is never mis-routed native
      expect(
        isNativeArrayProperty({ property: prop.ARRAY_OF(prop.UUID()) }),
      ).toEqual(false);
    });
  });

  describe('non-array properties', () => {
    it('should treat a scalar VARCHAR as NOT native', () => {
      expect(isNativeArrayProperty({ property: prop.VARCHAR() })).toEqual(
        false,
      );
    });
    it('should treat a scalar ENUM as NOT native', () => {
      expect(
        isNativeArrayProperty({ property: prop.ENUM(['ACTIVE', 'OFFLINE']) }),
      ).toEqual(false);
    });
  });
});
