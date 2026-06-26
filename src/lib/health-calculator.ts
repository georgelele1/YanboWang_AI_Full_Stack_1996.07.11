

import type {
  ActivityLevel,
  BmiCategory,
  Gender,
  Goal,
  HealthAssessmentInput,
  HealthAssessmentResult,
  WeeklyProjectionPoint,
} from '@/types/quiz'
import { getBmiWarning } from '@/lib/validation'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
}

const KCAL_PER_KG_FAT = 7700
const MAX_DAILY_DEFICIT = 750
const MIN_DAILY_CALORIES_MALE = 1500
const MIN_DAILY_CALORIES_FEMALE = 1200
const PROTEIN_PER_KG = 1.6
const FAT_CALORIE_PERCENT = 0.28
const KCAL_PER_G_PROTEIN = 4
const KCAL_PER_G_FAT = 9
const KCAL_PER_G_CARB = 4

export interface ValidationError {
  field: string
  message: string
}

export function validateInput(input: Partial<HealthAssessmentInput>): ValidationError[] {
  const errors: ValidationError[] = []

  if (input.age === undefined || input.age === null) {
    errors.push({ field: 'age', message: 'Age is required' })
  } else if (!Number.isFinite(input.age) || !Number.isInteger(input.age) || input.age < 16 || input.age > 100) {
    errors.push({ field: 'age', message: 'Age must be a whole number between 16 and 100' })
  }

  if (!input.gender) {
    errors.push({ field: 'gender', message: 'Gender is required' })
  }

  if (!input.goal) {
    errors.push({ field: 'goal', message: 'Goal is required' })
  }

  if (!input.activityLevel) {
    errors.push({ field: 'activityLevel', message: 'Activity level is required' })
  }

  if (input.heightCm === undefined || input.heightCm === null) {
    errors.push({ field: 'heightCm', message: 'Height is required' })
  } else if (!Number.isFinite(input.heightCm) || input.heightCm < 100 || input.heightCm > 250) {
    errors.push({ field: 'heightCm', message: 'Height must be between 100 cm and 250 cm' })
  }

  if (input.weightKg === undefined || input.weightKg === null) {
    errors.push({ field: 'weightKg', message: 'Current weight is required' })
  } else if (!Number.isFinite(input.weightKg) || input.weightKg < 30 || input.weightKg > 300) {
    errors.push({ field: 'weightKg', message: 'Weight must be between 30 kg and 300 kg' })
  }

  if (input.targetWeightKg === undefined || input.targetWeightKg === null) {
    errors.push({ field: 'targetWeightKg', message: 'Target weight is required' })
  } else if (!Number.isFinite(input.targetWeightKg) || input.targetWeightKg < 30 || input.targetWeightKg > 300) {
    errors.push({ field: 'targetWeightKg', message: 'Target weight must be between 30 kg and 300 kg' })
  }
  if (errors.length === 0 && input.weightKg !== undefined && input.targetWeightKg !== undefined && input.goal) {
    const weightDiff = input.weightKg - input.targetWeightKg

    if (input.goal === 'lose_weight' && weightDiff <= 0) {
      errors.push({
        field: 'targetWeightKg',
        message: 'Target weight must be lower than current weight for a weight-loss goal',
      })
    }

    if (Math.abs(weightDiff) > 100) {
      errors.push({ field: 'targetWeightKg', message: 'Target weight difference is unrealistically large (> 100 kg)' })
    }

    if (input.heightCm) {
      const heightM = input.heightCm / 100
      const minHealthyWeight = 16 * heightM * heightM
      if (input.targetWeightKg < minHealthyWeight) {
        errors.push({
          field: 'targetWeightKg',
          message: `Target weight is dangerously low for your height (min ~${Math.round(minHealthyWeight)} kg)`,
        })
      }
    }
  }

  return errors
}

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel]
}

export function calculateTargetCalories(tdee: number, goal: Goal, gender: Gender): number {
  let target: number
  switch (goal) {
    case 'lose_weight':    target = tdee - Math.min(500, MAX_DAILY_DEFICIT); break
    case 'tone_up':        target = tdee - 200; break
    case 'build_strength': target = tdee + 250; break
    case 'improve_health':
    default:               target = tdee; break
  }
  const min = gender === 'male' ? MIN_DAILY_CALORIES_MALE : MIN_DAILY_CALORIES_FEMALE
  return Math.max(Math.round(target), min)
}

export interface MacroBreakdown {
  proteinGrams: number
  fatGrams: number
  carbGrams: number
}

export function calculateMacros(dailyCalories: number, weightKg: number): MacroBreakdown {
  const proteinGrams = Math.round(PROTEIN_PER_KG * weightKg)
  const proteinCalories = proteinGrams * KCAL_PER_G_PROTEIN
  const fatCalories = dailyCalories * FAT_CALORIE_PERCENT
  const fatGrams = Math.round(fatCalories / KCAL_PER_G_FAT)
  const carbCalories = dailyCalories - proteinCalories - fatCalories
  const carbGrams = Math.max(0, Math.round(carbCalories / KCAL_PER_G_CARB))
  return { proteinGrams, fatGrams, carbGrams }
}

