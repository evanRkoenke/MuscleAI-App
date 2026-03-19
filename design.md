# Muscle AI — Mobile App Interface Design

## Brand Identity

**Color Palette (Dark Luxury / Clinical Neon)**

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0A0E14` | Deep dark base |
| Surface | `#111820` | Cards, elevated panels |
| Foreground | `#ECEDEE` | Primary text (white-ish) |
| Muted | `#7A8A99` | Secondary text |
| Primary | `#00B4FF` | Accent blue — buttons, highlights |
| Primary Glow | `#00E5FF` | Cyan neon glow accents |
| Border | `#1A2533` | Subtle dividers |
| Success | `#00E676` | Positive states, anabolic score high |
| Warning | `#FFB300` | Mid-range alerts |
| Error | `#FF3D3D` | Errors, low scores |

**Typography:** System font (SF Pro on iOS). Bold headlines, medium body.

**Visual Language:** Dark backgrounds, glowing blue/cyan accents, subtle gradients, rounded cards with thin borders. Inspired by the provided mockups — clinical luxury aesthetic.

---

## Screen List

### 1. Onboarding (3 slides)
- **Slide 1:** "Achieve Peak Performance" — Logo + tagline + bicep icon
- **Slide 2:** "The Ultimate Nutrition OS" — Calorie ring preview
- **Slide 3:** "Unlock Your 12-Month Journey" — Forecast chart preview
- **CTA:** "Get Started" button at bottom

### 2. Auth Screen
- Email/password login with "Forgot Password" link
- Google Sign-In button
- Apple Sign-In button
- "Create Account" toggle
- Uses Manus OAuth for actual auth (Google/Apple/Email flow)

### 3. Paywall Screen (Post-Onboarding)
- "Clinical Luxury" design — dark with glowing accents
- Three tier cards stacked vertically:
  - **Elite Annual** ($79.99/yr) — highlighted, "Best Value" badge
  - **Pro** ($19.99/mo)
  - **Essential** ($9.99/mo)
- "12-Month Muscle Forecast" locked behind Elite badge
- "Restore Purchases" link at bottom
- "Skip" / "Continue with Free" small link

### 4. Dashboard / Home Screen (Tab: Scan)
- Top: "MUSCLE AI" header with settings gear icon
- Large circular calorie ring: "Calories Remaining" (e.g., 1,650)
- Macro row below ring: Protein (g) | Carbs (g) | Fat (g)
- Quick action row: Scan | Meals | Forecast buttons
- "Protein Priority" card: food image + Anabolic Score badge (1-100)
- Floating camera button at bottom center for quick scan

### 5. Scan Screen (Tab: Scan — Camera Mode)
- Full-screen camera viewfinder
- Overlay: "Point at your meal" instruction
- Capture button (glowing blue ring)
- After capture: AI analysis overlay showing:
  - Food items detected
  - Calories, protein, carbs, fat
  - Anabolic Score (1-100) with color indicator

### 6. Meals Screen (Tab: Meals)
- Date selector at top (horizontal scroll)
- Meal sections: Breakfast, Lunch, Dinner, Snacks
- Each meal card: food name, calories, macros, anabolic score
- "Add Meal" button per section
- Daily totals summary at bottom

### 7. Track Screen (Tab: Track)
- Weight chart (line graph, time range selector: 1M, 3M, 6M, 1Y)
- Current weight display
- Body composition cards (if data available)
- "Log Weight" button
- Weekly/monthly progress summary

### 8. Forecast Screen (Tab: Forecast)
- "Anabolic Forecast" header with lock icon for non-Elite
- 12-month projection chart (weight over time)
- "Priority Sync" card — locked content indicator
- "PREMIUM MEMBERS ONLY" upsell card for non-Elite users
- Elite users see full forecast with milestones

### 9. AI Support Chat Screen
- Chat interface with "Muscle Support" AI agent
- Message bubbles (user = right, AI = left)
- Quick-action chips: "Login Help", "Billing", "How to Scan", "Troubleshooting"
- Input field with send button
- Escalation notice after 3 failed interactions

### 10. Settings Screen
- Profile section (name, email, avatar)
- Subscription status & manage
- Goal settings (target weight, calorie goal, macro split)
- Units preference (lbs/kg, cal/kJ)
- Notifications toggle
- Support (opens AI chat)
- Privacy Policy / Terms
- Logout

### 11. Gains Card Screen (Share)
- Auto-generated progress card for social sharing
- Shows: current stats, progress %, anabolic score
- Branded with Muscle AI logo + @muscleai.app
- Share button → IG Stories, TikTok, general share sheet

---

## Key User Flows

### Flow 1: First Launch
1. App opens → Onboarding slides (3 screens)
2. Tap "Get Started" → Auth screen
3. Sign up / Log in → Paywall screen
4. Choose plan or skip → Dashboard

### Flow 2: Scan a Meal
1. Dashboard → Tap floating camera button or "Scan" tab
2. Camera opens → Point at meal → Tap capture
3. AI analyzes image → Shows results overlay
4. Confirm → Meal logged → Dashboard updates macros

### Flow 3: View Forecast (Elite)
1. Tap "Forecast" tab
2. See 12-month projection chart
3. View milestones and predicted weight

### Flow 4: View Forecast (Free/Pro)
1. Tap "Forecast" tab
2. See blurred/locked chart
3. "Unlock" CTA → Opens paywall

### Flow 5: Get AI Support
1. Settings → Support, or dedicated chat icon
2. Chat with Muscle Support AI
3. AI resolves issue or escalates after 3 attempts

### Flow 6: Share Gains Card
1. Track tab → "Share Progress" button
2. Generates branded Gains Card
3. Share to IG Stories / TikTok / clipboard

---

## Tab Bar Structure

| Tab | Icon | Screen |
|-----|------|--------|
| Scan | Camera/eye icon | Dashboard + Scan |
| Meals | Fork/knife icon | Meals log |
| Track | Chart/bar icon | Weight tracking |
| Forecast | Trending-up icon | 12-month forecast |

Bottom tab bar: dark background, blue active tint, muted inactive. Floating camera button overlaps center of tab bar on Dashboard.
