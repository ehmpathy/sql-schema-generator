import { pg as prepare } from 'yesql';

import { uuid } from '@src/deps';
import { Entity } from '@src/domain.objects';
import * as prop from '@src/domain.operations/define/defineProperty';
import {
  createTablesForEntity,
  type DatabaseConnection,
  dropTablesForEntity,
  getDatabaseConnection,
} from '@src/domain.operations/generate/.test.utils';
import { dropAndCreateUpsertFunctionForEntity } from '@src/domain.operations/generate/.test.utils/dropAndCreateUpsertForEntity';
import { dropAndCreateViewForEntity } from '@src/domain.operations/generate/.test.utils/dropAndCreateViewForEntity';
import { getEntityFromCurrentView } from '@src/domain.operations/generate/.test.utils/getEntityFromCurrentView';

import { generateEntityUpsert } from './entityFunctions/generateEntityUpsert/generateEntityUpsert';
import { generateEntityTables } from './entityTables/generateEntityTables';
import { generateEntityCurrentView } from './entityViews/generateEntityCurrentView';

/*
  proves the native primitive + enum array column feature end to end:
  - DDL emits native array columns (text[]/numeric[]/boolean[]/timestamptz[]/<enum>[]), not join tables
  - the upsert writes each array in one shot
  - the hydrated view reads each array straight through
  - change detection treats the array as a value (no spurious version bump)
  - the enum array check rejects an out-of-set element
*/

// db-generated metadata that is not deterministic across runs; strip it so the domain array
// columns can be snapshotted for eyeball review. note: only these exact keys are volatile —
// `moments_at`/`moments`/`days` etc. are DOMAIN array data (fixed input instants), NOT metadata,
// so we strip by exact key name, never by an `_at` suffix.
const VOLATILE_ROW_KEYS = [
  'id',
  'uuid',
  'created_at',
  'effective_at',
  'updated_at',
];

// a serial primary/foreign key value is db-generated and order-dependent (e.g. a version row's
// `sensor_id` is the parent static id), so it is volatile too. any `<name>_id` column is such an
// fk reference, not domain array data — drop it so the snapshot is order-independent.
const isVolatileKey = (key: string) =>
  VOLATILE_ROW_KEYS.includes(key) || key.endsWith('_id');

