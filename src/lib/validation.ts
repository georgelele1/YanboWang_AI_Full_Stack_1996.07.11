/**
 * Request-level validation for API routes.
 *
 * Quiz now has 10 steps:
 *   1  Gender
 *   2  Age
 *   3  Goal
 *   4  Focus Area (multiple choice, options depend on goal)
 *   5  Activity Type Preference (multiple choice)
 *   6  Height + Weight
 *   7  Target Weight
 *   8  Activity Level
 *   9  Diet Preference
 *  10  Email
 */

import type { ActivityLevel, ActivityType, AgeGroup, DietPreference, FocusArea, Gender, Goal, QuizData } from '@/types/quiz'
import { ageToGroup } from '@/types/quiz'

const BMI_WARN_MIN = 15
const BMI_WARN_MAX = 60

const VALID_GENDERS: Gender[]              = ['male', 'female']
const VALID_GOALS: Goal[]                  = ['lose_weight', 'tone_up', 'build_strength', 'improve_health']
const VALID_ACTIVITY_LEVELS: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active']
const VALID_DIET_PREFS: DietPreference[]   = ['no_preference', 'vegetarian', 'vegan', 'keto', 'paleo']

const VALID_FOCUS_AREAS: Record<Goal, FocusArea[]> = {
  lose_weight:     ['belly_fat', 'thighs_hips', 'arms', 'full_body_slim'],
  tone_up:         ['core_abs', 'arms_shoulders', 'legs_glutes', 'full_body_tone'],
  build_strength:  ['chest_back', 'biceps_triceps', 'legs_power', 'core_strength'],
  improve_health:  ['flexibility', 'endurance', 'posture', 'stress_relief'],
}

const VALID_ACTIVITY_TYPES: ActivityType[] = [
  'home_workouts', 'gym', 'running_walking', 'yoga_pilates',
  'hiit_cardio', 'swimming', 'cycling', 'sports',
]

export interface FieldError {
  field: string
  message: string
}

const STEP_FIELDS: Record<number, readonly string[]> = {
  1: ['gender'], 2: ['age'], 3: ['goal'], 4: ['focusAreas'], 5: ['activityTypes'],
  6: ['heightCm', 'weightKg'], 7: ['targetWeightKg'], 8: ['activityLevel'],
  9: ['dietPreference'], 10: ['email'],
}

export function normalizeStepData(step: number, data: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...data }
  const numericFields = step === 2 ? ['age'] : step === 6 ? ['heightCm', 'weightKg'] : step === 7 ? ['targetWeightKg'] : []
  for (const field of numericFields) {
    if (typeof normalized[field] === 'string' && normalized[field].trim() !== '') {
      normalized[field] = Number(normalized[field])
    }
  }
  return normalized
}

