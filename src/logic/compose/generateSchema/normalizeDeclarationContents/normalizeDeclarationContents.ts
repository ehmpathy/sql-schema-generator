import { Entity } from '../../../../types';
import { throwErrorIfAnyReservedPropertyNamesAreUsed } from './throwErrorIfAnyReservedPropertyNamesAreUsed';
import { throwErrorIfAnyUniqueIsNotInProperties } from './throwErrorIfAnyUniqueIsNotInProperties';
import { throwErrorIfNamingConventionsNotFollowed } from './throwErrorIfNamingConventionsNotFollowed';

export const normalizeDeclarationContents = ({ contents }: { contents: any }) => {
  // 1. check that 'entities' is exported
  if (!contents.entities) throw new Error('an entities array must be exported by the source file');
  const entities = contents.entities as Entity[];

  // 2. check that each entity is of the constructor
  entities.forEach((entity: any) => {
    if (!(entity instanceof Entity)) throw new Error('all exported entities must be of, or extend, class Entity');
  });

  // 3. check that no reserved names are used
  entities.forEach((entity: Entity) => {
    throwErrorIfAnyReservedPropertyNamesAreUsed({ entity });
  });

  // 3. check that naming conventions are followed
  entities.forEach((entity: Entity) => {
    throwErrorIfNamingConventionsNotFollowed({ entity });
  });

  // 4. check that each property named in "unique" is actually a property of the entity
  entities.forEach((entity: Entity) => {
    throwErrorIfAnyUniqueIsNotInProperties({ entity });
  });

  // 5. set entity to be unique on "uuid" if it is unique on nothing
  const entitiesWithNormalizedUniqueness = entities.map((entity) => {
    // if unique on nothing, then set it to be unique on uuid
    if (entity.unique.length === 0) {
      return new Entity({ ...entity, unique: ['uuid'] });
    }

    // otherwise, change nothing
    return entity;
  });

  // 6. return the entities now that we've validate them
  return { entities: entitiesWithNormalizedUniqueness };
};
