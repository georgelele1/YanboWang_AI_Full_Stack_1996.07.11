/**
 * Workout Plan Generator
 *
 * Produces a personalised 7-day weekly workout schedule based on:
 *  - fitness goal (lose_weight / tone_up / build_strength / improve_health)
 *  - focus areas (goal-dependent multiple choice)
 *  - preferred activity types (multiple choice)
 *  - activity level (sedentary / light / moderate / active)
 */

import type {
  ActivityLevel, ActivityType, Exercise, FocusArea, Goal,
  WorkoutDay, WorkoutIntensity, WorkoutPlan,
} from '@/types/quiz'

// =============================================================================
// Exercise library
// =============================================================================

const EXERCISES: Record<string, Exercise[]> = {
  // -- Core / Abs
  core: [
    { name: 'Plank', sets: 3, reps: '30 sec', rest: '30 sec', notes: 'Keep hips level' },
    { name: 'Bicycle Crunches', sets: 3, reps: '20 each side', rest: '30 sec' },
    { name: 'Leg Raises', sets: 3, reps: '15', rest: '45 sec' },
    { name: 'Russian Twists', sets: 3, reps: '20 total', rest: '30 sec' },
    { name: 'Mountain Climbers', sets: 3, reps: '30 sec', rest: '30 sec' },
    { name: 'Dead Bug', sets: 3, reps: '10 each side', rest: '30 sec' },
  ],
  // -- Upper body push
  chest_shoulders: [
    { name: 'Push-Ups', sets: 3, reps: '12-15', rest: '60 sec' },
    { name: 'Dumbbell Shoulder Press', sets: 3, reps: '12', rest: '60 sec' },
    { name: 'Incline Push-Ups', sets: 3, reps: '15', rest: '45 sec' },
    { name: 'Lateral Raises', sets: 3, reps: '15', rest: '45 sec' },
    { name: 'Tricep Dips', sets: 3, reps: '12', rest: '60 sec' },
  ],
  // -- Upper body pull
  back_biceps: [
    { name: 'Dumbbell Rows', sets: 3, reps: '12 each side', rest: '60 sec' },
    { name: 'Resistance Band Pull-Aparts', sets: 3, reps: '20', rest: '30 sec' },
    { name: 'Superman Hold', sets: 3, reps: '10 x 2 sec', rest: '45 sec' },
    { name: 'Bicep Curls', sets: 3, reps: '12', rest: '60 sec' },
    { name: 'Face Pulls', sets: 3, reps: '15', rest: '45 sec' },
  ],
  // -- Lower body
  legs_glutes: [
    { name: 'Squats', sets: 4, reps: '15', rest: '60 sec', notes: 'Chest tall, knees over toes' },
    { name: 'Reverse Lunges', sets: 3, reps: '12 each leg', rest: '60 sec' },
    { name: 'Glute Bridges', sets: 3, reps: '20', rest: '30 sec' },
    { name: 'Sumo Squats', sets: 3, reps: '15', rest: '45 sec' },
    { name: 'Calf Raises', sets: 3, reps: '20', rest: '30 sec' },
    { name: 'Step-Ups', sets: 3, reps: '12 each leg', rest: '60 sec' },
  ],
  // -- HIIT / Cardio
  hiit: [
    { name: 'Jumping Jacks', sets: 3, reps: '45 sec on / 15 sec off', rest: '30 sec' },
    { name: 'Burpees', sets: 3, reps: '10', rest: '60 sec', notes: 'Scale to no-jump if needed' },
    { name: 'High Knees', sets: 3, reps: '40 sec', rest: '20 sec' },
    { name: 'Jump Squats', sets: 3, reps: '12', rest: '60 sec' },
    { name: 'Box Jumps', sets: 3, reps: '8', rest: '90 sec' },
    { name: 'Skaters', sets: 3, reps: '30 sec', rest: '30 sec' },
  ],
  // -- Yoga / Flexibility
  yoga: [
    { name: 'Sun Salutation (A)', sets: 3, reps: 'full round', rest: '30 sec' },
    { name: 'Downward Dog Hold', sets: 3, reps: '30 sec', rest: '15 sec' },
    { name: 'Pigeon Pose', sets: 2, reps: '60 sec each side', rest: '15 sec' },
    { name: 'Cat-Cow Flow', sets: 2, reps: '10 breaths', rest: '15 sec' },
    { name: 'Warrior II Hold', sets: 2, reps: '30 sec each side', rest: '15 sec' },
    { name: "Child's Pose", sets: 1, reps: '60 sec', rest: '--' },
  ],
  // -- Running / Walking
  cardio_run: [
    { name: 'Warm-up Walk', sets: 1, reps: '5 min', rest: '--' },
    { name: 'Interval Run (fast)', sets: 6, reps: '1 min', rest: '1 min walk', notes: 'RPE 8/10' },
    { name: 'Steady-State Jog', sets: 1, reps: '15 min', rest: '--', notes: 'Conversational pace' },
    { name: 'Cool-down Walk', sets: 1, reps: '5 min', rest: '--' },
  ],
  // -- Cycling
  cycling: [
    { name: 'Warm-up Spin (low resistance)', sets: 1, reps: '5 min', rest: '--' },
    { name: 'Pyramid Intervals', sets: 5, reps: '1-2-3-2-1 min hard', rest: 'Equal rest', notes: 'Resistance +2 each interval' },
    { name: 'Steady Endurance Ride', sets: 1, reps: '20 min', rest: '--' },
    { name: 'Cool-down', sets: 1, reps: '5 min', rest: '--' },
  ],
  // -- Swimming
  swimming: [
    { name: 'Freestyle Lap Swim', sets: 4, reps: '2 lengths', rest: '30 sec' },
    { name: 'Backstroke Recovery', sets: 2, reps: '2 lengths', rest: '20 sec' },
    { name: 'Kick Board Drill', sets: 3, reps: '1 length', rest: '30 sec' },
    { name: 'Pull Buoy Upper Body', sets: 3, reps: '2 lengths', rest: '30 sec' },
  ],
  // -- Arms
  arms: [
    { name: 'Bicep Curls', sets: 3, reps: '15', rest: '45 sec' },
    { name: 'Tricep Kickbacks', sets: 3, reps: '12 each arm', rest: '45 sec' },
    { name: 'Hammer Curls', sets: 3, reps: '12', rest: '45 sec' },
    { name: 'Overhead Tricep Extension', sets: 3, reps: '15', rest: '45 sec' },
    { name: 'Diamond Push-Ups', sets: 3, reps: '10', rest: '60 sec' },
  ],
}

