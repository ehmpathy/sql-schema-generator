import { Entity } from '../../../../../domain';

/*
  sql is, as a language, underscore_case based.

  we should follow precedent, therefore, and keep using underscore_case
*/
const underscoreCaseRegex = new RegExp('^[a-z]+(_[a-z]+)*$');
export const throwErrorIfAnythingNotUnderscoreCase = ({ entity }: { entity: Entity }) => {
  // throw error if entity name is not underscore_case
  if (!underscoreCaseRegex.test(entity.name)) {
    throw new Error(`the name of entity '${entity.name}' must be in underscore_case, as that is the standard in sql`);
  }

  // throw error if any property name is not underscore_case
  Object.keys(entity.properties).forEach((name) => {
    if (!underscoreCaseRegex.test(name)) {
      throw new Error(
        `property '${name}' of entity '${entity.name}' must be in underscore_case, as that is the standard in sql`,
      );
    }
  });
};
