// Quiz domain types

export type AgeGroup = '18-29' | '30-39' | '40-49' | '50+'
export type Gender = 'male' | 'female'
export type Goal = 'lose_weight' | 'tone_up' | 'build_strength' | 'improve_health'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'
export type DietPreference = 'no_preference' | 'vegetarian' | 'vegan' | 'keto' | 'paleo'

// Focus area options vary by goal (stored as string array for flexibility)
export type FocusArea =
  // lose_weight
  | 'belly_fat' | 'thighs_hips' | 'arms' | 'full_body_slim'
  // tone_up
  | 'core_abs' | 'arms_shoulders' | 'legs_glutes' | 'full_body_tone'
  // build_strength
  | 'chest_back' | 'biceps_triceps' | 'legs_power' | 'core_strength'
  // improve_health
  | 'flexibility' | 'endurance' | 'posture' | 'stress_relief'

// Activity types the user enjoys (multiple select)
export type ActivityType =
  | 'home_workouts'
  | 'gym'
  | 'running_walking'
  | 'yoga_pilates'
  | 'hiit_cardio'
  | 'swimming'
  | 'cycling'
  | 'sports'

export function ageToGroup(age: number): AgeGroup {
  if (age < 30) return '18-29'
  if (age < 40) return '30-39'
  if (age < 50) return '40-49'
  return '50+'
}

export interface QuizData {
  age?: number
  ageGroup?: AgeGroup
  gender?: Gender
  goal?: Goal
  focusAreas?: FocusArea[]       // step 4 -- goal-dependent multiple choice
  activityTypes?: ActivityType[] // step 5 -- activity preference multiple choice
  heightCm?: number
  weightKg?: number
  targetWeightKg?: number
  activityLevel?: ActivityLevel
  dietPreference?: DietPreference
  email?: string
}

export type QuizStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface StepPayload {
  step: QuizStep
  data: Partial<QuizData>
}

// Health result types
export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese'

export interface WeeklyProjectionPoint {
  week: number
  weightKg: number
}

export interface HealthAssessmentInput {
  age: number
  gender: Gender
  goal: Goal
  heightCm: number
  weightKg: number
  targetWeightKg: number
  activityLevel: ActivityLevel
}

export interface HealthAssessmentResult {
  bmi: number
  bmiCategory: BmiCategory
  dailyCalories: number
  proteinGrams: number
  carbGrams: number
  fatGrams: number
  weeklyWeightLossForecast: number
  weeksToGoal: number
  targetDate: Date
  weeklyProjection: WeeklyProjectionPoint[]
  medicalWarning?: string
}

// Workout plan types
export type WorkoutIntensity = 'low' | 'moderate' | 'high'

export interface Exercise {
  name: string
  sets: number
  reps: string   // e.g. "12" or "30 sec" or "AMRAP"
  rest: string   // e.g. "60 sec"
  notes?: string
}

export interface WorkoutDay {
  day: number         // 1-7
  dayName: string     // "Monday"
  type: string        // "Upper Body Strength" | "Rest" | "HIIT Cardio" etc.
  isRest: boolean
  duration: string    // "45 min"
  intensity: WorkoutIntensity
  exercises: Exercise[]
  tips?: string
}

export interface WorkoutPlan {
  weeks: number          // programme length in weeks
  daysPerWeek: number
  goal: Goal
  focusAreas: FocusArea[]
  activityTypes: ActivityType[]
  schedule: WorkoutDay[] // 7 entries (Mon-Sun)
  generalTips: string[]
}

// API response types
export interface ApiError {
  error: string
  details?: unknown
}

export type SubscriptionStatus = 'TRIAL' | 'TRIAL_EXPIRED' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface SessionResponse {
  id: string
  currentStep: number
  version: number
  isCompleted: boolean
  quizData: QuizData
  subscription: {
    status: SubscriptionStatus
    trialEndsAt?: string
    trialDaysLeft?: number
  } | null
}

export interface FreeResultsResponse {
  access: 'limited'
  reason: 'no_account' | 'trial_active' | 'trial_expired' | 'sub_expired'
  sessionId: string
  bmi: number
  bmiCategory: BmiCategory
  dailyCalories: number
  trialEndsAt?: string
  dataExpiresAt?: string
  message: string
  medicalWarning?: string
}

export interface FullResultsResponse {
  access: 'full'
  accessReason: 'subscribed'
  sessionId: string
  goal: Goal
  bmi: number
  bmiCategory: BmiCategory
  dailyCalories: number
  proteinGrams: number
  carbGrams: number
  fatGrams: number
  weeklyWeightLossForecast: number
  weeksToGoal: number
  targetDate: string
  weeklyProjection: WeeklyProjectionPoint[]
  medicalWarning?: string
}

export type ResultsResponse = FreeResultsResponse | FullResultsResponse
