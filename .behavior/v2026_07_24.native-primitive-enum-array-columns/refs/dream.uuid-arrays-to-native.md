# dream: convert uuid arrays to native `uuid[]` columns

## .what

teach `sql-schema-generator` to store `ARRAY_OF(UUID())` as a native `uuid[]` column on
the base/version table, instead of the current join-table model (a child `_uuid` table
plus an `array_order_index` column).

## .why

the `native-primitive-enum-array-columns` wish adds native array storage for
primitive/enum element arrays, but keeps uuid arrays on the join-table path, per its
stated scope. yet the decisive reason join tables exist for reference arrays — postgres
cannot put a foreign-key constraint on an array element [1] — does NOT apply to a bare
`UUID()`. a `UUID()` array carries no FK today (its child table holds a plain uuid column,
not a FK to a parent). so by the same logic that puts primitives on the native path,
`uuid[]` belongs there too.

benefits:

- one uniform array model: primitive + enum + uuid → native column; reference → join table
- faster single-table reads, with no `array_agg` join collapse in the view
- drops the `_uuid` child table and its `array_order_index` overhead

## .cons to weigh

- **migration cost** — uuid arrays are the one array kind with real prior use (the extant
  integration tests exercise `_uuids`). a switch changes already-generated schemas and
  forces a data migration for any consumer that uses them today — a break, not an additive
  change.
- **two-way door** — the hydrated view presents either storage as `uuid[]`, so the move can
  be made later with no DAO-visible contract change. no rush; low risk to defer.

## .depends on

- the `native-primitive-enum-array-columns` wish ships first — it builds the native array
  machinery (DDL column path, upsert single-value write, view straight-through select,
  value-equality change-detection) that this dream reuses. once that lands, a native branch
  that also accepts a `UUID()` element is a contained addition.

## .source

- captured from the vision appendix (section C: "should uuid arrays move to native
  `uuid[]` too?") of
  `.behavior/v2026_07_24.native-primitive-enum-array-columns/1.vision.yield.md`
- [1] postgres / EDB — array element foreign keys are a long-established limitation; the
  sanctioned workaround is a separate table with a FK constraint:
  https://www.enterprisedb.com/blog/postgresql-93-development-array-element-foreign-keys
