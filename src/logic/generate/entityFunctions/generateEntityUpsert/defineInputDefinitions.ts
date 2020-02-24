import { prop } from '../../../../contract/module';
import { Entity } from '../../../../types';
import { castPropertyToFunctionInputDefinition } from './utils/castPropertyToFunctionInputDefinition';

export const defineInputDefinitions = ({ entity }: { entity: Entity }) => {
  // cast properties to input definitions
  const inputDefinitionsFromProperties = Object.entries(entity.properties).map((entry) =>
    castPropertyToFunctionInputDefinition({ name: entry[0], definition: entry[1] }),
  );

  // if entity is unique on uuid, then uuid must be an input
  const entityIsUniqueOnUuid = entity.unique.length === 1 && entity.unique[0] === 'uuid';
  if (entityIsUniqueOnUuid) {
    return [
      castPropertyToFunctionInputDefinition({ name: 'uuid', definition: prop.UUID() }),
      ...inputDefinitionsFromProperties,
    ];
  }

  // otherwise, then just the properties are sufficient for inputs
  return inputDefinitionsFromProperties;
};
