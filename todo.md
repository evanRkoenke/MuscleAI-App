# Muscle AI — Project TODO

- [x] Configure dark luxury theme (colors, tokens)
- [x] Set up tab navigation (Scan, Meals, Track, Forecast)
- [x] Build onboarding flow (3 slides)
- [x] Build auth screen (login/signup with Google/Apple/Email)
- [x] Build paywall screen (3 tiers with Stripe links)
- [x] Build Dashboard/Home screen (calorie ring, macros, protein priority)
- [x] Build Scan screen (camera + AI analysis overlay)
- [x] Build Meals screen (daily meal log with sections)
- [x] Build Track screen (weight chart, log weight)
- [x] Build Forecast screen (12-month projection, Elite lock)
- [x] Build AI Support Chat screen (Muscle Support chatbot)
- [x] Build Settings screen (profile, subscription, goals, logout)
- [x] Build Gains Card screen (shareable progress cards)
- [x] Integrate server-side LLM for meal scanning AI
- [x] Integrate server-side LLM for AI support chatbot
- [x] Wire Stripe payment links into paywall
- [x] Add app icon and branding assets
- [x] Add onboarding → auth → paywall → dashboard navigation flow
- [x] Add local data persistence (AsyncStorage for meals, weight, settings)
- [x] Polish animations and haptic feedback

