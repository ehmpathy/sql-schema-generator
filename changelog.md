# Changelog

## [0.25.0](https://github.com/ehmpathy/sql-schema-generator/compare/v0.24.0...v0.25.0) (2024-06-09)


### Features

* **tables:** ensure constraint names dont exceed postgres name len limit ([2807c4d](https://github.com/ehmpathy/sql-schema-generator/commit/2807c4d0fe63ec848779f3df5d96026373b5a2f7))

## [0.24.0](https://github.com/ehmpathy/sql-schema-generator/compare/v0.23.0...v0.24.0) (2024-06-09)


### Features

* **arrays:** define join tables without redundant prefix to avoid resource name length issues ([d1cf466](https://github.com/ehmpathy/sql-schema-generator/commit/d1cf46621b91ad84f1d77add27d3afb4864ae8c8))

## [0.23.0](https://github.com/ehmpathy/sql-schema-generator/compare/v0.22.2...v0.23.0) (2024-05-26)


### Features

* **names:** domainValueObject to domainLiteral, for intuition++ ([#74](https://github.com/ehmpathy/sql-schema-generator/issues/74)) ([c1b0eef](https://github.com/ehmpathy/sql-schema-generator/commit/c1b0eef09ed5d8cd8ea9995566a4770d7fb368c8))


### Bug Fixes

* **practs:** make hooks executable ([#77](https://github.com/ehmpathy/sql-schema-generator/issues/77)) ([b92f914](https://github.com/ehmpathy/sql-schema-generator/commit/b92f914e4dbdce1faaf45bea87203da830df0faf))
* **practs:** upgrade to latest best ([#76](https://github.com/ehmpathy/sql-schema-generator/issues/76)) ([ab98fd5](https://github.com/ehmpathy/sql-schema-generator/commit/ab98fd5d9dad84f4cb3737063d05d4d06dbd00b4))

## [0.22.2](https://github.com/ehmpathy/sql-schema-generator/compare/v0.22.1...v0.22.2) (2023-10-25)


### Bug Fixes

* **contract:** support boolean datatype ([bcb9549](https://github.com/ehmpathy/sql-schema-generator/commit/bcb95490a95f1a3197461559d05a28b94742cb4a))

## [0.22.1](https://github.com/ehmpathy/sql-schema-generator/compare/v0.22.0...v0.22.1) (2023-02-14)


### Bug Fixes

* **errors:** help proactively identify circular import undefined reference errors ([3c261e0](https://github.com/ehmpathy/sql-schema-generator/commit/3c261e0a918247b0f5bf0d8cff062ed35bc3d128))
* **errors:** show stacktrace when an error reading declarations file is caught ([2ea9cb7](https://github.com/ehmpathy/sql-schema-generator/commit/2ea9cb7a29678a26f0c5975ed37e89c3573bb711))

## [0.22.0](https://github.com/ehmpathy/sql-schema-generator/compare/v0.21.4...v0.22.0) (2023-02-14)


### Features

* **config:** support using config file instead of cli args ([1312bb0](https://github.com/ehmpathy/sql-schema-generator/commit/1312bb03b38a27c320b6b29dc7d10837c546b172))

## [0.21.4](https://github.com/ehmpathy/sql-schema-generator/compare/v0.21.3...v0.21.4) (2023-02-12)


### Bug Fixes

* **cicd:** ensure integration test is provisioned before deploy test ([743b7db](https://github.com/ehmpathy/sql-schema-generator/commit/743b7dbdfef2636224e887588d3ac2676157961b))

## [0.21.3](https://github.com/ehmpathy/sql-schema-generator/compare/v1.16.0...v0.21.3) (2023-02-12)


### ⚠ BREAKING CHANGES

* **pgsql:** support postgres, instead of mysql ([#28](https://github.com/ehmpathy/sql-schema-generator/issues/28))

### Features

* **array:** support arrays of implicit uuid references ([01f1e46](https://github.com/ehmpathy/sql-schema-generator/commit/01f1e4657936472ed47c4fdba4218bf211fb1617))
* **cicd:** add publish_on_tag workflow to cicd ([158a5dd](https://github.com/ehmpathy/sql-schema-generator/commit/158a5dd12f1017a1a0c64dcf34ecd8b04c97d915))
* **declarations:** allow specifying declarations with the 'generateSqlSchemasFor' keyword ([59761e0](https://github.com/ehmpathy/sql-schema-generator/commit/59761e09bb08645dc04de273476e1bb4ee978ef4))
* **event:** first class support for persisting events ([765af63](https://github.com/ehmpathy/sql-schema-generator/commit/765af638fd5b8404788022ed48d6cdca88edc79a))
* **pgsql:** support postgres, instead of mysql ([#28](https://github.com/ehmpathy/sql-schema-generator/issues/28)) ([11ffb0d](https://github.com/ehmpathy/sql-schema-generator/commit/11ffb0d834c9f866d3c1ef5f63e68c9be2304839))
* **upsert:** return  all db generated values from upsert ([0e89af1](https://github.com/ehmpathy/sql-schema-generator/commit/0e89af1182bd4f1d0fc5463476e393c9cfe3c591))
* **view:** explicitly define order and separator in group_concat for array columns in view ([50fe41b](https://github.com/ehmpathy/sql-schema-generator/commit/50fe41b33278e40dc9760dda052fc21c95f92146))


### Bug Fixes

* **array:** handle postgres empty-array -&gt; null w/ coalesce ([fd6aac5](https://github.com/ehmpathy/sql-schema-generator/commit/fd6aac5bd5b7b0595911f7bb21e13ab5a910f945)), closes [#29](https://github.com/ehmpathy/sql-schema-generator/issues/29)
* **cicd:** ensure correct release version ([f724a71](https://github.com/ehmpathy/sql-schema-generator/commit/f724a7183b64bbd448c9e04c55e3deb45b94e336))
* **ctables:** make sure that check constraints are sorted alphabetically ([3bfe4c2](https://github.com/ehmpathy/sql-schema-generator/commit/3bfe4c26b71495dcd24c2fe4e61285ffd4914c5b))
* **deps:** resolve security warnings ([df70f24](https://github.com/ehmpathy/sql-schema-generator/commit/df70f2437b768db4d3d014e1a7a0c973e7bdfb36))
* **deps:** upgrade deps to remove audited vulnerabilities ([d8c7a83](https://github.com/ehmpathy/sql-schema-generator/commit/d8c7a83aa41b5336f552002882eb50576e80d455))
* **format:** apply prettier changes post bestpracts upgrade ([e7e8e24](https://github.com/ehmpathy/sql-schema-generator/commit/e7e8e24155afe587a611c2ac2cf8adbf2cd37c22))
* **practs:** upgrade to declapract-typescript-ehmpathy best practices ([da7123c](https://github.com/ehmpathy/sql-schema-generator/commit/da7123c7d20209cd4a19cefae78a1acb23a2f582))
* **practs:** upgrade to latest best practices; rm unused deps ([851ab5b](https://github.com/ehmpathy/sql-schema-generator/commit/851ab5bc7ea52bfcdc8ee65fe98b317b462dc536))
* **props:** support numeric type without precision/scale specified ([2b0b5fa](https://github.com/ehmpathy/sql-schema-generator/commit/2b0b5fae07e95a5940200d6c442370b568f80fb7))
* **refs:** support self referencing schemas ([c861392](https://github.com/ehmpathy/sql-schema-generator/commit/c861392e241dbb1bbb49256998aa3aceaee8da52))
* **save:** make sure to recursively mkdir when saving resources ([929c6ca](https://github.com/ehmpathy/sql-schema-generator/commit/929c6ca8382aab925f24547f78ea6154c591cdf5))
* **tests:** resolve test synatx errors found while testing after upgrade ([feb35f6](https://github.com/ehmpathy/sql-schema-generator/commit/feb35f6e1d30c611fcbb6829c0eb2274a3389872))
* **types:** resolve type errors after typescript upgrade ([123208c](https://github.com/ehmpathy/sql-schema-generator/commit/123208c844d5ca1529f368228bc6bf919e3c649a))
* **upsert:** include updated_at as one of the autogenerated values returned by upsert function ([b261c88](https://github.com/ehmpathy/sql-schema-generator/commit/b261c882360b0ebf828a653792feac2e7105d8f1))
* **usability:** throw a helpful error when user attempts to define updatable unique keys ([ba3ff58](https://github.com/ehmpathy/sql-schema-generator/commit/ba3ff58ea100ccc1487c97a024a7c78964c8e621))
* **view:** make view ddl closer to show create output of pg viewdef fn ([8f62de8](https://github.com/ehmpathy/sql-schema-generator/commit/8f62de8c1785374cacc137404ffa8f816bc429c2))
