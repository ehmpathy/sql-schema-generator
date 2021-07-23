import uuid from 'uuid/v4';
import { pg as prepare } from 'yesql';

import { DatabaseConnection, getDatabaseConnection } from '../../../__test_utils__/databaseConnection';
import { Entity, ValueObject } from '../../../types';
import * as prop from '../../define/defineProperty';
import { createTablesForEntity, dropTablesForEntity } from '../__test_utils__';
import { dropAndCreateUpsertFunctionForEntity } from '../__test_utils__/dropAndCreateUpsertForEntity';
import { dropAndCreateViewForEntity } from '../__test_utils__/dropAndCreateViewForEntity';
import { getEntityFromCurrentView } from '../__test_utils__/getEntityFromCurrentView';
import { generateEntityCurrentView } from './generateEntityCurrentView';

describe('generateEntityViewCurrent', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  describe('static entity', () => {
    describe('without array properties', () => {
      const address = new Entity({
        name: 'alternative_address',
        properties: {
          street: prop.VARCHAR(255),
          suite: {
            ...prop.VARCHAR(255),
            nullable: true,
          },
          city: prop.VARCHAR(255),
          country: prop.ENUM(['US', 'CA', 'MX']),
          weekday_found: {
            // non-unique but static property -> only track the first value
            ...prop.VARCHAR(15),
            nullable: true,
          },
        },
        unique: ['street', 'suite', 'city', 'country'],
      });
      it('should not create a _current view for static entities without array properties', async () => {
        const view = generateEntityCurrentView({ entity: address });
        expect(view).toEqual(null);
      });
    });
    describe('with array properties', () => {
      const lock = new ValueObject({
        name: 'door_lock',
        properties: {
          manufacturer: prop.VARCHAR(255),
          manufacturerId: prop.VARCHAR(255),
        },
      });
      const door = new ValueObject({
        name: 'door',
        properties: {
          color: prop.ENUM(['red', 'green', 'blue']),
          lock_ids: prop.ARRAY_OF(prop.REFERENCES(lock)), // e.g., can have one lock or two locks
        },
      });
      const upsertLock = async ({ manufacturer, manufacturerId }: { manufacturer: string; manufacturerId: string }) => {
        const result = await dbConnection.query(
          prepare(`
            SELECT * FROM upsert_${lock.name}(
              :manufacturer,
              :manufacturerId
            );
        `)({
            manufacturer,
            manufacturerId,
          }),
        );
        return result.rows[0].id;
      };
      const upsertDoor = async ({ color, lock_ids }: { color: string; lock_ids: string }) => {
        const result = await dbConnection.query(
          prepare(`
            SELECT * FROM upsert_${door.name}(
              :color,
              :lock_ids
            );
        `)({
            color,
            lock_ids,
          }),
        );
        return result.rows[0].id;
      };
      const getEntityFromView = async ({ id }: { id: number }) =>
        getEntityFromCurrentView({ id, entity: door, dbConnection });
      beforeAll(async () => {
        await dropTablesForEntity({ entity: door, dbConnection });
        await dropTablesForEntity({ entity: lock, dbConnection });
        await createTablesForEntity({ entity: lock, dbConnection });
        await createTablesForEntity({ entity: door, dbConnection });
        await dropAndCreateUpsertFunctionForEntity({ entity: lock, dbConnection });
        await dropAndCreateUpsertFunctionForEntity({ entity: door, dbConnection });
      });
      it('should generate good looking and consistent sql', () => {
        const view = generateEntityCurrentView({ entity: door });
        expect(view).not.toEqual(null);
        expect(view!.sql).toMatchSnapshot(); // review this manually for changes
      });

      it('should show the entity accurately', async () => {
        await dropAndCreateViewForEntity({ entity: door, dbConnection });
        const lockIds = [
          await upsertLock({ manufacturer: uuid(), manufacturerId: uuid() }),
          await upsertLock({ manufacturer: uuid(), manufacturerId: uuid() }),
          await upsertLock({ manufacturer: uuid(), manufacturerId: uuid() }),
        ].join(',');

        const props = {
          color: 'red',
          lock_ids: `{${lockIds}}`,
        };
        const id = await upsertDoor(props);

        // // check that the static part was accurate
        const entity = await getEntityFromView({ id });
        expect({ ...entity, lock_ids: `{${entity.lock_ids.join(',')}}` }).toMatchObject(props);
        expect(entity.uuid.length).toEqual(36); // sanity check that its a uuid
        expect(entity.id).toEqual(id);
      });
      it('should still return an array even if an array property for the entity is empty', async () => {
        await dropAndCreateViewForEntity({ entity: door, dbConnection });

        const props = {
          color: 'red',
          lock_ids: '{}',
        };
        const id = await upsertDoor(props);

        // // check that the static part was accurate
        const entity = await getEntityFromView({ id });
        expect(Array.isArray(entity.lock_ids));
        expect(entity.lock_ids).toEqual([]);
      });
    });
  });
  describe('versioned entity', () => {
    describe('without array properties', () => {
      const user = new Entity({
        name: 'alternative_user',
        properties: {
          cognito_uuid: prop.UUID(),
          name: {
            ...prop.VARCHAR(255),
            updatable: true,
          },
          bio: {
            ...prop.TEXT(),
            updatable: true,
            nullable: true,
          },
        },
        unique: ['cognito_uuid'],
      });
      beforeAll(async () => {
        await dropTablesForEntity({ entity: user, dbConnection });
        await createTablesForEntity({ entity: user, dbConnection });
        await dropAndCreateUpsertFunctionForEntity({ entity: user, dbConnection });
      });
      const getEntityFromView = async ({ id }: { id: number }) =>
        getEntityFromCurrentView({ id, entity: user, dbConnection });
      const upsertUser = async ({ cognito_uuid, name, bio }: { cognito_uuid: string; name: string; bio?: string }) => {
        const result = await dbConnection.query(
          prepare(`
        SELECT * FROM upsert_${user.name}(
          :cognito_uuid,
          :name,
          :bio
        );
      `)({
            cognito_uuid,
            name,
            bio,
          }),
        );
        return result.rows[0].id;
      };
      it('should generate good looking and consistent sql', () => {
        const view = generateEntityCurrentView({ entity: user });
        expect(view).not.toEqual(null);
        expect(view!.sql).toMatchSnapshot(); // review this manually for changes
      });
      it('should show the entity accurately', async () => {
        await dropAndCreateViewForEntity({ entity: user, dbConnection });
        const props = {
          cognito_uuid: uuid(),
          name: 'hank hill',
          bio: 'i sell propane and propane accessories',
        };
        const id = await upsertUser(props);

        // check that the static part was accurate
        const entity = await getEntityFromView({ id });
        expect(entity).toMatchObject(props);
        expect(entity.uuid.length).toEqual(36); // sanity check that its a uuid
        expect(entity.id).toEqual(id);
      });
      it('should always show the current version', async () => {
        await dropAndCreateViewForEntity({ entity: user, dbConnection });
        const props = {
          cognito_uuid: uuid(),
          name: 'hank hill',
          bio: 'i sell propane and propane accessories',
        };
        const id = await upsertUser(props);
        const idAgain = await upsertUser({ ...props, name: 'Hank Hillerson' });
        await upsertUser({ ...props, name: 'Hank Hillbody', bio: undefined });
        expect(idAgain).toEqual(id);

        // check that the updated part is still accurate
        const entity = await getEntityFromView({ id });
        expect(entity).toMatchObject({ ...props, name: 'Hank Hillbody', bio: null });
      });
    });
    describe('with array properties', () => {
      const wheel = new ValueObject({
        name: 'wheel',
        properties: {
          name: prop.VARCHAR(255),
        },
      });
      const vehicle = new Entity({
        name: 'vehicle',
        properties: {
          name: prop.VARCHAR(255),
          wheel_ids: {
            ...prop.ARRAY_OF(prop.REFERENCES(wheel)),
            updatable: true, // the wheels on a vehicle can change
          },
        },
        unique: ['name'],
      });
      beforeAll(async () => {
        await dropTablesForEntity({ entity: vehicle, dbConnection });
        await dropTablesForEntity({ entity: wheel, dbConnection });
        await createTablesForEntity({ entity: wheel, dbConnection });
        await createTablesForEntity({ entity: vehicle, dbConnection });

        await dropAndCreateUpsertFunctionForEntity({ entity: wheel, dbConnection });
        await dropAndCreateUpsertFunctionForEntity({ entity: vehicle, dbConnection });
      });
      const getEntityFromView = async ({ id }: { id: number }) =>
        getEntityFromCurrentView({ id, entity: vehicle, dbConnection });
      const upsertVehicle = async ({ name, wheel_ids }: { name: string; wheel_ids: string }) => {
        const result = await dbConnection.query(
          prepare(`
          SELECT * FROM upsert_${vehicle.name}(
            :name,
            :wheel_ids
          );
        `)({
            name,
            wheel_ids,
          }),
        );
        return result.rows[0].id;
      };
      const upsertWheel = async ({ name }: { name: string }) => {
        const result = await dbConnection.query(
          prepare(`
          SELECT * FROM upsert_${wheel.name}(
            :name
          );
        `)({
            name,
          }),
        );
        return result.rows[0].id;
      };
      it('should generate good looking and consistent sql', () => {
        const view = generateEntityCurrentView({ entity: vehicle });
        expect(view).not.toEqual(null);
        expect(view!.sql).toMatchSnapshot(); // review this manually for changes
      });
      it('should show the entity accurately', async () => {
        await dropAndCreateViewForEntity({ entity: vehicle, dbConnection });
        const wheelIds = [
          await upsertWheel({ name: uuid() }),
          await upsertWheel({ name: uuid() }),
          await upsertWheel({ name: uuid() }),
        ].join(',');
        const props = {
          name: uuid(),
          wheel_ids: `{${wheelIds}}`,
        };
        const id = await upsertVehicle(props);

        // check that the static part was accurate
        const entity = await getEntityFromView({ id });
        expect({ ...entity, wheel_ids: `{${entity.wheel_ids.join(',')}}` }).toMatchObject(props);
        expect(entity.uuid.length).toEqual(36); // sanity check that its a uuid
        expect(entity.id).toEqual(id);
      });
      it('should always show the current version', async () => {
        await dropAndCreateViewForEntity({ entity: vehicle, dbConnection });

        // create original version of entity
        const wheelIds = [
          await upsertWheel({ name: uuid() }),
          await upsertWheel({ name: uuid() }),
          await upsertWheel({ name: uuid() }),
        ].join(',');
        const props = {
          name: uuid(),
          wheel_ids: `{${wheelIds}}`,
        };
        const id = await upsertVehicle(props);

        // update the entity dynamic properties
        const updatedProps = {
          ...props,
          wheel_ids: `{${wheelIds
            .split(',')
            .slice(1, 2)
            .join(',')}}`,
        };
        const idAgain = await upsertVehicle(updatedProps);
        expect(idAgain).toEqual(id);

        // check that the updated part is still accurate
        const entity = await getEntityFromView({ id });
        expect({ ...entity, wheel_ids: `{${entity.wheel_ids.join(',')}}` }).toMatchObject(updatedProps);
      });
    });
  });
});
