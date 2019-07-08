import { Entity, Property } from '../../../types';
import { generateTableForStaticProperties } from './generateTableForStaticProperties';
import { generateTableForUpdateableProperties } from './generateTableForUpdateableProperties';

export const generateEntityTables = ({ entity }: { entity: Entity }) => {
  // 1. seperate static -vs- updatable properties
  const staticProps = Object.entries(entity.properties).reduce((progress, thisPropEntry) => {
    if (thisPropEntry[1].updatable) return progress; // if updatable, skip this property
    return { ...progress, [thisPropEntry[0]]: thisPropEntry[1] }; // add this property to static properties object
  }, {} as { [index: string]: Property }); // tslint:disable-line align
  const updatableProps = Object.entries(entity.properties).reduce((progress, thisPropEntry) => {
    if (!thisPropEntry[1].updatable) return progress; // if not, skip this property
    return { ...progress, [thisPropEntry[0]]: thisPropEntry[1] }; // add this property to static properties object
  }, {} as { [index: string]: Property }); // tslint:disable-line align

  // 2. validate the props
  // TODO: throw error if the unique constraint has dynamic properties

  // 3. define the sql
  const entityTable = generateTableForStaticProperties({ entityName: entity.name, unique: entity.unique, properties: staticProps });
  const entityVersionTable = (Object.keys(updatableProps).length)
    ? generateTableForUpdateableProperties({ entityName: entity.name, properties: updatableProps })
    : undefined;

  // 4. remove the string
  return {
    static: entityTable,
    version: entityVersionTable,
  };
};