function pick(key: string, count = 4): Exercise[] {
  const pool = EXERCISES[key] ?? EXERCISES.core
  return pool.slice(0, count)
}

// =============================================================================
// Day templates
// =============================================================================

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function restDay(day: number): WorkoutDay {
  return {
    day, dayName: DAY_NAMES[day - 1],
    type: 'Active Recovery / Rest',
    isRest: true,
    duration: '15-30 min',
    intensity: 'low',
    exercises: [
      { name: 'Light Walk or Stretching', sets: 1, reps: '20-30 min', rest: '--' },
      { name: 'Foam Rolling', sets: 1, reps: '10 min', rest: '--', notes: 'Target sore areas' },
    ],
    tips: 'Rest days are essential. Keep movement light and focus on hydration.',
  }
}

function workoutDay(
  day: number,
  type: string,
  intensity: WorkoutIntensity,
  duration: string,
  exercises: Exercise[],
  tips?: string,
): WorkoutDay {
  return { day, dayName: DAY_NAMES[day - 1], type, isRest: false, duration, intensity, exercises, tips }
}

// =============================================================================
// Plan builder
// =============================================================================

function preferredCardio(activityTypes: ActivityType[]): Exercise[] {
  if (activityTypes.includes('swimming')) return pick('swimming', 4)
  if (activityTypes.includes('cycling')) return pick('cycling', 4)
  if (activityTypes.includes('running_walking')) return pick('cardio_run', 4)
  if (activityTypes.includes('hiit_cardio')) return pick('hiit', 4)
  return pick('cardio_run', 4)
}

