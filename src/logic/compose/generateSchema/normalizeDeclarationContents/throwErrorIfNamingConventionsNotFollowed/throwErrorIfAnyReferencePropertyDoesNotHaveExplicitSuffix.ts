import { Entity } from '../../../../../types';

/*
  check that any properties that "reference" an entity have `_id` or `_ids` as their suffix
    to be explicit that they are _references_
*/
export const throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix = ({ entity }: { entity: Entity }) => {
  Object.entries(entity.properties).forEach(([name, definition]) => {
    if (!definition.references) return; // nothing to check here
    const requiredSuffix = definition.array ? '_ids' : '_id';
    const errorExplanation = definition.array
      ? 'since it references other entities.'
      : 'since it references another entity.';
    if (!name.endsWith(requiredSuffix)) {
      throw new Error(
        `property '${name}' of entity '${entity.name}' must end with '${requiredSuffix}' ${errorExplanation}`,
      );
    }
  });
};
