import { Entity } from '../../../../../domain';
import { throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix } from './throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix';
import { throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix } from './throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix';
import { throwErrorIfAnythingNotUnderscoreCase } from './throwErrorIfAnythingNotUnderscoreCase';

export const throwErrorIfNamingConventionsNotFollowed = ({
  entity,
}: {
  entity: Entity;
}) => {
  // check that any properties that "reference" an entity have `_id` or `_ids` as their suffix
  throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix({ entity });

  // check that any properties that store uuid have `_uuid` or `_uuids` as their suffix
  throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix({ entity });

  // check that all names use underscore case
  throwErrorIfAnythingNotUnderscoreCase({ entity });
};
