# HealthPath -- Health Assessment System

A full-stack health quiz funnel with a subscription paywall, built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

![CI](https://github.com/YOUR_USERNAME/health-quiz-app/actions/workflows/ci.yml/badge.svg)

---

## Live Demo

> Deploy to Vercel + Supabase (see Deployment section below), then replace this URL.

**Production URL:** `https://your-app.vercel.app`

**Pre-seeded demo sessions** (run `npm run db:seed` first):

| Session ID | State | Endpoint |
|---|---|---|
| `demo-trial-active` | TRIAL (2 days left) | `GET /api/results/demo-trial-active` |
| `demo-trial-expired` | TRIAL_EXPIRED | `GET /api/results/demo-trial-expired` |
| `demo-paid` | ACTIVE subscriber | `GET /api/results/demo-paid` |

> **Note:** Demo sessions bypass cookie auth in seed data and are for read-only API inspection only. The quiz UI always creates its own session with a full cookie.

---

## Quick Start (Local)

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USERNAME/health-quiz-app
cd health-quiz-app
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env -- set DATABASE_URL to your local PostgreSQL instance

# 3. Apply versioned database migrations
npx prisma migrate deploy

# 4. Seed demo sessions
npm run db:seed

# 5. Start dev server
npm run dev
# -> http://localhost:3000
```

### Existing development database baseline

If your local PostgreSQL database was created before migrations were added, do
not run the initial migration against it again. Mark the matching baseline as
applied once, then deploy later migrations normally:

```bash
npx prisma migrate resolve --applied 20260624000000_init
npx prisma migrate deploy
npm run db:seed
```

The second migration creates the `Video` table. The seed adds six video
records: two free previews and four subscriber-only lessons.

---

## Run Tests

```bash
# Unit tests only (no DB required) -- 171 tests
npx jest --testPathPattern="__tests__/unit"

# Integration tests (requires DATABASE_URL)
npx jest --testPathPattern="__tests__/integration" --runInBand

# All tests + coverage
npm run test:coverage
```

> **Note:** Integration tests require the Prisma client binary to match the host OS. On Windows, run `npm run db:generate` before running integration tests. On Linux CI, this is handled automatically by the workflow.

---

## Deployment (Vercel + Supabase)

### 1. Create a Supabase project
1. Go to https://supabase.com -> New Project
2. Copy the **Connection Pooling** string -> `DATABASE_URL`

### 2. Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
# Add environment variable when prompted:
#   DATABASE_URL=<your-supabase-pooling-url>
```

### 3. Apply migrations + seed
```bash
DATABASE_URL="<production-url>" npx prisma migrate deploy
DATABASE_URL="<production-url>" npm run db:seed
```

---

## API Reference

All endpoints are session-scoped. Session identity is established via an HttpOnly cookie (`healthpath_session_<id>`) set on session creation. The cookie must be present for all subsequent requests -- the quiz frontend handles this automatically.

### POST `/api/sessions`
Create a new quiz session. Returns an HttpOnly auth cookie.

**Body (optional):**
```json
{ "clientId": "uuid-v4-generated-by-client" }
```

**Response 201:**
```json
{
  "id": "cm...",
  "currentStep": 0,
  "version": 0,
  "isCompleted": false,
  "quizData": {},
  "subscription": null
}
```

Sending the same `clientId` re-issues the cookie and returns the existing session with `200`.

---

### GET `/api/sessions/:id`
Fetch session progress for page-refresh recovery. Requires cookie.

**Response 200:**
```json
{
  "id": "cm...",
  "currentStep": 3,
  "version": 3,
  "isCompleted": false,
  "quizData": { "age": 34, "gender": "female", "goal": "lose_weight" },
  "subscription": null
}
```

---

### PUT `/api/sessions/:id/steps`
Save a single quiz step. Requires cookie. Unknown fields for the given step are rejected with 400.

**Body:**
```json
{ "step": 6, "data": { "heightCm": 165, "weightKg": 75 } }
```

**Step schema:**

| Step | Field(s) | Valid values |
|------|----------|-------------|
| 1 | `gender` | `male`, `female` |
| 2 | `age` | Integer 16-100 |
| 3 | `goal` | `lose_weight`, `tone_up`, `build_strength`, `improve_health` |
| 4 | `focusAreas` | Array of 1+: depends on goal (see below) |
| 5 | `activityTypes` | Array of 1+: `home_workouts`, `gym`, `running_walking`, `yoga_pilates`, `hiit_cardio`, `swimming`, `cycling`, `sports` |
| 6 | `heightCm`, `weightKg` | 100-250, 30-300 |
| 7 | `targetWeightKg` | 30-300 |
| 8 | `activityLevel` | `sedentary`, `light`, `moderate`, `active` |
| 9 | `dietPreference` | `no_preference`, `vegetarian`, `vegan`, `keto`, `paleo` |
| 10 | `email` | Valid email (optional -- links session to a User + starts trial) |

**focusAreas values by goal:**
- `lose_weight`: `belly_fat`, `thighs_hips`, `arms`, `full_body_slim`
- `tone_up`: `core_abs`, `arms_shoulders`, `legs_glutes`, `full_body_tone`
- `build_strength`: `chest_back`, `biceps_triceps`, `legs_power`, `core_strength`
- `improve_health`: `flexibility`, `endurance`, `posture`, `stress_relief`

**Response 200:**
```json
{ "id": "cm...", "currentStep": 6, "version": 6, "savedAt": "2024-..." }
```

Step 6 additionally returns `medicalWarning` (string or null) if BMI is outside 15-60.

---

### POST `/api/sessions/:id/calculate`
Run the health assessment after all 10 steps are complete. Idempotent. Requires cookie.

**Response 201:**
```json
{ "sessionId": "cm...", "resultId": "cm..." }
```

---

### GET `/api/results/:sessionId`
Returns health results. Access level depends on subscription status. Requires cookie.

**Limited (no account or expired):**
```json
{
  "access": "limited",
  "reason": "no_account",
  "sessionId": "cm...",
  "bmi": 28.7,
  "bmiCategory": "Overweight",
  "dailyCalories": 1650,
  "message": "Enter your email to unlock your full plan and start your free 3-day trial."
}
```

**Full (ACTIVE subscription only):**
```json
{
  "access": "full",
  "accessReason": "subscribed",
  "sessionId": "cm...",
  "goal": "lose_weight",
  "bmi": 28.7,
  "bmiCategory": "Overweight",
  "dailyCalories": 1650,
  "proteinGrams": 120,
  "carbGrams": 178,
  "fatGrams": 51,
  "weeklyWeightLossForecast": 0.46,
  "weeksToGoal": 35,
  "targetDate": "2025-06-01T00:00:00.000Z",
  "weeklyProjection": [
    { "week": 0, "weightKg": 78 },
    { "week": 1, "weightKg": 77.5 }
  ]
}
```

---

### GET `/api/plan/:sessionId`
Returns a 7-day personalised workout plan. Only an active paid subscription
receives all seven days; free and trial users receive the first two days. Requires cookie.

**Limited:** first 2 days only.
**Full:** complete 7-day schedule with exercises, sets, reps, rest, and intensity.

---

### POST `/api/pay`
Simulate a payment confirmation -- activates subscription. Requires cookie.

**Body:**
```json
{ "sessionId": "cm...", "plan": "yearly" }
```
`plan` defaults to `"monthly"`. Accepted: `"monthly"` (+1 month), `"yearly"` (+1 year).

**Response 200:**
```json
{
  "success": true,
  "sessionId": "cm...",
  "status": "ACTIVE",
  "plan": "yearly",
  "activatedAt": "2024-03-15T10:00:00.000Z",
  "expiresAt": "2025-03-15T10:00:00.000Z"
}
```

Already-active (not yet expired) returns `"alreadyActive": true`. Expired ACTIVE subscriptions are renewed normally.

---

## API Replay (curl)

All requests must carry the session cookie. Use `-c`/`-b` to persist it:

```bash
BASE="http://localhost:3000"
JAR=/tmp/hp-cookies.txt

# 1. Create session (sets HttpOnly auth cookie)
SESSION=$(curl -sc $JAR -X POST $BASE/api/sessions \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.id')
echo "Session: $SESSION"

# 2. Complete all 10 steps
curl -sb $JAR -X PUT $BASE/api/sessions/$SESSION/steps \
  -H "Content-Type: application/json" \
  -d '{"step":1,"data":{"gender":"female"}}'

curl -sb $JAR -X PUT $BASE/api/sessions/$SESSION/steps \
  -H "Content-Type: application/json" \
  -d '{"step":2,"data":{"age":34}}'

curl -sb $JAR -X PUT $BASE/api/sessions/$SESSION/steps \
  -H "Content-Type: application/json" \
  -d '{"step":3,"data":{"goal":"lose_weight"}}'

curl -sb $JAR -X PUT $BASE/api/sessions/$SESSION/steps \
  -H "Content-Type: application/json" \
  -d '{"step":4,"data":{"focusAreas":["belly_fat","thighs_hips"]}}'

curl -sb $JAR -X PUT $BASE/api/sessions/$SESSION/steps \
  -H "Content-Type: application/json" \
  -d '{"step":5,"data":{"activityTypes":["gym","running_walking"]}}'

curl -sb $JAR -X PUT $BASE/api/sessions/$SESSION/steps \
  -H "Content-Type: application/json" \
  -d '{"step":6,"data":{"heightCm":165,"weightKg":78}}'

curl -sb $JAR -X PUT $BASE/api/sessions/$SESSION/steps \
  -H "Content-Type: application/json" \
  -d '{"step":7,"data":{"targetWeightKg":62}}'

curl -sb $JAR -X PUT $BASE/api/sessions/$SESSION/steps \
  -H "Content-Type: application/json" \
  -d '{"step":8,"data":{"activityLevel":"moderate"}}'

curl -sb $JAR -X PUT $BASE/api/sessions/$SESSION/steps \
  -H "Content-Type: application/json" \
  -d '{"step":9,"data":{"dietPreference":"no_preference"}}'

curl -sb $JAR -X PUT $BASE/api/sessions/$SESSION/steps \
  -H "Content-Type: application/json" \
  -d '{"step":10,"data":{"email":"demo@example.com"}}'

# 3. Calculate results
curl -sb $JAR -X POST $BASE/api/sessions/$SESSION/calculate | jq .

# 4. View limited results (trial started by email step above)
echo "=== TRIAL RESULTS ==="
curl -sb $JAR $BASE/api/results/$SESSION | jq .

# 5. Activate paid subscription
curl -sb $JAR -X POST $BASE/api/pay \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION\",\"plan\":\"yearly\"}" | jq .

# 6. View full results
echo "=== PAID RESULTS ==="
curl -sb $JAR $BASE/api/results/$SESSION | jq .
```

---

## Database Schema

```
+--------------------------------------------------+
|                     Session                      |
|  id              String (CUID)   PK              |
|  accessTokenHash String?         (cookie auth)   |
|  currentStep     Int             0-10            |
|  version         Int             (optimistic lock)|
|  isCompleted     Boolean                         |
|  quizData        Json            (all answers)   |
|  expiresAt       DateTime?       (data retention)|
|  userId          String?         FK -> User      |
+----------+-------------------------------+--------+
           |                               |
           | 1:1                           | 1:1
           v                               v
+---------------------+     +--------------------------+
|    HealthResult     |     |          User            |
|  id          String |     |  id     String           |
|  sessionId   String |     |  email  String (unique)  |
|  bmi         Float  |     +------------+-------------+
|  bmiCategory String |                  |
|  dailyCalories Int  |                  | 1:1
|  proteinGrams Int   |                  v
|  carbGrams   Int    |     +--------------------------+
|  fatGrams    Int    |     |       Subscription       |
|  weeklyProjection   |     |  status  Enum            |
|    Json (array)     |     |    TRIAL                 |
|  weeksToGoal Int    |     |    TRIAL_EXPIRED         |
|  targetDate DateTime|     |    ACTIVE                |
+---------------------+     |    EXPIRED               |
                            |    CANCELLED             |
                            |  plan        String?     |
                            |  trialEndsAt DateTime    |
                            |  activatedAt DateTime?   |
                            |  expiresAt   DateTime?   |
                            +--------------------------+
```

**Design decisions:**
- `quizData` as a JSON blob: new question steps can be added without schema migrations. Validated at the API layer per step.
- Separate `HealthResult` table: avoids loading the 52-point projection array on every auth check.
- `accessTokenHash` on Session: stores SHA-256 of a random token delivered via HttpOnly cookie. Session IDs alone are not sufficient for write access.
- `version` on Session: used for optimistic concurrency control on step saves -- concurrent updates return 409 rather than silently losing data.
- `expiresAt` on Session: scheduled for cleanup 2 days after trial expiry. The `/api/cleanup` route deletes sessions past this date.

---

## Health Assessment Algorithm

**BMR:** Mifflin-St Jeor equation (most validated for general-population cohort per ACSM).
```
Men:   BMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age) + 5
Women: BMR = (10 x weight_kg) + (6.25 x height_cm) - (5 x age) - 161
```

**TDEE:** BMR x activity multiplier (sedentary 1.2 -> active 1.725).

**Goal-based calorie target:**

| Goal | Adjustment | Timeline |
|------|-----------|---------|
| Lose weight | -500 kcal/day (deficit) | Weeks to target weight via deficit |
| Tone up (losing) | -200 kcal/day | Weeks to target weight via small deficit |
| Tone up (maintaining) | 0 kcal/day | 12-week recomposition programme |
| Build strength (gaining) | +250 kcal/day | Weeks to target weight via surplus |
| Build strength (recomp) | +250 kcal/day | 16-week recomposition programme |
| Improve health | 0 kcal/day | 12-week maintenance programme |

**Calorie floor:** 1500 kcal (male) / 1200 kcal (female).
**Timeline cap:** 104 weeks maximum to prevent runaway forecasts.
**Macros:** Protein 1.6 g/kg bodyweight, Fat 28% of calories, Carbs = remainder.

---

## Test Coverage

```
Test Suites: 2 passed (unit)
Tests:       171 passed
```

**Unit tests (`__tests__/unit/`)**

- `health-calculator.test.ts` -- BMI, BMR (Mifflin-St Jeor), TDEE multipliers, per-goal calorie targets, macro ratios, timeline per goal, projection arrays, input validation including NaN/Infinity/cross-field checks
- `validation.test.ts` -- all 10 step schemas, enum guards, array validation (focusAreas/activityTypes), SQL injection strings rejected, isQuizComplete, mergeQuizData

**Integration tests (`__tests__/integration/`)** -- require PostgreSQL

- `sessions.test.ts` -- session creation + idempotency, step persistence, version-lock conflict (409), out-of-order saves, calculate idempotency, 422 on incomplete data, 404 on unknown sessions
- `auth-and-pay.test.ts` -- free vs paid result shapes, payment activation, idempotent double-pay, trial-then-pay E2E flow

---

## Known Gaps and Limits

| Gap | Notes |
|-----|-------|
| No real payment processor | `/api/pay` is a stub. Production would use Stripe webhooks with signature verification. |
| `/api/cleanup` is unauthenticated | Requires `Authorization: Bearer <CLEANUP_SECRET>` in production. |
| `POST /api/sessions` (clientId path) returns quizData | The idempotent path re-issues a cookie but should not return quizData in the response body. |
| Token is SHA-256, not HMAC | `hashSessionAccessToken` uses plain SHA-256. True signed tokens would use `createHmac('sha256', process.env.TOKEN_SECRET)`. |
| Email not verified before account linking | Step 10 links any email to the session without ownership verification. |
| Integration tests fail on Windows host | Prisma binary mismatch between Windows and the Linux test sandbox. Unit tests (171) run cleanly on all platforms. |
| No E2E browser tests | Playwright coverage would add confidence on quiz navigation and paywall rendering. |

---

## AI Usage Retrospective

**Database modeling:** Asked Claude to compare normalised vs denormalised approaches for storing results. Chose a separate `HealthResult` table because the 52-point projection array is always read whole and never queried individually -- JSON column avoids 52 JOIN rows per request.

**Health algorithm:** Used Claude to compare Mifflin-St Jeor vs Harris-Benedict vs Katch-McArdle. Mifflin-St Jeor is the most validated for the non-athlete general population this product targets.

**Goal timeline semantics:** Claude's initial implementation used a single weight-loss formula for all four goals, producing "999 weeks to goal" for maintenance and "0 weeks" for strength (gaining). Fixed by branching on goal: deficit path for lose/tone, surplus-gain path for strength building, and flat 12/16-week programme for maintenance/recomposition.

**Security architecture:** User added HttpOnly cookie auth. Claude audited the implementation and identified 11 issues. Critical ones fixed: idempotent session path now re-issues cookie, ACTIVE subscription expiry now checked on every protected request, plan route now expires trials the same way the results route does.

**A suggestion I rejected:** Claude proposed storing `weeklyProjection` in a separate `WeightProjectionPoint` table. Rejected because: always read as a complete array, never filtered at DB level, and would require 52 JOIN rows to reconstruct a single field. JSON column is the right trade-off.

**A time AI was wrong:** The `/api/pay` idempotency check originally used `status === 'ACTIVE'` without checking `expiresAt`. An expired paid subscription returned `alreadyActive: true`, blocking renewal. Fixed to also verify `expiresAt > now`.
