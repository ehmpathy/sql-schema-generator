# tldr

## severity: blocker

acceptance tests must **fully round-trip** the deliverable — drive real input through the
real system and read the real result back — not merely assert on static output text.

a test that stops at "the tool produced this text" proves the artifact was *authored*, never
that it *works*. the round-trip proves it works: apply what was produced, exercise it, and
read the effect back through the same public surface a caller would use.

---
---
---

# deets

## .what

an acceptance test proves a promise to a real caller. to earn that proof it must complete the
whole loop the caller completes:

1. **produce** — invoke the contract (run the CLI, call the endpoint, build the artifact)
2. **apply** — put the produced artifact into the real system it targets (apply the generated
   schema to a real postgres, deploy the built config, load the generated module)
3. **exercise** — drive real input through it (call the generated function, hit the endpoint,
   run the generated code)
4. **read back** — observe the real effect through the same public surface a caller reads
   (query the generated view, read the response body, inspect the returned value)
5. **assert + snapshot** — assert the round-tripped result equals what was put in, and snapshot
   it so a reviewer sees the real caller experience in a diff

a test that performs only steps 1 and 5 on the *text* of the produced artifact (e.g. reads a
generated `.sql` file and greps it for a column type) is a **static-output assertion**, not an
acceptance test. it is welcome as an extra check, but it does not satisfy this rule on its own.

## .why

- **authored is not the same as works.** generated SQL can read perfectly and still fail to
  apply (a reserved word, a bad type, a broken constraint). only a real apply + execute proves
  it runs.
- **the caller lives at the far end of the loop.** the promise is "you can use this," not "this
  text exists." the round-trip is the only test that stands where the caller stands.
- **drift hides in the gap.** a generator can drift such that its output text still matches an
  old snapshot yet no longer executes. the round-trip catches what a text snapshot cannot.
- **the effect is the truth.** the returned row, the response body, the read-back value — that
  is the deliverable. assert on the effect, not on the recipe that was meant to cause it.

## severity: blocker

an acceptance test that only asserts on static output text, with no real apply + execute +
read-back, gives false confidence: it turns green while the deliverable is broken for every
caller. that is the exact failure this gate exists to prevent, so an acceptance suite without a
full round-trip for each contract is a blocker.

## .where

- every `*.acceptance.test.ts` that covers a contract which produces an artifact meant to run
  or be applied (codegen output, schema DDL, built config, generated client)
- the round-trip uses the real dependency (a real postgres via `rhx use.testdb`), never a mock
  — consistent with `rule.forbid.acceptance.mocks`

## .when

- applies whenever the contract's output is *executable* or *applyable* (SQL, code, config)
- does **not** demand a round-trip for a contract whose output is purely terminal text with no
  downstream system (e.g. a `--help` screen) — there, the stdout snapshot IS the full effect
- when a specific artifact cannot itself be applied (e.g. it transitively emits a reserved
  identifier the tool does not quote), round-trip an equivalent self-contained artifact that
  exercises the identical code path, and record why the original could not serve

## .how

- provision the real dependency in setup (`rhx use.testdb`, or the CI `start:testdb` step)
- apply the LITERAL produced artifact (read the generated file and run it), so the test proves
  the on-disk output, not an in-memory re-derivation
- drive input through the produced surface, read the result back through the produced surface
- assert the read-back equals the input, then snapshot a stabilized view of it (strip volatile
  db-generated keys) so the caller experience is legible in a PR diff
- cover the mutation lifecycle where one exists: write, re-write unchanged (no-op), change
  (one effect) — so idempotency and change-detection are proven, not assumed

## .examples

### positive

```ts
// produce -> apply -> exercise -> read back -> assert + snapshot
execSync('./bin/run generate -c config.yml'); // produce
await db.query({ sql: readGenerated('tables/parcel.sql') }); // apply the literal output
await db.query({ sql: readGenerated('functions/upsert_parcel.sql') });
await db.query({ sql: readGenerated('views/view_parcel_current.sql') });
const id = await upsertParcel({ tags: ['a', 'b'], land_use: ['RESIDENTIAL'] }); // exercise
const row = await db.query({ sql: `select * from view_parcel_current where id = ${id}` }); // read back
expect(row.tags).toEqual(['a', 'b']); // assert the effect
expect(asStableRow(row)).toMatchSnapshot(); // snapshot the caller experience
```

### negative

```ts
// static-output assertion only: proves the text was authored, never that it runs
execSync('./bin/run generate -c config.yml');
const sql = readGenerated('functions/upsert_parcel.sql');
expect(sql).toContain('in_tags varchar[]'); // the recipe reads right...
expect(sql).toMatchSnapshot(); // ...but no apply or execute ever ran
```

## .see also

- `rule.forbid.acceptance.mocks` — the round-trip uses the real dependency, never a mock
- `rule.require.acceptance.blackbox` — the round-trip drives + reads through the public surface
- `rule.require.acceptance-journey-coverage` — the journeys a round-trip must cover
- `skills/use.testdb.sh` — provisions the real postgres the round-trip needs
