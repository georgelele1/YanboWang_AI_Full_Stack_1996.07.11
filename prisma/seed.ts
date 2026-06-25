/**
 * Seed: creates demo sessions covering every access state.
 * Run: npm run db:seed
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { calculateHealthAssessment } from '../src/lib/health-calculator'

const prisma = new PrismaClient()

const RESULT_DATA = {
  age: 34,                          // exact age — used in BMR calculation
  gender: 'female' as const,
  goal: 'lose_weight' as const,
  heightCm: 165,
  weightKg: 78,
  targetWeightKg: 62,
  activityLevel: 'moderate' as const,
}

const QUIZ_DATA = {
  ...RESULT_DATA,
  ageGroup: '30-39' as const,       // derived from age=34 for display only
  dietPreference: 'no_preference' as const,
}

const VIDEO_LIBRARY = [
  { slug: 'mobility-reset', title: '5-Minute Mobility Reset', description: 'Gentle mobility for hips, shoulders and spine.', category: 'Mobility', durationSeconds: 300, thumbnailUrl: '/female30-39.png', isFreePreview: true, sortOrder: 1 },
  { slug: 'beginner-strength', title: 'Beginner Full-Body Strength', description: 'A clear, low-impact strength session for your first week.', category: 'Strength', durationSeconds: 720, thumbnailUrl: '/male30-39.png', isFreePreview: true, sortOrder: 2 },
  { slug: 'core-foundations', title: 'Core Foundations', description: 'Build stable core strength with controlled movements.', category: 'Strength', durationSeconds: 600, thumbnailUrl: '/female18-29.png', isFreePreview: false, sortOrder: 3 },
  { slug: 'low-impact-cardio', title: 'Low-Impact Cardio', description: 'Raise your heart rate without jumping.', category: 'Cardio', durationSeconds: 900, thumbnailUrl: '/male18-29.png', isFreePreview: false, sortOrder: 4 },
  { slug: 'posture-flow', title: 'Posture & Desk Reset', description: 'A guided flow for a more comfortable posture.', category: 'Mobility', durationSeconds: 480, thumbnailUrl: '/female40-49.png', isFreePreview: false, sortOrder: 5 },
  { slug: 'recovery-stretch', title: 'Evening Recovery Stretch', description: 'Slow down with a calming full-body stretch.', category: 'Recovery', durationSeconds: 660, thumbnailUrl: '/male50+.png', isFreePreview: false, sortOrder: 6 },
]

async function seedVideos() {
  const demoVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  await Promise.all(VIDEO_LIBRARY.map((video) => prisma.video.upsert({
    where: { slug: video.slug },
    update: { ...video, videoUrl: demoVideoUrl, isPublished: true },
    create: { ...video, videoUrl: demoVideoUrl, isPublished: true },
  })))
}

async function createSession(
  id: string,
  email: string,
  subscriptionStatus: 'TRIAL' | 'TRIAL_EXPIRED' | 'ACTIVE',
  trialOffsetDays: number, // negative = expired N days ago, positive = N days left
) {
  await prisma.session.deleteMany({ where: { id } })
  await prisma.user.deleteMany({ where: { email } })

  const result = calculateHealthAssessment(RESULT_DATA)
  const now = new Date()
  const trialEndsAt = new Date(now)
  trialEndsAt.setDate(trialEndsAt.getDate() + trialOffsetDays)

  // Calculate expiresAt for expired sessions (2 days after trial ended)
  let expiresAt: Date | null = null
  if (subscriptionStatus === 'TRIAL_EXPIRED') {
    expiresAt = new Date(trialEndsAt)
    expiresAt.setDate(expiresAt.getDate() + 2)
  }

  const user = await prisma.user.create({
    data: {
      email,
      subscription: {
        create: {
          status: subscriptionStatus,
          trialEndsAt,
          ...(subscriptionStatus === 'ACTIVE' && {
            activatedAt: now,
            expiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
          }),
        },
      },
    },
  })

  await prisma.session.create({
    data: {
      id,
      userId: user.id,
      currentStep: 8,
      isCompleted: true,
      expiresAt,
      quizData: QUIZ_DATA,
      result: {
        create: {
          bmi: result.bmi,
          bmiCategory: result.bmiCategory,
          dailyCalories: result.dailyCalories,
          proteinGrams: result.proteinGrams,
          carbGrams: result.carbGrams,
          fatGrams: result.fatGrams,
          weeklyWeightLossForecast: result.weeklyWeightLossForecast,
          weeksToGoal: result.weeksToGoal,
          targetDate: result.targetDate,
          weeklyProjection: result.weeklyProjection as unknown as Prisma.JsonArray,
        },
      },
    },
  })

  return user
}

async function main() {
  console.log('🌱 Seeding demo sessions...\n')
  await seedVideos()

  // 1. Active trial (2 days left)
  await createSession('demo-trial-active', 'trial@demo.com', 'TRIAL', 2)
  console.log('✅ demo-trial-active     → TRIAL (2 days left)  → GET /api/results/demo-trial-active')

  // 2. Expired trial (expired yesterday, data deletes in 1 more day)
  await createSession('demo-trial-expired', 'expired@demo.com', 'TRIAL_EXPIRED', -1)
  console.log('✅ demo-trial-expired    → TRIAL_EXPIRED        → GET /api/results/demo-trial-expired')

  // 3. Paid subscriber
  await createSession('demo-paid', 'paid@demo.com', 'ACTIVE', -1)
  console.log('✅ demo-paid             → ACTIVE (subscribed)  → GET /api/results/demo-paid')

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REVIEWER DEMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Compare access states:

  # Trial user (full access, 2 days left):
  curl http://localhost:3000/api/results/demo-trial-active

  # Trial expired (limited + deletion warning):
  curl http://localhost:3000/api/results/demo-trial-expired

  # Paid subscriber (full access):
  curl http://localhost:3000/api/results/demo-paid

Simulate payment (upgrades trial-expired → active):
  curl -X POST http://localhost:3000/api/pay \\
    -H "Content-Type: application/json" \\
    -d '{"sessionId":"demo-trial-expired","plan":"yearly"}'

Trigger data cleanup (purges expired sessions):
  curl -X POST http://localhost:3000/api/cleanup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
