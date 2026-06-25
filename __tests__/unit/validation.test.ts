/**
 * Unit tests for request-level validation helpers.
 *
 * Quiz now has 10 steps:
 *  1  Gender
 *  2  Age
 *  3  Goal
 *  4  Focus Area (multiple choice)
 *  5  Activity Type Preference (multiple choice)
 *  6  Height + Weight
 *  7  Target Weight
 *  8  Activity Level
 *  9  Diet Preference
 * 10  Email
 */

import { validateStepData, safeFloat, safeInt, mergeQuizData, isQuizComplete } from '@/lib/validation'

// =============================================================================
// safeFloat
// =============================================================================

describe('safeFloat', () => {
  test('parses valid number string', () => {
    expect(safeFloat('70.5')).toBe(70.5)
  })

  test('passes through number', () => {
    expect(safeFloat(75)).toBe(75)
  })

  test('returns null for undefined', () => {
    expect(safeFloat(undefined)).toBeNull()
  })

  test('returns null for null', () => {
    expect(safeFloat(null)).toBeNull()
  })

  test('returns null for empty string', () => {
    expect(safeFloat('')).toBeNull()
  })

  test('returns null for non-numeric string', () => {
    expect(safeFloat('abc')).toBeNull()
    expect(safeFloat('DROP TABLE')).toBeNull()
  })

  test('returns null for NaN', () => {
    expect(safeFloat(NaN)).toBeNull()
  })

  test('returns null for Infinity', () => {
    expect(safeFloat(Infinity)).toBeNull()
    expect(safeFloat(-Infinity)).toBeNull()
  })

  test('returns null for object', () => {
    expect(safeFloat({ value: 70 })).toBeNull()
  })

  test('handles numeric 0 correctly', () => {
    expect(safeFloat(0)).toBe(0)
  })
})

// =============================================================================
// safeInt
// =============================================================================

describe('safeInt', () => {
  test('parses valid integer string', () => {
    expect(safeInt('25')).toBe(25)
  })

  test('passes through integer', () => {
    expect(safeInt(30)).toBe(30)
  })

  test('returns null for fractional number', () => {
    expect(safeInt(25.5)).toBeNull()
  })

  test('returns null for fractional string', () => {
    expect(safeInt('25.5')).toBeNull()
  })

  test('returns null for undefined', () => {
    expect(safeInt(undefined)).toBeNull()
  })

  test('returns null for null', () => {
    expect(safeInt(null)).toBeNull()
  })

  test('returns null for empty string', () => {
    expect(safeInt('')).toBeNull()
  })

  test('returns null for NaN', () => {
    expect(safeInt(NaN)).toBeNull()
  })

  test('returns null for Infinity', () => {
    expect(safeInt(Infinity)).toBeNull()
  })

  test('handles integer 0 correctly', () => {
    expect(safeInt(0)).toBe(0)
  })
})

// =============================================================================
// validateStepData
// =============================================================================

describe('validateStepData - step 1 (gender)', () => {
  test('accepts male', () => {
    expect(validateStepData(1, { gender: 'male' })).toHaveLength(0)
  })

  test('accepts female', () => {
    expect(validateStepData(1, { gender: 'female' })).toHaveLength(0)
  })

  test('rejects invalid gender', () => {
    expect(validateStepData(1, { gender: 'other' })).toHaveLength(1)
  })

  test('rejects empty string', () => {
    expect(validateStepData(1, { gender: '' })).toHaveLength(1)
  })
})

describe('validateStepData - step 2 (exact age)', () => {
  test('accepts valid integer age', () => {
    expect(validateStepData(2, { age: 28 })).toHaveLength(0)
  })

  test('accepts minimum age (16)', () => {
    expect(validateStepData(2, { age: 16 })).toHaveLength(0)
  })

  test('accepts maximum age (100)', () => {
    expect(validateStepData(2, { age: 100 })).toHaveLength(0)
  })

  test('rejects age below 16', () => {
    expect(validateStepData(2, { age: 15 })).toHaveLength(1)
  })

  test('rejects age above 100', () => {
    expect(validateStepData(2, { age: 101 })).toHaveLength(1)
  })

  test('rejects fractional age', () => {
    expect(validateStepData(2, { age: 25.5 })).toHaveLength(1)
  })

  test('rejects missing age', () => {
    expect(validateStepData(2, {})).toHaveLength(1)
  })

  test('rejects string age (injection attempt)', () => {
    expect(validateStepData(2, { age: "'; DROP TABLE sessions; --" })).toHaveLength(1)
  })

  test('rejects NaN', () => {
    expect(validateStepData(2, { age: NaN })).toHaveLength(1)
  })

  test('rejects Infinity', () => {
    expect(validateStepData(2, { age: Infinity })).toHaveLength(1)
  })

  test('does NOT accept legacy ageGroup string (must be number)', () => {
    expect(validateStepData(2, { age: '30-39' as any })).toHaveLength(1)
  })
})

