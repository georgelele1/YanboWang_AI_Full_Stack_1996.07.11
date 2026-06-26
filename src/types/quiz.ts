
export type AgeGroup = '18-29' | '30-39' | '40-49' | '50+'
export type Gender = 'male' | 'female'
export type Goal = 'lose_weight' | 'tone_up' | 'build_strength' | 'improve_health'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active'
export type DietPreference = 'no_preference' | 'vegetarian' | 'vegan' | 'keto' | 'paleo'
export type GoalMotivation =
  | 'wedding'
  | 'conference'
  | 'vacation'
  | 'health_check'
  | 'confidence'
  | 'family'
  | 'sports_event'
  | 'other'
export type FocusArea =
  | 'belly_fat' | 'thighs_hips' | 'arms' | 'full_body_slim'
  | 'core_abs' | 'arms_shoulders' | 'legs_glutes' | 'full_body_tone'
  | 'chest_back' | 'biceps_triceps' | 'legs_power' | 'core_strength'
  | 'flexibility' | 'endurance' | 'posture' | 'stress_relief'
export type ActivityType =
  | 'home_workouts'
  | 'gym'
  | 'running_walking'
  | 'yoga_pilates'
  | 'hiit_cardio'
  | 'swimming'
  | 'cycling'
  | 'sports'

export function getAgeGroup(age: number): AgeGroup {
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
  focusAreas?: FocusArea[]
  activityTypes?: ActivityType[]
  heightCm?: number
  weightKg?: number
  targetWeightKg?: number
  targetDate?: string
  targetTimelineWeeks?: number
  motivation?: GoalMotivation
  motivationDetail?: string
  activityLevel?: ActivityLevel
  dietPreference?: DietPreference
  email?: string
}

export type QuizStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export interface StepPayload {
  step: QuizStep
  data: Partial<QuizData>
}
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
export type WorkoutIntensity = 'low' | 'moderate' | 'high'

export interface Exercise {
  name: string
  sets: number
  reps: string
  rest: string
  notes?: string
}

export interface WorkoutDay {
  day: number
  dayName: string
  type: string
  isRest: boolean
  duration: string
  intensity: WorkoutIntensity
  exercises: Exercise[]
  tips?: string
}

export interface WorkoutPlan {
  weeks: number
  daysPerWeek: number
  goal: Goal
  focusAreas: FocusArea[]
  activityTypes: ActivityType[]
  schedule: WorkoutDay[]
  generalTips: string[]
}
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
  requestedTargetDate?: string
  requestedTimelineWeeks?: number
  motivation?: GoalMotivation
  motivationDetail?: string
  medicalWarning?: string
}

export type ResultsResponse = FreeResultsResponse | FullResultsResponse
