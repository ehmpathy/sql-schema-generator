import uuid from 'uuid/v4';
import { pg as prepare } from 'yesql';

import { DatabaseConnection, getDatabaseConnection } from '../../../__test_utils__/databaseConnection';
import { getShowCreateFunction } from '../../../__test_utils__/getShowCreateFunction';
import { Entity } from '../../../types';
import * as prop from '../../define/defineProperty';
import { generateEntityTables } from '../entityTables/generateEntityTables';
import { generateEntityBackfillCurrentVersionPointers } from './generateEntityBackfillCurrentVersionPointers';
import { generateEntityUpsert } from './generateEntityUpsert/generateEntityUpsert';

describe('generateEntityBackfillCurrentVersionPointers', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  describe('versioned entity', () => {
    const car = new Entity({
      name: 'car',
      properties: {
        vin: prop.VARCHAR(255),
        name: {
          ...prop.VARCHAR(255),
          updatable: true,
          nullable: true, // i.e., some people don't name their cars
        },
        wheels: {
          ...prop.SMALLINT(),
          updatable: true,
        },
      },
      unique: ['vin'],
    });
    beforeAll(async () => {
      // provision the table
      const tables = await generateEntityTables({ entity: car });
      await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.currentVersionPointer!.name};` });
      await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.version!.name};` });
      await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.static.name};` });
      await dbConnection.query({ sql: tables.static.sql });
      await dbConnection.query({ sql: tables.version!.sql });
      await dbConnection.query({ sql: tables.currentVersionPointer!.sql });
    });
    const upsertCar = async ({ vin, name, wheels }: { vin: string; name?: string; wheels: number }) => {
      const result = await dbConnection.query(
        prepare(`
        SELECT * FROM upsert_${car.name}(
          :vin,
          :name,
          :wheels
        );
      `)({
          vin,
          name,
          wheels,
        }),
      );
      return result.rows[0].id;
    };
    const recreateTheUpsertMethod = async () => {
      const { name, sql: upsertSql } = generateEntityUpsert({ entity: car });
      await dbConnection.query({ sql: `DROP FUNCTION IF EXISTS ${name}` });
      await dbConnection.query({ sql: upsertSql });
      return { name, sql: upsertSql };
    };
    const recreateTheBackfillMethod = async () => {
      const { name, sql: upsertSql } = generateEntityBackfillCurrentVersionPointers({ entity: car });
      await dbConnection.query({ sql: `DROP FUNCTION IF EXISTS ${name}` });
      await dbConnection.query({ sql: upsertSql });
      return { name, sql: upsertSql };
    };
    const backfillCurrentVersionPointers = async (params?: { limit: number }) => {
      const result = await dbConnection.query(
        prepare(`
          SELECT backfill_${car.name}_cvp (:limit) as rows_affected;
        `)(params || { limit: 100 }),
      );
      return result.rows[0].rows_affected as number;
    };
    const getEntityVersions = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${car.name}_version where ${car.name}_id = :id order by created_at asc
      `)({ id }),
      );
      return result.rows;
    };
    const getEntityCurrentVersionPointer = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${car.name}_cvp where ${car.name}_id = :id
      `)({ id }),
      );
      return result.rows;
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
      const { sql, name } = await recreateTheBackfillMethod();
      const showCreateSql = await getShowCreateFunction({ dbConnection, func: name });
      expect(sql).toEqual(showCreateSql);
      expect(sql).toMatchSnapshot();
    });
    it('should find nothing needs backfill after upsert', async () => {
      await recreateTheBackfillMethod();
      await recreateTheUpsertMethod();

      // insert the car
      const props = {
        vin: uuid(),
        name: 'Bessy',
        wheels: 4,
      };
      await upsertCar(props);

      // check that rows affected by backfill = 0
      const rowsAffectedByBackfill = await backfillCurrentVersionPointers();
      expect(rowsAffectedByBackfill).toEqual(0);

      // update the car
      await upsertCar({ ...props, wheels: 5 });

      // check that rows affected are still = 0
      const rowsAffectedByBackfillNow = await backfillCurrentVersionPointers();
      expect(rowsAffectedByBackfillNow).toEqual(0);
    });
    it('should insert new records into cvp table, if for some reason it was never added in the first place', async () => {
      await recreateTheBackfillMethod();
      await recreateTheUpsertMethod();

      // insert the car
      const props = {
        vin: uuid(),
        name: 'Bessy',
        wheels: 4,
      };
      const id = await upsertCar(props);

      // show that before deleting, nothing was needed to be done
      const rowsAffectedByBackfill = await backfillCurrentVersionPointers();
      expect(rowsAffectedByBackfill).toEqual(0);

      // delete all the cvp records
      await dbConnection.query({ sql: `delete from ${car.name}_cvp where ${car.name}_id = ${id}` });

      // prove that the target record was affected
      const rowsAffectedByBackfillNow = await backfillCurrentVersionPointers();
      expect(rowsAffectedByBackfillNow).toEqual(1);

      // show that the current version pointer is correct
      const currentVersions = await getEntityVersions({ id });
      expect(currentVersions.length).toEqual(1); // we expect this in the test
      const currentVersionId = currentVersions[0].id;
      const [currentVersionPointer] = await getEntityCurrentVersionPointer({ id });
      expect(currentVersionPointer[`${car.name}_version_id`]).toEqual(currentVersionId);
    });
    it('should update records in cvp table, if for some reason the record is out of sync', async () => {
      await recreateTheBackfillMethod();
      await recreateTheUpsertMethod();

      // insert the car
      const props = {
        vin: uuid(),
        name: 'Bessy',
        wheels: 4,
      };
      const id = await upsertCar(props);

      // show that before inserting new version manually, nothing was needed to be done
      const rowsAffectedByBackfill = await backfillCurrentVersionPointers();
      expect(rowsAffectedByBackfill).toEqual(0);

      // insert a new version manually
      await dbConnection.query({
        sql: `
        INSERT INTO car_version
        (car_id, name, wheels)
        VALUES
        (${id}, 'the world famous twenty-one wheeler', 21);
      `,
      });

      // prove that one pointer needs to be fixed now
      const rowsAffectedByBackfillNow = await backfillCurrentVersionPointers();
      expect(rowsAffectedByBackfillNow).toEqual(1);

      // show that the current version pointer is now correct
      const currentVersions = await getEntityVersions({ id });
      expect(currentVersions.length).toEqual(2); // we expect this in the test
      const currentVersionId = currentVersions[1].id;
      const [currentVersionPointer] = await getEntityCurrentVersionPointer({ id });
      expect(currentVersionPointer[`${car.name}_version_id`]).toEqual(currentVersionId);
    });

    const upsertNewCar = async () => {
      const props = {
        vin: uuid(),
        name: 'Bessy',
        wheels: 4,
      };
      return await upsertCar(props);
    };
    const deleteCvpRecordForCarById = async ({ id }: { id: number }) => {
      await dbConnection.query({ sql: `delete from ${car.name}_cvp where ${car.name}_id = ${id}` });
    };
    it('should respect the limit on inserts', async () => {
      await recreateTheBackfillMethod();
      await recreateTheUpsertMethod();

      // upsert 5 cars
      const idsOfNewCars = [
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
      ];

      // show that before deleting, nothing was needed to be done
      const rowsAffectedByBackfill = await backfillCurrentVersionPointers();
      expect(rowsAffectedByBackfill).toEqual(0);

      // manually update each row, ensuring that ids are out of sync
      await Promise.all(idsOfNewCars.map(async (id) => deleteCvpRecordForCarById({ id })));

      // show that limit is respected
      const rowsAffectedByBackfillNow = await backfillCurrentVersionPointers({ limit: 3 });
      expect(rowsAffectedByBackfillNow).toEqual(3);

      // and double prove it by showing that the remainder will be backfilled on running it again
      const rowsAffectedByBackfillNowAgain = await backfillCurrentVersionPointers({ limit: 1000 });
      expect(rowsAffectedByBackfillNowAgain).toEqual(2);
    });

    const manuallyChangeVersionOfCarById = async ({ id }: { id: number }) => {
      await dbConnection.query({
        sql: `
        INSERT INTO car_version
        (car_id, name, wheels)
        VALUES
        (${id}, 'the world famous twenty-one wheeler', 21);
      `,
      });
    };
    it('should respect the limit on updates', async () => {
      await recreateTheBackfillMethod();
      await recreateTheUpsertMethod();

      // upsert 5 cars
      const idsOfNewCars = [
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
      ];

      // show that before updating, nothing was needed to be done
      const rowsAffectedByBackfill = await backfillCurrentVersionPointers();
      expect(rowsAffectedByBackfill).toEqual(0);

      // manually update each row, ensuring that ids are out of sync
      await Promise.all(idsOfNewCars.map(async (id) => manuallyChangeVersionOfCarById({ id })));

      // show that limit is respected
      const rowsAffectedByBackfillNow = await backfillCurrentVersionPointers({ limit: 3 });
      expect(rowsAffectedByBackfillNow).toEqual(3);

      // and double prove it by showing that the remainder will be backfilled on running it again
      const rowsAffectedByBackfillNowAgain = await backfillCurrentVersionPointers({ limit: 1000 });
      expect(rowsAffectedByBackfillNowAgain).toEqual(2);
    });
    it('should respect the limit on combinations of inserts and updates', async () => {
      await recreateTheBackfillMethod();
      await recreateTheUpsertMethod();

      // upsert 5 cars
      const idsOfNewCarsToDeleteRecordsFor = [
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
      ];
      const idsOfNewCarsToUpdate = [
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
        await upsertNewCar(),
      ];

      // show that before updating, nothing was needed to be done
      const rowsAffectedByBackfill = await backfillCurrentVersionPointers();
      expect(rowsAffectedByBackfill).toEqual(0);

      // manually update each row, ensuring that ids are out of sync
      await Promise.all(idsOfNewCarsToDeleteRecordsFor.map(async (id) => deleteCvpRecordForCarById({ id })));
      await Promise.all(idsOfNewCarsToUpdate.map(async (id) => manuallyChangeVersionOfCarById({ id })));

      // show that limit is respected
      const rowsAffectedByBackfillNow = await backfillCurrentVersionPointers({ limit: 7 });
      expect(rowsAffectedByBackfillNow).toEqual(7);

      // and double prove it by showing that the remainder will be backfilled on running it again
      const rowsAffectedByBackfillNowAgain = await backfillCurrentVersionPointers({ limit: 1000 });
      expect(rowsAffectedByBackfillNowAgain).toEqual(3);
    });
  });
});
