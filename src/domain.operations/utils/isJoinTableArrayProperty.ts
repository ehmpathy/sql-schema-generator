import type { Property } from '@src/domain.objects';

import { isNativeArrayProperty } from './isNativeArrayProperty';

/**
 * .what = decides whether an array property is stored via a join table (a child
 *         map-table plus a hash column) rather than a native postgres array column
 *
 * .why = arrays split into two storage models by element kind:
 *   - reference/uuid element => join table, for element-level references
 *   - primitive/enum element => native array column on the base/version table
 *   this is the inverse of isNativeArrayProperty, scoped to array properties. it names
 *   the "join-table array" concept once, so the seven generate-seams that route on it
 *   share a single classifier and cannot drift on the negation.
 *
 * .note = a non-array property is never a join-table array (returns false).
 */
export const isJoinTableArrayProperty = ({
  property,
}: {
  property: Property;
}): boolean => !!property.array && !isNativeArrayProperty({ property });
