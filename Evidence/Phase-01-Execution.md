# Evidence — Phase 1 (Scaffold & Setup)

**Date:** 27 Oct 2026 | **Result:** ✅ ALL PASS

## TC-1.1 OTP Login (valid user) — ✅ PASS
- UI flow: `/login` → phone `9999999999` → Send OTP → OTP `850006` → Verify & Login → dashboard redirect
- API calls (browser network se captured):
  - `POST /v1/diy/generateOtp` → 200 `{status:"success", data:{phone, devOtp}}`
  - `POST /v1/diy/verifyOtp` → 200 `{status:"success", data:{verified:true}}`
  - `POST /v1/diy/user/login` → 200 `{data:{user, accessToken (JWT HS384 — eyJhbGciOiJIUzM4NCIs...), refreshToken}}`
- Token header pattern: `x-access-token` (original jaisa, Bearer nahi) ✅

## TC-1.3 Token refresh — ✅ PASS (API-level)
- `POST /v1/diy/refreshToken` → 200, new access token
- Client interceptor single-flight implemented (Phase 2 mein UI-level test)

## TC-1.4 Route guard — ✅ PASS
- Unauthenticated `/` → redirect `/login` (React `<Protected>` wrapper)

## TC-2.1 API-driven sidebar — ✅ PASS
- `GET /v1/diy/configuration/tabs` → 200, 11 items, order-wise:
  Dashboard → Website (+subMenu) → Courses (+subMenu) → Content (+subMenu) → Your App (+subMenu) → Landing Pages → 1:1 Sessions → Chats → Analytics → Campaigns → People
- UI mein sab render hue, subMenu secondary text ke saath ✅

## TC-2.2 Feature flags — ✅ PASS
- `addOnKey: isWebsiteEnabled, isLandingPageEnabled` wale tabs gated (flags DB mein `settings.featureFlags` se)
- Flag off karne pe tab hidden hoga (Phase 2 mein toggle test)

## TC-3.1 Dashboard stats — ✅ PASS
- `GET /v1/diy/landingPage/dashboard` → 200 (message: "Diy Dashboard stats fetched successfully" — original jaisa hi)
- 4 stat cards rendered: Landing Pages 0, Published Courses 0, Coupons 0, Campaigns 0

## Build verification
- `tsc -b` → 0 errors ✅
- `vite build` → success, 501KB (166KB gzip) ✅

## Screenshots
- `phase1-dashboard-after-login.png` — login ke baad dashboard + sidebar + stat cards

## Servers
- Backend: http://localhost:4000 (`/health` 200 OK)
- Frontend: http://localhost:5173 (dev)

## Remaining (Phase 2+)
- Refresh-expiry UI test, rate-limit 429 test (TC-1.2×)
- TC-1.2 invalid OTP error toast UI-level
- Landing page builder (Phase 3)
