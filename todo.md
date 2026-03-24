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
