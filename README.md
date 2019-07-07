schema-generator
==============

Generate relational database schema for entities. Ensure best practices are followed and automate managing boiler plate sql.  

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/schema-control.svg)](https://npmjs.org/package/schema-control)
[![Codecov](https://codecov.io/gh/uladkasach/schema-control/branch/master/graph/badge.svg)](https://codecov.io/gh/uladkasach/schema-control)
[![Downloads/week](https://img.shields.io/npm/dw/schema-control.svg)](https://npmjs.org/package/schema-control)
[![License](https://img.shields.io/npm/l/schema-control.svg)](https://github.com/uladkasach/schema-control/blob/master/package.json)

# Table of Contents
<!-- toc -->
* [Table of Contents](#table-of-contents)
* [Overview](#overview)
* [Usage](#usage)
* [Commands](#commands)
* [Contribution](#contribution)
<!-- tocstop -->

# Overview

The goal of Schema Generator is to simplify managing database schema for entities and to encode best practices. By leveraging schema-generator, you're able to not worry about managing the boiler plate best practice code required for interacting with a relational database and instead focus more on the business logic.

Schema Generator generates:
  - tables for all managed entities (following temporal database design)
  - an upsert stored procedure
  - views current and current_hydrated view

These resources have been found as best practice for mastering data about both static and updatable entities and use best practices in their definitions.

The generator produces sql that you _should_ check into your VCS. This sql can be manually modified after generation if you need to customize something. If you'd like to update your definitions to follow updated best practices, you can simply re-generate the files and your VCS will provide a diff of all things that changed.



# Usage

1. Save the package as a dev dependency
  ```sh
  npm install --save-dev schema-generator
  ```

2. Define your entities, somewhere in your VCS repo
  ```ts

  ```

3. Run the generate command
  ```sh
  npx schema-generator -s path/to/definitions.js -t
  ```

4. Check the code into your VCS

5. Use a schema management tool like schema-control or liquibase to apply your schema

6. ???

7. Profit

# Commands
<!-- commands -->
* [`schema-generator command [FILE]`](#schema-generator-command-file)
* [`schema-generator help [COMMAND]`](#schema-generator-help-command)

## `schema-generator command [FILE]`

describe the command here

```
USAGE
  $ schema-generator command [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
  -v, --version    show CLI version
```

_See code: [dist/contract/command.ts](https://github.com/uladkasach/schema-generator/blob/v0.0.0/dist/contract/command.ts)_

## `schema-generator help [COMMAND]`

display help for schema-generator

```
USAGE
  $ schema-generator help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_
<!-- commandsstop -->


# Contribution

Team work makes the dream work! Please create a ticket for any features you think are missing and, if willing and able, draft a PR for the feature :)

## Testing
1. start the integration test db
  - *note: you will need docker and docker-compose installed for this to work*
  - `npm run integration-test-provision-db`
2. run the tests
  - `npm run test`

## Test Coverage
Test coverage is essential for maintainability, readability, and ensuring everything works! Anything not covered in tests is not guarenteed to work.

Test coverage:
- proves things work
- immensely simplifies refactoring (i.e., maintainability)
- encourages smaller, well scoped, more reusable, and simpler to understand modules (unit tests especially)
- encourages better coding patterns
- is living documentation for code, guaranteed to be up to date

#### Unit Tests
Unit tests should mock out all dependencies, so that we are only testing the logic in the immediate test. If we are not mocking out any of the imported functions, we are 1. testing that imported function (which should have its own unit tests, so this is redundant) and 2. burdening ourselfs with the considerations of that imported function - which slows down our testing as we now have to meet those constraints as well.

Note: Unit test coverage ensures that each function does exactly what you expect it to do (i.e., guarentees the contract). Compile time type checking (i.e., typescript) checks that we are using our dependencies correctly. When combined together, we guarentee that the contract we addition + compile time type checking guarentee that not only are we using our dependencies correctly but that our dependencies will do what we expect. This is a thorough combination.

`jest`

#### Integration Tests
Integration tests should mock _nothing_ - they should test the full lifecycle of the request and check that we get the expected response for an expected input. These are great to use at higher levels of abstraction - as well at the interface between an api (e.g., db connection or client).

`jest -c jest.integration.config.js`

## Patterns

Below are a few of the patterns that this project uses and the rational behind them.

- TypedObjects: every logical entity that is worked with in this project is represented by a typed object in order to formally define a ubiquitous language and enforce its usage throughout the code
- Contract - Logic - Data: this module formally distinguishes the contract layer, the logic layer, and the data layer:
  - The contract layer defines what we expose to users and under what requirements. This is where any input validation or output normalization occurs. This is where we think about minimizing the amount of things we expose - as each contract is something more to maintain.
  - The logic layer defines the domain logic / business logic that this module abstracts. This is where the heart of the module is and is where the magic happens. This layer is used by the contract layer to fulfill its promises and utilizes the data layer to persist data.
  - The data layer is a layer of abstraction that enables easy interaction with data sources and data stores (e.g., clients and databases). This module only uses the database.
- Utils -vs- Abstracting Complexity: abstracting complexity is important for maintainability and also for well scoped unit tests. We distinguish, in this project, two types of abstractions:
  - _utils are for modules that are completely domain independent and could easily be their own node module.
  - Otherwise, the module/function that you are abstracting into its own function should be a sibling module to the main module, under a directory with the name of the main module.
