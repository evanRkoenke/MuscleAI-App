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
- [x] Add delete meal functionality (swipe or tap to delete)
- [x] Add favorite meal functionality (star/heart toggle)
- [x] Show favorites section at top of meals list
- [x] Persist favorites and deletions in AsyncStorage
- [x] Add confirmation dialog before deleting a meal

## Pre-Launch Debug Pass
- [x] Verify all navigation flows end-to-end (no dead ends)
- [x] Verify all onPress handlers work (no empty handlers)
- [x] Check error states on all screens (scan fail, network error, empty states)
- [x] Verify subscription gating works correctly (free vs paid)
- [x] Verify dark theme is consistent across all screens
- [x] Check all data persistence (meals, profile, settings)
- [x] Run full test suite and fix any failures

## Cloud Backend — Database & Sync
- [x] Add meals table to Drizzle schema (userId, date, mealType, name, calories, protein, carbs, fat, anabolicScore, imageUri, isFavorite)
- [x] Add userProfiles table to Drizzle schema (userId, targetWeight, currentWeight, calorieGoal, proteinGoal, carbsGoal, fatGoal, unit, profilePhotoUri, subscription)
- [x] Add weightLog table to Drizzle schema (userId, date, weight)
- [x] Add pushTokens table to Drizzle schema (userId, token, platform)
- [x] Run database migrations (pnpm db:push)
- [x] Build server-side query helpers in server/db.ts for all tables
- [x] Build tRPC sync routers (meals CRUD, profile upsert, weight CRUD, push token registration)
- [x] Refactor app-context to use tRPC for cloud sync (write-through: local + cloud)
- [x] Handle offline/unauthenticated gracefully (fallback to local AsyncStorage)

## Manus OAuth Auth Integration
- [x] Wire useAuth hook into app navigation (auto-redirect to auth screen if not logged in)
- [x] Sync user profile from cloud on login
- [x] Sync meals from cloud on login
- [x] Sync weight log from cloud on login

## Push Notifications — Protein Shortfall Alerts
- [x] Request notification permissions on app launch
- [x] Register Expo push token with server
- [x] Schedule daily local notification for protein shortfall check (8 PM)
- [x] Implement protein shortfall calculation and notification content
- [x] Handle notification tap to open meals screen
