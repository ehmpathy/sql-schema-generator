import sha256 from 'simple-sha256';
import uuid from 'uuid/v4';
import { mysql as prepare } from 'yesql';

import { Entity, ValueObject } from '../../../../types';
import * as prop from '../../../define/defineProperty';
import {
  createTablesForEntity,
  DatabaseConnection,
  dropTablesForEntity,
  getDatabaseConnection,
} from '../../__test_utils__';
import { dropAndCreateUpsertFunctionForEntity } from '../../__test_utils__/dropAndCreateUpsertForEntity';
import { provisionGetFromDelimiterSplitStringFunction } from '../../__test_utils__/provisionGetFromDelimiterSplitStringFunction';
import { generateEntityUpsert } from './generateEntityUpsert';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
      name: 'address_2',
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
    beforeAll(async () => {
      // provision the table
      await dropTablesForEntity({ entity: address, dbConnection });
      await createTablesForEntity({ entity: address, dbConnection });

      // provision the upsert
      await dropAndCreateUpsertFunctionForEntity({ entity: address, dbConnection });
    });
    const upsertAddress = async ({
      street,
      suite,
      city,
      country,
      weekday_found,
    }: {
      street: string;
      suite: string | null;
      city: string;
      country: string;
      weekday_found?: string;
    }) => {
      const result = (await dbConnection.query(
        prepare(`
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
        }),
      )) as any;
      return result[0][0].id;
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = (await dbConnection.query(
        prepare(`
        select * from ${address.name} where id = :id
      `)({ id }),
      )) as any;
      return result[0][0];
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
      const { sql, name } = generateEntityUpsert({ entity: address });
      const result = (await dbConnection.query({
        sql: `SHOW CREATE FUNCTION ${name}`,
      })) as any;
      const showCreateSql = result[0][0]['Create Function'].replace(' DEFINER=`root`@`%`', ''); // ignoring the definer part
      expect(sql).toEqual(showCreateSql);

      // show an example of the upsert function
      expect(sql).toMatchSnapshot();
    });
    it('should create the entity accurately', async () => {
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
    });
    it('should not create a second entity, if unique properties are the same', async () => {
      // idempotency
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
    it('should be case sensitive in deciding whether values are unique', async () => {
      // mysql is not case sensitive by default, so we must make sure that somehow we meet this condition (options include default encode on table/column, binary on search, and data hashing)
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
      await dropTablesForEntity({ entity: user, dbConnection });
      await createTablesForEntity({ entity: user, dbConnection });

      // provision the upsert
      await dropAndCreateUpsertFunctionForEntity({ entity: user, dbConnection });
    });
    const upsertUser = async ({ cognito_uuid, name, bio }: { cognito_uuid: string; name: string; bio?: string }) => {
      const result = (await dbConnection.query(
        prepare(`
        SELECT upsert_${user.name}(
          :cognito_uuid,
          :name,
          :bio
        ) as id;
      `)({
          cognito_uuid,
          name,
          bio,
        }),
      )) as any;
      return result[0][0].id;
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = (await dbConnection.query(
        prepare(`
        select * from ${user.name} where id = :id
      `)({ id }),
      )) as any;
      return result[0][0];
    };
    const getEntityVersions = async ({ id }: { id: number }) => {
      const result = (await dbConnection.query(
        prepare(`
        select * from ${user.name}_version where ${user.name}_id = :id
      `)({ id }),
      )) as any;
      return result[0];
    };
    const getEntityCurrentVersionPointer = async ({ id }: { id: number }) => {
      const result = (await dbConnection.query(
        prepare(`
        select * from ${user.name}_cvp where ${user.name}_id = :id
      `)({ id }),
      )) as any;
      return result[0];
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
      const { sql, name } = generateEntityUpsert({ entity: user });
      const result = (await dbConnection.query({
        sql: `SHOW CREATE FUNCTION ${name}`,
      })) as any;
      const showCreateSql = result[0][0]['Create Function'].replace(' DEFINER=`root`@`%`', ''); // ignoring the definer part
      expect(sql).toEqual(showCreateSql);

      // show an example of the upsert function
      expect(sql).toMatchSnapshot();
    });
    it('should create the entity accurately', async () => {
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

      // check that the current version table is initialized accurately
      const currentVersionPointers = await getEntityCurrentVersionPointer({ id });
      expect(currentVersionPointers.length).toEqual(1);
      expect(currentVersionPointers[0][`${user.name}_version_id`]).toEqual(versions[0].id);
    });
    it('should update the entity if the updateable data changed', async () => {
      const props = {
        cognito_uuid: uuid(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const id = await upsertUser(props);
      const idAgain = await upsertUser({ ...props, name: "Hank's Hill" });
      expect(id).toEqual(idAgain);

      // expect two versions
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(2);

      // expect newest version to have updated name
      expect(versions[1].name).toEqual("Hank's Hill");

      // expect the current version pointer to be pointing to the newest version
      const currentVersionPointers = await getEntityCurrentVersionPointer({ id });
      expect(currentVersionPointers.length).toEqual(1);
      expect(currentVersionPointers[0][`${user.name}_version_id`]).toEqual(versions[1].id);
    });
    it('should be case sensitive in determining updateable data has changed', async () => {
      // mysql is not case sensitive by default, so we must make sure that somehow we meet this condition (options include default encode on table/column, binary on search, and data hashing)
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
    it('should not create a new version if the updateable data did not change', async () => {
      // i.e., idempotency
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
    it('should not create a new version if the updateable data did not change, even if one of fields is null', async () => {
      // i.e., idempotency
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

    it('should not update the current version pointer table if a new version was not created', async () => {
      // i.e., idempotency
      const props = {
        cognito_uuid: uuid(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const id = await upsertUser(props);

      // check the pointer before the no-op upsert
      const initialVersionPointers = await getEntityCurrentVersionPointer({ id });
      expect(initialVersionPointers.length).toEqual(1);
      const initialVersionPointer = initialVersionPointers[0];

      // make the upsert
      await sleep(1000); // sleep to make extra sure that if we do update the current_version_pointer table, that the timestamp will be different
      const idAgain = await upsertUser(props);
      expect(id).toEqual(idAgain);

      // expect prove its  a no-op
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);

      // now prove that the current version pointer table was not updated since the initial pointer was defined
      const currentVersionPointers = await getEntityCurrentVersionPointer({ id });
      expect(currentVersionPointers.length).toEqual(1);
      expect(initialVersionPointer.created_at).toEqual(currentVersionPointers[0].created_at); // timestamps should be identical
    });
  });

  describe('entity with array properties', () => {
    const language = new ValueObject({
      name: 'language',
      properties: {
        name: prop.VARCHAR(255),
      },
    });
    const producer = new ValueObject({
      name: 'producer',
      properties: {
        name: prop.VARCHAR(255),
      },
    });
    const movie = new Entity({
      name: 'movie',
      properties: {
        name: prop.VARCHAR(255),
        producer_ids: prop.ARRAY_OF(prop.REFERENCES(producer)),
        language_ids: {
          ...prop.ARRAY_OF(prop.REFERENCES(language)),
          updatable: true, // the languages a movie is available in can change over time
        },
      },
      unique: ['name', 'producer_ids'],
    });
    beforeAll(async () => {
      // provision the tables
      await dropTablesForEntity({ entity: movie, dbConnection });
      await dropTablesForEntity({ entity: producer, dbConnection });
      await dropTablesForEntity({ entity: language, dbConnection });
      await createTablesForEntity({ entity: language, dbConnection });
      await createTablesForEntity({ entity: producer, dbConnection });
      await createTablesForEntity({ entity: movie, dbConnection });

      // provision the upserts
      await provisionGetFromDelimiterSplitStringFunction({ dbConnection });
      await dropAndCreateUpsertFunctionForEntity({ entity: language, dbConnection });
      await dropAndCreateUpsertFunctionForEntity({ entity: producer, dbConnection });
      await dropAndCreateUpsertFunctionForEntity({ entity: movie, dbConnection });
    });
    const upsertLanguage = async ({ name }: { name: string }) => {
      const result = (await dbConnection.query(
        prepare(`
        SELECT upsert_${language.name}(
          :name
        ) as id;
      `)({
          name,
        }),
      )) as any;
      return result[0][0].id as number;
    };
    const upsertProducer = async ({ name }: { name: string }) => {
      const result = (await dbConnection.query(
        prepare(`
        SELECT upsert_${producer.name}(
          :name
        ) as id;
      `)({
          name,
        }),
      )) as any;
      return result[0][0].id as number;
    };
    const upsertMovie = async ({
      name,
      producer_ids,
      language_ids,
    }: {
      name: string;
      producer_ids: number[];
      language_ids: number[];
    }) => {
      const result = (await dbConnection.query(
        prepare(`
        SELECT upsert_${movie.name}(
          :name,
          :producer_ids,
          :language_ids
        ) as id;
      `)({
          name,
          producer_ids: producer_ids.join(','),
          language_ids: language_ids.join(','),
        }),
      )) as any;
      return result[0][0].id as number;
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = (await dbConnection.query(
        prepare(`
        select * from ${movie.name} where id = :id
      `)({ id }),
      )) as any;
      return result[0][0];
    };
    const getEntityVersions = async ({ id }: { id: number }) => {
      const result = (await dbConnection.query(
        prepare(`
        select * from ${movie.name}_version where ${movie.name}_id = :id
      `)({ id }),
      )) as any;
      return result[0];
    };
    const getEntityCurrentVersionPointer = async ({ id }: { id: number }) => {
      const result = (await dbConnection.query(
        prepare(`
        select * from ${movie.name}_cvp where ${movie.name}_id = :id
      `)({ id }),
      )) as any;
      return result[0];
    };
    const getProducerMappingTableEntries = async ({ id }: { id: number }) => {
      const result = (await dbConnection.query(
        prepare(`
        select * from ${movie.name}_to_${producer.name} where ${movie.name}_id = :id
      `)({ id }),
      )) as any;
      return result[0];
    };
    const getLanguageMappingTableEntries = async ({ versionId }: { versionId: number }) => {
      const result = (await dbConnection.query(
        prepare(`
        select * from ${movie.name}_version_to_${language.name} where ${movie.name}_version_id = :versionId
      `)({ versionId }),
      )) as any;
      return result[0];
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
      const { sql } = generateEntityUpsert({ entity: movie });
      const result = (await dbConnection.query({
        sql: `SHOW CREATE FUNCTION upsert_${movie.name}`,
      })) as any;
      const showCreateSql = result[0][0]['Create Function'].replace(' DEFINER=`root`@`%`', ''); // ignoring the definer part
      expect(sql).toEqual(showCreateSql);
      expect(sql).toMatchSnapshot();
    });
    it('should define the array values properly', async () => {
      const producerIds = [await upsertProducer({ name: uuid() }), await upsertProducer({ name: uuid() })];
      const languageIds = [
        await upsertLanguage({ name: uuid() }),
        await upsertLanguage({ name: uuid() }),
        await upsertLanguage({ name: uuid() }),
      ];
      const movieProps = {
        name: uuid(),
        producer_ids: producerIds,
        language_ids: languageIds,
      };
      const id = await upsertMovie(movieProps);

      // check that the static part was accurate
      const entityStatic = await getEntityStatic({ id });
      expect(entityStatic.uuid.length).toEqual(36); // uuid was generated
      expect(entityStatic.producer_ids_hash).toEqual(sha256.sync(movieProps.producer_ids.join(',')));

      // check that the versioned part is accurate
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
      expect(versions[0].language_ids_hash).toEqual(sha256.sync(movieProps.language_ids.join(',')));

      // check that the current version table is initialized accurately
      const currentVersionPointers = await getEntityCurrentVersionPointer({ id });
      expect(currentVersionPointers.length).toEqual(1);
      expect(currentVersionPointers[0][`${movie.name}_version_id`]).toEqual(versions[0].id);

      // check that the mapping tables are accurate
      const producerMappings = await getProducerMappingTableEntries({ id });
      expect(producerMappings.length).toEqual(producerIds.length);
      producerIds.forEach((producerId) => {
        expect(producerMappings.map((mapping: any) => mapping.producer_id)).toContainEqual(producerId);
      });
      const languageMappings = await getLanguageMappingTableEntries({ versionId: versions[0].id });
      expect(languageMappings.length).toEqual(languageIds.length);
      languageIds.forEach((languageId) => {
        expect(languageMappings.map((mapping: any) => mapping.language_id)).toContainEqual(languageId);
      });
    });
    it('should update the entity if the updateable array has changed', async () => {
      const producerIds = [await upsertProducer({ name: uuid() }), await upsertProducer({ name: uuid() })];
      const languageIds = [
        await upsertLanguage({ name: uuid() }),
        await upsertLanguage({ name: uuid() }),
        await upsertLanguage({ name: uuid() }),
      ];
      const movieProps = {
        name: uuid(),
        producer_ids: producerIds,
        language_ids: languageIds,
      };

      // create the movie
      const id = await upsertMovie(movieProps);

      // alter the languages its in and upsert it again
      const updatedLanguageIds = movieProps.language_ids.slice(0, 1);
      const idAgain = await upsertMovie({ ...movieProps, language_ids: updatedLanguageIds });
      expect(id).toEqual(idAgain); // should update the same entity

      // expect two versions now
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(2);

      // check that new version data is accurate
      expect(versions[1].language_ids_hash).toEqual(sha256.sync(movieProps.language_ids.slice(0, 1).join(',')));

      // check that the current version table is pointing to the right version
      const currentVersionPointers = await getEntityCurrentVersionPointer({ id });
      expect(currentVersionPointers.length).toEqual(1);
      expect(currentVersionPointers[0][`${movie.name}_version_id`]).toEqual(versions[1].id);

      // check that the mapping tables are accurate
      const languageMappings = await getLanguageMappingTableEntries({ versionId: versions[1].id });
      expect(languageMappings.length).toEqual(updatedLanguageIds.length);
      updatedLanguageIds.forEach((languageId) => {
        expect(languageMappings.map((mapping: any) => mapping.language_id)).toContainEqual(languageId);
      });
    });
    it('should not create a new version if the updateable array did not change', async () => {
      const producerIds = [await upsertProducer({ name: uuid() }), await upsertProducer({ name: uuid() })];
      const languageIds = [
        await upsertLanguage({ name: uuid() }),
        await upsertLanguage({ name: uuid() }),
        await upsertLanguage({ name: uuid() }),
      ];
      const movieProps = {
        name: uuid(),
        producer_ids: producerIds,
        language_ids: languageIds,
      };

      // create the movie
      const id = await upsertMovie(movieProps);

      // alter the languages its in and upsert it again
      const idAgain = await upsertMovie(movieProps);
      expect(id).toEqual(idAgain); // should update the same entity

      // expect one version still
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);

      // check that the mapping tables are accurate
      const languageMappings = await getLanguageMappingTableEntries({ versionId: versions[0].id });
      expect(languageMappings.length).toEqual(languageIds.length);
      languageIds.forEach((languageId) => {
        expect(languageMappings.map((mapping: any) => mapping.language_id)).toContainEqual(languageId);
      });
    });
  });
});
