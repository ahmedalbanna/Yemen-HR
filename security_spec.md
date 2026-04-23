# Security Specification: Yemen HR & Compliance Pro

## 1. Data Invariants
- An employee record cannot be created without a `createdBy` field matching the current user's UID.
- Only authenticated admins (checked via `/admins/` collection) can create or modify employee records.
- Leave requests can be created by any signed-in user, but only admins can approve/reject them.
- `salary` and `nationalId` are restricted fields and should only be readable by admins. (Note: In this app version we simplify to Admin-only management).

## 2. The Dirty Dozen (Attacker Payloads)

1. **Identity Spoofing**: Creating an employee with a different `createdBy` UID.
2. **Shadow Field Injection**: Adding `isVerified: true` to a leave request.
3. **Admin Privilege Escalation**: Creating a document in `/admins/{myUid}`.
4. **State Shortcutting**: Creating a leave request with `status: 'approved'`.
5. **PII Leak**: Non-admin user trying to `get` an employee record.
6. **Denial of Wallet**: Sending 1MB string in `nationalId`.
7. **Orphaned Record**: Creating a leave request for a non-existent `employeeId`.
8. **Impersonation**: Updating an employee's `name` as a non-admin.
9. **History Erasure**: Updating `hireDate` after employee creation.
10. **Resource Exhaustion**: Creating 10,000 leave requests in a loop.
11. **ID Poisoning**: Using a 1KB string as a document ID.
12. **Status Locking Bypass**: Modifying a leave request after it's been `rejected`.

## 3. Test Runner (Conceptual)
All tests below expect `PERMISSION_DENIED`.

```typescript
// firestore.rules.test.ts snippet
await assertFails(addDoc(collection(db, 'employees'), { 
  name: 'Attacker', 
  createdBy: 'other_uid' 
}));
await assertFails(setDoc(doc(db, 'admins', myUid), { role: 'admin' }));
```
