import { DatabaseConnection } from './types';

/**
 * fortunately for us, postgres does not come with built in `SHOW CREATE TABLE/VIEW/FUNCTION`
 *
 * we have to provide a way to do so manually. on the bright side, postgres does provide an extensive catalog system that we can leverage
 *
 * based on https://stackoverflow.com/questions/2593803/how-to-generate-the-create-table-sql-statement-for-an-existing-table-in-postgr
 */
export const provisionShowCreateTableFunction = async ({ dbConnection }: { dbConnection: DatabaseConnection }) => {
  const sql = `
CREATE OR REPLACE FUNCTION public.show_create_table(p_schema_name character varying, p_table_name character varying)
  RETURNS SETOF text AS
$BODY$
DECLARE
    v_table_ddl   text;
    column_record record;
    table_rec record;
    constraint_rec record;
    firstrec boolean;
BEGIN
    FOR table_rec IN
        SELECT c.relname, c.oid FROM pg_catalog.pg_class c
            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                WHERE relkind = 'r'
                AND n.nspname = p_schema_name
                AND relname~ ('^('||p_table_name||')$')
          ORDER BY c.relname
    LOOP
        FOR column_record IN
            SELECT
                b.nspname as schema_name,
                b.relname as table_name,
                a.attname as column_name,
                pg_catalog.format_type(a.atttypid, a.atttypmod) as column_type,
                CASE WHEN
                    (SELECT substring(pg_catalog.pg_get_expr(d.adbin, d.adrelid) for 128)
                     FROM pg_catalog.pg_attrdef d
                     WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum AND a.atthasdef) IS NOT NULL THEN
                    'DEFAULT '|| (SELECT substring(pg_catalog.pg_get_expr(d.adbin, d.adrelid) for 128)
                                  FROM pg_catalog.pg_attrdef d
                                  WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum AND a.atthasdef)
                ELSE
                    ''
                END as column_default_value,
                CASE WHEN a.attnotnull = true THEN
                    'NOT NULL'
                ELSE
                    'NULL'
                END as column_not_null,
                a.attnum as attnum,
                e.max_attnum as max_attnum
            FROM
                pg_catalog.pg_attribute a
                INNER JOIN
                 (SELECT c.oid,
                    n.nspname,
                    c.relname
                  FROM pg_catalog.pg_class c
                       LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                  WHERE c.oid = table_rec.oid
                  ORDER BY 2, 3) b
                ON a.attrelid = b.oid
                INNER JOIN
                 (SELECT
                      a.attrelid,
                      max(a.attnum) as max_attnum
                  FROM pg_catalog.pg_attribute a
                  WHERE a.attnum > 0
                    AND NOT a.attisdropped
                  GROUP BY a.attrelid) e
                ON a.attrelid=e.attrelid
            WHERE a.attnum > 0
              AND NOT a.attisdropped
            ORDER BY a.attnum
        LOOP
            IF column_record.attnum = 1 THEN
                v_table_ddl:='CREATE TABLE '||column_record.schema_name||'.'||column_record.table_name||' (';
            ELSE
                v_table_ddl:=v_table_ddl||',';
            END IF;

            IF column_record.attnum <= column_record.max_attnum THEN
                v_table_ddl:=v_table_ddl||chr(10)||
                         '    '||column_record.column_name||' '||column_record.column_type||' '||column_record.column_default_value||' '||column_record.column_not_null;
            END IF;
        END LOOP;
        firstrec := TRUE;
        FOR constraint_rec IN
            SELECT conname, pg_get_constraintdef(c.oid) as constrainddef
                FROM pg_constraint c
                    WHERE conrelid=(
                        SELECT attrelid FROM pg_attribute
                        WHERE attrelid = (
                            SELECT oid FROM pg_class WHERE relname = table_rec.relname
                                AND relnamespace = (SELECT ns.oid FROM pg_namespace ns WHERE ns.nspname = p_schema_name)
                        ) AND attname='tableoid'
                    )
        LOOP
            v_table_ddl:=v_table_ddl||','||chr(10);
            v_table_ddl:=v_table_ddl||'CONSTRAINT '||constraint_rec.conname;
            v_table_ddl:=v_table_ddl||chr(10)||'    '||constraint_rec.constrainddef;
            firstrec := FALSE;
        END LOOP;
        v_table_ddl:=v_table_ddl||');';
        RETURN NEXT v_table_ddl;
    END LOOP;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
  `.trim();
  await dbConnection.query({ sql });
};
