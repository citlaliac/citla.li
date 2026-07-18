# CEC congregations rollout

## Before deployment

1. Back up `cec_accounts`, `cec_account_sessions`, and `cec_wheel_spins`.
2. Capture the preservation baseline:

   ```sql
   SELECT COUNT(*) AS account_count, SUM(pontifex_points) AS total_pp
   FROM cec_accounts
   WHERE email IS NOT NULL;
   ```

3. Deploy the application. The first CEC account request applies only additive columns and tables.
4. Run the baseline query again. Both values must match the pre-deploy values before gameplay resumes.

The migration writes one zero-value `opening_balance` ledger row per existing account. It does not rewrite an
account's balance.

## Verification

```sql
SELECT COUNT(*) FROM cec_factions;
SELECT COUNT(*) FROM cec_faction_memberships;
SELECT COUNT(*) FROM cec_pp_events WHERE event_type = 'opening_balance';
SELECT COUNT(*) AS account_count, SUM(pontifex_points) AS total_pp
FROM cec_accounts
WHERE email IS NOT NULL;
```

Test registration, one map reward, one wheel spin, congregation founding, joining, and the 48-hour switch
rejection before broad release.

## Rollback

Roll back the application files to the prior release, but leave the additive tables and account columns in place.
The previous release ignores them, so no destructive down migration is needed. Restore the database backup only
if the account-count or PP preservation check fails; restoring it also removes rewards earned after the backup.

