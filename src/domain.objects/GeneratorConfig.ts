import { DomainObject } from 'domain-objects';
import { z } from 'zod';

export enum DatabaseLanguage {
  MYSQL = 'mysql',
  POSTGRES = 'postgres',
}

const schema = z.object({
  rootDir: z.string(),
  language: z.enum(Object.values(DatabaseLanguage) as [string, ...string[]]),
  dialect: z.string(),
  declarationsPath: z.string(),
  targetDirPath: z.string(),
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
