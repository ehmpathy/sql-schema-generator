import { Entity } from '../../../../types';
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

  // 3. check that naming conventions are followed
  entities.forEach((entity: any) => {
    throwErrorIfNamingConventionsNotFollowed({ entity });
  });

  // 4. check that each property named in "unique" is actually a property of the entity
  entities.forEach((entity: any) => {
    throwErrorIfAnyUniqueIsNotInProperties({ entity });
  });
  // ------ TODO ----------

  // 5. return the entities now that we've validate them
  return { entities };
};