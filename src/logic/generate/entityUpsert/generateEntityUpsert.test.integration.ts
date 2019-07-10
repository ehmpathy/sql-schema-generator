import uuid from 'uuid/v4';
import { mysql as prepare } from 'yesql';
import { Entity } from '../../../types';
import * as prop from '../../define/defineProperty';
import { DatabaseConnection, getDatabaseConnection } from '../_test_utils/databaseConnection';
import { generateEntityTables } from '../entityTables/generateEntityTables';
import { generateEntityUpsert } from './generateEntityUpsert';

describe('generateEntityUpsert', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  describe('static entity', () => {
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
        weekday_found: { // non-unique but static property -> only track the first value
          ...prop.VARCHAR(15),
          nullable: true,
        },
      },
      unique: ['street', 'suite', 'city', 'country'],
    });
    beforeAll(async () => {
      // provision the table
      const tables = await generateEntityTables({ entity: address });
      await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.static.name};` });
      await dbConnection.query({ sql: tables.static.sql });
    });
    const recreateTheUpsertMethod = async () => {
      const { name, sql: upsertSql } = generateEntityUpsert({ entity: address });
      await dbConnection.query({ sql: `DROP FUNCTION IF EXISTS ${name}` });
      await dbConnection.query({ sql: upsertSql });
      return upsertSql;
    };
    const upsertAddress = async ({ street, suite, city, country, weekday_found }: {
      street: string,
      suite: string | null,
      city: string,
      country: string,
      weekday_found?: string,
    }) => {
      const result = await dbConnection.query(prepare(`
        SELECT upsert_${address.name}(
          :street,
          :suite,
          :city,
          :country,
          :weekday_found
        ) as id;
      `)({
        street,
        suite,
        city,
        country,
        weekday_found: weekday_found || null,
      })) as any;
      return result[0][0].id;
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(prepare(`
        select * from ${address.name} where id = :id
      `)({ id })) as any;
      return result[0][0];
    };
    it('should create the entity accurately', async () => {
      const sql = await recreateTheUpsertMethod();
      const props = {
        street: '__STREET__',
        suite: '__SUITE__',
        city: '__CITY__',
        country: 'US',
      };
      const id = await upsertAddress(props);
      const entity = await getEntityStatic({ id });
      expect(entity.uuid.length).toEqual(36); // uuid was generated
      expect(entity).toMatchObject(props);
      expect(sql).toMatchSnapshot();
    });
    it('should not create a second entity, if unique properties are the same', async () => { // idempotency
      await recreateTheUpsertMethod();
      const props = {
        street: '__STREET__',
        suite: '__SUITE__',
        city: '__CITY__',
        country: 'US',
      };
      const id = await upsertAddress(props);
      const idAgain = await upsertAddress(props);
      expect(id).toEqual(idAgain);
    });
    it('should not create a duplicate entity even if static entity has nullable value as part of unique column', async () => {
      await recreateTheUpsertMethod();
      const props = {
        street: '__STREET__',
        suite: null,
        city: '__CITY__',
        country: 'US',
      };
      const id = await upsertAddress(props);
      const idAgain = await upsertAddress(props);
      expect(id).toEqual(idAgain);
    });
    it('should not create a duplicate entity even if the new upsert has changed a non-unique but static property', async () => {
      // non unique + static -> we dont care if it changes for this entity, we just want the first value; otherwise, it is dynamic
      await recreateTheUpsertMethod();
      const props = {
        street: '__STREET__',
        suite: null,
        city: '__CITY__',
        country: 'US',
      };
      const id = await upsertAddress(props);
      const idAgain = await upsertAddress({ ...props, weekday_found: 'friday' });
      expect(id).toEqual(idAgain);
    });
    it('should be case sensisitive in deciding whether values are unique', async () => { // mysql is not case sensitive by default, so we must make sure that somehow we meet this condition (options include default encode on table/column, binary on search, and data hashing)
      await recreateTheUpsertMethod();
      await recreateTheUpsertMethod();
      const props = {
        street: '__STREET__',
        suite: '__SUITE__',
        city: '__CITY__',
        country: 'US',
      };
      const id = await upsertAddress(props);
      const idAgain = await upsertAddress({ ...props, city: props.city.toLowerCase() });
      expect(id).not.toEqual(idAgain);
    });
  });
  describe('versioned entity', () => {
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
      // provision the table
      const tables = await generateEntityTables({ entity: user });
      await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.version!.name};` });
      await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.static.name};` });
      await dbConnection.query({ sql: tables.static.sql });
      await dbConnection.query({ sql: tables.version!.sql });
    });
    const recreateTheUpsertMethod = async () => {
      const { name, sql: upsertSql } = generateEntityUpsert({ entity: user });
      await dbConnection.query({ sql: `DROP FUNCTION IF EXISTS ${name}` });
      await dbConnection.query({ sql: upsertSql });
      return { name, sql: upsertSql };
    };
    const upsertUser = async ({ cognito_uuid, name, bio }: {
      cognito_uuid: string,
      name: string,
      bio?: string,
    }) => {
      const result = await dbConnection.query(prepare(`
        SELECT upsert_${user.name}(
          :cognito_uuid,
          :name,
          :bio
        ) as id;
      `)({
        cognito_uuid,
        name,
        bio,
      })) as any;
      return result[0][0].id;
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(prepare(`
        select * from ${user.name} where id = :id
      `)({ id })) as any;
      return result[0][0];
    };
    const getEntityVersions = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(prepare(`
        select * from ${user.name}_version where ${user.name}_id = :id
      `)({ id })) as any;
      return result[0];
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async() => {
      const { sql, name } = await recreateTheUpsertMethod();
      const result = await dbConnection.query({
        sql: `SHOW CREATE FUNCTION ${name}`,
      }) as any;
      const showCreateSql = result[0][0]['Create Function'];
      expect(sql).toEqual(showCreateSql);
    });
    it('should create the entity accurately', async () => {
      const { sql } = await recreateTheUpsertMethod();
      const props = {
        cognito_uuid: uuid(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const id = await upsertUser(props);

      // check that the static part was accurate
      const entityStatic = await getEntityStatic({ id });
      expect(entityStatic.uuid.length).toEqual(36); // uuid was generated
      expect(entityStatic.cognito_uuid).toEqual(props.cognito_uuid);

      // check that the versioned part is accurate
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
      expect(versions[0].name).toEqual(props.name);
      expect(versions[0].bio).toEqual(props.bio);

      // show an example of the upsert function
      expect(sql).toMatchSnapshot();
    });
    it('should update the entity if the updateble data changed', async () => {
      await recreateTheUpsertMethod();
      const props = {
        cognito_uuid: uuid(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const id = await upsertUser(props);
      const idAgain = await upsertUser({ ...props, name: 'Hank\'s Hill' });
      expect(id).toEqual(idAgain);

      // expect two versions
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(2);

      // expect newest version to have updated name
      expect(versions[1].name).toEqual('Hank\'s Hill');
    });
    it('should be case sensitive in determining updateable data has changed', async () => {  // mysql is not case sensitive by default, so we must make sure that somehow we meet this condition (options include default encode on table/column, binary on search, and data hashing)
      await recreateTheUpsertMethod();
      const props = {
        cognito_uuid: uuid(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const id = await upsertUser(props);
      const idAgain = await upsertUser({ ...props, name: 'Hank Hill' });
      expect(id).toEqual(idAgain);

      // expect two versions
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(2);

      // expect newest version to have updated name
      expect(versions[1].name).toEqual('Hank Hill');
    });
    it('should not create a new version if the updateable data did not change', async () => { // i.e., idempotency
      await recreateTheUpsertMethod();
      const props = {
        cognito_uuid: uuid(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const id = await upsertUser(props);
      const idAgain = await upsertUser(props);
      expect(id).toEqual(idAgain);

      // expect only one versions
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
    });
    it('should not create a new version if the updateable data did not change, even if one of fields is null', async () => { // i.e., idempotency
      await recreateTheUpsertMethod();
      const props = {
        cognito_uuid: uuid(),
        name: 'hank hill',
      };
      const id = await upsertUser(props);
      const idAgain = await upsertUser(props);
      expect(id).toEqual(idAgain);

      // expect only one versions
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
    });
  });
});
