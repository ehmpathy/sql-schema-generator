import { DataTypeName, type Property } from '@src/domain.objects';

/**
 * .what = decides whether an array property is stored as a native postgres array
 *         column (e.g. `text[]`, `numeric[]`, `<enum>[]`) rather than a join table
 *
 * .why = arrays split into two storage models by element kind:
 *   - primitive/enum element => native array column on the base/version table
 *   - reference/uuid element => join table, for element-level references
 *   the join table model exists because postgres cannot put a foreign-key constraint
 *   on an array element; primitive/enum lists have no such need, so they store inline.
 *
 * .note = the ref/uuid checks come FIRST so that reference and uuid arrays are never
 *         mis-routed to the native path (they keep their extant join table behavior).
 */
export const isNativeArrayProperty = ({
  property,
}: {
  property: Property;
}): boolean => {
  // only array properties can be native arrays
  if (!property.array) return false;

  // reference arrays are join tables (element-level foreign keys)
  if (property.references) return false;

  // uuid arrays are join tables (implicit cross-database references)
  if (property.type.name === DataTypeName.UUID) return false;

  // otherwise it is a primitive or enum element -> native array column
  return true;
};
