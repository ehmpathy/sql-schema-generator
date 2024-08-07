import sha256 from 'simple-sha256';
import { pg as prepare } from 'yesql';

import { normalizeCreateFunctionDdl } from '../../../../__nonpublished_modules__/postgres-show-create-ddl/showCreateFunction/normalizeCreateFunctionDdl';
import { getShowCreateFunction } from '../../../../__test_utils__/getShowCreateFunction';
import { uuid as uuidV4 } from '../../../../deps';
import { Entity, Literal } from '../../../../domain';
import * as prop from '../../../define/defineProperty';
import {
  createTablesForEntity,
  DatabaseConnection,
  dropTablesForEntity,
  getDatabaseConnection,
} from '../../__test_utils__';
import { dropAndCreateUpsertFunctionForEntity } from '../../__test_utils__/dropAndCreateUpsertForEntity';
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
        street: prop.VARCHAR(),
        suite: {
          ...prop.VARCHAR(),
          nullable: true,
        },
        city: prop.VARCHAR(),
        country: prop.ENUM(['US', 'CA', 'MX']),
        weekday_found: {
          // non-unique but static property -> only track the first value
          ...prop.VARCHAR(),
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
      await dropAndCreateUpsertFunctionForEntity({
        entity: address,
        dbConnection,
      });
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
      const result = await dbConnection.query(
        prepare(`
        SELECT * FROM upsert_${address.name}(
          :street,
          :suite,
          :city,
          :country,
          :weekday_found
        );
      `)({
          street,
          suite,
          city,
          country,
          weekday_found: weekday_found || null,
        }),
      );
      const row = result.rows[0];
      return { id: row.id, uuid: row.uuid, createdAt: row.created_at };
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${address.name} where id = :id
      `)({ id }),
      );
      return result.rows[0];
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
      const { sql, name } = generateEntityUpsert({ entity: address });
      const showCreateSql = await getShowCreateFunction({
        func: name,
        dbConnection,
      });
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
      const { id, uuid, createdAt } = await upsertAddress(props);
      expect(uuid.length).toEqual(36);
      const entity = await getEntityStatic({ id });
      expect(entity.uuid).toEqual(uuid);
      expect(entity.created_at).toEqual(createdAt);
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
      const { id } = await upsertAddress(props);
      const { id: idAgain } = await upsertAddress(props);
      expect(id).toEqual(idAgain);
    });
    it('should not create a duplicate entity even if static entity has nullable value as part of unique column', async () => {
      const props = {
        street: '__STREET__',
        suite: null,
        city: '__CITY__',
        country: 'US',
      };
      const { id } = await upsertAddress(props);
      const { id: idAgain } = await upsertAddress(props);
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
      const { id } = await upsertAddress(props);
      const { id: idAgain } = await upsertAddress({
        ...props,
        weekday_found: 'friday',
      });
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
      const { id } = await upsertAddress(props);
      const { id: idAgain } = await upsertAddress({
        ...props,
        city: props.city.toLowerCase(),
      });
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
      await dropAndCreateUpsertFunctionForEntity({
        entity: user,
        dbConnection,
      });
    });
    const upsertUser = async ({
      cognito_uuid,
      name,
      bio,
    }: {
      cognito_uuid: string;
      name: string;
      bio?: string;
    }) => {
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
      const row = result.rows[0];
      return {
        id: row.id,
        uuid: row.uuid,
        createdAt: row.created_at,
        effectiveAt: row.effective_at,
        updatedAt: row.updated_at,
      };
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${user.name} where id = :id
      `)({ id }),
      );
      return result.rows[0];
    };
    const getEntityVersions = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${user.name}_version where ${user.name}_id = :id order by created_at asc
      `)({ id }),
      );
      return result.rows;
    };
    const getEntityCurrentVersionPointer = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${user.name}_cvp where ${user.name}_id = :id
      `)({ id }),
      );
      return result.rows;
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
      const { sql, name } = generateEntityUpsert({ entity: user });
      const showCreateSql = await getShowCreateFunction({
        dbConnection,
        func: name,
      });
      expect(normalizeCreateFunctionDdl({ ddl: sql })).toEqual(showCreateSql);

      // show an example of the upsert function
      expect(sql).toMatchSnapshot();
    });
    it('should create the entity accurately', async () => {
      const props = {
        cognito_uuid: uuidV4(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const { id, uuid, createdAt, effectiveAt, updatedAt } = await upsertUser(
        props,
      );

      // check that the static part was accurate
      const entityStatic = await getEntityStatic({ id });
      expect(entityStatic.uuid.length).toEqual(36); // uuid was generated
      expect(entityStatic.cognito_uuid).toEqual(props.cognito_uuid);
      expect(uuid).toEqual(entityStatic.uuid);
      expect(createdAt).toEqual(entityStatic.created_at);

      // check that the versioned part is accurate
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
      expect(versions[0].name).toEqual(props.name);
      expect(versions[0].bio).toEqual(props.bio);
      expect(effectiveAt).toEqual(versions[0].effective_at);
      expect(updatedAt).toEqual(versions[0].created_at); // updated_at of entity = created_at of version

      // check that the current version table is initialized accurately
      const currentVersionPointers = await getEntityCurrentVersionPointer({
        id,
      });
      expect(currentVersionPointers.length).toEqual(1);
      expect(currentVersionPointers[0][`${user.name}_version_id`]).toEqual(
        versions[0].id,
      );
    });
    it('should update the entity if the updateable data changed', async () => {
      const props = {
        cognito_uuid: uuidV4(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const { id, effectiveAt } = await upsertUser(props);
      const { id: idAgain, effectiveAt: effectiveAtAgain } = await upsertUser({
        ...props,
        name: "Hank's Hill",
      });
      expect(idAgain).toEqual(id);
      expect(effectiveAtAgain).not.toEqual(effectiveAt);

      // expect two versions
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(2);
      expect(effectiveAt).toEqual(versions[0].effective_at);
      expect(effectiveAtAgain).toEqual(versions[1].effective_at);

      // expect newest version to have updated name
      expect(versions[1].name).toEqual("Hank's Hill");

      // expect the current version pointer to be pointing to the newest version
      const currentVersionPointers = await getEntityCurrentVersionPointer({
        id,
      });
      expect(currentVersionPointers.length).toEqual(1);
      expect(currentVersionPointers[0][`${user.name}_version_id`]).toEqual(
        versions[1].id,
      );
    });
    it('should be case sensitive in determining updateable data has changed', async () => {
      // mysql is not case sensitive by default, so we must make sure that somehow we meet this condition (options include default encode on table/column, binary on search, and data hashing)
      const props = {
        cognito_uuid: uuidV4(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const { id } = await upsertUser(props);
      const { id: idAgain } = await upsertUser({ ...props, name: 'Hank Hill' });
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
        cognito_uuid: uuidV4(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const { id } = await upsertUser(props);
      const { id: idAgain } = await upsertUser(props);
      expect(id).toEqual(idAgain);

      // expect only one versions
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
    });
    it('should not create a new version if the updateable data did not change, even if one of fields is null', async () => {
      // i.e., idempotency
      const props = {
        cognito_uuid: uuidV4(),
        name: 'hank hill',
      };
      const { id } = await upsertUser(props);
      const { id: idAgain } = await upsertUser(props);
      expect(id).toEqual(idAgain);

      // expect only one versions
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
    });
    it('should not update the current version pointer table if a new version was not created', async () => {
      // i.e., idempotency
      const props = {
        cognito_uuid: uuidV4(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const { id } = await upsertUser(props);

      // check the pointer before the no-op upsert
      const initialVersionPointers = await getEntityCurrentVersionPointer({
        id,
      });
      expect(initialVersionPointers.length).toEqual(1);
      const initialVersionPointer = initialVersionPointers[0];

      // make the upsert
      await sleep(1000); // sleep to make extra sure that if we do update the current_version_pointer table, that the timestamp will be different
      const { id: idAgain } = await upsertUser(props);
      expect(id).toEqual(idAgain);

      // expect prove its  a no-op
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);

      // now prove that the current version pointer table was not updated since the initial pointer was defined
      const currentVersionPointers = await getEntityCurrentVersionPointer({
        id,
      });
      expect(currentVersionPointers.length).toEqual(1);
      expect(initialVersionPointer.created_at).toEqual(
        currentVersionPointers[0].created_at,
      ); // timestamps should be identical
    });

    it('should have the same exact created_at timestamp on both the static and version rows, on first insert', async () => {
      const props = {
        cognito_uuid: uuidV4(),
        name: 'hank hill',
        bio: 'i sell propane and propane accessories',
      };
      const { id } = await upsertUser(props);

      // grab the data
      const entityStatic = await getEntityStatic({ id });
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
      const currentVersionPointers = await getEntityCurrentVersionPointer({
        id,
      });
      expect(currentVersionPointers.length).toEqual(1);

      // check that all have same timestamp
      expect(versions[0].created_at).toEqual(entityStatic.created_at);
      expect(currentVersionPointers[0].updated_at).toEqual(
        entityStatic.created_at,
      );
    });
  });

  describe('entity with array properties', () => {
    const language = new Literal({
      name: 'language',
      properties: {
        name: prop.VARCHAR(),
      },
    });
    const producer = new Literal({
      name: 'producer',
      properties: {
        name: prop.VARCHAR(),
      },
    });
    const movie = new Entity({
      name: 'movie',
      properties: {
        name: prop.VARCHAR(),
        producer_ids: prop.ARRAY_OF(prop.REFERENCES(producer)),
        language_ids: {
          ...prop.ARRAY_OF(prop.REFERENCES(language)),
          updatable: true, // the languages a movie is available in can change over time
        },
        studio_uuids: prop.ARRAY_OF(prop.UUID()), // the studios that helped make the movie (tracked in a separate database)
        poster_uuids: {
          ...prop.ARRAY_OF(prop.UUID()),
          updatable: true, // the posters advertising this movie may be updated over time
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
      await dropAndCreateUpsertFunctionForEntity({
        entity: language,
        dbConnection,
      });
      await dropAndCreateUpsertFunctionForEntity({
        entity: producer,
        dbConnection,
      });
      await dropAndCreateUpsertFunctionForEntity({
        entity: movie,
        dbConnection,
      });
    });
    const upsertLanguage = async ({ name }: { name: string }) => {
      const result = await dbConnection.query(
        prepare(`
        SELECT * FROM upsert_${language.name}(
          :name
        );
      `)({
          name,
        }),
      );
      return result.rows[0].id;
    };
    const upsertProducer = async ({ name }: { name: string }) => {
      const result = await dbConnection.query(
        prepare(`
        SELECT * FROM upsert_${producer.name}(
          :name
        );
      `)({
          name,
        }),
      );
      return result.rows[0].id;
    };
    const upsertMovie = async ({
      name,
      producer_ids,
      language_ids,
      studio_uuids,
      poster_uuids,
    }: {
      name: string;
      producer_ids: number[];
      language_ids: number[];
      studio_uuids: string[];
      poster_uuids: string[];
    }) => {
      const result = await dbConnection.query(
        prepare(`
        SELECT * FROM upsert_${movie.name}(
          :name,
          :producer_ids,
          :language_ids,
          :studio_uuids,
          :poster_uuids
        );
      `)({
          name,
          producer_ids: `{${producer_ids.join(',')}}`,
          language_ids: `{${language_ids.join(',')}}`,
          studio_uuids: `{${studio_uuids.join(',')}}`,
          poster_uuids: `{${poster_uuids.join(',')}}`,
        }),
      );
      return result.rows[0].id;
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${movie.name} where id = :id
      `)({ id }),
      );
      return result.rows[0];
    };
    const getEntityVersions = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${movie.name}_version where ${movie.name}_id = :id order by created_at asc
      `)({ id }),
      );
      return result.rows;
    };
    const getEntityCurrentVersionPointer = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${movie.name}_cvp where ${movie.name}_id = :id
      `)({ id }),
      );
      return result.rows;
    };
    const getProducerMappingTableEntries = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${movie.name}_to_${producer.name} where ${movie.name}_id = :id
      `)({ id }),
      );
      return result.rows;
    };
    const getLanguageMappingTableEntries = async ({
      versionId,
    }: {
      versionId: number;
    }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${movie.name}_version_to_${language.name} where ${movie.name}_version_id = :versionId
      `)({ versionId }),
      );
      return result.rows;
    };
    const getStudioUuidMappingTableEntries = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${movie.name}_to_studio_uuid where ${movie.name}_id = :id
      `)({ id }),
      );
      return result.rows;
    };
    const getPosterUuidMappingTableEntries = async ({
      versionId,
    }: {
      versionId: number;
    }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${movie.name}_version_to_poster_uuid where ${movie.name}_version_id = :versionId
      `)({ versionId }),
      );
      return result.rows;
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
      const { sql, name } = generateEntityUpsert({ entity: movie });
      const showCreateSql = await getShowCreateFunction({
        dbConnection,
        func: name,
      });
      expect(sql).toEqual(showCreateSql);
      expect(sql).toMatchSnapshot();
    });
    it('should define the array values properly', async () => {
      const producerIds = [
        await upsertProducer({ name: uuidV4() }),
        await upsertProducer({ name: uuidV4() }),
      ];
      const languageIds = [
        await upsertLanguage({ name: uuidV4() }),
        await upsertLanguage({ name: uuidV4() }),
        await upsertLanguage({ name: uuidV4() }),
      ];
      const movieProps = {
        name: uuidV4(),
        producer_ids: producerIds,
        language_ids: languageIds,
        studio_uuids: [uuidV4()],
        poster_uuids: [uuidV4(), uuidV4()],
      };
      const id = await upsertMovie(movieProps);

      // check that the static part was accurate
      const entityStatic = await getEntityStatic({ id });
      expect(entityStatic.uuid.length).toEqual(36); // uuid was generated
      expect(entityStatic.producer_ids_hash.toString('hex')).toEqual(
        sha256.sync(movieProps.producer_ids.join(',')),
      );
      expect(entityStatic.studio_uuids_hash.toString('hex')).toEqual(
        sha256.sync(movieProps.studio_uuids.join(',')),
      );

      // check that the versioned part is accurate
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
      expect(versions[0].language_ids_hash.toString('hex')).toEqual(
        sha256.sync(movieProps.language_ids.join(',')),
      );
      expect(versions[0].poster_uuids_hash.toString('hex')).toEqual(
        sha256.sync(movieProps.poster_uuids.join(',')),
      );

      // check that the current version table is initialized accurately
      const currentVersionPointers = await getEntityCurrentVersionPointer({
        id,
      });
      expect(currentVersionPointers.length).toEqual(1);
      expect(currentVersionPointers[0][`${movie.name}_version_id`]).toEqual(
        versions[0].id,
      );

      // check that the mapping tables are accurate
      const producerMappings = await getProducerMappingTableEntries({ id });
      expect(producerMappings.length).toEqual(producerIds.length);
      producerIds.forEach((producerId, index) => {
        expect(producerMappings[index].producer_id).toEqual(producerId); // at the expected index
        expect(producerMappings[index].array_order_index).toEqual(index + 1); // explicitly tracked. note: postgres arrays start at 1
      });
      const languageMappings = await getLanguageMappingTableEntries({
        versionId: versions[0].id,
      });
      expect(languageMappings.length).toEqual(languageIds.length);
      languageIds.forEach((languageId, index) => {
        expect(languageMappings[index].language_id).toEqual(languageId); // at the expected index
        expect(languageMappings[index].array_order_index).toEqual(index + 1); // explicitly tracked. note: postgres arrays start at 1
      });
      const studioUuidMappings = await getStudioUuidMappingTableEntries({ id });
      expect(studioUuidMappings.length).toEqual(studioUuidMappings.length);
      movieProps.studio_uuids.forEach((studioUuid, index) => {
        expect(studioUuidMappings[index].studio_uuid).toEqual(studioUuid); // at the expected index
        expect(studioUuidMappings[index].array_order_index).toEqual(index + 1); // explicitly tracked. note: postgres arrays start at 1
      });
      const posterUuidMappings = await getPosterUuidMappingTableEntries({
        versionId: versions[0].id,
      });
      expect(posterUuidMappings.length).toEqual(posterUuidMappings.length);
      movieProps.poster_uuids.forEach((posterUuid, index) => {
        expect(posterUuidMappings[index].poster_uuid).toEqual(posterUuid); // at the expected index
        expect(posterUuidMappings[index].array_order_index).toEqual(index + 1); // explicitly tracked. note: postgres arrays start at 1
      });
    });
    it('should update the entity if the updateable array has changed', async () => {
      const producerIds = [
        await upsertProducer({ name: uuidV4() }),
        await upsertProducer({ name: uuidV4() }),
      ];
      const languageIds = [
        await upsertLanguage({ name: uuidV4() }),
        await upsertLanguage({ name: uuidV4() }),
        await upsertLanguage({ name: uuidV4() }),
      ];
      const movieProps = {
        name: uuidV4(),
        producer_ids: producerIds,
        language_ids: languageIds,
        studio_uuids: [uuidV4()],
        poster_uuids: [uuidV4(), uuidV4(), uuidV4()],
      };

      // create the movie
      const id = await upsertMovie(movieProps);

      // alter the languages its in and upsert it again
      const updatedLanguageIds = [languageIds[2], languageIds[0]]; // drop middle, swap first and last
      const updatedPosterUuids = [
        movieProps.poster_uuids[1]!,
        movieProps.poster_uuids[0]!,
      ]; // drop last, swap first and middle
      const idAgain = await upsertMovie({
        ...movieProps,
        language_ids: updatedLanguageIds,
        poster_uuids: updatedPosterUuids,
      });
      expect(id).toEqual(idAgain); // should update the same entity

      // expect two versions now
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(2);

      // check that new version data is accurate
      expect(versions[1].language_ids_hash.toString('hex')).toEqual(
        sha256.sync(updatedLanguageIds.join(',')),
      );
      expect(versions[1].poster_uuids_hash.toString('hex')).toEqual(
        sha256.sync(updatedPosterUuids.join(',')),
      );

      // check that the current version table is pointing to the right version
      const currentVersionPointers = await getEntityCurrentVersionPointer({
        id,
      });
      expect(currentVersionPointers.length).toEqual(1);
      expect(currentVersionPointers[0][`${movie.name}_version_id`]).toEqual(
        versions[1].id,
      );

      // check that the mapping tables are accurate
      const languageMappings = await getLanguageMappingTableEntries({
        versionId: versions[1].id,
      });
      expect(languageMappings.length).toEqual(updatedLanguageIds.length);
      updatedLanguageIds.forEach((languageId, index) => {
        expect(languageMappings[index].language_id).toEqual(languageId); // at the expected index
        expect(languageMappings[index].array_order_index).toEqual(index + 1); // explicitly tracked. note: postgres arrays start at 1
      });
      const posterUuidMappings = await getPosterUuidMappingTableEntries({
        versionId: versions[1].id,
      });
      expect(posterUuidMappings.length).toEqual(updatedPosterUuids.length);
      updatedPosterUuids.forEach((posterUuid, index) => {
        expect(posterUuidMappings[index].poster_uuid).toEqual(posterUuid); // at the expected index
        expect(posterUuidMappings[index].array_order_index).toEqual(index + 1); // explicitly tracked. note: postgres arrays start at 1
      });
    });
    it('should not create a new version if the updateable array did not change', async () => {
      const producerIds = [
        await upsertProducer({ name: uuidV4() }),
        await upsertProducer({ name: uuidV4() }),
      ];
      const languageIds = [
        await upsertLanguage({ name: uuidV4() }),
        await upsertLanguage({ name: uuidV4() }),
        await upsertLanguage({ name: uuidV4() }),
      ];
      const movieProps = {
        name: uuidV4(),
        producer_ids: producerIds,
        language_ids: languageIds,
        studio_uuids: [uuidV4()],
        poster_uuids: [uuidV4(), uuidV4()],
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
      const languageMappings = await getLanguageMappingTableEntries({
        versionId: versions[0].id,
      });
      expect(languageMappings.length).toEqual(languageIds.length);
      languageIds.forEach((languageId) => {
        expect(
          languageMappings.map((mapping: any) => mapping.language_id),
        ).toContainEqual(languageId);
      });
    });
    it('should have the same exact created_at timestamp on both the static, version, and mapping rows, on first insert', async () => {
      const producerIds = [
        await upsertProducer({ name: uuidV4() }),
        await upsertProducer({ name: uuidV4() }),
      ];
      const languageIds = [
        await upsertLanguage({ name: uuidV4() }),
        await upsertLanguage({ name: uuidV4() }),
        await upsertLanguage({ name: uuidV4() }),
      ];
      const movieProps = {
        name: uuidV4(),
        producer_ids: producerIds,
        language_ids: languageIds,
        studio_uuids: [uuidV4()],
        poster_uuids: [uuidV4(), uuidV4()],
      };

      // create the movie
      const id = await upsertMovie(movieProps);

      // grab the data
      const entityStatic = await getEntityStatic({ id });
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
      const producerMappings = await getProducerMappingTableEntries({ id });
      expect(producerMappings.length).toEqual(producerIds.length);
      const languageMappings = await getLanguageMappingTableEntries({
        versionId: versions[0].id,
      });
      expect(languageMappings.length).toEqual(languageIds.length);
      const studioUuidMappings = await getStudioUuidMappingTableEntries({ id });
      expect(studioUuidMappings.length).toEqual(movieProps.studio_uuids.length);
      const posterUuidMappings = await getPosterUuidMappingTableEntries({
        versionId: versions[0].id,
      });
      expect(posterUuidMappings.length).toEqual(movieProps.poster_uuids.length);
      const currentVersionPointers = await getEntityCurrentVersionPointer({
        id,
      });
      expect(currentVersionPointers.length).toEqual(1);

      // check that they all have same timestamp
      expect(versions[0].created_at).toEqual(entityStatic.created_at);
      producerMappings.forEach((mapping: any) =>
        expect(mapping.created_at).toEqual(entityStatic.created_at),
      );
      languageMappings.forEach((mapping: any) =>
        expect(mapping.created_at).toEqual(entityStatic.created_at),
      );
      studioUuidMappings.forEach((mapping: any) =>
        expect(mapping.created_at).toEqual(entityStatic.created_at),
      );
      posterUuidMappings.forEach((mapping: any) =>
        expect(mapping.created_at).toEqual(entityStatic.created_at),
      );
      expect(currentVersionPointers[0].updated_at).toEqual(
        entityStatic.created_at,
      );
    });
    it('should be able to insert empty arrays', async () => {
      const movieProps = {
        name: uuidV4(),
        producer_ids: [],
        language_ids: [],
        studio_uuids: [],
        poster_uuids: [],
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
      const producerMappings = await getProducerMappingTableEntries({ id });
      expect(producerMappings.length).toEqual(0);
      const languageMappings = await getLanguageMappingTableEntries({
        versionId: versions[0].id,
      });
      expect(languageMappings.length).toEqual(0);
    });
  });

  describe('static entity unique on uuid', () => {
    const plantOrder = new Entity({
      name: 'plant_order',
      properties: {
        customer_id: prop.BIGINT(), // really should be a reference - but for simplicity lets leave it as a bigint
        plant_name: prop.VARCHAR(),
        quantity: prop.INT(),
      },
      unique: ['uuid'],
    });
    beforeAll(async () => {
      // provision the table
      await dropTablesForEntity({ entity: plantOrder, dbConnection });
      await createTablesForEntity({ entity: plantOrder, dbConnection });

      // provision the upsert
      await dropAndCreateUpsertFunctionForEntity({
        entity: plantOrder,
        dbConnection,
      });
    });
    const upsertPlantOrder = async ({
      uuid,
      customer_id,
      plant_name,
      quantity,
    }: {
      uuid: string;
      customer_id: number;
      plant_name: string;
      quantity: number;
    }) => {
      const result = await dbConnection.query(
        prepare(`
        SELECT * FROM upsert_${plantOrder.name}(
          :uuid,
          :customer_id,
          :plant_name,
          :quantity
        );
      `)({
          uuid,
          customer_id,
          plant_name,
          quantity,
        }),
      );
      return result.rows[0].id;
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${plantOrder.name} where id = :id
      `)({ id }),
      );
      return result.rows[0];
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
      const { sql, name } = generateEntityUpsert({ entity: plantOrder });
      const showCreateSql = await getShowCreateFunction({
        dbConnection,
        func: name,
      });
      expect(sql).toEqual(showCreateSql);

      // show an example of the upsert function
      expect(sql).toMatchSnapshot();
    });
    it('should create the entity accurately', async () => {
      const props = {
        uuid: uuidV4(),
        customer_id: 821,
        plant_name: 'Monstera deliciosa',
        quantity: 1,
      };
      const id = await upsertPlantOrder(props);
      const entity = await getEntityStatic({ id });
      expect(entity.uuid.length).toEqual(36); // uuid was generated
      expect(entity).toMatchObject(props);
    });
    it('should not create a second entity, if unique properties are the same', async () => {
      // idempotency
      const props = {
        uuid: uuidV4(),
        customer_id: 821,
        plant_name: 'Monstera deliciosa',
        quantity: 1,
      };
      const id = await upsertPlantOrder(props);
      const idAgain = await upsertPlantOrder(props);
      expect(id).toEqual(idAgain);
    });
  });

  describe('fully versioned entity unique on uuid', () => {
    const webstore = new Entity({
      name: 'webstore',
      properties: {
        name: { ...prop.VARCHAR(), updatable: true },
        phone_number: { ...prop.VARCHAR(), updatable: true },
        email: { ...prop.VARCHAR(), updatable: true },
        logo_url: { ...prop.VARCHAR(), updatable: true },
      },
      unique: ['uuid'],
    });
    beforeAll(async () => {
      // provision the table
      await dropTablesForEntity({ entity: webstore, dbConnection });
      await createTablesForEntity({ entity: webstore, dbConnection });

      // provision the upsert
      await dropAndCreateUpsertFunctionForEntity({
        entity: webstore,
        dbConnection,
      });
    });
    const upsertWebstore = async ({
      uuid,
      name,
      phone_number,
      email,
      logo_url,
    }: {
      uuid: string;
      name: string;
      phone_number: string;
      email: string;
      logo_url: string;
    }) => {
      const result = await dbConnection.query(
        prepare(`
        SELECT * FROM upsert_${webstore.name}(
          :uuid,
          :name,
          :phone_number,
          :email,
          :logo_url
        );
      `)({
          uuid,
          name,
          phone_number,
          email,
          logo_url,
        }),
      );
      return result.rows[0].id;
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${webstore.name} where id = :id
      `)({ id }),
      );
      return result.rows[0];
    };
    const getEntityVersions = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${webstore.name}_version where ${webstore.name}_id = :id
      `)({ id }),
      );
      return result.rows;
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
      const { sql, name } = generateEntityUpsert({ entity: webstore });
      const showCreateSql = await getShowCreateFunction({
        dbConnection,
        func: name,
      });
      expect(sql).toEqual(showCreateSql);

      // show an example of the upsert function
      expect(sql).toMatchSnapshot();
    });
    it('should create the entity accurately', async () => {
      const props = {
        uuid: uuidV4(),
        name: "Donnie's Donuts",
        phone_number: '15125551234',
        email: 'hello@donniesdonuts.com',
        logo_url: 'https://...',
      };
      const id = await upsertWebstore(props);

      // check that the static part was accurate
      const entityStatic = await getEntityStatic({ id });
      expect(entityStatic.uuid).toEqual(props.uuid); // inserted uuid was used

      // check that the versioned part is accurate
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(1);
      expect(versions[0].name).toEqual(props.name);
      expect(versions[0].phone_number).toEqual(props.phone_number);
      expect(versions[0].email).toEqual(props.email);
      expect(versions[0].logo_url).toEqual(props.logo_url);
    });
    it('should update the entity if the updateable data changed', async () => {
      const props = {
        uuid: uuidV4(),
        name: "Donnie's Donuts",
        phone_number: '15125551234',
        email: 'hello@donniesdonuts.com',
        logo_url: 'https://...',
      };
      const id = await upsertWebstore(props);
      const idAgain = await upsertWebstore({
        ...props,
        name: "Donnie's Donuts and More",
      }); // Donnie had feature creep
      expect(id).toEqual(idAgain);

      // expect two versions
      const versions = await getEntityVersions({ id });
      expect(versions.length).toEqual(2);

      // expect newest version to have updated name
      expect(versions[1].name).toEqual("Donnie's Donuts and More");
    });
  });

  describe('entity that references another entity by version', () => {
    const vehicle = new Entity({
      name: 'tracked_vehicle',
      properties: {
        make: prop.VARCHAR(),
        model: prop.VARCHAR(),
        year: { ...prop.VARCHAR(), check: '(LENGTH($COLUMN_NAME) = 4)' },
        software_version: { ...prop.VARCHAR(), updatable: true }, // over the air updates -> updatable
      },
      unique: ['make', 'model', 'year'],
    });
    const crashReport = new Literal({
      name: 'crash_report',
      properties: {
        location_id: prop.BIGINT(), // this should reference a real "location" literal, but for this example lets just leave it as a bigint
        vehicle_version_id: prop.REFERENCES_VERSION(vehicle), // reference the specific vehicle version, as maybe a software glitch is causing the crashes
      },
    });
    beforeAll(async () => {
      // provision the tables
      await dropTablesForEntity({ entity: crashReport, dbConnection });
      await dropTablesForEntity({ entity: vehicle, dbConnection });
      await createTablesForEntity({ entity: vehicle, dbConnection });
      await createTablesForEntity({ entity: crashReport, dbConnection });

      // provision the upserts
      await dropAndCreateUpsertFunctionForEntity({
        entity: vehicle,
        dbConnection,
      });
      await dropAndCreateUpsertFunctionForEntity({
        entity: crashReport,
        dbConnection,
      });
    });
    const upsertVehicle = async ({
      make,
      model,
      year,
      software_version,
    }: {
      make: string;
      model: string;
      year: string;
      software_version: string;
    }) => {
      const result = await dbConnection.query(
        prepare(`
        SELECT * FROM upsert_${vehicle.name}(
          :make,
          :model,
          :year,
          :software_version
        );
      `)({
          make,
          model,
          year,
          software_version,
        }),
      );
      return result.rows[0].id;
    };
    const upsertCrashReport = async ({
      location_id,
      vehicle_version_id,
    }: {
      location_id: number;
      vehicle_version_id: number;
    }) => {
      const result = await dbConnection.query(
        prepare(`
        SELECT * FROM upsert_${crashReport.name}(
          :location_id,
          :vehicle_version_id
        );
      `)({
          location_id,
          vehicle_version_id,
        }),
      );
      return result.rows[0].id;
    };
    const getEntityStatic = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${crashReport.name} where id = :id
      `)({ id }),
      );
      return result.rows[0];
    };
    const getVehicleEntityVersions = async ({ id }: { id: number }) => {
      const result = await dbConnection.query(
        prepare(`
        select * from ${vehicle.name}_version where ${vehicle.name}_id = :id
      `)({ id }),
      );
      return result.rows;
    };
    it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
      const { sql, name } = generateEntityUpsert({ entity: crashReport });
      const showCreateSql = await getShowCreateFunction({
        dbConnection,
        func: name,
      });
      expect(sql).toEqual(showCreateSql);
      expect(sql).toMatchSnapshot();
    });
    it('should define the values properly', async () => {
      const vehicleId = await upsertVehicle({
        make: 'honda',
        model: 'odyssey',
        year: '2002',
        software_version: '0.7.3',
      });
      const vehicleVersionId = (
        await getVehicleEntityVersions({ id: vehicleId })
      )[0].id;
      const crashReportProps = {
        location_id: 721,
        vehicle_version_id: vehicleVersionId,
      };
      const id = await upsertCrashReport(crashReportProps);

      // check that it succeeded accurately
      const entityStatic = await getEntityStatic({ id });
      expect(entityStatic.vehicle_version_id).toEqual(
        crashReportProps.vehicle_version_id,
      );
    });
  });
});