function preferredFlexibility(activityTypes: ActivityType[]): Exercise[] {
  if (activityTypes.includes('yoga_pilates')) return pick('yoga', 5)
  return [
    { name: 'Hip Flexor Stretch', sets: 2, reps: '45 sec each', rest: '15 sec' },
    { name: 'Hamstring Stretch', sets: 2, reps: '45 sec each', rest: '15 sec' },
    { name: 'Chest Opener', sets: 2, reps: '30 sec', rest: '15 sec' },
    { name: 'Spinal Twist', sets: 2, reps: '30 sec each', rest: '15 sec' },
  ]
}

function intensityForLevel(level: ActivityLevel): WorkoutIntensity {
  if (level === 'sedentary' || level === 'light') return 'low'
  if (level === 'moderate') return 'moderate'
  return 'high'
}

export function generateWorkoutPlan(
  goal: Goal,
  focusAreas: FocusArea[],
  activityTypes: ActivityType[],
  activityLevel: ActivityLevel,
): WorkoutPlan {
  const intensity = intensityForLevel(activityLevel)
  const cardio = preferredCardio(activityTypes)
  const flexibility = preferredFlexibility(activityTypes)
  const daysPerWeek = activityLevel === 'sedentary' ? 3 : activityLevel === 'light' ? 4 : 5

  let schedule: WorkoutDay[]

  if (goal === 'lose_weight') {
    const wantsBelly = focusAreas.includes('belly_fat')
    const wantsLegs  = focusAreas.includes('thighs_hips')
    const wantsArms  = focusAreas.includes('arms')
    schedule = [
      workoutDay(1, 'Full Body Fat Burn', intensity, '40 min',
        [...pick('hiit', 3), ...(wantsBelly ? pick('core', 2) : pick('legs_glutes', 2))],
        'Keep rest short (30-45 sec) to maintain elevated heart rate.'),
      workoutDay(2, wantsLegs ? 'Lower Body Toning' : 'Core & Cardio', intensity, '35 min',
        wantsLegs ? pick('legs_glutes', 5) : [...pick('core', 3), ...cardio.slice(0, 2)]),
      restDay(3),
      workoutDay(4, wantsArms ? 'Arms & Cardio' : 'Upper Body Circuit', intensity, '35 min',
        wantsArms ? [...pick('arms', 3), ...cardio.slice(0, 2)] : [...pick('chest_shoulders', 3), ...pick('back_biceps', 2)]),
      workoutDay(5, 'Cardio + Core Finisher', 'moderate', '40 min',
        [...cardio.slice(0, 3), ...pick('core', 2)],
        'Aim for 140-160 BPM during cardio intervals.'),
      daysPerWeek >= 5
        ? workoutDay(6, 'Flexibility & Mobility', 'low', '30 min', flexibility, 'Focus on deep breathing and holding stretches.')
        : restDay(6),
      restDay(7),
    ]
  } else if (goal === 'build_strength') {
    const wantsChest = focusAreas.includes('chest_back')
    const wantsLegs  = focusAreas.includes('legs_power')
    const wantsArms  = focusAreas.includes('biceps_triceps')
    const wantsCore  = focusAreas.includes('core_strength')
    schedule = [
      workoutDay(1, wantsChest ? 'Chest & Back (Push/Pull)' : 'Upper Body Push', 'high', '50 min',
        wantsChest ? [...pick('chest_shoulders', 3), ...pick('back_biceps', 2)] : pick('chest_shoulders', 5),
        'Use progressive overload -- add weight when you hit the top of the rep range.'),
      workoutDay(2, wantsLegs ? 'Leg Power Day' : 'Lower Body Strength', 'high', '50 min',
        pick('legs_glutes', 5)),
      restDay(3),
      workoutDay(4, wantsArms ? 'Arms & Shoulders Hypertrophy' : 'Upper Body Pull', 'high', '45 min',
        wantsArms ? [...pick('arms', 3), ...pick('chest_shoulders', 2)] : [...pick('back_biceps', 3), ...pick('arms', 2)]),
      workoutDay(5, wantsCore ? 'Core Strength & Power' : 'Full Body Compound', 'moderate', '45 min',
        wantsCore ? pick('core', 5) : [...pick('legs_glutes', 2), ...pick('chest_shoulders', 2), ...pick('core', 1)]),
      daysPerWeek >= 5
        ? workoutDay(6, 'Active Cardio', 'low', '30 min', cardio.slice(0, 4), 'Keep intensity low -- this is active recovery, not a second workout.')
        : restDay(6),
      restDay(7),
    ]
  } else if (goal === 'tone_up') {
    const wantsCore  = focusAreas.includes('core_abs')
    const wantsArms  = focusAreas.includes('arms_shoulders')
    const wantsLegs  = focusAreas.includes('legs_glutes')
    schedule = [
      workoutDay(1, 'Upper Body Tone', intensity, '40 min',
        [...pick('chest_shoulders', 3), ...(wantsArms ? pick('arms', 2) : pick('back_biceps', 2))],
        'Focus on time under tension -- slow the eccentric (lowering) phase to 3 seconds.'),
      workoutDay(2, wantsLegs ? 'Lower Body Sculpt' : 'Cardio & Core', intensity, '40 min',
        wantsLegs ? pick('legs_glutes', 5) : [...cardio.slice(0, 2), ...pick('core', 3)]),
      restDay(3),
      workoutDay(4, wantsCore ? 'Core & Stability' : 'Full Body Circuit', 'moderate', '35 min',
        wantsCore ? pick('core', 5) : [...pick('legs_glutes', 2), ...pick('chest_shoulders', 2), ...pick('core', 1)]),
      workoutDay(5, 'Cardio + Arms Finisher', intensity, '35 min',
        [...cardio.slice(0, 3), ...(wantsArms ? pick('arms', 2) : pick('back_biceps', 2))]),
      daysPerWeek >= 5
        ? workoutDay(6, 'Flexibility & Yoga', 'low', '30 min', flexibility)
        : restDay(6),
      restDay(7),
    ]
  } else {
    // improve_health
    const wantsFlex    = focusAreas.includes('flexibility')
    const wantsEndure  = focusAreas.includes('endurance')
    schedule = [
      workoutDay(1, wantsEndure ? 'Cardio Endurance' : 'Full Body Wellness', 'moderate', '35 min',
        wantsEndure ? cardio : [...pick('legs_glutes', 2), ...pick('core', 2), ...cardio.slice(0, 1)]),
      workoutDay(2, wantsFlex ? 'Flexibility & Mobility' : 'Core & Balance', 'low', '30 min',
        wantsFlex ? flexibility : [...pick('core', 3), ...pick('yoga', 2)]),
      restDay(3),
      workoutDay(4, 'Functional Strength', 'moderate', '35 min',
        [...pick('legs_glutes', 2), ...pick('chest_shoulders', 2), ...pick('core', 1)]),
      workoutDay(5, 'Cardio + Stretch', 'moderate', '35 min',
        [...cardio.slice(0, 3), ...flexibility.slice(0, 2)],
        'End every session with 5 minutes of deep breathing for stress relief.'),
      daysPerWeek >= 5
        ? workoutDay(6, 'Active Recovery Walk', 'low', '30 min', [
            { name: 'Brisk Walk', sets: 1, reps: '20-30 min', rest: '--' },
            { name: 'Full Body Stretch', sets: 1, reps: '10 min', rest: '--' },
          ])
        : restDay(6),
      restDay(7),
    ]
  }

  const generalTips: string[] = [
    'Drink at least 2 litres of water per day, more on training days.',
    'Aim for 7-9 hours of sleep -- recovery is where progress is made.',
    'Warm up for 5 minutes before every session with light cardio or mobility work.',
    'Track your weights and reps each session -- progressive overload drives results.',
    'If a movement causes sharp pain (not muscle burn), stop and consult a professional.',
  ]

  return {
    weeks: 8,
    daysPerWeek,
    goal,
    focusAreas,
    activityTypes,
    schedule,
    generalTips,
  }
}
