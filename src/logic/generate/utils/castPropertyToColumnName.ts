import { Property } from '../../../domain';

/*
  note: "column name" refers to the name of the column on either the static or the version table - not the mapping table (since mapping tables are always fk's and fk's have standard notation)
*/
export const castPropertyToColumnName = ({ name, definition }: { name: string; definition: Property }) => {
  // if its an array, then we really only store the "hash" on the column - and name it that way. (the actual values are stored in a mapping table)
  if (definition.array) return `${name}_hash`; // e.g., 'tag_ids' => 'tag_ids_hash'

  // if its not an array, then we store exactly what the user asked for
  return name;
};