// present a roundtripped view/version row as stable, snapshot-friendly domain data: drop the
// volatile metadata keys, and coerce the driver's array element shapes into plain JSON — numeric[]
// comes back as string[] (kept as-is), timestamptz[] as Date[] (to iso), bytea[] as Buffer[] (to hex).
const asStableRow = (row: Record<string, unknown>) => {
  const stable: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (isVolatileKey(key)) continue;
    if (Array.isArray(value)) {
      stable[key] = value.map((element) => {
        if (element instanceof Date) return element.toISOString();
        if (Buffer.isBuffer(element)) return element.toString('hex');
        return element;
      });
    } else {
      stable[key] = value;
    }
  }
  return stable;
};
describe('native array columns', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });

  const sensor = new Entity({
    name: 'sensor',
    properties: {
      serial_number: prop.VARCHAR(),
      labels: prop.ARRAY_OF(prop.VARCHAR()), // static native array -> lives on the base table
      tags: { ...prop.ARRAY_OF(prop.VARCHAR()), updatable: true },
      readings: { ...prop.ARRAY_OF(prop.NUMERIC()), updatable: true },
      flags: { ...prop.ARRAY_OF(prop.BOOLEAN()), updatable: true },
      moments_at: { ...prop.ARRAY_OF(prop.TIMESTAMPTZ()), updatable: true },
      statuses: {
        ...prop.ARRAY_OF(prop.ENUM(['ACTIVE', 'FAULTED', 'OFFLINE'])),
        updatable: true,
      },
    },
    unique: ['serial_number'],
  });

  beforeAll(async () => {
    await dropTablesForEntity({ entity: sensor, dbConnection });
    await createTablesForEntity({ entity: sensor, dbConnection });
    await dropAndCreateUpsertFunctionForEntity({
      entity: sensor,
      dbConnection,
    });
    await dropAndCreateViewForEntity({ entity: sensor, dbConnection });
  });

  const upsertSensor = async (input: {
    serial_number: string;
    labels: string[];
    tags: string[];
    readings: number[];
    flags: boolean[];
    moments_at: string[];
    statuses: string[];
  }) => {
    const result = await dbConnection.query(
      prepare(`
        SELECT * FROM upsert_${sensor.name}(
          :serial_number,
          :labels,
          :tags,
          :readings,
          :flags,
          :moments_at,
          :statuses
        );
      `)(input),
    );
    return result.rows[0].id as number;
  };

  const getVersions = async ({ id }: { id: number }) => {
    const result = await dbConnection.query(
      prepare(`
        select * from ${sensor.name}_version where ${sensor.name}_id = :id order by created_at asc
      `)({ id }),
    );
    return result.rows;
  };

  it('should emit native array columns in the DDL, with no join table', () => {
    const tables = generateEntityTables({ entity: sensor });

    // the static table carries the static native array column inline
    expect(tables.static.sql).toContain('labels varchar[]');

    // the version table carries each updatable native array column inline
    expect(tables.version!.sql).toContain('tags varchar[]');
    expect(tables.version!.sql).toContain('readings numeric[]');
    expect(tables.version!.sql).toContain('flags boolean[]');
    expect(tables.version!.sql).toContain(
      'moments_at timestamp with time zone[]',
    );
    expect(tables.version!.sql).toContain('statuses varchar[]');

    // the enum array uses an element-membership check, not a scalar IN
    expect(tables.version!.sql).toContain(
      "CHECK (statuses <@ ARRAY['ACTIVE', 'FAULTED', 'OFFLINE']::varchar[])",
    );

    // no join table is generated for any of these native arrays
    expect(tables.mappings).toEqual([]);

    // no *_hash column is emitted for the native arrays
    expect(tables.static.sql).not.toContain('labels_hash');
    expect(tables.version!.sql).not.toContain('tags_hash');
  });

  it('should round-trip native arrays through upsert and the hydrated view', async () => {
    const id = await upsertSensor({
      serial_number: '__SERIAL_ROUNDTRIP__',
      labels: ['alpha', 'beta'],
      tags: ['a', 'b'],
      readings: [1, 2],
      flags: [true, false],
      moments_at: ['2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'],
      statuses: ['ACTIVE', 'FAULTED'],
    });

    const view = await getEntityFromCurrentView({
      id,
      entity: sensor,
      dbConnection,
    });

    // strings + enums come back as string arrays, straight through
    expect(view.labels).toEqual(['alpha', 'beta']);
    expect(view.tags).toEqual(['a', 'b']);
    expect(view.statuses).toEqual(['ACTIVE', 'FAULTED']);

    // booleans come back as a boolean array
    expect(view.flags).toEqual([true, false]);

    // numeric comes back as a string array (node-postgres default); compare by value
    expect(view.readings.map(Number)).toEqual([1, 2]);

    // timestamptz comes back as a Date array; compare by instant
    expect(view.moments_at.map((d: Date) => new Date(d).getTime())).toEqual([
      new Date('2026-01-01T00:00:00.000Z').getTime(),
      new Date('2026-02-01T00:00:00.000Z').getTime(),
    ]);

    // snapshot the full roundtripped instance (every native array type at once) so a reviewer
    // can eyeball exactly what data comes back through the view in a PR diff
    expect(asStableRow(view)).toMatchSnapshot(
      'roundtrip view instance (all native array element types)',
    );
  });

  it('should not bump the version when the same array is re-upserted', async () => {
    const input = {
      serial_number: '__SERIAL_IDEMPOTENT__',
      labels: ['x'],
      tags: ['keep', 'same'],
      readings: [3, 4],
      flags: [true],
      moments_at: ['2026-03-01T00:00:00.000Z'],
      statuses: ['OFFLINE'],
    };

    const id = await upsertSensor(input);
    const versionsAfterFirst = await getVersions({ id });
    expect(versionsAfterFirst.length).toEqual(1);

    // re-upsert the exact same values -> no new version
    await upsertSensor(input);
    const versionsAfterSecond = await getVersions({ id });
    expect(versionsAfterSecond.length).toEqual(1);
  });

  it('should bump the version exactly once for a change in each updatable array element type', async () => {
    // a baseline for every updatable native array type (varchar, numeric, boolean,
    // timestamptz, enum). each step below changes exactly ONE type and asserts one bump,
    // so the changed-direction is proven per element type, not just for varchar `tags`.
    const base = {
      serial_number: '__SERIAL_CHANGE__',
      labels: ['fixed'],
      tags: ['before'],
      readings: [5],
      flags: [false],
      moments_at: ['2026-04-01T00:00:00.000Z'],
      statuses: ['ACTIVE'],
    };
    const id = await upsertSensor(base);
    expect((await getVersions({ id })).length).toEqual(1);

    // varchar[] change
    await upsertSensor({ ...base, tags: ['after'] });
    expect((await getVersions({ id })).length).toEqual(2);

    // numeric[] change
    await upsertSensor({ ...base, tags: ['after'], readings: [6] });
    expect((await getVersions({ id })).length).toEqual(3);

    // boolean[] change
    await upsertSensor({
      ...base,
      tags: ['after'],
      readings: [6],
      flags: [true],
    });
    expect((await getVersions({ id })).length).toEqual(4);

    // timestamptz[] change
    await upsertSensor({
      ...base,
      tags: ['after'],
      readings: [6],
      flags: [true],
      moments_at: ['2026-05-01T00:00:00.000Z'],
    });
    expect((await getVersions({ id })).length).toEqual(5);

    // enum varchar[] change
    await upsertSensor({
      ...base,
      tags: ['after'],
      readings: [6],
      flags: [true],
      moments_at: ['2026-05-01T00:00:00.000Z'],
      statuses: ['FAULTED'],
    });
    expect((await getVersions({ id })).length).toEqual(6);

    // snapshot every version row in order so a reviewer sees the full before->after progression
    // of the stored native-array data as each element type changes, one at a time
    const versions = await getVersions({ id });
    expect(versions.map(asStableRow)).toMatchSnapshot(
      'version rows across a change in each updatable native array element type',
    );
  });

  it('should snapshot the generated DDL, upsert function, and view for eyeball review', () => {
    const tables = generateEntityTables({ entity: sensor });
    const upsert = generateEntityUpsert({ entity: sensor });
    const view = generateEntityCurrentView({ entity: sensor });

    // snapshot the actual generated SQL so a reviewer can eyeball the native-array codegen in a diff
    expect(tables.static.sql).toMatchSnapshot();
    expect(tables.version!.sql).toMatchSnapshot();
    expect(upsert.sql).toMatchSnapshot();
    expect(view!.sql).toMatchSnapshot();
  });

  it('should accept an explicit empty enum array through the element-membership check', async () => {
    // the enum-array CHECK is `statuses <@ ARRAY[...]`; an empty array `{}` is contained by any
    // set, so it must pass the check (proven through the real upsert, not just asserted in a comment)
    const id = await upsertSensor({
      serial_number: '__SERIAL_EMPTY_ENUM__',
      labels: [],
      tags: [],
      readings: [],
      flags: [],
      moments_at: [],
      statuses: [], // empty enum array must satisfy the <@ check
    });

    const view = await getEntityFromCurrentView({
      id,
      entity: sensor,
      dbConnection,
    });
    expect(view.statuses).toEqual([]);

    // boundary: an all-empty-arrays instance reads back as empty arrays (not null) across every
    // native array element type — snapshot the whole instance so the empty-array shape is visible
    expect(asStableRow(view)).toMatchSnapshot(
      'roundtrip view instance (all empty arrays)',
    );
  });

  it('should reject an enum array element outside the allowed set', async () => {
    try {
      await upsertSensor({
        serial_number: '__SERIAL_BAD_ENUM__',
        labels: ['y'],
        tags: ['t'],
        readings: [9],
        flags: [true],
        moments_at: ['2026-05-01T00:00:00.000Z'],
        statuses: ['NOT_A_REAL_STATUS'], // violates the element-membership check
      });
      throw new Error('should not reach here'); // fail if the check did not reject
    } catch (error) {
      expect(error.message).toContain('statuses_check');
      expect(error.message).toMatchSnapshot(); // the exact postgres error a developer sees
    }
  });

  // pin down the `<@` NULL-element semantics against a real postgres: an enum array
  // that holds a NULL element does NOT satisfy `col <@ ARRAY[...]`, so the CHECK rejects
  // it — the same fail-loud outcome as an out-of-set element. this is the pit-of-success
  // (a stray NULL cannot slip into an enum list) and documents the behavior so a future
  // change to the check shape is caught.
  it('should reject an enum array that holds a NULL element', async () => {
    try {
      await dbConnection.query(
        prepare(`
          SELECT * FROM upsert_${sensor.name}(
            :serial_number,
            :labels,
            :tags,
            :readings,
            :flags,
            :moments_at,
            :statuses
          );
        `)({
          serial_number: '__SERIAL_NULL_ENUM_ELEMENT__',
          labels: ['y'],
          tags: ['t'],
          readings: [9],
          flags: [true],
          moments_at: ['2026-05-01T00:00:00.000Z'],
          statuses: ['ACTIVE', null], // NULL element -> <@ not satisfied -> CHECK rejects
        }),
      );
      throw new Error('should not reach here'); // fail if the check did not reject
    } catch (error) {
      expect(error.message).toContain('statuses_check');
      // snapshot the exact postgres error a developer sees when a NULL element slips into an
      // enum array — same fail-loud check violation as an out-of-set element
      expect(error.message).toMatchSnapshot(
        'enum array NULL-element rejection error',
      );
    }
  });

  // an entity whose only special property is a static native array, with no updatable
  // properties (so no version table). this exercises the path where a view must still be
  // generated: the view carries the null->[] coalesce that presents an unset list as [].
  describe('static native array only entity (no version table)', () => {
    const beacon = new Entity({
      name: 'beacon',
      properties: {
        serial_number: prop.VARCHAR(),
        // static native array; no updatable props. nullable so the null->[] coalesce
        // in the view is reachable (a non-nullable array column can never hold NULL)
        labels: { ...prop.ARRAY_OF(prop.VARCHAR()), nullable: true },
      },
      unique: ['serial_number'],
    });

    beforeAll(async () => {
      await dropTablesForEntity({ entity: beacon, dbConnection });
      await createTablesForEntity({ entity: beacon, dbConnection });
      await dropAndCreateUpsertFunctionForEntity({
        entity: beacon,
        dbConnection,
      });
      await dropAndCreateViewForEntity({ entity: beacon, dbConnection });
    });

    const upsertBeacon = async (input: {
      serial_number: string;
      labels: string[];
    }) => {
      const result = await dbConnection.query(
        prepare(`
          SELECT * FROM upsert_${beacon.name}(
            :serial_number,
            :labels
          );
        `)(input),
      );
      return result.rows[0].id as number;
    };

    it('should still generate a view even with no version table', () => {
      const view = generateEntityCurrentView({ entity: beacon });
      expect(view).not.toEqual(null);
    });

    it('should round-trip the static native array through the view', async () => {
      const id = await upsertBeacon({
        serial_number: '__BEACON_ROUNDTRIP__',
        labels: ['alpha', 'beta'],
      });
      const view = await getEntityFromCurrentView({
        id,
        entity: beacon,
        dbConnection,
      });
      expect(view.labels).toEqual(['alpha', 'beta']);

      // boundary: a static-native-array-only entity (no version table) still roundtrips the
      // array through its view — snapshot the instance
      expect(asStableRow(view)).toMatchSnapshot(
        'roundtrip view instance (static native array only, no version table)',
      );
    });

    it('should present a NULL native array cell as an empty array via the view', async () => {
      // insert a base row directly, with labels unset (NULL), to prove the coalesce
      const inserted = await dbConnection.query(
        prepare(`
          INSERT INTO ${beacon.name} (uuid, serial_number)
          VALUES (uuid_generate_v4(), :serial_number)
          RETURNING id
        `)({ serial_number: '__BEACON_NULL_LABELS__' }),
      );
      const id = inserted.rows[0].id as number;

      const view = await getEntityFromCurrentView({
        id,
        entity: beacon,
        dbConnection,
      });
      expect(view.labels).toEqual([]); // NULL coalesced to [] by the view

      // boundary: a NULL native array cell presents as [] through the view's coalesce —
      // snapshot the instance so the null->[] projection is visible
      expect(asStableRow(view)).toMatchSnapshot(
        'roundtrip view instance (NULL native array cell coalesced to [])',
      );
    });
  });

  // an entity that mixes a native array (labels -> a real text[] column) with a join-table
  // array (part_uuids -> a child map-table). the vision names this coexistence as an edgecase
  // that must work without collision: the two storage models must live side by side in the
  // same DDL, upsert, and view without a column-name, check-name, or join-order clash.
  describe('entity mixing native and join-table arrays', () => {
    const gadget = new Entity({
      name: 'gadget',
      properties: {
        serial_number: prop.VARCHAR(),
        labels: prop.ARRAY_OF(prop.VARCHAR()), // native array -> text[] column
        part_uuids: prop.ARRAY_OF(prop.UUID()), // join-table array -> child map-table
      },
      unique: ['serial_number'],
    });

    beforeAll(async () => {
      await dropTablesForEntity({ entity: gadget, dbConnection });
      await createTablesForEntity({ entity: gadget, dbConnection });
      await dropAndCreateUpsertFunctionForEntity({
        entity: gadget,
        dbConnection,
      });
      await dropAndCreateViewForEntity({ entity: gadget, dbConnection });
    });

    const upsertGadget = async (input: {
      serial_number: string;
      labels: string[];
      part_uuids: string;
    }) => {
      const result = await dbConnection.query(
        prepare(`
          SELECT * FROM upsert_${gadget.name}(
            :serial_number,
            :labels,
            :part_uuids
          );
        `)(input),
      );
      return result.rows[0].id as number;
    };

    it('should generate a native array column and a join table side by side, no collision', () => {
      const tables = generateEntityTables({ entity: gadget });

      // the native array lives inline on the base table as a real column
      expect(tables.static.sql).toContain('labels varchar[]');
      expect(tables.static.sql).not.toContain('labels_hash');

      // the join-table array gets a values-hash column plus one mapping table
      expect(tables.static.sql).toContain('part_uuids_hash');
      expect(tables.mappings.length).toEqual(1);
      expect(tables.mappings[0]!.name).toContain('part_uuid');
    });

    it('should round-trip both arrays through upsert and the view without collision', async () => {
      const partUuids = [uuid(), uuid()];
      const id = await upsertGadget({
        serial_number: '__GADGET_MIXED__',
        labels: ['alpha', 'beta'],
        part_uuids: `{${partUuids.join(',')}}`,
      });

      const view = await getEntityFromCurrentView({
        id,
        entity: gadget,
        dbConnection,
      });

      // the native array reads straight through as a text[]
      expect(view.labels).toEqual(['alpha', 'beta']);

      // the join-table array reads back collapsed via the view, same values
      expect(`{${view.part_uuids.join(',')}}`).toEqual(
        `{${partUuids.join(',')}}`,
      );

      // boundary: native array + join-table array coexist without collision. the part_uuids are
      // random per run, so snapshot the deterministic shape — the native `labels` verbatim plus the
      // join-array element count — to show both storage models roundtrip side by side
      expect({
        labels: view.labels,
        part_uuids_count: view.part_uuids.length,
      }).toMatchSnapshot(
        'roundtrip view instance (native array + join-table array)',
      );
    });
  });

  // proves that every documented primitive element type (beyond the five the sensor exercises)
  // produces valid postgres array DDL and round-trips. real postgres validates each column type
  // when createTablesForEntity runs in the beforeAll; a bad type string would throw there.
  describe('broad primitive element types', () => {
    const probe = new Entity({
      name: 'probe',
      properties: {
        serial_number: prop.VARCHAR(),
        shorts: prop.ARRAY_OF(prop.SMALLINT()),
        ints: prop.ARRAY_OF(prop.INT()),
        bigs: prop.ARRAY_OF(prop.BIGINT()),
        reals: prop.ARRAY_OF(prop.REAL()),
        doubles: prop.ARRAY_OF(prop.DOUBLE_PRECISION()),
        codes: prop.ARRAY_OF(prop.CHAR(3)),
        notes: prop.ARRAY_OF(prop.TEXT()),
        prices: prop.ARRAY_OF(prop.NUMERIC(10, 2)), // precision + scale composed with []
        days: prop.ARRAY_OF(prop.DATE()),
        times: prop.ARRAY_OF(prop.TIME()),
        moments: prop.ARRAY_OF(prop.TIMESTAMP()),
        blobs: prop.ARRAY_OF(prop.BYTEA()),
      },
      unique: ['serial_number'],
    });

    beforeAll(async () => {
      await dropTablesForEntity({ entity: probe, dbConnection });
      await createTablesForEntity({ entity: probe, dbConnection }); // real pg validates each array type
      await dropAndCreateUpsertFunctionForEntity({
        entity: probe,
        dbConnection,
      });
      await dropAndCreateViewForEntity({ entity: probe, dbConnection });
    });

    const upsertProbe = async (input: {
      serial_number: string;
      shorts: string;
      ints: string;
      bigs: string;
      reals: string;
      doubles: string;
      codes: string;
      notes: string;
      prices: string;
      days: string;
      times: string;
      moments: string;
      blobs: string;
    }) => {
      const result = await dbConnection.query(
        prepare(`
          SELECT * FROM upsert_${probe.name}(
            :serial_number,
            :shorts,
            :ints,
            :bigs,
            :reals,
            :doubles,
            :codes,
            :notes,
            :prices,
            :days,
            :times,
            :moments,
            :blobs
          );
        `)(input),
      );
      return result.rows[0].id as number;
    };

    it('should compose precision + scale with the array suffix in the DDL', () => {
      const tables = generateEntityTables({ entity: probe });
      expect(tables.static.sql).toContain('prices numeric(10, 2)[]');
      expect(tables.static.sql).toContain('doubles double precision[]');
      expect(tables.static.sql).toContain('bigs bigint[]');
      expect(tables.static.sql).toContain('codes varchar(3)[]'); // prop.CHAR aliases varchar(n)
      expect(tables.static.sql).toContain('blobs bytea[]');
    });

    it('should round-trip the broad primitive array types through the view', async () => {
      const id = await upsertProbe({
        serial_number: '__PROBE_ROUNDTRIP__',
        shorts: '{1,2}',
        ints: '{10,20}',
        bigs: '{1000,2000}',
        reals: '{1.5,2.5}',
        doubles: '{3.25,4.75}',
        codes: '{abc,xyz}',
        notes: '{hello,world}',
        prices: '{10.25,20.50}',
        days: '{2026-01-01,2026-02-01}',
        times: '{14:30:00,09:00:00}',
        moments: '{2026-01-01 00:00:00,2026-02-01 00:00:00}',
        blobs: '{"\\\\x0102","\\\\x0304"}',
      });

      const view = await getEntityFromCurrentView({
        id,
        entity: probe,
        dbConnection,
      });

      expect(view.shorts.map(Number)).toEqual([1, 2]);
      expect(view.ints.map(Number)).toEqual([10, 20]);
      expect(view.bigs.map(Number)).toEqual([1000, 2000]);
      expect(view.reals.map(Number)).toEqual([1.5, 2.5]);
      expect(view.doubles.map(Number)).toEqual([3.25, 4.75]);
      expect(view.codes).toEqual(['abc', 'xyz']);
      expect(view.notes).toEqual(['hello', 'world']);
      expect(view.prices.map(Number)).toEqual([10.25, 20.5]);
      expect(view.days.map((d: Date) => new Date(d).getTime())).toEqual([
        new Date('2026-01-01T00:00:00.000Z').getTime(),
        new Date('2026-02-01T00:00:00.000Z').getTime(),
      ]);
      // time[] reads back as its element clock strings
      expect(view.times).toEqual(['14:30:00', '09:00:00']);
      // timestamp[] reads back as element dates (compared by instant)
      expect(view.moments.map((m: Date) => new Date(m).getTime())).toEqual([
        new Date('2026-01-01T00:00:00.000Z').getTime(),
        new Date('2026-02-01T00:00:00.000Z').getTime(),
      ]);
      // bytea[] reads back as element buffers (compared by hex)
      expect(view.blobs.map((b: Buffer) => b.toString('hex'))).toEqual([
        '0102',
        '0304',
      ]);

      // snapshot the full instance across every documented primitive element type (smallint, int,
      // bigint, real, double, char, text, numeric(p,s), date, time, timestamp, bytea) at once
      expect(asStableRow(view)).toMatchSnapshot(
        'roundtrip view instance (broad primitive element types)',
      );
    });

    it('should round-trip an explicit empty array as an empty array', async () => {
      const id = await upsertProbe({
        serial_number: '__PROBE_EMPTY__',
        shorts: '{}',
        ints: '{}',
        bigs: '{}',
        reals: '{}',
        doubles: '{}',
        codes: '{}',
        notes: '{}',
        prices: '{}',
        days: '{}',
        times: '{}',
        moments: '{}',
        blobs: '{}',
      });

      const view = await getEntityFromCurrentView({
        id,
        entity: probe,
        dbConnection,
      });

      // an explicitly-upserted empty array reads back as an empty array, not null
      expect(view.ints).toEqual([]);
      expect(view.notes).toEqual([]);
      expect(view.prices).toEqual([]);

      // boundary: every broad-primitive column upserted empty reads back empty — snapshot the
      // whole instance so the empty-array shape is visible across all element types at once
      expect(asStableRow(view)).toMatchSnapshot(
        'roundtrip view instance (broad primitive types, all empty)',
      );
    });
  });

  // an updatable + nullable native array exercises the CVP change-detection null<->value
  // transition: the where-clause conditional must add its null-safe branch for the array column.
  describe('nullable updatable native array (CVP null<->value transition)', () => {
    const flux = new Entity({
      name: 'flux',
      properties: {
        serial_number: prop.VARCHAR(),
        maybe_tags: {
          ...prop.ARRAY_OF(prop.VARCHAR()),
          updatable: true,
          nullable: true,
        },
      },
      unique: ['serial_number'],
    });

    beforeAll(async () => {
      await dropTablesForEntity({ entity: flux, dbConnection });
      await createTablesForEntity({ entity: flux, dbConnection });
      await dropAndCreateUpsertFunctionForEntity({
        entity: flux,
        dbConnection,
      });
      await dropAndCreateViewForEntity({ entity: flux, dbConnection });
    });

    const upsertFlux = async (input: {
      serial_number: string;
      maybe_tags: string[] | null;
    }) => {
      const result = await dbConnection.query(
        prepare(`
          SELECT * FROM upsert_${flux.name}(
            :serial_number,
            :maybe_tags
          );
        `)(input),
      );
      return result.rows[0].id as number;
    };

    const getVersions = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
          select * from ${flux.name}_version where ${flux.name}_id = :id order by created_at asc
        `)({ id }),
      );
      return result.rows;
    };

    it('should bump the version across value<->null transitions, but not on a no-op', async () => {
      // v1: a value
      const id = await upsertFlux({
        serial_number: '__FLUX__',
        maybe_tags: ['a', 'b'],
      });
      expect((await getVersions({ id })).length).toEqual(1);

      // value -> null is a change -> v2
      await upsertFlux({ serial_number: '__FLUX__', maybe_tags: null });
      expect((await getVersions({ id })).length).toEqual(2);

      // null -> null is a no-op -> still v2 (the null-safe branch matches)
      await upsertFlux({ serial_number: '__FLUX__', maybe_tags: null });
      expect((await getVersions({ id })).length).toEqual(2);

      // null -> value is a change -> v3
      await upsertFlux({ serial_number: '__FLUX__', maybe_tags: ['a', 'b'] });
      expect((await getVersions({ id })).length).toEqual(3);

      // value -> same value is a no-op -> still v3
      await upsertFlux({ serial_number: '__FLUX__', maybe_tags: ['a', 'b'] });
      expect((await getVersions({ id })).length).toEqual(3);

      // snapshot the three stored version rows so a reviewer sees the value -> null -> value
      // progression that the CVP null-safe change detection produced
      const versions = await getVersions({ id });
      expect(versions.map(asStableRow)).toMatchSnapshot(
        'version rows across value<->null transitions (nullable native array)',
      );
    });

    it('should not bump the version when an unchanged array holds a NULL element', async () => {
      // a NULL *element* (distinct from a NULL whole-array) is the case where plain `=` returns
      // NULL rather than TRUE; IS NOT DISTINCT FROM must still treat it as unchanged
      const id = await upsertFlux({
        serial_number: '__FLUX_NULL_ELEMENT__',
        maybe_tags: ['a', null] as unknown as string[],
      });
      expect((await getVersions({ id })).length).toEqual(1);

      // re-upsert the identical NULL-element array -> no new version
      await upsertFlux({
        serial_number: '__FLUX_NULL_ELEMENT__',
        maybe_tags: ['a', null] as unknown as string[],
      });
      expect((await getVersions({ id })).length).toEqual(1);

      // snapshot the single stored version row so the persisted NULL-element array shape is
      // visible (a NULL element survives roundtrip and does not spuriously bump the version)
      const versions = await getVersions({ id });
      expect(versions.map(asStableRow)).toMatchSnapshot(
        'version row holding a NULL array element (unchanged, no bump)',
      );
    });
  });
});
