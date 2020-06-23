import sqlFormatter from 'sql-formatter';

/**
 * normalize generated create table ddl for comparisons
 *
 * TODO: name this function specific to its use case
 * e.g., "normalizeForSchemaComparison" or something similar
 */
export const normalizeCreateTableDdl = ({ ddl }: { ddl: string }) => {
  // prettify that ddl, to make standard spacing and appearance of ddl
  const prettyDdl = sqlFormatter.format(ddl);

  // swap back to better aliases
  let aliasedSql = prettyDdl;
  aliasedSql = aliasedSql.replace(/int DEFAULT nextval\([\'\w: \n]+\)/g, 'serial'); // e.g., `bigint DEFAULT nextval('test_tb_for_show_create_on_id_seq' :: regclass)` -> `bigserial`; although 'bigint default ...' is the canonical def, its just too verbose to be useful
  aliasedSql = aliasedSql.replace(/character varying/g, 'varchar'); // although `character varying` is the canonical term, `varchar` is used more regularly in practice -> more helpful
  aliasedSql = aliasedSql.replace(/ integer /g, ' int '); // postgres converts `int` to `integer`, but `bigint` is kept as `bigint`.... lets be consistent and just use the shorthand
  aliasedSql = aliasedSql.replace(/ ?:: ?\w+( ?\[\])?/g, ''); // remove any ":: __TYPE__" casting that could exist in the DDL. this level of information has not been found as useful yet

  // reprettify the ddl
  const reprettyDdl = sqlFormatter.format(aliasedSql);

  // return the normalized ddl
  return reprettyDdl;
};