export function calculateTimeline(
  currentWeightKg: number,
  targetWeightKg: number,
  tdee: number,
  dailyCalories: number,
): { weeksToGoal: number; weeklyWeightLossForecast: number } {
  const weightDiffKg = currentWeightKg - targetWeightKg
  if (weightDiffKg <= 0) return { weeksToGoal: 0, weeklyWeightLossForecast: 0 }

  const dailyDeficit = Math.max(tdee - dailyCalories, 0)
  const weeklyDeficit = dailyDeficit * 7
  const weeklyWeightLossForecast = weeklyDeficit > 0
    ? parseFloat((weeklyDeficit / KCAL_PER_KG_FAT).toFixed(2))
    : 0
  const weeksToGoal = weeklyWeightLossForecast > 0
    ? Math.min(Math.ceil(weightDiffKg / weeklyWeightLossForecast), 104)
    : 104

  return { weeksToGoal, weeklyWeightLossForecast }
}

export function generateWeeklyProjection(
  startWeightKg: number,
  targetWeightKg: number,
  weeklyLossKg: number,
  weeksToGoal: number,
): WeeklyProjectionPoint[] {
  const points: WeeklyProjectionPoint[] = []
  const totalWeeks = Math.min(weeksToGoal, 52)
  for (let week = 0; week <= totalWeeks; week++) {
    const weight = Math.max(
      parseFloat((startWeightKg - weeklyLossKg * week).toFixed(1)),
      targetWeightKg,
    )
    points.push({ week, weightKg: weight })
  }
  return points
}


export function generateGainProjection(
  startWeightKg: number,
  targetWeightKg: number,
  weeklyGainKg: number,
  weeksToGoal: number,
): WeeklyProjectionPoint[] {
  const points: WeeklyProjectionPoint[] = []
  const totalWeeks = Math.min(weeksToGoal, 52)
  for (let week = 0; week <= totalWeeks; week++) {
    const weight = Math.min(
      parseFloat((startWeightKg + weeklyGainKg * week).toFixed(1)),
      targetWeightKg,
    )
    points.push({ week, weightKg: weight })
  }
  return points
}


export function generateFlatProjection(
  weightKg: number,
  programWeeks: number,
): WeeklyProjectionPoint[] {
  return Array.from({ length: programWeeks + 1 }, (_, week) => ({
    week,
    weightKg,
  }))
}

export function calculateHealthAssessment(input: HealthAssessmentInput): HealthAssessmentResult {
  const { age, gender, goal, heightCm, weightKg, targetWeightKg, activityLevel } = input

  const bmi = parseFloat(calculateBmi(weightKg, heightCm).toFixed(1))
  const bmiCategory = getBmiCategory(bmi)
  const bmr = calculateBmr(weightKg, heightCm, age, gender)
  const tdee = calculateTdee(bmr, activityLevel)
  const dailyCalories = calculateTargetCalories(tdee, goal, gender)
  const { proteinGrams, fatGrams, carbGrams } = calculateMacros(dailyCalories, weightKg)
  let weeksToGoal: number
  let weeklyWeightLossForecast: number
  let weeklyProjection: WeeklyProjectionPoint[]

  if (goal === 'lose_weight' || (goal === 'tone_up' && targetWeightKg < weightKg)) {
    const timeline = calculateTimeline(weightKg, targetWeightKg, tdee, dailyCalories)
    weeksToGoal = timeline.weeksToGoal
    weeklyWeightLossForecast = timeline.weeklyWeightLossForecast
    weeklyProjection = generateWeeklyProjection(weightKg, targetWeightKg, weeklyWeightLossForecast, weeksToGoal)

  } else if (goal === 'build_strength' && targetWeightKg > weightKg) {
    const dailySurplus = Math.max(dailyCalories - tdee, 50)
    const weeklyGainKg = parseFloat(((dailySurplus * 7) / KCAL_PER_KG_FAT).toFixed(2))
    const gainKg = targetWeightKg - weightKg
    weeksToGoal = Math.min(Math.ceil(gainKg / weeklyGainKg), 104)
    weeklyWeightLossForecast = -weeklyGainKg
    weeklyProjection = generateGainProjection(weightKg, targetWeightKg, weeklyGainKg, weeksToGoal)

  } else if (goal === 'improve_health' || goal === 'tone_up') {
    weeksToGoal = 12
    weeklyWeightLossForecast = 0
    weeklyProjection = generateFlatProjection(weightKg, 12)

  } else {
    weeksToGoal = 16
    weeklyWeightLossForecast = 0
    weeklyProjection = generateFlatProjection(weightKg, 16)
  }

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + weeksToGoal * 7)

  const medicalWarning = getBmiWarning(heightCm, weightKg) ?? undefined

  return {
    bmi,
    bmiCategory,
    dailyCalories: Math.round(dailyCalories),
    proteinGrams,
    fatGrams,
    carbGrams,
    weeklyWeightLossForecast,
    weeksToGoal,
    targetDate,
    weeklyProjection,
    medicalWarning,
  }
}
