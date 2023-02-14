import { DomainObject } from 'domain-objects';
import Joi from 'joi';

export enum DatabaseLanguage {
  MYSQL = 'mysql',
  POSTGRES = 'postgres',
}

const schema = Joi.object().keys({
  rootDir: Joi.string().required(), // dir of config file, to which all config paths are relative
  language: Joi.string().valid(...Object.values(DatabaseLanguage)),
  dialect: Joi.string().required(),
  declarationsPath: Joi.string().required(),
  targetDirPath: Joi.string().required(),
});

export interface GeneratorConfig {
  rootDir: string;
  language: DatabaseLanguage;
  dialect: string;
  declarationsPath: string;
  targetDirPath: string;
}
export class GeneratorConfig
  extends DomainObject<GeneratorConfig>
  implements GeneratorConfig
{
  public static schema = schema;
}
