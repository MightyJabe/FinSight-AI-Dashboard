---
status: complete
priority: p1
issue_id: "002"
tags: [security, code-review, authorization]
dependencies: []
---

# IDOR Vulnerability in Document Delete Endpoint

## Problem Statement

The document delete endpoint allows **any authenticated user** to delete **any document** in the system. There is no ownership verification before deletion.

This is an Insecure Direct Object Reference (IDOR) vulnerability that could allow malicious users to delete other users' financial documents.

## Findings

**File:** `src/app/api/documents/delete/route.ts` (lines 31-33)

```typescript
const { documentId } = await req.json();
await db.collection('documents').doc(documentId).delete();  // NO OWNERSHIP CHECK!
```

**Attack Scenario:**
1. Attacker authenticates with their own account
2. Attacker guesses or enumerates document IDs
3. Attacker sends DELETE request with victim's documentId
4. Victim's document is deleted

## Proposed Solutions

### Option A: Add Ownership Verification (Recommended)
**Pros:** Simple, follows existing patterns
**Cons:** Additional database read
**Effort:** Small (30 minutes)
**Risk:** Low

```typescript
const docRef = db.collection('documents').doc(documentId);
const doc = await docRef.get();

if (!doc.exists) {
  return NextResponse.json({ error: 'Document not found' }, { status: 404 });
}

if (doc.data()?.userId !== userId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

await docRef.delete();
```

### Option B: Use User Subcollection
**Pros:** Impossible to access other users' documents
**Cons:** Requires data migration
**Effort:** Large (4-8 hours)
**Risk:** Medium

Move documents to `users/{userId}/documents/{documentId}`

## Recommended Action

**Option A** - Add ownership verification. Apply same pattern to any other endpoints with direct document access.

## Technical Details

**Affected Files:**
- `src/app/api/documents/delete/route.ts` - add ownership check
- Review all DELETE endpoints for similar issues

**Database Changes:** None

## Acceptance Criteria

- [ ] Document delete verifies userId matches document owner
- [ ] Returns 403 Forbidden for unauthorized delete attempts
- [ ] Returns 404 for non-existent documents
- [ ] Audit log entry for delete attempts
- [ ] Integration test for authorization

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-16 | Created from security review | Always verify ownership before destructive operations |

## Resources

- OWASP IDOR: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References
- Security review agent findings