export function validateStepData(step: number, data: Record<string, unknown>): FieldError[] {
  const errors: FieldError[] = []

  const allowedFields = STEP_FIELDS[step]
  if (!allowedFields) return [{ field: 'step', message: 'Step must be between 1 and 10' }]
  for (const field of Object.keys(data)) {
    if (!allowedFields.includes(field)) {
      errors.push({ field, message: `Field is not allowed for step ${step}` })
    }
  }

  switch (step) {
    case 1: {
      if (!VALID_GENDERS.includes(data.gender as Gender)) {
        errors.push({ field: 'gender', message: `Must be one of: ${VALID_GENDERS.join(', ')}` })
      }
      break
    }
    case 2: {
      const age = safeInt(data.age)
      if (age === null || age < 16 || age > 100) {
        errors.push({ field: 'age', message: 'Age must be a whole number between 16 and 100' })
      }
      break
    }
    case 3: {
      if (!VALID_GOALS.includes(data.goal as Goal)) {
        errors.push({ field: 'goal', message: `Must be one of: ${VALID_GOALS.join(', ')}` })
      }
      break
    }
    case 4: {
      // Focus areas -- must be array with at least 1 valid value for the given goal
      const areas = data.focusAreas
      if (!Array.isArray(areas) || areas.length === 0) {
        errors.push({ field: 'focusAreas', message: 'Select at least one focus area' })
      } else {
        // We validate individual values; goal context not available here so accept any valid FocusArea
        const allValid = Object.values(VALID_FOCUS_AREAS).flat() as string[]
        const invalid = (areas as string[]).filter(a => !allValid.includes(a))
        if (invalid.length > 0) {
          errors.push({ field: 'focusAreas', message: `Invalid focus area(s): ${invalid.join(', ')}` })
        }
      }
      break
    }
    case 5: {
      // Activity types -- must be array with at least 1 valid value
      const types = data.activityTypes
      if (!Array.isArray(types) || types.length === 0) {
        errors.push({ field: 'activityTypes', message: 'Select at least one activity type' })
      } else {
        const invalid = (types as string[]).filter(t => !VALID_ACTIVITY_TYPES.includes(t as ActivityType))
        if (invalid.length > 0) {
          errors.push({ field: 'activityTypes', message: `Invalid activity type(s): ${invalid.join(', ')}` })
        }
      }
      break
    }
    case 6: {
      const h = safeFloat(data.heightCm)
      const w = safeFloat(data.weightKg)
      if (h === null || h < 100 || h > 250) errors.push({ field: 'heightCm', message: 'Must be a number between 100 and 250' })
      if (w === null || w < 30  || w > 300) errors.push({ field: 'weightKg', message: 'Must be a number between 30 and 300' })
      // BMI out-of-range is a soft warning only -- see getBmiWarning()
      break
    }
    case 7: {
      const t = safeFloat(data.targetWeightKg)
      if (t === null || t < 30 || t > 300) {
        errors.push({ field: 'targetWeightKg', message: 'Must be a number between 30 and 300' })
      }
      break
    }
    case 8: {
      if (!VALID_ACTIVITY_LEVELS.includes(data.activityLevel as ActivityLevel)) {
        errors.push({ field: 'activityLevel', message: `Must be one of: ${VALID_ACTIVITY_LEVELS.join(', ')}` })
      }
      break
    }
    case 9: {
      if (data.dietPreference !== undefined && !VALID_DIET_PREFS.includes(data.dietPreference as DietPreference)) {
        errors.push({ field: 'dietPreference', message: `Must be one of: ${VALID_DIET_PREFS.join(', ')}` })
      }
      break
    }
    case 10: {
      if (data.email !== undefined && data.email !== null && data.email !== '') {
        if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          errors.push({ field: 'email', message: 'Invalid email address format' })
        }
      }
      break
    }
    default:
      errors.push({ field: 'step', message: 'Step must be between 1 and 10' })
  }

  return errors
}

export function safeFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return n
}

export function safeInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null
  return n
}

export function mergeQuizData(existing: QuizData, incoming: Partial<QuizData>): QuizData {
  const merged = { ...existing, ...incoming }
  if (merged.age !== undefined && merged.age > 0) {
    merged.ageGroup = ageToGroup(merged.age)
  }
  return merged
}

export function getBmiWarning(heightCm: number, weightKg: number): string | null {
  const heightM = heightCm / 100
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1))
  if (bmi < BMI_WARN_MIN) {
    return (
      `Your BMI is ${bmi}, which is very low for your height. ` +
      `Starting an exercise or diet programme at this weight may not be safe. ` +
      `We strongly recommend consulting a doctor or healthcare professional ` +
      `before making any changes to your diet or activity level.`
    )
  }
  if (bmi > BMI_WARN_MAX) {
    return (
      `Your BMI is ${bmi}, which is very high for your height. ` +
      `Intense exercise at this weight may put significant strain on your joints and heart. ` +
      `We strongly recommend consulting a doctor or healthcare professional ` +
      `before starting any exercise programme.`
    )
  }
  return null
}

export function isQuizComplete(data: QuizData): boolean {
  if (!data.age || data.age <= 0) return false
  if (!data.gender || !data.goal || !data.activityLevel) return false
  if (!data.heightCm || data.heightCm <= 0) return false
  if (!data.weightKg || data.weightKg <= 0) return false
  if (!data.targetWeightKg || data.targetWeightKg <= 0) return false
  return true
}
