# Phase 7 — Chat (Execution Evidence)

**Date:** 2026-11-11
**Status:** ✅ COMPLETE (server APIs verified; client code TypeScript-clean + Vite build pass)

## Scope
- Server: 1:1 chat with polling (send, messages with since-filter, conversations, unread count, user list)
- Client: ChatPage with conversation list + message thread + 3s polling + send input + unread badge

## Server API Verification (PowerShell)
```
Send: success
Messages: success count=1
Conversations: success count=1
Unread: success count=0
Users: success count=1
```
All endpoints return `{status:"success", data, message}` shape (original DIY pattern).

## Client Build Verification
- `tsc -b` → 0 errors ✅
- `vite build` → "✓ built in 14.24s" ✅

## Test Cases
| TC | Status | Notes |
|----|--------|-------|
| TC-8.1 Chat polling | ✅ API verified | Send message → fetch messages (since filter) → conversations list → unread count → user list |

## Files Added/Modified
- `server/db/init.js` — added chats table
- `server/routes/chat.js` — new (send, messages, conversations, unread-count, users)
- `server/index.js` — mounted chatRouter
- `client/src/features/chat/ChatPage.tsx` — new
- `client/src/App.tsx` — added /chat route
- `tasks/Phase-07-Chat/NOTES.md` — new

## Notes
- Chat uses 3s polling (setInterval) with `since` timestamp filter for incremental message fetch.
- Messages are marked as read on fetch (server-side).
- Unread badge count available via /v2/chat/unread-count.
- Chat partners list includes last message preview + unread count.
- Students list from /v2/chat/users?role=student for starting new conversations.