describe('validateStepData - step 3 (goal)', () => {
  test('accepts all valid goals', () => {
    for (const goal of ['lose_weight', 'tone_up', 'build_strength', 'improve_health']) {
      expect(validateStepData(3, { goal })).toHaveLength(0)
    }
  })

  test('rejects invalid goal', () => {
    expect(validateStepData(3, { goal: 'get_rich' })).toHaveLength(1)
  })
})

describe('validateStepData - step 4 (focusAreas)', () => {
  test('accepts valid focus area(s)', () => {
    expect(validateStepData(4, { focusAreas: ['belly_fat'] })).toHaveLength(0)
    expect(validateStepData(4, { focusAreas: ['core_abs', 'legs_glutes'] })).toHaveLength(0)
  })

  test('accepts any valid FocusArea value regardless of goal', () => {
    expect(validateStepData(4, { focusAreas: ['chest_back', 'flexibility'] })).toHaveLength(0)
  })

  test('rejects empty array', () => {
    const errs = validateStepData(4, { focusAreas: [] })
    expect(errs.some((e) => e.field === 'focusAreas')).toBe(true)
  })

  test('rejects missing focusAreas', () => {
    const errs = validateStepData(4, {})
    expect(errs.some((e) => e.field === 'focusAreas')).toBe(true)
  })

  test('rejects non-array value', () => {
    const errs = validateStepData(4, { focusAreas: 'belly_fat' as any })
    expect(errs.some((e) => e.field === 'focusAreas')).toBe(true)
  })

  test('rejects invalid focus area value', () => {
    const errs = validateStepData(4, { focusAreas: ['banana'] })
    expect(errs.some((e) => e.field === 'focusAreas')).toBe(true)
  })
})

describe('validateStepData - step 5 (activityTypes)', () => {
  test('accepts valid activity type(s)', () => {
    expect(validateStepData(5, { activityTypes: ['gym'] })).toHaveLength(0)
    expect(validateStepData(5, { activityTypes: ['home_workouts', 'running_walking'] })).toHaveLength(0)
  })

  test('accepts all valid activity types', () => {
    const all = ['home_workouts', 'gym', 'running_walking', 'yoga_pilates', 'hiit_cardio', 'swimming', 'cycling', 'sports']
    expect(validateStepData(5, { activityTypes: all })).toHaveLength(0)
  })

  test('rejects empty array', () => {
    const errs = validateStepData(5, { activityTypes: [] })
    expect(errs.some((e) => e.field === 'activityTypes')).toBe(true)
  })

  test('rejects missing activityTypes', () => {
    const errs = validateStepData(5, {})
    expect(errs.some((e) => e.field === 'activityTypes')).toBe(true)
  })

  test('rejects invalid activity type', () => {
    const errs = validateStepData(5, { activityTypes: ['trampolining'] })
    expect(errs.some((e) => e.field === 'activityTypes')).toBe(true)
  })
})

