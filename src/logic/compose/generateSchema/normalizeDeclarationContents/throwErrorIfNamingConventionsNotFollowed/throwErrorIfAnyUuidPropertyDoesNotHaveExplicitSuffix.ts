import { DataTypeName, Entity } from '../../../../../domain';

/*
  check that any properties store uuids (e.g., an array of uuids or one uuid) has `_uuid` or `_uuids` as its suffix
    to be explicit that the array contains uuids
*/
export const throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix = ({
  entity,
}: {
  entity: Entity;
}) => {
  Object.entries(entity.properties).forEach(([name, definition]) => {
    if (definition.type.name !== DataTypeName.UUID) return; // nothing to check here
    const requiredSuffix = definition.array ? '_uuids' : '_uuid';
    const errorExplanation = definition.array
      ? 'since it should be explicit about being an array of uuids.'
      : 'since it should be explicit about being a uuid.';
    if (!name.endsWith(requiredSuffix)) {
      throw new Error(
        `property '${name}' of entity '${entity.name}' must end with '${requiredSuffix}' ${errorExplanation}`,
      );
    }
  });
};
