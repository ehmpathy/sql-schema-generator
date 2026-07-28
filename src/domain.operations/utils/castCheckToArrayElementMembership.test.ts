import { castCheckToArrayElementMembership } from './castCheckToArrayElementMembership';

describe('castCheckToArrayElementMembership', () => {
  it('should recast an enum scalar IN check into an element-membership check', () => {
    const result = castCheckToArrayElementMembership({
      check: "($COLUMN_NAME IN ('ACTIVE', 'FAULTED', 'OFFLINE'))",
    });
    expect(result).toEqual(
      "($COLUMN_NAME <@ ARRAY['ACTIVE', 'FAULTED', 'OFFLINE']::varchar[])",
    );
  });
  it('should pass through an already-recast element-membership check unchanged (idempotent)', () => {
    const alreadyRecast =
      "($COLUMN_NAME <@ ARRAY['ACTIVE', 'FAULTED', 'OFFLINE']::varchar[])";
    // the recast runs twice (declare-time + emission-time), so it must be safe to re-run
    expect(castCheckToArrayElementMembership({ check: alreadyRecast })).toEqual(
      alreadyRecast,
    );
  });
  it('should throw for a custom / scalar check that does not fit the enum shape', () => {
    try {
      castCheckToArrayElementMembership({ check: "($COLUMN_NAME ~ '^SN')" });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toContain('only supports the ENUM check shape');
      expect(error.message).toMatchSnapshot();
    }
  });
});
