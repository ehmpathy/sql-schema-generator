import { pg as prepare } from 'yesql';

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  type DatabaseConnection,
  getDatabaseConnection,
} from '../../.test.utils/databaseConnection';

describe('generate command', () => {
  it('should be able to generate schema for valid entities declaration', async () => {
    const configPath = path.join(
      __dirname,
      '../.test.assets/codegen.sql.schema.acceptance.yml',
    );
    const rootDir = path.join(__dirname, '../../..');

    // run the CLI command via node against compiled dist
    // note: test:acceptance runs build first
    execSync(`./bin/run generate -c ${configPath}`, {
      cwd: rootDir,
      encoding: 'utf-8',
    });

    // assert the native-array feature at the acceptance boundary: the CLI-produced artifacts
    // must carry a native array column (not a join table) for the primitive/enum arrays on `home`.
    // the `home` fixture declares a native primitive array `tags` (static) and a native enum
    // array `amenities` (updatable), alongside join-table reference arrays (host_ids/photo_ids).
    const generatedDir = path.join(__dirname, '../.test.assets/generated');
    const readGenerated = (relPath: string) =>
      readFileSync(path.join(generatedDir, relPath), 'utf-8');

    // the static native primitive array is a real `varchar[]` column on the base table
    const homeTableSql = readGenerated('tables/home.sql');
    expect(homeTableSql).toContain('tags varchar[] NOT NULL');
    expect(homeTableSql).toMatchSnapshot('home table (native primitive array)');

    // the updatable native enum array is a `varchar[]` column with an element-membership check
    const homeVersionTableSql = readGenerated('tables/home_version.sql');
    expect(homeVersionTableSql).toContain('amenities varchar[] NOT NULL');
    expect(homeVersionTableSql).toContain(
      "CHECK (amenities <@ ARRAY['POOL', 'WIFI', 'PARKING']::varchar[])",
    );
    expect(homeVersionTableSql).toMatchSnapshot(
      'home version table (native enum array + membership check)',
    );

    // the upsert function is the native-array WRITE path: primitive/enum arrays are passed as
    // native array inputs (`in_tags varchar[]`, `in_amenities varchar[]`) and written in one shot,
    // while reference arrays (host_ids/photo_ids) keep the hash + mapping-table path. change
    // detection on the version uses the null-safe `IS NOT DISTINCT FROM` for the native enum array.
    const homeUpsertSql = readGenerated('functions/upsert_home.sql');
    expect(homeUpsertSql).toContain('in_tags varchar[]');
    expect(homeUpsertSql).toContain('in_amenities varchar[]');
    expect(homeUpsertSql).toContain(
      'v.amenities IS NOT DISTINCT FROM in_amenities',
    );
    expect(homeUpsertSql).toMatchSnapshot(
      'home upsert function (native array write path)',
    );

    // the hydrated view selects each native array straight through with the null->[] coalesce
    const homeViewSql = readGenerated('views/view_home_current.sql');
    expect(homeViewSql).toContain(
      'coalesce(s.tags, array[]::varchar[]) as tags',
    );
    expect(homeViewSql).toContain(
      'coalesce(v.amenities, array[]::varchar[]) as amenities',
    );
    expect(homeViewSql).toMatchSnapshot(
      'home view (native arrays selected through)',
    );
  });

  it('should display help for the generate command', async () => {
    const rootDir = path.join(__dirname, '../../..');

    // the --help path is a user-faced contract: it must advertise the command,
    // its purpose, and the -c/--config input a human needs to invoke it.
    const helpOutput = execSync('./bin/run generate --help', {
      cwd: rootDir,
      encoding: 'utf-8',
    });

    expect(helpOutput).toContain('sql-schema-generator generate [options]');
    expect(helpOutput).toContain('-c, --config <path>');
    expect(helpOutput).toMatchSnapshot('generate --help output');
  });

  it('should reject an invalid entities declaration with a helpful error', async () => {
    const configPath = path.join(
      __dirname,
      '../.test.assets/codegen.sql.schema.acceptance.invalid.yml',
    );
    const rootDir = path.join(__dirname, '../../..');

    // the invalid fixture declares a native array of a serial pseudo-type, which
    // sql-schema-generator rejects at declare time. exercise the CLI's negative path:
    // the command must fail (non-zero exit) with a UserInputError that names the fix.
    const negativePath = () =>
      execSync(`./bin/run generate -c ${configPath}`, {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    const caught = (() => {
      try {
        negativePath();
        return null;
      } catch (error) {
        return error as { status: number; stderr: string };
      }
    })();

    // the CLI must have failed loud (non-zero exit), not silently produced schema
    expect(caught).not.toBeNull();
    expect(caught!.status).not.toEqual(0);

    // snapshot only the stable UserInputError message + fix guidance, minus the
    // volatile absolute-path stack frames so the snapshot stays deterministic
    const stableError = caught!.stderr.split('\n    at ')[0]!.trim();
    expect(stableError).toContain(
      "prop.ARRAY_OF does not support the serial pseudo-type 'bigserial'",
    );
    expect(stableError).toMatchSnapshot('generate invalid declaration error');
  });
});

describe('parcel native-array full round-trip (literal CLI output applied to postgres)', () => {
  // a self-contained native-array entity whose entire generated graph applies cleanly to a real
  // postgres — proof that the CLI's on-disk upsert function + hydrated view actually execute (not
  // just that their SQL text looks right). home's own graph cannot serve as the vehicle here: it
  // transitively emits a `user` table, a reserved word the generator writes unquoted, which
  // postgres rejects — so a self-contained entity exercises the identical native-array code paths.
  let dbConnection: DatabaseConnection;

  const rootDir = path.join(__dirname, '../../..');
  const generatedDir = path.join(__dirname, '../.test.assets/generated');
  const readGenerated = (relPath: string) =>
    readFileSync(path.join(generatedDir, relPath), 'utf-8');

  // db-generated + order-dependent keys are volatile across runs; strip them so the domain array
  // columns can be snapshotted. arrays are coerced to plain JSON for a legible diff.
  const asStableRow = (row: Record<string, unknown>) => {
    const stable: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (
        ['id', 'uuid', 'created_at', 'effective_at', 'updated_at'].includes(
          key,
        ) ||
        key.endsWith('_id')
      )
        continue;
      stable[key] = Array.isArray(value)
        ? value.map((element) =>
            element instanceof Date ? element.toISOString() : element,
          )
        : value;
    }
    return stable;
  };

  const upsertParcel = async (input: {
    apn: string;
    tags: string[];
    lot_dimensions: number[];
    land_use: string[];
  }) => {
    const result = await dbConnection.query(
      prepare(`
        SELECT * FROM upsert_parcel(
          :apn,
          :tags,
          :lot_dimensions,
          :land_use
        );
      `)(input),
    );
    return result.rows[0].id as number;
  };

  const getParcelFromView = async ({ id }: { id: number }) => {
    const result = await dbConnection.query(
      prepare('SELECT * FROM view_parcel_current WHERE id = :id')({ id }),
    );
    expect(result.rows.length).toEqual(1);
    return result.rows[0];
  };

  const getParcelVersions = async ({ id }: { id: number }) => {
    const result = await dbConnection.query(
      prepare(
        'SELECT * FROM parcel_version WHERE parcel_id = :id ORDER BY created_at ASC',
      )({ id }),
    );
    return result.rows;
  };

  const applyGeneratedParcelGraph = async () => {
    // reset any prior parcel objects so the apply starts from a clean slate
    await dbConnection.query({
      sql: 'DROP VIEW IF EXISTS view_parcel_current',
    });
    await dbConnection.query({ sql: 'DROP FUNCTION IF EXISTS upsert_parcel' });
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS parcel_cvp' });
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS parcel_version' });
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS parcel' });

    // apply the LITERAL generated files, in dependency order
    await dbConnection.query({ sql: readGenerated('tables/parcel.sql') });
    await dbConnection.query({
      sql: readGenerated('tables/parcel_version.sql'),
    });
    await dbConnection.query({ sql: readGenerated('tables/parcel_cvp.sql') });
    await dbConnection.query({
      sql: readGenerated('functions/upsert_parcel.sql'),
    });
    await dbConnection.query({
      sql: readGenerated('views/view_parcel_current.sql'),
    });
  };

  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });

  afterAll(async () => {
    await dbConnection.end();
  });

  // the ACTION under test is the public contract — the `generate` CLI command. the apply +
  // exercise + read-back that follow are the VERIFY phase, which rule.require.acceptance.blackbox
  // permits to use internals ("verify (then) — internal access allowed"). this proves the
  // CLI-produced upsert function + hydrated view actually execute against a real postgres, not
  // just that their SQL text reads right.
  it('should generate a native-array schema whose literal output applies and round-trips through upsert + view against real postgres', async () => {
    // action: invoke the public contract — the `generate` CLI command
    execSync(
      `./bin/run generate -c ${path.join(
        __dirname,
        '../.test.assets/codegen.sql.schema.acceptance.yml',
      )}`,
      { cwd: rootDir, encoding: 'utf-8' },
    );

    // verify: apply the LITERAL produced artifact to a real postgres
    await applyGeneratedParcelGraph();

    // verify: write native arrays, read them back through the hydrated view
    const id = await upsertParcel({
      apn: '__PARCEL_ROUNDTRIP__',
      tags: ['residential', 'corner-lot'],
      lot_dimensions: [50.5, 120.25],
      land_use: ['RESIDENTIAL'],
    });
    const view = await getParcelFromView({ id });

    // the static native primitive + numeric arrays read straight through
    expect(view.tags).toEqual(['residential', 'corner-lot']);
    expect(view.lot_dimensions.map(Number)).toEqual([50.5, 120.25]);
    // the updatable native enum array reads straight through from the version row
    expect(view.land_use).toEqual(['RESIDENTIAL']);

    // snapshot the full round-tripped instance so a reviewer sees exactly what the CLI-produced
    // view returns for every native array type in a PR diff
    expect(asStableRow(view)).toMatchSnapshot(
      'parcel round-trip view instance (native arrays through literal CLI output)',
    );

    // verify: an identical re-write is a no-op — the null-safe IS NOT DISTINCT FROM matches,
    // so no new version is cut
    const idempotentInput = {
      apn: '__PARCEL_IDEMPOTENT__',
      tags: ['flat'],
      lot_dimensions: [100],
      land_use: ['AGRICULTURAL'],
    };
    const idempotentId = await upsertParcel(idempotentInput);
    expect((await getParcelVersions({ id: idempotentId })).length).toEqual(1);
    await upsertParcel(idempotentInput);
    expect((await getParcelVersions({ id: idempotentId })).length).toEqual(1);

    // verify: a changed enum array cuts exactly one new version
    const changeBase = {
      apn: '__PARCEL_CHANGE__',
      tags: ['hillside'],
      lot_dimensions: [75.5],
      land_use: ['RESIDENTIAL'],
    };
    const changeId = await upsertParcel(changeBase);
    expect((await getParcelVersions({ id: changeId })).length).toEqual(1);
    await upsertParcel({ ...changeBase, land_use: ['COMMERCIAL'] });
    const changeVersions = await getParcelVersions({ id: changeId });
    expect(changeVersions.length).toEqual(2);

    // snapshot the before -> after version rows so the CLI-produced change detection is visible
    expect(changeVersions.map(asStableRow)).toMatchSnapshot(
      'parcel version rows across an enum array change (literal CLI output)',
    );
  });
});
