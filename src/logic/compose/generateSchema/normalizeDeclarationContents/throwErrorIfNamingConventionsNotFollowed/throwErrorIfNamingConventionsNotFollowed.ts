import { Entity } from '../../../../../types';
import { throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix } from './throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix';
import { throwErrorIfAnythingNotUnderscoreCase } from './throwErrorIfAnythingNotUnderscoreCase';

export const throwErrorIfNamingConventionsNotFollowed = ({ entity }: { entity: Entity }) => {
  // 1. check that any properties that "reference" an entity have `_id` or `_ids` as their suffix
  throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix({ entity });

  // 2. check that all names use underscore case
  throwErrorIfAnythingNotUnderscoreCase({ entity });
};
