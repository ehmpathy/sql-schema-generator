import { Entity } from '../../../types';

export const normalizeDeclarationContents = ({ contents }: { contents: any }) => {
  // 1. check that 'entitites' is exported
  if (!contents.entities) throw new Error('an entities array must be exported by the source file');
  const entities = contents.entities as Entity[];

  // 2. check that each entity is of the constructor
  entities.forEach((entity: any) => { if (entity.constructor.name !== 'Entity' || !entity.constructor.schema) throw new Error('all exported entities must be of class Entity'); });

  // 3. return the entities now that we've validate them
  return { entities };
};
