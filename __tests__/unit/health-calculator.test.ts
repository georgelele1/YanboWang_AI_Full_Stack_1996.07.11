/**
 * Unit tests for the health assessment calculator.
 *
 * All tests use exact age (integer) — not age group.
 * midpointAge() has been removed; calculateBmr() takes age directly.
 */

import {
  calculateBmi,
  getBmiCategory,
  calculateBmr,
  calculateTdee,
  calculateTargetCalories,
  calculateMacros,
  calculateTimeline,
  generateWeeklyProjection,
  calculateHealthAssessment,
  validateInput,
} from '@/lib/health-calculator'

// ─────────────────────────────────────────────────────────────────────────────
// calculateBmi
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateBmi', () => {
  test('returns correct BMI for typical values', () => {
    // 70 kg, 170 cm → 70 / 1.7^2 ≈ 24.2
    expect(calculateBmi(70, 170)).toBeCloseTo(24.22, 1)
  })

  test('returns correct BMI for tall person', () => {
    expect(calculateBmi(90, 190)).toBeCloseTo(24.93, 1)
  })

  test('returns correct BMI for short person', () => {
    expect(calculateBmi(50, 155)).toBeCloseTo(20.81, 1)
  })

  test('handles extreme low weight (boundary)', () => {
    expect(calculateBmi(30, 100)).toBeCloseTo(30, 0)
  })

  test('handles extreme high weight (boundary)', () => {
    const bmi = calculateBmi(300, 200)
    expect(bmi).toBeGreaterThan(0)
    expect(Number.isFinite(bmi)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getBmiCategory
// ─────────────────────────────────────────────────────────────────────────────

describe('getBmiCategory', () => {
  test('< 18.5 is Underweight', () => {
    expect(getBmiCategory(16)).toBe('Underweight')
    expect(getBmiCategory(18.4)).toBe('Underweight')
  })

  test('18.5–24.9 is Normal', () => {
    expect(getBmiCategory(18.5)).toBe('Normal')
    expect(getBmiCategory(22)).toBe('Normal')
    expect(getBmiCategory(24.9)).toBe('Normal')
  })

  test('25–29.9 is Overweight', () => {
    expect(getBmiCategory(25)).toBe('Overweight')
    expect(getBmiCategory(27.5)).toBe('Overweight')
    expect(getBmiCategory(29.9)).toBe('Overweight')
  })

  test('>= 30 is Obese', () => {
    expect(getBmiCategory(30)).toBe('Obese')
    expect(getBmiCategory(40)).toBe('Obese')
  })

  test('boundary at exactly 25', () => {
    expect(getBmiCategory(25.0)).toBe('Overweight')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// calculateBmr — now takes exact age integer
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateBmr', () => {
  test('male BMR calculation (Mifflin-St Jeor, exact age)', () => {
    // 70 kg, 170 cm, age 24, male
    // = (10*70) + (6.25*170) − (5*24) + 5 = 700 + 1062.5 − 120 + 5 = 1647.5
    expect(calculateBmr(70, 170, 24, 'male')).toBeCloseTo(1647.5, 0)
  })

  test('female BMR calculation (Mifflin-St Jeor, exact age)', () => {
    // 65 kg, 165 cm, age 35, female
    // = (10*65) + (6.25*165) − (5*35) − 161 = 650 + 1031.25 − 175 − 161 = 1345.25
    expect(calculateBmr(65, 165, 35, 'female')).toBeCloseTo(1345.25, 0)
  })

  test('male BMR is higher than female with same stats', () => {
    const maleBmr = calculateBmr(70, 170, 35, 'male')
    const femaleBmr = calculateBmr(70, 170, 35, 'female')
    expect(maleBmr).toBeGreaterThan(femaleBmr)
  })

  test('heavier person has higher BMR', () => {
    const lighter = calculateBmr(60, 170, 35, 'male')
    const heavier = calculateBmr(100, 170, 35, 'male')
    expect(heavier).toBeGreaterThan(lighter)
  })

  test('older person has lower BMR than younger (same weight/height)', () => {
    // 20-year-old vs 55-year-old: difference = 5*(55-20) = 175 kcal/day
    const young = calculateBmr(70, 170, 20, 'male')
    const older = calculateBmr(70, 170, 55, 'male')
    expect(older).toBeLessThan(young)
    expect(young - older).toBeCloseTo(175, 0)
  })

  test('each additional year reduces BMR by exactly 5 kcal', () => {
    // Mifflin-St Jeor: age coefficient = -5
    const age30 = calculateBmr(70, 170, 30, 'male')
    const age31 = calculateBmr(70, 170, 31, 'male')
    expect(age30 - age31).toBeCloseTo(5, 5)
  })

  test('age 16 is accepted (minimum)', () => {
    const bmr = calculateBmr(55, 165, 16, 'female')
    expect(Number.isFinite(bmr)).toBe(true)
    expect(bmr).toBeGreaterThan(0)
  })

  test('age 100 is accepted (maximum)', () => {
    const bmr = calculateBmr(65, 170, 100, 'male')
    expect(Number.isFinite(bmr)).toBe(true)
    expect(bmr).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// calculateTdee
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateTdee', () => {
  test('sedentary multiplier = 1.2', () => {
    expect(calculateTdee(1000, 'sedentary')).toBeCloseTo(1200, 0)
  })

  test('active multiplier = 1.725', () => {
    expect(calculateTdee(1000, 'active')).toBeCloseTo(1725, 0)
  })

  test('all activity levels produce distinct TDEE values', () => {
    const values = ['sedentary', 'light', 'moderate', 'active'].map(
      (a) => calculateTdee(2000, a as any),
    )
    const unique = new Set(values)
    expect(unique.size).toBe(4)
  })

  test('active TDEE > sedentary TDEE', () => {
    expect(calculateTdee(2000, 'active')).toBeGreaterThan(calculateTdee(2000, 'sedentary'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// calculateTargetCalories
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateTargetCalories', () => {
  const baseTdee = 2500

  test('lose_weight creates deficit of ~500 kcal', () => {
    expect(calculateTargetCalories(baseTdee, 'lose_weight', 'male')).toBe(2000)
  })

  test('tone_up creates deficit of ~200 kcal', () => {
    expect(calculateTargetCalories(baseTdee, 'tone_up', 'male')).toBe(2300)
  })

  test('build_strength creates surplus of ~250 kcal', () => {
    expect(calculateTargetCalories(baseTdee, 'build_strength', 'male')).toBe(2750)
  })

  test('improve_health returns TDEE (maintenance)', () => {
    expect(calculateTargetCalories(baseTdee, 'improve_health', 'male')).toBe(2500)
  })

  test('never drops below female minimum (1200 kcal)', () => {
    const cal = calculateTargetCalories(1300, 'lose_weight', 'female')
    expect(cal).toBeGreaterThanOrEqual(1200)
  })

  test('never drops below male minimum (1500 kcal)', () => {
    const cal = calculateTargetCalories(1600, 'lose_weight', 'male')
    expect(cal).toBeGreaterThanOrEqual(1500)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// calculateMacros
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateMacros', () => {
  test('protein = 1.6g per kg body weight', () => {
    const { proteinGrams } = calculateMacros(2000, 80)
    expect(proteinGrams).toBe(128) // 1.6 * 80
  })

  test('fat ≈ 28% of calories', () => {
    const { fatGrams } = calculateMacros(2000, 80)
    const fatCalories = fatGrams * 9
    expect(fatCalories / 2000).toBeCloseTo(0.28, 1)
  })

  test('carbs are non-negative', () => {
    const { carbGrams } = calculateMacros(1500, 80)
    expect(carbGrams).toBeGreaterThanOrEqual(0)
  })

  test('macro calories approximately sum to daily calories', () => {
    const { proteinGrams, fatGrams, carbGrams } = calculateMacros(2000, 70)
    const total = proteinGrams * 4 + fatGrams * 9 + carbGrams * 4
    expect(Math.abs(total - 2000)).toBeLessThan(100)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// calculateTimeline
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateTimeline', () => {
  test('returns 0 weeks when already at target weight', () => {
    const result = calculateTimeline(70, 70, 2500, 2000)
    expect(result.weeksToGoal).toBe(0)
    expect(result.weeklyWeightLossForecast).toBe(0)
  })

  test('returns 0 weeks when below target weight (gain goal)', () => {
    const result = calculateTimeline(60, 70, 2500, 2750)
    expect(result.weeksToGoal).toBe(0)
  })

  test('calculates weeks correctly with 500 kcal/day deficit', () => {
    const result = calculateTimeline(75, 70, 2500, 2000)
    expect(result.weeksToGoal).toBeGreaterThan(8)
    expect(result.weeksToGoal).toBeLessThan(15)
  })

  test('caps weeks at 104 when deficit is zero (maintenance)', () => {
    const result = calculateTimeline(80, 70, 2500, 2500)
    expect(result.weeksToGoal).toBe(104)
    expect(result.weeklyWeightLossForecast).toBe(0)
  })

  test('weekly forecast is proportional to deficit size', () => {
    const small = calculateTimeline(80, 70, 2500, 2300) // 200 kcal deficit
    const large = calculateTimeline(80, 70, 2500, 1750) // 750 kcal deficit
    expect(large.weeklyWeightLossForecast).toBeGreaterThan(small.weeklyWeightLossForecast)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// generateWeeklyProjection
// ─────────────────────────────────────────────────────────────────────────────

describe('generateWeeklyProjection', () => {
  test('starts at current weight (week 0)', () => {
    const pts = generateWeeklyProjection(80, 70, 0.5, 20)
    expect(pts[0].week).toBe(0)
    expect(pts[0].weightKg).toBe(80)
  })

  test('ends at (or above) target weight', () => {
    const pts = generateWeeklyProjection(80, 70, 0.5, 20)
    const last = pts[pts.length - 1]
    expect(last.weightKg).toBeGreaterThanOrEqual(70)
  })

  test('weight decreases monotonically', () => {
    const pts = generateWeeklyProjection(80, 60, 0.5, 40)
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].weightKg).toBeLessThanOrEqual(pts[i - 1].weightKg)
    }
  })

  test('capped at 52 weeks maximum', () => {
    const pts = generateWeeklyProjection(200, 60, 0.1, 1400)
    expect(pts.length).toBeLessThanOrEqual(53) // week 0 + 52
  })

  test('weight never drops below target', () => {
    const pts = generateWeeklyProjection(80, 70, 2, 10)
    for (const p of pts) {
      expect(p.weightKg).toBeGreaterThanOrEqual(70)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// validateInput — uses exact age
// ─────────────────────────────────────────────────────────────────────────────

describe('validateInput', () => {
  const validInput = {
    age: 34,
    gender: 'female' as const,
    goal: 'lose_weight' as const,
    heightCm: 165,
    weightKg: 75,
    targetWeightKg: 60,
    activityLevel: 'moderate' as const,
  }

  test('returns no errors for valid input', () => {
    expect(validateInput(validInput)).toHaveLength(0)
  })

  test('returns error for missing age', () => {
    const errors = validateInput({ ...validInput, age: undefined })
    expect(errors.some((e) => e.field === 'age')).toBe(true)
  })

  test('returns error for age below 16', () => {
    const errors = validateInput({ ...validInput, age: 15 })
    expect(errors.some((e) => e.field === 'age')).toBe(true)
  })

  test('returns error for age above 100', () => {
    const errors = validateInput({ ...validInput, age: 101 })
    expect(errors.some((e) => e.field === 'age')).toBe(true)
  })

  test('returns error for fractional age', () => {
    const errors = validateInput({ ...validInput, age: 25.5 as any })
    expect(errors.some((e) => e.field === 'age')).toBe(true)
  })

  test('accepts age 16 (minimum boundary)', () => {
    expect(validateInput({ ...validInput, age: 16 })).toHaveLength(0)
  })

  test('accepts age 100 (maximum boundary)', () => {
    expect(validateInput({ ...validInput, age: 100 })).toHaveLength(0)
  })

  test('returns error for missing gender', () => {
    const errors = validateInput({ ...validInput, gender: undefined })
    expect(errors.some((e) => e.field === 'gender')).toBe(true)
  })

  test('returns error for missing goal', () => {
    const errors = validateInput({ ...validInput, goal: undefined })
    expect(errors.some((e) => e.field === 'goal')).toBe(true)
  })

  test('returns error for height < 100', () => {
    const errors = validateInput({ ...validInput, heightCm: 50 })
    expect(errors.some((e) => e.field === 'heightCm')).toBe(true)
  })

  test('returns error for height > 250', () => {
    const errors = validateInput({ ...validInput, heightCm: 300 })
    expect(errors.some((e) => e.field === 'heightCm')).toBe(true)
  })

  test('returns error for weight < 30', () => {
    const errors = validateInput({ ...validInput, weightKg: 10 })
    expect(errors.some((e) => e.field === 'weightKg')).toBe(true)
  })

  test('returns error for weight > 300', () => {
    const errors = validateInput({ ...validInput, weightKg: 400 })
    expect(errors.some((e) => e.field === 'weightKg')).toBe(true)
  })

  test('returns error for weight = 0', () => {
    const errors = validateInput({ ...validInput, weightKg: 0 })
    expect(errors.some((e) => e.field === 'weightKg')).toBe(true)
  })

  test('returns error for negative weight', () => {
    const errors = validateInput({ ...validInput, weightKg: -10 })
    expect(errors.some((e) => e.field === 'weightKg')).toBe(true)
  })

  test('returns error for Infinity height', () => {
    const errors = validateInput({ ...validInput, heightCm: Infinity })
    expect(errors.some((e) => e.field === 'heightCm')).toBe(true)
  })

  test('returns error for NaN weight', () => {
    const errors = validateInput({ ...validInput, weightKg: NaN })
    expect(errors.some((e) => e.field === 'weightKg')).toBe(true)
  })

  // ── Cross-field: BMI range is now a SOFT WARNING (not a hard error) ─────
  // validateInput never rejects based on BMI; extreme BMI produces a
  // medicalWarning on the result instead. Users can still proceed.

  test('200 cm / 59 kg passes validation (BMI 14.75 -- soft warning only)', () => {
    // BMI below 15 but users are NOT blocked
    const errors = validateInput({ ...validInput, heightCm: 200, weightKg: 59, targetWeightKg: 65, goal: 'improve_health' })
    expect(errors.some((e) => e.field === 'weightKg')).toBe(false)
  })

  test('200 cm / 60 kg is accepted (BMI 15.0, lower boundary)', () => {
    // improve_health; target 65 kg is healthy for 200 cm (BMI 16.25)
    expect(validateInput({ ...validInput, heightCm: 200, weightKg: 60, targetWeightKg: 65, goal: 'improve_health' })).toHaveLength(0)
  })

  test('150 cm / 135 kg is accepted (BMI 60.0, upper boundary)', () => {
    // lose_weight; target 60 kg is a healthy target for 150 cm
    expect(validateInput({ ...validInput, heightCm: 150, weightKg: 135, targetWeightKg: 60 })).toHaveLength(0)
  })

  test('150 cm / 136 kg passes validation (BMI 60.4 -- soft warning only)', () => {
    // BMI above 60 but users are NOT blocked
    const errors = validateInput({ ...validInput, heightCm: 150, weightKg: 136, targetWeightKg: 60 })
    expect(errors.some((e) => e.field === 'weightKg')).toBe(false)
  })

  test('170 cm / 43 kg passes validation (BMI 14.9 -- soft warning only)', () => {
    // 43 / (1.7)^2 = 43/2.89 = 14.88 -- warning, not error
    const errors = validateInput({ ...validInput, heightCm: 170, weightKg: 43, targetWeightKg: 50, goal: 'improve_health' })
    expect(errors.some((e) => e.field === 'weightKg')).toBe(false)
  })

  test('170 cm / 44 kg is accepted (BMI 15.2, above minimum)', () => {
    // 44 / (1.7)^2 = 44/2.89 = 15.22; improve_health so no lose_weight conflict
    expect(validateInput({ ...validInput, heightCm: 170, weightKg: 44, targetWeightKg: 50, goal: 'improve_health' })).toHaveLength(0)
  })

  test('extreme BMI produces medicalWarning on the assessment result', () => {
    // BMI 14.75 (200 cm / 59 kg) -- no hard error, but warning is present
    const result = calculateHealthAssessment({ ...validInput, heightCm: 200, weightKg: 59, targetWeightKg: 65, goal: 'improve_health' })
    expect(result.medicalWarning).toBeDefined()
    expect(result.medicalWarning).toContain('BMI')
  })

  test('lose_weight goal requires target < current weight', () => {
    const errors = validateInput({ ...validInput, goal: 'lose_weight', targetWeightKg: 90 })
    expect(errors.some((e) => e.field === 'targetWeightKg')).toBe(true)
  })

  test('target weight > 100 kg below current is rejected', () => {
    const errors = validateInput({ ...validInput, weightKg: 150, targetWeightKg: 40 })
    expect(errors.some((e) => e.field === 'targetWeightKg')).toBe(true)
  })

  test('dangerously low target weight (BMI < 16) is rejected', () => {
    const errors = validateInput({ ...validInput, targetWeightKg: 35 })
    expect(errors.some((e) => e.field === 'targetWeightKg')).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// calculateHealthAssessment (integration)
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateHealthAssessment', () => {
  const typicalMale = {
    age: 35,
    gender: 'male' as const,
    goal: 'lose_weight' as const,
    heightCm: 175,
    weightKg: 90,
    targetWeightKg: 75,
    activityLevel: 'moderate' as const,
  }

  test('returns all required fields', () => {
    const result = calculateHealthAssessment(typicalMale)
    expect(result).toHaveProperty('bmi')
    expect(result).toHaveProperty('bmiCategory')
    expect(result).toHaveProperty('dailyCalories')
    expect(result).toHaveProperty('proteinGrams')
    expect(result).toHaveProperty('carbGrams')
    expect(result).toHaveProperty('fatGrams')
    expect(result).toHaveProperty('weeklyWeightLossForecast')
    expect(result).toHaveProperty('weeksToGoal')
    expect(result).toHaveProperty('targetDate')
    expect(result).toHaveProperty('weeklyProjection')
  })

  test('BMI is positive and finite', () => {
    const { bmi } = calculateHealthAssessment(typicalMale)
    expect(bmi).toBeGreaterThan(0)
    expect(Number.isFinite(bmi)).toBe(true)
  })

  test('daily calories are positive', () => {
    const { dailyCalories } = calculateHealthAssessment(typicalMale)
    expect(dailyCalories).toBeGreaterThan(0)
  })

  test('target date is in the future', () => {
    const { targetDate } = calculateHealthAssessment(typicalMale)
    expect(targetDate.getTime()).toBeGreaterThan(Date.now())
  })

  test('weekly projection array is non-empty', () => {
    const { weeklyProjection } = calculateHealthAssessment(typicalMale)
    expect(weeklyProjection.length).toBeGreaterThan(0)
  })

  test('build_strength produces higher calories than lose_weight', () => {
    const buildResult = calculateHealthAssessment({ ...typicalMale, goal: 'build_strength', targetWeightKg: 95 })
    const loseResult = calculateHealthAssessment(typicalMale)
    expect(buildResult.dailyCalories).toBeGreaterThan(loseResult.dailyCalories)
  })

  test('active person gets higher calories than sedentary person', () => {
    const active = calculateHealthAssessment({ ...typicalMale, activityLevel: 'active' })
    const sedentary = calculateHealthAssessment({ ...typicalMale, activityLevel: 'sedentary' })
    expect(active.dailyCalories).toBeGreaterThan(sedentary.dailyCalories)
  })

  test('heavier person has higher BMI', () => {
    const heavy = calculateHealthAssessment({ ...typicalMale, weightKg: 120 })
    const normal = calculateHealthAssessment(typicalMale)
    expect(heavy.bmi).toBeGreaterThan(normal.bmi)
  })

  test('older person gets lower calorie target (same other params)', () => {
    const young = calculateHealthAssessment({ ...typicalMale, age: 30 })
    const older = calculateHealthAssessment({ ...typicalMale, age: 70 })
    expect(young.dailyCalories).toBeGreaterThan(older.dailyCalories)
  })
})
