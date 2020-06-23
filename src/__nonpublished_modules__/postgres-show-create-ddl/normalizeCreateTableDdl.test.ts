import { normalizeCreateTableDdl } from './normalizeCreateTableDdl';

const exampleShowCreateDdl = `
CREATE TABLE public.test_tb_for_show_create_on (
  id bigint DEFAULT nextval('test_tb_for_show_create_on_id_seq'::regclass) NOT NULL,
  name character varying(150)  NULL,
  counter integer NULL,
  level character varying(50)  NULL,
CONSTRAINT test_tb_for_show_create_on_level_check
  CHECK (((level)::text = ANY ((ARRAY['info'::character varying, 'warn'::character varying, 'error'::character varying])::text[]))),
CONSTRAINT test_tb_for_show_create_on_pkey
  PRIMARY KEY (id));
`.trim();

describe('normalizeCreateTableDdl', () => {
  it('should be able to swap `character varying` with varchar, since its more standard', () => {
    const normalizedDdl = normalizeCreateTableDdl({ ddl: exampleShowCreateDdl });
    expect(normalizedDdl).not.toContain('character varying');
  });
  it('should be able find where serial column was replaced with lowlevel def, since its more helpful', () => {
    const normalizedDdl = normalizeCreateTableDdl({ ddl: exampleShowCreateDdl });
    expect(normalizedDdl).not.toContain("bigint DEFAULT nextval('test_tb_for_show_create_on_id_seq' :: regclass)");
    expect(normalizedDdl).toContain('bigserial');
  });
  it('should be able to fix the serial column def even if split across newlines', () => {
    const rawDdl = `
CREATE TABLE public.generate_table_column_test_table (
  id bigint DEFAULT nextval(
    'generate_table_column_test_table_id_seq' :: regclass
  ) NOT NULL
);
    `;
    const normalizedDdl = normalizeCreateTableDdl({ ddl: rawDdl });
    expect(normalizedDdl).not.toContain('bigint');
    expect(normalizedDdl).toContain('bigserial');
  });
  it('should strip out the ::__TYPE__ casting that our show create returns, since that level of granularity is not useful', () => {
    const normalizedDdl = normalizeCreateTableDdl({ ddl: exampleShowCreateDdl });
    expect(normalizedDdl).not.toContain("bigint DEFAULT nextval('test_tb_for_show_create_on_id_seq' :: regclass)");
    expect(normalizedDdl).toContain('bigserial');
  });
  it('should normalize ` integer ` into ` int `, since postgres does not have a `biginteger` and only `bigint`, for consistency', () => {
    const normalizedDdl = normalizeCreateTableDdl({ ddl: exampleShowCreateDdl });
    expect(normalizedDdl).not.toContain('integer');
    expect(normalizedDdl).toContain(' int ');
  });
});