describe('validateStepData - step 6 (height + weight)', () => {
  test('accepts valid height and weight', () => {
    expect(validateStepData(6, { heightCm: 170, weightKg: 70 })).toHaveLength(0)
  })

  test('rejects height < 100', () => {
    const errs = validateStepData(6, { heightCm: 50, weightKg: 70 })
    expect(errs.some((e) => e.field === 'heightCm')).toBe(true)
  })

  test('rejects height > 250', () => {
    const errs = validateStepData(6, { heightCm: 300, weightKg: 70 })
    expect(errs.some((e) => e.field === 'heightCm')).toBe(true)
  })

  test('rejects weight < 30', () => {
    const errs = validateStepData(6, { heightCm: 170, weightKg: 10 })
    expect(errs.some((e) => e.field === 'weightKg')).toBe(true)
  })

  test('rejects weight > 300', () => {
    const errs = validateStepData(6, { heightCm: 170, weightKg: 500 })
    expect(errs.some((e) => e.field === 'weightKg')).toBe(true)
  })

  test('rejects non-numeric string as height (injection attempt)', () => {
    const errs = validateStepData(6, { heightCm: 'tall' as any, weightKg: 70 })
    expect(errs.some((e) => e.field === 'heightCm')).toBe(true)
  })

  test('rejects NaN as weight', () => {
    const errs = validateStepData(6, { heightCm: 170, weightKg: NaN })
    expect(errs.some((e) => e.field === 'weightKg')).toBe(true)
  })

  test('rejects Infinity as height', () => {
    const errs = validateStepData(6, { heightCm: Infinity, weightKg: 70 })
    expect(errs.some((e) => e.field === 'heightCm')).toBe(true)
  })
})

describe('validateStepData - step 6 BMI (soft warning, not hard error)', () => {
  // BMI out-of-range is a SOFT WARNING only.
  // validateStepData never rejects based on BMI.

  test('200 cm / 60 kg is accepted (BMI 15.0, boundary)', () => {
    expect(validateStepData(6, { heightCm: 200, weightKg: 60 })).toHaveLength(0)
  })

  test('200 cm / 59 kg is NOT rejected (BMI 14.75 -- soft warning only)', () => {
    const errs = validateStepData(6, { heightCm: 200, weightKg: 59 })
    expect(errs.some((e) => e.field === 'weightKg')).toBe(false)
  })

  test('200 cm / 45 kg is NOT rejected (BMI 11.25 -- soft warning only)', () => {
    const errs = validateStepData(6, { heightCm: 200, weightKg: 45 })
    expect(errs.some((e) => e.field === 'weightKg')).toBe(false)
  })

  test('150 cm / 135 kg is accepted (BMI 60.0, boundary)', () => {
    expect(validateStepData(6, { heightCm: 150, weightKg: 135 })).toHaveLength(0)
  })

  test('150 cm / 136 kg is NOT rejected (BMI 60.4 -- soft warning only)', () => {
    const errs = validateStepData(6, { heightCm: 150, weightKg: 136 })
    expect(errs.some((e) => e.field === 'weightKg')).toBe(false)
  })

  test('150 cm / 200 kg is NOT rejected (BMI 88.9 -- soft warning only)', () => {
    const errs = validateStepData(6, { heightCm: 150, weightKg: 200 })
    expect(errs.some((e) => e.field === 'weightKg')).toBe(false)
  })

  test('170 cm / 70 kg is accepted (BMI 24.2, typical)', () => {
    expect(validateStepData(6, { heightCm: 170, weightKg: 70 })).toHaveLength(0)
  })

  test('invalid height still produces a heightCm error (individual bounds)', () => {
    const errs = validateStepData(6, { heightCm: 50, weightKg: 60 })
    expect(errs.some((e) => e.field === 'heightCm')).toBe(true)
  })
})

describe('validateStepData - step 7 (targetWeight)', () => {
  test('accepts valid target weight', () => {
    expect(validateStepData(7, { targetWeightKg: 65 })).toHaveLength(0)
  })

  test('rejects target < 30', () => {
    expect(validateStepData(7, { targetWeightKg: 20 })).toHaveLength(1)
  })

  test('rejects target > 300', () => {
    expect(validateStepData(7, { targetWeightKg: 400 })).toHaveLength(1)
  })

  test('rejects negative target', () => {
    expect(validateStepData(7, { targetWeightKg: -10 })).toHaveLength(1)
  })
})

describe('validateStepData - step 8 (activityLevel)', () => {
  test('accepts all valid activity levels', () => {
    for (const level of ['sedentary', 'light', 'moderate', 'active']) {
      expect(validateStepData(8, { activityLevel: level })).toHaveLength(0)
    }
  })

  test('rejects invalid activity level', () => {
    expect(validateStepData(8, { activityLevel: 'extreme' })).toHaveLength(1)
  })
})

describe('validateStepData - step 9 (dietPreference)', () => {
  test('accepts valid diet preference', () => {
    expect(validateStepData(9, { dietPreference: 'vegan' })).toHaveLength(0)
  })

  test('accepts undefined (optional)', () => {
    expect(validateStepData(9, {})).toHaveLength(0)
  })

  test('rejects invalid diet preference', () => {
    expect(validateStepData(9, { dietPreference: 'carnivore' })).toHaveLength(1)
  })
})

