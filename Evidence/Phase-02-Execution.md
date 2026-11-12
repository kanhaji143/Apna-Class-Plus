# Evidence — Phase 2 (Auth & Dashboard Shell — completion)

**Date:** 27 Oct 2026 | **Result:** ✅ ALL PASS

## TC-1.2 Invalid OTP → error message — ✅ PASS
- Filled wrong OTP `000000` against devOtp `848755`
- `POST /v1/diy/verifyOtp` → 400 `{status:"error", message:"Invalid or expired OTP"}`
- UI shows red Alert: "Invalid or expired OTP" (friendly message via rejectWithValue) ✅

## TC-1.3 Token refresh (UI-level) — ✅ PASS
- Expired access token scenario → axios interceptor called `POST /v1/diy/refreshToken` (single-flight, 2 calls deduped)
- Original request retried, dashboard data loaded ✅
- (Console log captured: 2x refreshToken at 15:24:29 → deduped to 1 refresh)

## TC-3.1 Dashboard stats — ✅ PASS (Phase 1 se, re-verified)
- `GET /v1/diy/landingPage/dashboard` → 200, 4 stat cards rendered (0/0/0/0)

## TC-3.2 Analytics filter — ✅ PASS
- Dropdown changed "Last 7 Days" → "Today"
- `GET /v1/diy/analytcs/stats?day=1` → 200
- 4 analytics cards rendered: Website sessions 9 (55% ↓), Buy Now Clicks 0, Transactions 0, Revenue 0
- Percent badge color: flag 0 → error (red), flag 1 → success (green) ✅

## API endpoints added in Phase 2
- `GET /v1/diy/analytcs/stats?day=X` (original spelling "analytcs" matched) — response shape matches original: `{dropDown, data[], lifetimeRevenue}`

## Code changes
- `client/src/features/auth/authSlice.ts`: `verifyAndLogin` now uses `rejectWithValue` → friendly server error message
- `client/src/features/dashboard/DashboardPage.tsx`: added analytics section + day Select filter

## Build verification
- `tsc -b` → 0 errors ✅

## Phase 1 + Phase 2 combined status
- Auth: OTP login ✅, refresh ✅, route guard ✅, invalid OTP error ✅
- Sidebar: API-driven 11 tabs + feature flags ✅
- Dashboard: stat cards ✅ + analytics cards + day filter ✅
- DevOtp hint on login page ✅
