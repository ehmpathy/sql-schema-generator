import type { Property } from '@src/domain.objects';
import { isNativeArrayProperty } from '@src/domain.operations/utils/isNativeArrayProperty';

/*
  note: "column name" refers to the name of the column on either the static or the version table - not the join table (since join tables are always fk's and fk's have standard notation)
*/
export const castPropertyToColumnName = ({
  name,
  definition,
}: {
  name: string;
  definition: Property;
}) => {
  // a native array is stored as a real array column, so it keeps its own name
  if (isNativeArrayProperty({ property: definition })) return name; // e.g., 'tags' => 'tags' (a text[] column)

  // a join-table array only stores the "hash" on the column - and is named that way (the actual values live in a join table)
  if (definition.array) return `${name}_hash`; // e.g., 'tag_ids' => 'tag_ids_hash'

  // if its not an array, then we store exactly what the user asked for
  return name;
};