describe('validateStepData - step 10 (email)', () => {
  test('accepts valid email', () => {
    expect(validateStepData(10, { email: 'test@example.com' })).toHaveLength(0)
  })

  test('accepts missing email (optional)', () => {
    expect(validateStepData(10, {})).toHaveLength(0)
  })

  test('accepts empty string (skip)', () => {
    expect(validateStepData(10, { email: '' })).toHaveLength(0)
  })

  test('rejects malformed email', () => {
    expect(validateStepData(10, { email: 'not-an-email' })).toHaveLength(1)
  })

  test('rejects email with spaces', () => {
    expect(validateStepData(10, { email: 'a b@c.com' })).toHaveLength(1)
  })
})

describe('validateStepData - invalid step number', () => {
  test('rejects step 0', () => {
    expect(validateStepData(0, {})).toHaveLength(1)
  })

  test('rejects step 11', () => {
    expect(validateStepData(11, {})).toHaveLength(1)
  })
})

// =============================================================================
// mergeQuizData
// =============================================================================

describe('mergeQuizData', () => {
  test('merges new fields into existing data', () => {
    const existing = { age: 28 }
    const incoming = { gender: 'female' as const }
    const merged = mergeQuizData(existing, incoming)
    expect(merged.age).toBe(28)
    expect(merged.gender).toBe('female')
  })

  test('auto-derives ageGroup when age is present', () => {
    expect(mergeQuizData({}, { age: 28 }).ageGroup).toBe('18-29')
    expect(mergeQuizData({}, { age: 34 }).ageGroup).toBe('30-39')
    expect(mergeQuizData({}, { age: 45 }).ageGroup).toBe('40-49')
    expect(mergeQuizData({}, { age: 60 }).ageGroup).toBe('50+')
  })

  test('incoming age overwrites existing age and re-derives ageGroup', () => {
    const merged = mergeQuizData({ age: 28, ageGroup: '30-39' as const }, { age: 42 })
    expect(merged.age).toBe(42)
    expect(merged.ageGroup).toBe('40-49')
  })

  test('does not mutate original objects', () => {
    const existing = { age: 28 }
    const incoming = { gender: 'male' as const }
    mergeQuizData(existing, incoming)
    expect(existing).toEqual({ age: 28 })
  })

  test('merges focusAreas and activityTypes', () => {
    const merged = mergeQuizData(
      { goal: 'lose_weight' as const },
      { focusAreas: ['belly_fat' as const], activityTypes: ['gym' as const] },
    )
    expect(merged.focusAreas).toEqual(['belly_fat'])
    expect(merged.activityTypes).toEqual(['gym'])
  })
})

// =============================================================================
// isQuizComplete
// =============================================================================

describe('isQuizComplete', () => {
  const complete = {
    age: 34,
    gender: 'male' as const,
    goal: 'lose_weight' as const,
    heightCm: 175,
    weightKg: 90,
    targetWeightKg: 75,
    activityLevel: 'moderate' as const,
  }

  test('returns true when all required fields present', () => {
    expect(isQuizComplete(complete)).toBe(true)
  })

  test('returns false when age missing', () => {
    const { age: _, ...rest } = complete
    expect(isQuizComplete(rest)).toBe(false)
  })

  test('returns false when age is 0', () => {
    expect(isQuizComplete({ ...complete, age: 0 })).toBe(false)
  })

  test('returns false when heightCm missing', () => {
    const { heightCm: _, ...rest } = complete
    expect(isQuizComplete(rest)).toBe(false)
  })

  test('returns false when weightKg is 0 (falsy)', () => {
    expect(isQuizComplete({ ...complete, weightKg: 0 })).toBe(false)
  })

  test('returns false when empty object', () => {
    expect(isQuizComplete({})).toBe(false)
  })

  test('passes with ageGroup absent (ageGroup is analytics-only)', () => {
    const { ageGroup: _, ...rest } = { ...complete, ageGroup: '30-39' as const }
    expect(isQuizComplete(rest)).toBe(true)
  })

  test('passes even when focusAreas and activityTypes absent (optional for calculation)', () => {
    expect(isQuizComplete(complete)).toBe(true)
  })
})
