import indentString from 'indent-string';
import { isPresent } from 'simple-type-guards';

import { Entity } from '../../../../domain';
import { defineDeclarations } from './defineDeclarations';
import { defineFindOrCreateStaticEntityLogic } from './defineFindOrCreateStaticEntityLogic';
import { defineInputDefinitions } from './defineInputDefinitions';
import { defineInsertVersionIfDynamicDataChangedLogic } from './defineInsertVersionIfDynamicDataChangedLogic';
import { defineUpsertCurrentVersionPointerIfNeededLogic } from './defineUpsertCurrentVersionPointerIfNeededLogic';

/*
1. define function
2. define inputs
3. declare needed inputs
4. logic
  1. find or create the static entity, get the id of the static entity
    - if inserting, insert into mapping tables too
  2. check if the version has changed
  3. if the version has changed, insert a new version
  5. return the id of the static entity
*/
export const generateEntityUpsert = ({ entity }: { entity: Entity }) => {
  // define the input definitions
  const inputDefinitions = defineInputDefinitions({ entity });

  // define the declarations
  const declarations = defineDeclarations({ entity });

  // define all of the different logic required for a complete upsert
  const findOrCreateStaticEntityLogic = defineFindOrCreateStaticEntityLogic({
    entity,
  });
  const insertVersionIfDynamicDataChangedLogic =
    defineInsertVersionIfDynamicDataChangedLogic({ entity });
  const upsertCurrentVersionPointerIfNeededLogic =
    defineUpsertCurrentVersionPointerIfNeededLogic({ entity });

  // define the return statement
  const hasVersionTable = Object.values(entity.properties).some(
    (property) => !!property.updatable,
  );
  const returnsDefinition = `
TABLE(${[
    'id bigint',
    'uuid uuid',
    'created_at timestamp with time zone',
    hasVersionTable ? 'effective_at timestamp with time zone' : null,
    hasVersionTable ? 'updated_at timestamp with time zone' : null,
  ]
    .filter(isPresent)
    .join(', ')})
  `.trim();
  const returnsQuery = `
      SELECT ${[
        's.id',
        's.uuid',
        's.created_at',
        hasVersionTable ? 'v.effective_at AS effective_at' : null,
        hasVersionTable ? 'v.created_at AS updated_at' : null,
      ]
        .filter(isPresent)
        .join(', ')}
      FROM ${entity.name} s
      ${[
        hasVersionTable
          ? `JOIN ${entity.name}_version v ON v.id = v_matching_version_id`
          : null,
        'WHERE s.id = v_static_id',
      ]
        .filter(isPresent)
        .join('\n      ')}
  `.trim();

  // combine the version and static logic into full upsert function
  const definition = `
CREATE OR REPLACE FUNCTION upsert_${entity.name}(
  ${inputDefinitions.join(',\n  ')}
)
RETURNS ${returnsDefinition}
LANGUAGE plpgsql
AS $$
  DECLARE
    ${declarations.join('\n    ')}
  BEGIN
    ${[
      findOrCreateStaticEntityLogic,
      insertVersionIfDynamicDataChangedLogic,
      upsertCurrentVersionPointerIfNeededLogic,
    ]
      .filter((sql): sql is string => !!sql)
      .map((sql) => indentString(sql, 4))
      .join('\n\n')
      .trim()}

    -- return the db generated values
    RETURN QUERY
      ${returnsQuery};
  END;
$$
  `.trim();
  return {
    name: `upsert_${entity.name}`,
    sql: definition,
  };
};