## Beta Refinement — Design & System Debug
- [x] Redesign calorie ring with thick stroke, blue gradient glow, ceramic/3D effect
- [x] Update primary color to Electric Blue (#007AFF) across all action buttons
- [x] Improve macro cards with colored labels (cyan protein, amber carbs, red fat)
- [x] Add glow effects to floating camera button and interactive elements
- [x] Improve typography to bold, modern, high-tech sans-serif
- [x] Redesign Protein Priority card with anabolic score badge overlay
- [x] Polish Forecast screen chart with proper line weight and glow
- [x] Add Forecast premium upsell box matching reference (66% savings, UNLOCK button)
- [x] Fix auth screen: add Forgot Password flow
- [x] Fix auth screen: add Login/Signup toggle
- [x] Ensure user data persists across logins (AsyncStorage)
- [x] Fix Manage Subscription to route to Stripe Customer Portal
- [x] Verify Elite plan unlocks 12-Month Forecast
- [x] Add branded error handling for scan failures
- [x] Add branded error handling for payment declines
- [x] Improve scan screen with faster feedback and error states
- [x] Run full system diagnostic and fix all issues

## Priority Reset — Pixel-Perfect Visual Fidelity
- [x] Rebuild Dashboard ceramic ring to exact reference: thick arc stroke, blue-to-cyan gradient, outer glow shadow, large centered number
- [x] Match Dashboard layout exactly: MUSCLE AI header, settings gear, ring → macros row → quick actions → Protein Priority card → Muscle Support → camera FAB
- [x] Rebuild Forecast chart to match reference: gradient line, proper axis labels (1M, 10, 12 MONTHS), weight label with date
- [x] Rebuild Forecast upsell box: lock icon, "Priority Sync", "PREMIUM MEMBERS ONLY" text, "ELITE ANNUAL $79.99" with "66% SAVINGS", gradient UNLOCK button
- [x] Fix Manage Subscription to correctly route to Stripe Customer Portal (production logic)
- [x] Make Elite Annual ($79.99/yr) the primary highlighted CTA on paywall, visually distinct from other tiers
- [x] Remove all stock/generic icons where Blue Digital Bicep branding should appear

## User Profile Section
- [x] Build Profile screen with user avatar, name, stats summary
- [x] Add Gains Cards gallery section (grid of previously generated cards)
- [x] Add Personal Records section (best lifts, highest protein day, longest streak, heaviest weight, etc.)
- [x] Persist Gains Cards and personal records in AsyncStorage
- [x] Add profile access from Dashboard (header tap or settings)
- [x] Wire navigation to Profile screen from tab bar or settings

## Logo in Dashboard Header
- [x] Replace gradient "M" avatar with blue digital bicep logo image in Dashboard header

## Native Apple StoreKit IAP Integration
- [x] Install expo-iap package for StoreKit 2 support
- [x] Create IAP service module with product IDs, purchase flow, and restore logic
- [x] Rebuild paywall UI to trigger native iOS purchase sheet instead of Safari redirects
- [x] Add server-side receipt validation endpoint
- [x] Update subscription status in app state after successful purchase
- [x] Instantly unlock 12-Month Forecast and Priority Sync on Elite purchase
- [x] Maintain Clinical Luxury / Electric Blue paywall design
- [x] Add restore purchases functionality
- [x] Handle purchase errors with branded error messages
- [x] Graceful web fallback (Stripe links) since StoreKit only works on iOS

## Profile Enhancements & Launch Readiness
- [x] Replace logo in Dashboard header with tappable profile avatar (user photo or initials)
- [x] Add profile photo picker (camera + gallery) using expo-image-picker
- [x] Add editable Name field in Profile screen
- [x] Add editable Email field in Profile screen
- [x] Add payment method management (change card / payment method)
- [x] Persist profile photo URI in AsyncStorage
- [x] Full launch-readiness polish pass (edge cases, error states, empty states)
- [x] Ensure all navigation flows complete end-to-end with no dead ends

## Subscription Gating for Profile Fields
- [x] Lock email editing for free plan users (show upgrade prompt)
- [x] Lock payment method management for free plan users (show upgrade prompt)
- [x] Paid plan users (essential, pro, elite) can edit email and manage payment

## Design Reset v3 — Absolute Visual Fidelity
- [x] Re-examine reference images and document exact pixel specs
- [x] Rebuild Dashboard ceramic ring with proper thick arc, gradient glow, and exact reference layout
- [x] Rebuild Forecast chart with exact line-weight, axis labels, and font-style from reference
- [x] Replace all stock icons with Blue Digital Bicep branding where appropriate
- [x] Fix Manage Subscription routing to Stripe Customer Portal
- [x] Make Elite Annual $79.99 the dominant highlighted CTA on paywall
- [x] Match Clinical Luxury dark aesthetic exactly (no generic UI elements)

## Profile Button in Header
- [x] Add profile avatar button/icon to the left of "MUSCLE AI" header on Dashboard

## Status Bar Dark Background
- [x] Fix status bar area to have dark background matching the app theme

## iOS Status Bar Background Fix (Real Device)
- [x] Fix iOS status bar area to show dark background on real device (not just web preview)

## Meal Delete & Favorites
- [x] Add delete meal functionality (tap trash icon with confirmation)
- [x] Add favorite meal toggle (star icon)
- [x] Show favorites section at top of meals list
- [x] Persist favorites and deletions in AsyncStorage

## Manual Food Item Addition
- [x] Add "Add Item" button on scan results to add missing food items
- [x] Build food search/manual entry modal with name, grams, macros
- [x] Allow editing grams/weight of AI-detected items
- [x] Recalculate meal totals after adding/editing items

## Enhanced AI Scanner
- [x] Update AI prompt to include comprehensive food knowledge (all cuisines, brands, preparations)
- [x] Add sugar tracking to AI scan output and meal data model
- [x] Display sugar grams in scan results and meal details
- [x] Add sugar to daily macro tracking on dashboard

## Publish Health Check
- [x] Run TypeScript check — 0 errors
- [x] Run full test suite — 101 passing
- [x] Write tests for new features (delete, favorite, add item, sugar tracking)
- [x] Verify preview is working correctly
- [x] Verify all navigation flows end-to-end

## App Rename
- [x] Rename app to "Muscle AI | Calorie Tracker" in app.config.ts

## Food Editing & Addition Enhancement
- [x] Enhance quantity/gram editing UX on scan results (inline editable fields)
- [x] Add manual food addition with name, grams, calories, protein, carbs, fat, sugar
- [x] Recalculate meal totals when items are edited or added
- [x] Allow removing individual food items from scan results

## Apple TestFlight / EAS Build Configuration
- [x] Create eas.json with development, preview, and production build profiles
- [x] Configure for internal TestFlight distribution (not Expo Go)
- [x] Set correct iOS bundle identifier and Android package
- [x] Add submit configuration for App Store Connect
- [x] Add iOS camera and photo library permission descriptions

## Bundle ID & Build Cleanup
- [x] Set ios.bundleIdentifier to com.evan.muscleai
- [x] Set android.package to com.evan.muscleai
- [x] Update eas.json submit config with correct bundle ID
- [x] Clean up stale native folders (ios/, android/) — none present
- [x] Remove build blockers (fixed stale scheme reference in oauth.ts, cleaned .expo/web cache)

## Logo & Color Scheme Update
- [x] Set uploaded geometric arm logo as app icon (icon.png, splash-icon.png, favicon.png, android-icon-foreground.png)
- [x] Update theme.config.js to monochrome black/white/silver palette matching logo
- [x] Update all hardcoded colors across 14 screen files to monochrome palette
- [x] Update app.config.ts logoUrl and splash background colors to pure black

## Auth Screen Logo
- [x] Add geometric arm logo prominently on auth/login screen above MUSCLE AI title

## Button Color Adjustment
- [x] Darken white/light buttons across the app while keeping button text white

## Dashboard Icon Color Adjustment
- [x] Darken circular camera FAB button to #444444 charcoal
- [x] Darken profile icon to #444444 charcoal
- [x] Lighten camera FAB and profile icon slightly from #444444 to #555555

## Weekly Calendar Strip
- [x] Add horizontal scrollable weekly calendar strip to dashboard
- [x] Support day selection that updates calories/macros display
- [x] Style with minimalist black-and-white theme matching Muscle AI branding
- [x] Subtle highlight for currently selected date

## Date-Based Meal Editing
- [x] Share selected date from dashboard calendar to meals tab
- [x] Update meals tab to show meals for the selected date (not just today)
- [x] Allow adding/editing meals for any selected date
- [x] Update scan-meal to log meals to the selected date

## Header Logo
- [x] Add geometric arm logo next to MUSCLE AI title in dashboard header
- [x] Crop black background from logo to make it transparent (only muscle arm visible)
- [x] Make the header logo bigger

## Global Typography Update
- [x] Configure SF Pro Display / system San Francisco as the default font family
- [x] Set Bold weight for all headings and subheadings
- [x] Set Regular weight for body text
- [x] Apply consistent typography hierarchy across all screens

## Header Text Style
- [x] Remove italic from MUSCLE AI header text
- [x] Set to SF Pro Display Bold with tighter letter spacing (-2%)
- [x] Ensure logo sits correctly next to upright MUSCLE AI header text

## Auth Screen Branding Update
- [x] Add cropped muscle logo above MUSCLE AI text on auth screen
- [x] Remove italic tilt from MUSCLE AI text on auth screen
- [x] Change MUSCLE AI font to SF Pro Display Bold on auth screen

## Bug: Logo not showing on Expo Go
- [x] Fix cropped muscle logo not rendering on Expo Go (switched from react-native Image to expo-image)

## Macro Card Font Sizing
- [x] Make macro numbers dynamically shrink when values are large to prevent text wrapping

## Meal Category Bug Fix
- [x] Fix meals going to wrong category (all going to dinner instead of selected category)
- [x] Pass correct category from meals tab "Add Breakfast/Lunch/Dinner/Snacks" buttons to scan-meal
- [x] Add meal category picker on scan screen so user can choose category before logging

## Track Weight Entry Deletion
- [x] Add ability to delete recent weight entries in Track section

## Dynamic Anabolic Forecast
- [x] Calculate projected milestones based on user's daily calories and protein goal
- [x] Graph trends upward for caloric surplus with high protein, downward for deficit
- [x] Update Projected Milestones weights dynamically based on the formula

## Priority Sync Unlock Fix
- [x] Fix Priority Sync card to unlock for Elite Annual subscribers
- [x] Remove lock icon and overlay when user has Elite plan
- [x] Show real-time data sync status when unlocked

## Global Subscription Gating & Welcome Popup
- [x] Global subscription check: unlock all features based on plan tier (Elite/Pro/Essential)
- [x] Remove all lock overlays when user has active subscription
- [x] Create sleek "Welcome to Elite" popup after $79.99 purchase
- [x] Persist subscription status locally with AsyncStorage so features never re-lock
- [x] Update Forecast page to use global subscription gating
- [x] Update Priority Sync to use global subscription gating
- [x] Write tests for subscription system

## Free Plan Daily Scan Limit
- [x] Build scan counter with local persistence (AsyncStorage) and midnight reset
- [x] Create "Daily Limit Reached" popup with high-contrast "Get Unlimited Scans with Elite" button
- [x] Integrate limit check into scan flow (block after 5th scan for free users)
- [x] Paid tiers (Essential/Pro/Elite) bypass the limit entirely
- [x] Write tests for scan limit logic

## 5-Step Onboarding Quiz
- [x] Step 1: Height and weight input screen
- [x] Step 2: Primary goal selection (Build Muscle, Lean Bulk, Maintenance)
- [x] Step 3: Training frequency (times per week)
- [x] Step 4: Dietary restrictions selection
- [x] Step 5: Target body weight input
- [x] Skip option on each screen
- [x] Persist onboarding data locally (AsyncStorage)
- [x] Gate app behind onboarding on first launch only
- [x] Connect onboarding data to Anabolic Forecast logic
- [x] Write tests for onboarding data flow and forecast connection

## Login/Signup After Onboarding
- [x] Login screen with Google and Apple auth options
- [x] "Retake Quiz" link on login screen to go back to onboarding
- [x] Show login after onboarding completion

## Navigation Transitions
- [x] Add 300ms fade transition to all Stack navigation (tabs, settings, modals)
- [x] Add 300ms fade transition to tab switching
- [x] Ensure fluid premium feel across all navigation

## SF Pro Font Enforcement
- [x] Ensure SF Pro is the system font on all text elements across all screens
- [x] Audit and fix any hardcoded fontFamily references that aren't SF Pro
- [x] Added Typography import to onboarding, welcome-modal, scan-limit-modal

## Debug Pass — Fix Broken Buttons
- [x] Audit all onPress handlers across all screens for dead ends
- [x] Fix any non-functional buttons or navigation issues
- [x] Verify all flows end-to-end (onboarding → auth → paywall → dashboard → scan → meals)
- [x] Added runtime safety guard to IconSymbol for unmapped icons
- [x] Fixed AuthGate route matching to prevent redirect loops

## AI Coach Insight Box
- [x] Add AI Coach insight box below every scan result explaining the Anabolic Score
- [x] Local insight generation based on protein density, sources, and sugar analysis
- [x] Match monochrome theme styling with grade badges (ELITE/STRONG/MODERATE/LOW)

## Instagram Stories Gains Card Share
- [x] Add Instagram Stories share button on Gains Card screen
- [x] Generate aesthetic shareable card with user stats and macro bars
- [x] Share to Instagram Stories, TikTok, or general share sheet

## Fast Food Pro Directory
- [x] Build Fast Food Pro screen with 8 major chain restaurants
- [x] Show highest protein options at each chain (Culver's, McDonald's, Chick-fil-A, etc.)
- [x] Add search/filter functionality with protein density ranking
- [x] Match monochrome theme styling with pro tips per item

## iOS Home Screen Widget
- [x] Create widget data provider and preview components
- [x] Show protein consumed vs goal in compact and medium widget layouts
- [x] Widget preview section added to Settings screen
- [x] Match monochrome theme styling

## Tests for Retention Features
- [x] AI Coach insight logic tests (5 tests)
- [x] Fast Food Pro protein score and sorting tests (4 tests)
- [x] Widget data structure and progress calculation tests (3 tests)
- [x] Score grading tests (4 tests)

## Cloud Sync for Paid Subscribers
- [x] Design database schema for meals, forecasts, profile, and subscription
- [x] Build server-side sync API (push/pull endpoints)
- [x] Build client-side sync service with paid-tier gating
- [x] Sync meal logs, Anabolic Forecasts, and profile settings to cloud for paid users
- [x] Link all synced data to Google/Apple ID
- [x] Keep free users local-only with device storage
- [x] Add "Sync to Cloud" upsell message for free users on second device login
- [x] Persist subscription tier ($9.99/mo Essential, $19.99/mo Pro, $79.99/yr Elite) to database
- [x] Ensure progress restores when paid users sign in on any device
- [x] Write tests for sync logic (21 tests covering data prep, merge, formatting, tier gating)

## Auto-Sync on App Launch
- [x] Auto-pull cloud data when paid user opens the app
- [x] Auto-push local changes to cloud after pull completes
- [x] Restore subscription tier from server on launch
- [x] Skip auto-sync for free users

## Restore Purchases on Paywall
- [x] Add "Restore Purchases" button to paywall screen with loading state
- [x] Call server restorePurchases endpoint to check for active subscriptions
- [x] Update local subscription tier if active subscription found
- [x] Show success/failure feedback with haptic confirmation

## Offline Sync Queue
- [x] Build offline queue that buffers data changes when offline (AsyncStorage)
- [x] Detect network connectivity changes using expo-network
- [x] Auto-push queued changes when connectivity returns (NetworkSyncManager)
- [x] Persist queue in AsyncStorage so it survives app restart
- [x] Queue compaction (dedup full_sync, merge profile_updates)
- [x] Retry tracking with max-retry pruning
- [x] Offline queue status indicator in Settings (Cloud Sync section)
- [x] Write tests for offline queue logic (16 tests)

## Fix Scan Limits Per Tier
- [x] Essential plan: 50 scans/month (not 5/day like Free)
- [x] Pro/Elite: unlimited scans (no counter shown)
- [x] Free: 5 scans/day (existing behavior)
- [x] Update scan badge text to show tier-appropriate message
- [x] Update scan counter module to support monthly limits
- [x] Update ScanLimitModal with tier-aware messaging (monthly vs daily)
- [x] Update tests for tier-specific scan limits (32 tests)

## Calendar Strip Redesign — Minimalist Premium
- [x] Remove solid gray background boxes from date cells
- [x] Make current day a high-contrast white pill/circle with black text
- [x] Make past/future dates simple white text on black background
- [x] Add 4px Anabolic Dot under dates with logged meals
- [x] Ensure SF Pro Display font throughout calendar strip

## Fix Free User Auth → Paywall Gate (Updated)
- [x] OAuth callback routes through paywall instead of directly to /(tabs)
- [x] Free users CAN continue for free (5 scans/day, local storage only)
- [x] Cloud sync strictly gated to paid subscribers only
- [x] Free users see subscription options but can skip with "Continue with Free"

## Rework Auth Flow (New Requirements)
- [x] First launch → onboarding quiz immediately (no change needed)
- [x] After onboarding → show auth/login screen
- [x] Auth screen: tapping Google/Apple/SignUp redirects free users to paywall first (not OAuth)
- [x] Paywall: subscribing → redirect back to auth to complete login with Google/Apple/account
- [x] Paywall: "Continue with Free" → skip auth entirely, go to tabs (local only, 5 scans/day)
- [x] AuthGate updated to support new flow: onboarding → auth → paywall → auth → tabs OR free → tabs
- [x] Update tests for new auth flow

## Full Debug Audit
- [x] TypeScript compilation check (0 errors)
- [x] Full test suite passes (316 passed, 1 skipped)
- [x] Dev server health check (running, healthy)
- [x] Console errors and runtime warnings reviewed
- [x] Auth flow files audited (auth.tsx, paywall.tsx, auth-gate.tsx, oauth/callback.tsx)
- [x] App context and state management audited
- [x] Tab layouts and navigation audited
- [x] Feature files audited (scan counter, meals, onboarding, cloud sync, settings)
- [x] All discovered issues fixed:
  - [x] CRITICAL: Fixed cloud sync tRPC calls — created vanillaTrpc client for imperative (non-hook) calls
  - [x] Fixed restoreSubscriptionFromCloud, syncToCloud, syncFromCloud to use vanillaTrpc
  - [x] Fixed paywall restore purchases to use vanillaTrpc
  - [x] Fixed stray semicolon in tab layout
  - [x] Fixed double semicolon in scan-meal.tsx

## Upgrade Plan Button in Settings
- [x] Add "Upgrade Plan" button in subscription section for Essential/Pro users
- [x] Button navigates to paywall to upgrade to higher tier
- [x] Only show for Essential and Pro users (not free or Elite)

## Save Your Progress Upsell Banner
- [x] Add upsell banner on home screen for free users
- [x] Banner encourages subscribing to save progress across devices
- [x] Tapping banner navigates to paywall
- [x] Banner hidden for paid subscribers

## Streak Tracking with Badges
- [x] Create streak calculation module (lib/streak.ts)
- [x] Calculate current streak and longest streak from meal dates
- [x] Add milestone badges: 7-day "Week Warrior", 30-day "Monthly Machine", 100-day "Century Club"
- [x] Display streak card with fire emoji counter and badge row on dashboard
- [x] Badges show earned/unearned states (opacity-based)
- [x] Write 13 streak tests (all passing)

## Paywall Back Arrow
- [x] Add back arrow button to paywall screen header (shows when navigated from settings, profile, home, forecast)
- [x] Updated all paywall navigation calls to pass from= param

## Subscription Model Overhaul
- [x] Replace old 4-tier model (free/essential/pro/elite) with 2-plan model (monthly/annual)
- [x] Monthly Essential: $9.99/mo — full access, Stripe URL configured
- [x] Elite Annual: $59.99/yr — full access, "Best Value - Save 50%", Stripe URL configured
- [x] Both plans give identical full access to all features
- [x] Rewrite paywall UI with only two plan cards
- [x] Gate: Dashboard locked until user selects a plan and completes Stripe checkout
- [x] Post-checkout: grant full access to all AI scanning and tracking features
- [x] Restore Purchase button visible on paywall
- [x] Update subscription-features.ts to remove old tier logic
- [x] Update settings screen to remove old tier references
- [x] Update auth-gate for new gating logic
- [x] Remove "Continue with Free" option — all users must choose a plan
- [x] Update all screens referencing old subscription tiers

## Remove Free Trial — Immediate Charge
- [x] Remove "trial" tier from SubscriptionTier type (only: none, monthly, annual)
- [x] Update paywall copy: "Start Free Trial" → "Get Instant Access" / "Unlock MuscleAI"
- [x] Verify Stripe URLs are correct (Monthly $9.99, Annual $59.99)
- [x] Remove trialStartDate and trial expiry logic from app-context
- [x] Update auth-gate: require confirmed payment (monthly/annual) before dashboard
- [x] Update subscription-features, iap-service, scan-counter for no trial tier
- [x] Update all screens referencing "trial" tier
- [x] Update tests for no-trial model (295 passed, 0 TS errors)

## Rework App Flow — No Free Plan
- [x] First launch: onboarding quiz → login page → paywall (on login/signup attempt)
- [x] Returning users: go directly to login page (skip onboarding)
- [x] Option to retake onboarding quiz from login page
- [x] Paywall triggered when user tries to login/create account without paying
- [x] Back arrow always visible on paywall, navigates to previous page
- [x] Remove free plan entirely (no 5 scans/day, no Continue with Free)
- [x] Remove upsell banner from home screen (no free users exist)
- [x] Scan-limit-modal updated (all subscribers have unlimited)
- [x] AuthGate rewritten for new flow
- [x] Auth screen rewritten for new flow
- [x] Paywall updated with always-visible back arrow
- [x] All 295 tests passing, 0 TS errors

## Paywall Back Arrow Position
- [x] Lower the back arrow on paywall so it doesn't overlap status bar or other elements

## Fix Create Account Infinite Spinner
- [x] Root cause: no server-side email/password signup endpoint exists (backend is OAuth-only)
- [x] Removed fake email/password form — kept only Google and Apple OAuth sign-in
- [x] Added 15-second timeout on auth screen to stop spinner if OAuth doesn't respond
- [x] Added 30-second timeout on OAuth callback to prevent infinite processing state
- [x] Added "Back to Sign In" link on OAuth error screen
- [x] Clear error messages for timeout, network failure, and OAuth errors
- [x] OAuth callback already redirects to /(tabs) after successful login
- [x] All 295 tests passing, 0 TS errors

## Fix OAuth Login Redirect Loop
- [x] After successful Google/Apple OAuth, user must land on dashboard not auth page
- [x] Fix AuthGate so authenticated users always reach /(tabs)
- [x] Ensure all login methods (Google, Apple) work correctly end-to-end
- [x] Decoupled authentication from subscription: auth gates app entry, subscription gates features
- [x] Removed paywall gate from auth screen login buttons — users can OAuth directly
- [x] Updated auth-paywall-gate tests for new flow (20 tests, all passing)
- [x] 296 tests passing, 0 TypeScript errors

## Fix OAuth redirect_uri Scheme Error
- [x] OAuth fails with "redirect_uri scheme 'exp' not allowed" on Expo Go
- [x] Update OAuth redirect_uri to use HTTPS server callback instead of exp:// deep link
- [x] Added /api/oauth/mobile-callback server endpoint that exchanges code and redirects via deep link
- [x] Updated getRedirectUri() to use HTTPS API endpoint for native (Expo Go + standalone)
- [x] Server exchanges OAuth code, creates session, then redirects to muscleai://oauth/callback with sessionToken
- [x] Ensure OAuth works on both Expo Go and production builds
- [x] 296 tests passing, 0 TypeScript errors

## Production Ready Check
- [x] Verify 'muscleai' scheme is explicitly set in app.config.ts for deep link support
- [x] Verify bundleIdentifier (iOS) and package (Android) are set — com.evan.muscleai
- [x] Audit all environment variables — no localhost references in production code
- [x] Audit Stripe URLs point to production (fixed test URLs in profile.tsx, settings.tsx, tests)
- [x] Audit OAuth config for production readiness — all env-driven, no hardcoded values
- [x] Audit server endpoints for production readiness — removed localhost:8081 fallback
- [x] Push final production-ready code to GitHub
- [x] 296 tests passing, 0 TypeScript errors

## Fix Expo Launch — Static app.json Required
- [x] Create static app.json with all production manifest settings
- [x] Ensure app.config.ts still works alongside app.json for dynamic env vars
- [x] Push to GitHub so Expo Launch can read the static manifest
- [x] 296 tests passing, 0 TypeScript errors

## Final OAuth Login Audit for Paid Users (Google + Apple)
- [x] Audit auth screen: Google and Apple login buttons trigger OAuth correctly
- [x] Audit OAuth redirect_uri construction for native builds
- [x] Audit server mobile-callback endpoint: code exchange, session creation, deep link redirect
- [x] Audit client OAuth callback screen: session token storage, user info persistence
- [x] Audit AuthGate: authenticated paid users reach dashboard without loops
- [x] Audit subscription restoration from cloud after login
- [x] Fix AutoSync stale closure bug — subscription ref now reads latest value after restore
- [x] Fix session verification to allow empty name (Apple users may hide name)
- [x] Fix AuthGate hasRedirected ref — resets on logout so re-login redirects to tabs
- [x] Fix any issues found and push to GitHub
- [x] 296 tests passing, 0 TypeScript errors

## Replace Manus OAuth with Native Google + Apple Sign-In
- [x] Install expo-apple-authentication and @react-native-google-signin/google-signin
- [x] Configure app.json and app.config.ts with Apple Sign-In capability and Google Sign-In plugin
- [x] Create native auth service (lib/native-auth.ts) for Apple and Google sign-in
- [x] Add server endpoint /api/auth/native to verify native identity tokens (Apple JWKS + Google JWKS)
- [x] Update auth screen to use native sign-in buttons (native on iOS/Android, Manus OAuth fallback on web)
- [x] Set Google OAuth Web Client ID and iOS URL scheme in app config
- [x] Wire up Google Sign-In configuration on app startup in _layout.tsx
- [x] Apple Sign-In shows native iOS sheet, Google Sign-In shows native popup
- [x] Server verifies identity tokens via Apple/Google JWKS public keys
- [x] Session management, cloud sync, and subscription restoration maintained
- [x] 297 tests passing, 0 TypeScript errors
- [x] Push to GitHub

## Expo Store Launch — Production Config Values
- [x] Update bundleIdentifier to com.evankoenke.muscleaiorcalorietracker in app.config.ts and app.json
- [x] Add appleTeamId RS439TZ92G to app.config.ts and app.json
- [x] Add projectId 18396eeb-c055-4675-932a-b23ba5ca5dd7 to app.config.ts and app.json
- [x] ITSAppUsesNonExemptEncryption: false already set in infoPlist
- [x] Added owner: evankoenke to app.config.ts and app.json
- [x] Updated eas.json submit appleTeamId to RS439TZ92G
- [x] Push to GitHub for Expo Launch re-run
- [x] 297 tests passing, 0 TypeScript errors

## Replace Stripe Payment Links with Native In-App Purchases
- [x] Research and choose IAP library — expo-iap (StoreKit 2 + Google Play Billing)
- [x] Install expo-iap and configure app.json/app.config.ts
- [x] Rewrite iap-service.ts with native purchase flow (expo-iap useIAP hook)
- [x] Rewrite paywall screen with native IAP purchase buttons (Monthly $9.99, Annual $59.99)
- [x] Add "Restore Purchases" button using expo-iap restore flow
- [x] Remove ALL Stripe references from paywall, settings, profile, support, and tests
- [x] Update server/iap.ts product ID mapping for new bundle ID
- [x] Update settings.tsx to manage subscriptions via App Store/Google Play
- [x] Update profile.tsx payment method management to native store
- [x] Update support.tsx billing FAQ to reflect native IAP
- [x] Update tests: replaced Stripe link tests with native IAP product ID tests
- [x] 298 tests passing, 0 TypeScript errors
- [x] Push to GitHub

## Fix Expo Launch CommandError — app.config.ts Production Values
- [x] Update owner to "evankoenkes-organization" in app.config.ts
- [x] Update projectId to "aace2de1-ac67-4116-9acf-5820c84bb35c" in app.config.ts extra.eas
- [x] Ensure appleTeamId RS439TZ92G is set
- [x] Ensure bundleIdentifier com.evankoenke.muscleaiorcalorietracker is set
- [x] Ensure ITSAppUsesNonExemptEncryption: false is in ios.infoPlist
- [x] Update app.json with matching values
- [x] Push to GitHub main branch

## Fix Login Redirect Loop (Final Fix)
- [x] Root cause: Google/Apple sign-in completes, dashboard briefly shows, then redirects back to login
- [x] Audit AuthGate logic for race conditions or state resets
- [x] Audit session persistence (SecureStore/AsyncStorage) to ensure token survives navigation
- [x] Audit app-context auth state management for stale closures or re-initialization
- [x] Fix the issue permanently so authenticated users stay on dashboard
- [x] Test and push to GitHub

## Reverse Auth Flow: Sign In First, Then Paywall
- [x] Change flow from onboarding→paywall→auth→tabs to onboarding→auth→paywall→tabs
- [x] Update AuthGate to redirect authenticated users to paywall before tabs (if no subscription)
- [x] Update auth.tsx to navigate to paywall after successful sign-in (not directly to tabs)
- [x] Update paywall.tsx to navigate to tabs after subscription or dismiss
- [x] Ensure oauth/callback.tsx follows the same new flow
- [x] Remove any pre-auth paywall redirects

## Fix Expo Go Preview
- [x] Diagnose Expo Go preview — sandbox runs web-only mode; Expo Go requires local dev or EAS Build

## Fix Expo Go HTTP 500 Error
- [x] Dev server runs with --web flag only, causing HTTP 500 for Expo Go native bundle requests
- [x] Reconfigure dev server to serve both web and native bundles (removed --web flag from dev:metro script)
