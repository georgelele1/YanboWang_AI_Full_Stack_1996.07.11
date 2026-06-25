'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type {
  ActivityLevel,
  ActivityType,
  DietPreference,
  FocusArea,
  Gender,
  Goal,
  QuizData,
} from '@/types/quiz'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_KEY = 'healthpath_session_id'

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}


// ─────────────────────────────────────────────────────────────────────────────
// Age-group illustrated figures  (SVG, no external images)
// ─────────────────────────────────────────────────────────────────────────────

type AgeGroup = '18-29' | '30-39' | '40-49' | '50+'

const AGE_CARDS: {
  group: AgeGroup; age: number
  bgFrom: string; bgTo: string
  label: string; outfitColor: string
}[] = [
  { group: '18-29', age: 24, bgFrom: '#F97316', bgTo: '#EA580C', label: 'Age: 18–29', outfitColor: '#FED7AA' },
  { group: '30-39', age: 34, bgFrom: '#0EA5E9', bgTo: '#0284C7', label: 'Age: 30–39', outfitColor: '#BAE6FD' },
  { group: '40-49', age: 44, bgFrom: '#8B5CF6', bgTo: '#7C3AED', label: 'Age: 40–49', outfitColor: '#DDD6FE' },
  { group: '50+',   age: 55, bgFrom: '#10B981', bgTo: '#059669', label: 'Age: 50+',       outfitColor: '#A7F3D0' },
]

type HairStyle = 'ponytail' | 'waves' | 'bob' | 'pixie'

const HAIR_BY_AGE: Record<AgeGroup, { style: HairStyle; color: string }> = {
  '18-29': { style: 'ponytail', color: '#1C0A00' },
  '30-39': { style: 'waves',    color: '#7C2D12' },
  '40-49': { style: 'bob',      color: '#4B3832' },
  '50+':   { style: 'pixie',    color: '#9CA3AF' },
}

function FemaleAthletesvg({
  hairStyle, hairColor, outfitColor, h = 190,
}: {
  hairStyle: HairStyle; hairColor: string; outfitColor: string; h?: number
}) {
  const skin = '#FECBA1'; const dark = '#1F2937'; const oc = outfitColor
  return (
    <svg viewBox="0 0 100 230" aria-hidden="true" style={{ height: h, width: 'auto', display: 'block', margin: '0 auto' }}>
      {hairStyle === 'ponytail' && <>
        <ellipse cx="50" cy="22" rx="19" ry="21" fill={hairColor} />
        <path d="M64 20 Q80 42 76 74 Q71 84 67 76 Q70 54 60 32" fill={hairColor} />
      </>}
      {hairStyle === 'waves' && <>
        <ellipse cx="50" cy="22" rx="19" ry="21" fill={hairColor} />
        <path d="M31 30 Q23 62 26 92 Q32 74 36 56" fill={hairColor} />
        <path d="M69 30 Q77 62 74 92 Q68 74 64 56" fill={hairColor} />
      </>}
      {hairStyle === 'bob' && <>
        <ellipse cx="50" cy="22" rx="19" ry="20" fill={hairColor} />
        <path d="M31 30 Q25 54 29 68 Q35 55 38 43" fill={hairColor} />
        <path d="M69 30 Q75 54 71 68 Q65 55 62 43" fill={hairColor} />
      </>}
      {hairStyle === 'pixie' && <>
        <ellipse cx="50" cy="22" rx="18" ry="15" fill={hairColor} />
        <path d="M32 32 Q27 46 33 54 Q38 43 40 35" fill={hairColor} />
        <path d="M68 32 Q73 46 67 54 Q62 43 60 35" fill={hairColor} />
      </>}
      <ellipse cx="50" cy="26" rx="17" ry="20" fill={skin} />
      <ellipse cx="43.5" cy="24" rx="2.2" ry="2.8" fill={dark} />
      <ellipse cx="56.5" cy="24" rx="2.2" ry="2.8" fill={dark} />
      <circle cx="44.3" cy="23" r="0.9" fill="white" />
      <circle cx="57.3" cy="23" r="0.9" fill="white" />
      <path d="M44.5 33 Q50 38 55.5 33" stroke="#C05621" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="44" y="43" width="12" height="13" rx="5" fill={skin} />
      <ellipse cx="28" cy="63" rx="9" ry="6" fill={oc} opacity="0.9" />
      <ellipse cx="72" cy="63" rx="9" ry="6" fill={oc} opacity="0.9" />
      <path d="M34 55 Q30 72 31 88 L69 88 Q70 72 66 55 Q60 49 50 49 Q40 49 34 55Z" fill={oc} opacity="0.9" />
      <path d="M42 49 L40 55" stroke={oc} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M58 49 L60 55" stroke={oc} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M29 61 Q15 86 17 118" stroke={skin} strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M71 61 Q85 86 83 118" stroke={skin} strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M31 88 Q27 104 28 120 L72 120 Q73 104 69 88Z" fill={oc} opacity="0.95" />
      <path d="M28 120 Q22 134 24 150 L76 150 Q78 134 72 120Z" fill={oc} />
      <path d="M32 150 Q28 176 29 212" stroke={oc} strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M68 150 Q72 176 71 212" stroke={oc} strokeWidth="14" strokeLinecap="round" fill="none" />
      <ellipse cx="29" cy="214" rx="11" ry="5" fill={dark} />
      <ellipse cx="71" cy="214" rx="11" ry="5" fill={dark} />
    </svg>
  )
}

function MaleAthletesvg({
  hairStyle, hairColor, outfitColor, h = 190,
}: {
  hairStyle: HairStyle; hairColor: string; outfitColor: string; h?: number
}) {
  const skin = '#FECBA1'; const dark = '#1F2937'; const oc = outfitColor
  return (
    <svg viewBox="0 0 100 230" aria-hidden="true" style={{ height: h, width: 'auto', display: 'block', margin: '0 auto' }}>
      <ellipse cx="50" cy="20" rx="18" ry={hairStyle === 'pixie' ? 11 : 14} fill={hairColor} />
      <rect x="32" y="24" width="6" height="10" rx="3" fill={hairColor} />
      <rect x="62" y="24" width="6" height="10" rx="3" fill={hairColor} />
      <ellipse cx="50" cy="27" rx="18" ry="21" fill={skin} />
      <ellipse cx="43" cy="25" rx="2.5" ry="3.1" fill={dark} />
      <ellipse cx="57" cy="25" rx="2.5" ry="3.1" fill={dark} />
      <circle cx="44" cy="24" r="1" fill="white" />
      <circle cx="58" cy="24" r="1" fill="white" />
      <path d="M44 34 Q50 39 56 34" stroke="#7C3011" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="42" y="45" width="16" height="14" rx="5" fill={skin} />
      <ellipse cx="24" cy="67" rx="12" ry="7" fill={oc} />
      <ellipse cx="76" cy="67" rx="12" ry="7" fill={oc} />
      <path d="M30 58 Q26 80 28 100 L72 100 Q74 80 70 58 Q62 50 50 50 Q38 50 30 58Z" fill={oc} opacity="0.9" />
      <path d="M26 63 Q11 90 13 122" stroke={skin} strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M74 63 Q89 90 87 122" stroke={skin} strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M28 100 Q24 116 26 134 L74 134 Q76 116 72 100Z" fill={oc} opacity="0.95" />
      <path d="M34 134 Q30 166 32 212" stroke="#374151" strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d="M66 134 Q70 166 68 212" stroke="#374151" strokeWidth="16" strokeLinecap="round" fill="none" />
      <ellipse cx="32" cy="214" rx="13" ry="5.5" fill={dark} />
      <ellipse cx="68" cy="214" rx="13" ry="5.5" fill={dark} />
    </svg>
  )
}

function AgeFigureSVG({
  group, gender, outfitColor,
}: {
  group: AgeGroup; gender?: 'male' | 'female'; outfitColor: string
}) {
  const { style, color } = HAIR_BY_AGE[group]
  return gender === 'male'
    ? <MaleAthletesvg   hairStyle={style} hairColor={color} outfitColor={outfitColor} />
    : <FemaleAthletesvg hairStyle={style} hairColor={color} outfitColor={outfitColor} />
}

// Photo paths match the exact filenames saved in /public/
// e.g. /female18-29.png, /Male18-29.png
const PHOTO_MAP: Record<string, string> = {
  'female-18-29': '/female18-29.png',
  'female-30-39': '/female30-39.png',
  'female-40-49': '/female40-49.png',
  'female-50+':   '/female50+.png',
  'male-18-29':   '/Male18-29.png',
  'male-30-39':   '/male30-39.png',
  'male-40-49':   '/male40-49.png',
  'male-50+':     '/male50+.png',
}

function AgeCardButton({
  card, gender, selected, onSelect,
}: {
  card: typeof AGE_CARDS[0]; gender?: 'male' | 'female'; selected: boolean; onSelect: () => void
}) {
  const genderKey = gender ?? 'female'
  const photoSrc  = PHOTO_MAP[`${genderKey}-${card.group}`] ?? null

  // Falls back to SVG if file not found
  const [photoOk, setPhotoOk] = React.useState(true)

  return (
    <button
      onClick={onSelect}
      className={`relative flex flex-col rounded-3xl overflow-hidden border-4 transition-all duration-200
                  focus:outline-none active:scale-95
                  ${selected
                    ? 'border-white shadow-2xl scale-[1.03] ring-4 ring-orange-500/40'
                    : 'border-transparent hover:scale-[1.02] hover:shadow-xl'}`}
      style={{ background: `linear-gradient(160deg, ${card.bgFrom}, ${card.bgTo})` }}
      aria-label={`Select age group ${card.label}`}
    >
      {/* Photo or SVG fallback */}
      <div className="h-56 w-full overflow-hidden relative">
        {photoOk ? (
          <img
            src={photoSrc}
            alt={card.label}
            className="w-full h-full object-cover object-top"
            onError={() => setPhotoOk(false)}
          />
        ) : (
          <div className="h-full flex items-end justify-center pt-3">
            <AgeFigureSVG group={card.group} gender={gender} outfitColor={card.outfitColor} />
          </div>
        )}
        {/* Subtle gradient overlay so label bar blends in */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* Label bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/75 backdrop-blur-sm">
        <span className="text-white font-bold text-sm">{card.label}</span>
        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
          {selected
            ? <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          }
        </span>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Body silhouette — parameterised by BMI and gender
// Used in steps 6 (current body) and 7 (before/after)
// ─────────────────────────────────────────────────────────────────────────────

function bmiToWidthFactor(bmi: number): number {
  if (bmi < 17)  return 0.65
  if (bmi < 20)  return 0.78
  if (bmi < 23)  return 0.88
  if (bmi < 25)  return 0.96
  if (bmi < 28)  return 1.08
  if (bmi < 32)  return 1.22
  if (bmi < 37)  return 1.40
  return 1.58
}

function bmiColor(bmi: number): string {
  if (bmi < 18.5) return '#60A5FA'  // blue — underweight
  if (bmi < 25)   return '#34D399'  // green — normal
  if (bmi < 30)   return '#FBBF24'  // amber — overweight
  return '#F87171'                  // red — obese
}

function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25)   return 'Healthy weight'
  if (bmi < 30)   return 'Overweight'
  return 'Obese'
}

function BodySVG({
  gender = 'female',
  widthFactor: w,
  outfitColor,
}: {
  gender?: 'male' | 'female'
  widthFactor: number
  outfitColor: string
}) {
  const skin  = '#FECBA1'
  const dark  = '#1F2937'
  const cx    = 60   // center-x inside 120-wide viewBox

  // Torso measurements — capped so figure never bleeds past viewBox
  const sh  = Math.min(18 * w, 24)  // shoulder half-width
  const ws  = gender === 'female' ? Math.min(11 * w, 17) : sh  // waist (hourglass only for female)
  const hp  = Math.min(20 * w, 26)  // hip half-width

  // Arm starting x (outside shoulder), capped
  const ax  = Math.min(cx + sh + 3, 84)

  // Each leg drawn as a CLOSED PATH so there's always a visible gap between them.
  // Leg centers: lx (left) and rx (right), always 11px either side of cx.
  const lx  = cx - 11
  const rx  = cx + 11
  // Leg half-width scales mildly with BMI; gap is guaranteed by the fixed leg centers
  const lw  = Math.min(7 + 3.5 * (w - 0.65), 11)
  const cw  = Math.min(5 + 2.5 * (w - 0.65),  9)  // calf is slimmer

  // Thigh top y differs by gender (where trousers/skirt end)
  const thighTopY = gender === 'female' ? 148 : 110
  const kneeY     = 175
  const ankleY    = 215

  return (
    <svg viewBox="0 0 120 235" className="w-full h-full" aria-hidden="true">
      {/* ── Hair ── */}
      {gender === 'female' ? <>
        <ellipse cx={cx} cy="20" rx="21" ry="19" fill="#7C2D12" />
        <path d={`M39 28 Q32 65 36 96 Q41 72 44 52`} fill="#7C2D12" />
        <path d={`M81 28 Q88 65 84 96 Q79 72 76 52`} fill="#7C2D12" />
      </> : <>
        <ellipse cx={cx} cy="18" rx="19" ry="12" fill="#2D1B00" />
        <rect x={cx-19} y="24" width="7" height="9" rx="3" fill="#2D1B00" />
        <rect x={cx+12} y="24" width="7" height="9" rx="3" fill="#2D1B00" />
      </>}

      {/* ── Head ── */}
      <ellipse cx={cx} cy={gender === 'female' ? 31 : 29} rx="19" ry="21" fill={skin} />

      {/* ── Face ── */}
      <ellipse cx={cx-7} cy={gender === 'female' ? 29 : 27} rx="2.2" ry="2.8" fill={dark} />
      <ellipse cx={cx+7} cy={gender === 'female' ? 29 : 27} rx="2.2" ry="2.8" fill={dark} />
      <circle  cx={cx-6} cy={gender === 'female' ? 28 : 26} r="0.9" fill="white" />
      <circle  cx={cx+8} cy={gender === 'female' ? 28 : 26} r="0.9" fill="white" />
      {gender === 'female' &&
        <path d={`M${cx-6} 40 Q${cx} 45 ${cx+6} 40`} stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" fill="none" />}

      {/* ── Neck ── */}
      <rect x={cx-6} y={gender === 'female' ? 49 : 47} width="12" height="12" rx="5" fill={skin} />

      {/* ── Shoulders ── */}
      <ellipse cx={cx - sh - 3} cy="64" rx={gender === 'male' ? 12 : 9} ry="6" fill={outfitColor} />
      <ellipse cx={cx + sh + 3} cy="64" rx={gender === 'male' ? 12 : 9} ry="6" fill={outfitColor} />

      {/* ── Torso ── */}
      {gender === 'female'
        ? <path d={`M${cx-sh} 58 Q${cx-sh-1} 76 ${cx-ws} 90 Q${cx-hp} 102 ${cx-hp} 110 L${cx+hp} 110 Q${cx+hp} 102 ${cx+ws} 90 Q${cx+sh+1} 76 ${cx+sh} 58 Z`} fill={outfitColor} />
        : <path d={`M${cx-sh-1} 58 Q${cx-sh+1} 82 ${cx-hp} 110 L${cx+hp} 110 Q${cx+sh-1} 82 ${cx+sh+1} 58 Z`} fill={outfitColor} />
      }

      {/* ── Arms (skin-colored — no dark columns) ── */}
      <path d={`M${cx-sh-1} 62 Q${cx-ax+cx-sh+6} 88 ${cx-22} 122`} stroke={skin} strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d={`M${cx+sh+1} 62 Q${ax-3} 88 ${cx+22} 122`} stroke={skin} strokeWidth="11" strokeLinecap="round" fill="none" />

      {/* ── Female skirt panel (hips → thigh top) ── */}
      {gender === 'female' &&
        <path d={`M${cx-hp} 110 Q${cx-hp-3} 132 ${cx-hp-1} ${thighTopY} L${cx+hp+1} ${thighTopY} Q${cx+hp+3} 132 ${cx+hp} 110 Z`}
              fill={outfitColor} opacity="0.9" />}

      {/* ── Left thigh (CLOSED PATH → always has gap to right leg) ── */}
      <path d={`M${lx-lw} ${thighTopY} Q${lx-lw+1} ${kneeY-10} ${lx-cw} ${kneeY} L${lx+cw} ${kneeY} Q${lx+lw-1} ${kneeY-10} ${lx+lw} ${thighTopY} Z`}
            fill={gender === 'female' ? outfitColor : dark} />

      {/* ── Right thigh ── */}
      <path d={`M${rx-lw} ${thighTopY} Q${rx-lw+1} ${kneeY-10} ${rx-cw} ${kneeY} L${rx+cw} ${kneeY} Q${rx+lw-1} ${kneeY-10} ${rx+lw} ${thighTopY} Z`}
            fill={gender === 'female' ? outfitColor : dark} />

      {/* ── Left calf (skin for female, dark for male) ── */}
      <path d={`M${lx-cw} ${kneeY} Q${lx-cw} ${ankleY-10} ${lx-cw+2} ${ankleY} L${lx+cw-2} ${ankleY} Q${lx+cw} ${ankleY-10} ${lx+cw} ${kneeY} Z`}
            fill={gender === 'female' ? skin : dark} />

      {/* ── Right calf ── */}
      <path d={`M${rx-cw} ${kneeY} Q${rx-cw} ${ankleY-10} ${rx-cw+2} ${ankleY} L${rx+cw-2} ${ankleY} Q${rx+cw} ${ankleY-10} ${rx+cw} ${kneeY} Z`}
            fill={gender === 'female' ? skin : dark} />

      {/* ── Shoes ── */}
      <ellipse cx={lx} cy={ankleY+3} rx={cw+4}  ry="4.5" fill={dark} />
      <ellipse cx={rx} cy={ankleY+3} rx={cw+4}  ry="4.5" fill={dark} />
    </svg>
  )
}

function BodyCard({
  label,
  gender,
  bmi,
  weightKg,
  outfitColor = '#34D399',
  isGoal = false,
}: {
  label: string; gender?: 'male' | 'female'
  bmi: number; weightKg: number
  outfitColor?: string; isGoal?: boolean
}) {
  const wf = bmiToWidthFactor(bmi)
  const col = bmiColor(bmi)
  const lbl = bmiLabel(bmi)

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden border-2 transition-all
                     ${isGoal ? 'border-orange-400 shadow-lg shadow-orange-500/20' : 'border-slate-700'}`}>
      {/* Label chip */}
      <div className={`px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide
                       ${isGoal ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
        {label}
      </div>

      {/* Figure */}
      <div className="bg-gradient-to-b from-gray-50 to-white px-2 pt-2 pb-0 h-44">
        <BodySVG gender={gender} widthFactor={wf} outfitColor={isGoal ? '#34D399' : outfitColor} />
      </div>

      {/* Stats */}
      <div className="px-3 py-2 bg-slate-800 border-t border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">BMI</span>
          <span className="text-sm font-bold" style={{ color: col }}>{bmi.toFixed(1)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 mb-1">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, ((bmi - 14) / (40 - 14)) * 100)}%`,
              backgroundColor: col,
            }}
          />
        </div>
        <p className="text-[10px] text-center font-medium" style={{ color: col }}>{lbl} · {weightKg.toFixed(0)} kg</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Option card (single select)
// ─────────────────────────────────────────────────────────────────────────────

function OptionCard({
  emoji, label, sublabel, selected, onClick,
}: {
  emoji: string; label: string; sublabel?: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`onboarding-option option-card w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all
        ${selected
          ? 'is-selected border-[#34271f] bg-[#f2eee8] shadow-none'
          : 'border-[#e8e1d8] bg-[#fffdf9] hover:border-[#998879]'
        }`}
    >
      <span className="text-2xl shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#2d241e]">{label}</p>
        {sublabel && <p className="text-sm text-[#74695e] mt-0.5">{sublabel}</p>}
      </div>
      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all
        ${selected ? 'border-[#34271f] bg-[#34271f]' : 'border-[#d8cfc4]'}`}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  )
}

// Multi-select tile (checkbox style)
function MultiCard({
  emoji, label, selected, onClick,
}: {
  emoji: string; label: string; selected: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`onboarding-option flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all
        ${selected
          ? 'is-selected border-[#34271f] bg-[#f2eee8] shadow-none'
          : 'border-[#e8e1d8] bg-[#fffdf9] hover:border-[#998879]'
        }`}
    >
      <span className="text-xl shrink-0">{emoji}</span>
      <p className="flex-1 text-sm font-medium text-[#2d241e]">{label}</p>
      <div className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center
        ${selected ? 'border-[#34271f] bg-[#34271f]' : 'border-[#d8cfc4]'}`}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex h-1 w-full gap-1.5" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={`flex-1 rounded-full ${index < step ? 'bg-[#34271f]' : 'bg-[#ebe6df]'}`} />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Number input sub-component
// ─────────────────────────────────────────────────────────────────────────────

function NumberInput({
  label, unit, value, onChange, min, max, placeholder,
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void
  min: number; max: number; placeholder: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#3a302a] mb-2">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 pr-16 border-2 border-[#e1d9cf] bg-white rounded-xl text-[#2d241e] font-medium
            focus:outline-none focus:border-[#34271f] transition-colors text-lg"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#887c70] font-medium">{unit}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Quiz Component
// ─────────────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 10

class SessionConflictError extends Error {}

export default function QuizPage() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string>('')
  const [sessionVersion, setSessionVersion] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [quizData, setQuizData] = useState<QuizData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medicalWarning, setMedicalWarning] = useState<string | null>(null)
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null)
  const [showBrandMoment, setShowBrandMoment] = useState(false)

  // Local form state
  const [ageVal, setAgeVal] = useState('')
  const [heightVal, setHeightVal] = useState('')
  const [weightVal, setWeightVal] = useState('')
  const [targetWeightVal, setTargetWeightVal] = useState('')
  const [emailVal, setEmailVal] = useState('')
  // Multi-select state
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])

  // ── Init: create/recover session ────────────────────────────────
  useEffect(() => {
    async function init() {
      // ?fresh=1 in the URL forces a brand-new session (used by "Retake Quiz" links)
      const isFresh = typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('fresh') === '1'
      if (isFresh) {
        localStorage.removeItem(SESSION_KEY)
      }

      const id = getOrCreateSessionId()
      setSessionId(id)
      try {
        const res = await fetch(`/api/sessions/${id}`)
        if (res.ok) {
          const data = await res.json()
          setSessionVersion(data.version ?? 0)
          const qd = data.quizData ?? {}

          // If this is a legacy session (ageGroup but no age) the new quiz
          // can't complete it. Clear and restart so the user fills step 1 fresh.
          if (qd.ageGroup && !qd.age) {
            localStorage.removeItem(SESSION_KEY)
            const createRes = await fetch('/api/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            })
            if (createRes.ok || createRes.status === 201) {
              const created = await createRes.json()
              setSessionId(created.id)
              setSessionVersion(created.version ?? 0)
              localStorage.setItem(SESSION_KEY, created.id)
            }
            return
          }

          if (qd && Object.keys(qd).length > 0) {
            setQuizData(qd)
            if (qd.age)            setAgeVal(String(qd.age))
            if (qd.heightCm)       setHeightVal(String(qd.heightCm))
            if (qd.weightKg)       setWeightVal(String(qd.weightKg))
            if (qd.targetWeightKg) setTargetWeightVal(String(qd.targetWeightKg))
            if (qd.focusAreas)     setFocusAreas(qd.focusAreas)
            if (qd.activityTypes)  setActivityTypes(qd.activityTypes)
          }

          // Completed session — show choice screen instead of silent redirect
          if (data.isCompleted) {
            setCompletedSessionId(id)
            setIsLoading(false)
            return
          }
          if (data.currentStep > 0) setCurrentStep(Math.min(data.currentStep + 1, TOTAL_STEPS))
        } else {
          if (res.status !== 404) localStorage.removeItem(SESSION_KEY)
          const createRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: res.status === 404 ? id : undefined }),
          })
          if (createRes.ok || createRes.status === 201) {
            const created = await createRes.json()
            setSessionId(created.id)
            setSessionVersion(created.version ?? 0)
            localStorage.setItem(SESSION_KEY, created.id)
          }
        }
      } catch {
        // Non-fatal; continue without recovery
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [router])

  // ── Save step to backend ──────────────────────────────────────
  const saveStep = useCallback(async (step: number, data: Partial<QuizData>) => {
    if (!sessionId) return
    try {
      setIsSaving(true)
      setError(null)
      const res = await fetch(`/api/sessions/${sessionId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, data, version: sessionVersion }),
      })
      if (!res.ok) {
        if (res.status === 409) throw new SessionConflictError()
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }
      const json = await res.json()
      setSessionVersion(json.version ?? sessionVersion)
      // Step 6 carries height + weight -- check for BMI advisory
      if (step === 6) {
        if (json.medicalWarning) setMedicalWarning(json.medicalWarning)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed'
      setError(`Failed to save progress: ${msg}. Please try again.`)
      throw e
    } finally {
      setIsSaving(false)
    }
  }, [sessionId, sessionVersion])

  // ── Navigate to next step ─────────────────────────────────────
  const goNext = useCallback(async (stepData: Partial<QuizData>) => {
    const merged = { ...quizData, ...stepData }
    setQuizData(merged)
    try {
      await saveStep(currentStep, stepData)
      if (currentStep === TOTAL_STEPS) {
        setCurrentStep(TOTAL_STEPS + 1)
        setError(null)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        let calcRes: Response
        try {
          calcRes = await fetch(`/api/sessions/${sessionId}/calculate`, {
            method: 'POST',
            signal: controller.signal,
          })
        } catch {
          clearTimeout(timeout)
          setCurrentStep(TOTAL_STEPS)
          setError('Calculation timed out -- please try again.')
          return
        }
        clearTimeout(timeout)
        if (!calcRes.ok) {
          const body = await calcRes.json().catch(() => ({}))
          setCurrentStep(TOTAL_STEPS)
          // 422 Incomplete: some steps missing — restart from step 1
          if (calcRes.status === 422 && body.error?.toLowerCase().includes('incomplete')) {
            setError('Some answers are missing. Please restart the quiz.')
            setTimeout(() => {
              localStorage.removeItem(SESSION_KEY)
              router.push('/quiz')
            }, 2000)
          } else {
            setError(body.error || 'Calculation failed — please try again.')
          }
          return
        }
        router.push(`/results/${sessionId}`)
      } else if (currentStep === 5) {
        // This transition page is not persisted, preserving the API's ten-step contract.
        setShowBrandMoment(true)
      } else {
        setCurrentStep((s) => s + 1)
      }
    } catch (e) {
      if (e instanceof SessionConflictError) {
        const latest = await fetch(`/api/sessions/${sessionId}`)
        if (latest.ok) {
          const data = await latest.json()
          const qd = data.quizData ?? {}
          setQuizData(qd)
          setSessionVersion(data.version ?? 0)
          if (qd.age) setAgeVal(String(qd.age))
          if (qd.heightCm) setHeightVal(String(qd.heightCm))
          if (qd.weightKg) setWeightVal(String(qd.weightKg))
          if (qd.targetWeightKg) setTargetWeightVal(String(qd.targetWeightKg))
          if (qd.focusAreas) setFocusAreas(qd.focusAreas)
          if (qd.activityTypes) setActivityTypes(qd.activityTypes)
          setError('Your session changed in another tab. The latest saved answers were restored; please submit this step again.')
          return
        }
      }
      // Do not advance optimistically. A failed persistence request must keep
      // the user on the current question so the stored quiz cannot diverge
      // from the visible form state.
    }
  }, [currentStep, quizData, saveStep, sessionId, router])

  const goBack = () => {
    if (showBrandMoment) {
      setShowBrandMoment(false)
      return
    }
    setCurrentStep((s) => Math.max(1, s - 1))
  }

  const startOver = () => {
    localStorage.removeItem(SESSION_KEY)
    window.location.reload()
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  // Completed session — let the user choose to view or start fresh
  if (completedSessionId) {
    return <CompletedSessionScreen sessionId={completedSessionId} onStartFresh={startOver} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner w-10 h-10" />
          <p className="text-slate-400 text-sm">Loading your session...</p>
        </div>
      </div>
    )
  }

  if (showBrandMoment) {
    return <BrandMoment onBack={goBack} onContinue={() => {
      setShowBrandMoment(false)
      setCurrentStep(6)
    }} />
  }

  if (currentStep === TOTAL_STEPS + 1) return <CalculatingScreen />

  return (
    <div className="onboarding-flow min-h-screen bg-[#fcfbf8] text-[#2d241e] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#eee9e1] px-5 py-3 flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <button onClick={goBack} disabled={currentStep === 1} aria-label="Previous question" className="w-10 h-10 rounded-full border border-[#dfd8cf] flex items-center justify-center disabled:opacity-30 hover:bg-[#f3efe9]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" /></svg>
          </button>
          <Link href="/" className="font-extrabold text-xl tracking-[-0.05em] text-[#2d241e]">HealthPath</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-sm font-semibold">Your profile</span>
          <button onClick={startOver} className="text-sm text-[#776b60] hover:text-[#2d241e] transition-colors">
            Start over
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="px-0 w-full pb-2">
        <ProgressBar step={currentStep} total={TOTAL_STEPS} />
      </div>

      {/* Step content */}
      <main className="onboarding-step flex-1 px-5 py-12 max-w-xl mx-auto w-full step-enter">
        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        {medicalWarning && (
          <div className="mb-4 bg-amber-900/20 border border-amber-800 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">⚠️</span>
              <div>
                <p className="font-semibold text-amber-300 text-sm mb-1">Medical Consultation Recommended</p>
                <p className="text-amber-400 text-sm leading-relaxed">{medicalWarning}</p>
                <button
                  onClick={() => setMedicalWarning(null)}
                  className="mt-2 text-xs text-amber-400 underline hover:text-amber-300"
                >
                  I understand, continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Gender */}
        {currentStep === 1 && (
          <StepGender selected={quizData.gender} onSelect={(v) => goNext({ gender: v })} />
        )}
        {/* Step 2: Age (gender known now, so figures match) */}
        {currentStep === 2 && (
          <StepAge
            gender={quizData.gender}
            onSelect={(age) => {
              setAgeVal(String(age))
              goNext({ age })
            }}
          />
        )}
        {/* Step 3: Goal */}
        {currentStep === 3 && (
          <StepGoal selected={quizData.goal} onSelect={(v) => {
            // Clear focus areas when goal changes
            setFocusAreas([])
            goNext({ goal: v })
          }} />
        )}
        {/* Step 4: Focus Areas (goal-dependent) */}
        {currentStep === 4 && (
          <StepFocusArea
            goal={quizData.goal}
            selected={focusAreas}
            onChange={setFocusAreas}
            onNext={() => goNext({ focusAreas })}
          />
        )}
        {/* Step 5: Activity Type Preferences */}
        {currentStep === 5 && (
          <StepActivityTypes
            selected={activityTypes}
            onChange={setActivityTypes}
            onNext={() => goNext({ activityTypes })}
          />
        )}
        {/* Step 6: Height + Weight */}
        {currentStep === 6 && (
          <StepBodyData
            heightVal={heightVal} weightVal={weightVal}
            onHeightChange={setHeightVal} onWeightChange={setWeightVal}
            gender={quizData.gender}
            onNext={() => goNext({ heightCm: parseFloat(heightVal), weightKg: parseFloat(weightVal) })}
          />
        )}
        {/* Step 7: Target Weight */}
        {currentStep === 7 && (
          <StepTargetWeight
            currentWeight={quizData.weightKg}
            heightCm={quizData.heightCm}
            gender={quizData.gender}
            targetVal={targetWeightVal}
            onChange={setTargetWeightVal}
            onNext={() => goNext({ targetWeightKg: parseFloat(targetWeightVal) })}
          />
        )}
        {/* Step 8: Activity Level */}
        {currentStep === 8 && (
          <StepActivity selected={quizData.activityLevel} onSelect={(v) => goNext({ activityLevel: v })} />
        )}
        {/* Step 9: Diet Preference */}
        {currentStep === 9 && (
          <StepDiet selected={quizData.dietPreference} onSelect={(v) => goNext({ dietPreference: v })} />
        )}
        {/* Step 10: Email */}
        {currentStep === 10 && (
          <StepEmail
            emailVal={emailVal} onChange={setEmailVal}
            onNext={() => goNext({ ...(emailVal ? { email: emailVal } : {}) })}
            isSaving={isSaving}
          />
        )}
      </main>

      <footer className="text-center pb-6 text-xs text-slate-500">
        🔒 Your answers are private and never sold
      </footer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step components
// ─────────────────────────────────────────────────────────────────────────────

function StepAge({ gender, onSelect: onSelectAge }: {
  gender?: 'male' | 'female'
  onSelect: (age: number) => void
}) {
  const [selected, setSelected] = useState<AgeGroup | null>(null)

  function pick(card: typeof AGE_CARDS[0]) {
    setSelected(card.group)
    // Pass age value directly — avoids stale-closure bug from reading ageVal state
    setTimeout(() => onSelectAge(card.age), 240)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Choose your age</h2>
      <p className="text-slate-400 text-sm mb-5">
        Tap your age group. Your metabolic rate is calibrated precisely to your age.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {AGE_CARDS.map((card) => (
          <AgeCardButton
            key={card.group}
            card={card}
            gender={gender}
            selected={selected === card.group}
            onSelect={() => pick(card)}
          />
        ))}
      </div>
    </div>
  )
}

function StepGender({ selected, onSelect }: { selected?: Gender; onSelect: (v: Gender) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">What is your biological sex?</h2>
      <p className="text-slate-400 text-sm mb-6">Used to calculate your baseline metabolic rate accurately.</p>
      <div className="flex flex-col gap-3">
        <OptionCard emoji="♂️" label="Male" selected={selected === 'male'} onClick={() => onSelect('male')} />
        <OptionCard emoji="♀️" label="Female" selected={selected === 'female'} onClick={() => onSelect('female')} />
      </div>
    </div>
  )
}

function StepGoal({ selected, onSelect }: { selected?: Goal; onSelect: (v: Goal) => void }) {
  const options: { value: Goal; emoji: string; label: string; sublabel: string }[] = [
    { value: 'lose_weight',    emoji: '⬇️', label: 'Lose weight',           sublabel: 'Shed body fat with a caloric deficit' },
    { value: 'tone_up',       emoji: '✨',          label: 'Tone up',               sublabel: 'Reduce fat while maintaining muscle' },
    { value: 'build_strength', emoji: '🏋️', label: 'Build strength',       sublabel: 'Gain muscle with a slight caloric surplus' },
    { value: 'improve_health', emoji: '❤️',  label: 'Improve overall health', sublabel: 'Maintain weight with balanced nutrition' },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">What&apos;s your main goal?</h2>
      <p className="text-slate-400 text-sm mb-6">Your plan is calibrated to this specific outcome.</p>
      <div className="flex flex-col gap-3">
        {options.map((o) => (
          <OptionCard key={o.value} emoji={o.emoji} label={o.label} sublabel={o.sublabel}
            selected={selected === o.value} onClick={() => onSelect(o.value)} />
        ))}
      </div>
    </div>
  )
}

// Focus areas are goal-dependent
const FOCUS_OPTIONS: Record<Goal, { value: FocusArea; emoji: string; label: string }[]> = {
  lose_weight: [
    { value: 'belly_fat',    emoji: '🪆', label: 'Belly fat' },
    { value: 'thighs_hips',  emoji: '🦵', label: 'Thighs & hips' },
    { value: 'arms',         emoji: '💪', label: 'Arms' },
    { value: 'full_body_slim', emoji: '🏃', label: 'Full body slim' },
  ],
  tone_up: [
    { value: 'core_abs',       emoji: '💪', label: 'Core & abs' },
    { value: 'arms_shoulders', emoji: '🏋️', label: 'Arms & shoulders' },
    { value: 'legs_glutes',    emoji: '🦵', label: 'Legs & glutes' },
    { value: 'full_body_tone', emoji: '✨', label: 'Full body tone' },
  ],
  build_strength: [
    { value: 'chest_back',     emoji: '🏋️', label: 'Chest & back' },
    { value: 'biceps_triceps', emoji: '💪', label: 'Biceps & triceps' },
    { value: 'legs_power',     emoji: '🏆', label: 'Legs & power' },
    { value: 'core_strength',  emoji: '⚡', label: 'Core strength' },
  ],
  improve_health: [
    { value: 'flexibility',  emoji: '🧘', label: 'Flexibility' },
    { value: 'endurance',    emoji: '🏃', label: 'Endurance' },
    { value: 'posture',      emoji: '🪤', label: 'Posture' },
    { value: 'stress_relief', emoji: '🧘', label: 'Stress relief' },
  ],
}

function StepFocusArea({ goal, selected, onChange, onNext }: {
  goal?: Goal
  selected: FocusArea[]
  onChange: (v: FocusArea[]) => void
  onNext: () => void
}) {
  const options = goal ? FOCUS_OPTIONS[goal] : []
  const toggle = (v: FocusArea) => {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  }
  const goalLabel: Record<Goal, string> = {
    lose_weight:    'lose weight',
    tone_up:        'tone up',
    build_strength: 'build strength',
    improve_health: 'improve health',
  }
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Where do you want to focus?</h2>
      <p className="text-slate-400 text-sm mb-6">
        Choose all areas you want to {goal ? goalLabel[goal] : 'target'} -- your plan will
        prioritise these. Select at least one.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <MultiCard key={o.value} emoji={o.emoji} label={o.label}
            selected={selected.includes(o.value)} onClick={() => toggle(o.value)} />
        ))}
      </div>
      <button
        disabled={selected.length === 0}
        onClick={onNext}
        className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500
          text-white font-bold py-4 rounded-2xl transition-all"
      >
        Continue →
      </button>
    </div>
  )
}

const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; emoji: string; label: string }[] = [
  { value: 'home_workouts',   emoji: '🏠', label: 'Home workouts' },
  { value: 'gym',             emoji: '🏋️', label: 'Gym' },
  { value: 'running_walking', emoji: '🏃', label: 'Running / Walking' },
  { value: 'yoga_pilates',    emoji: '🧘', label: 'Yoga / Pilates' },
  { value: 'hiit_cardio',     emoji: '⚡',  label: 'HIIT / Cardio' },
  { value: 'swimming',        emoji: '🏊', label: 'Swimming' },
  { value: 'cycling',         emoji: '🚴', label: 'Cycling' },
  { value: 'sports',          emoji: '⚽',  label: 'Sports' },
]

function StepActivityTypes({ selected, onChange, onNext }: {
  selected: ActivityType[]
  onChange: (v: ActivityType[]) => void
  onNext: () => void
}) {
  const toggle = (v: ActivityType) => {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  }
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">What activities do you enjoy?</h2>
      <p className="text-slate-400 text-sm mb-6">
        Your plan will be built around what you actually like doing. Pick as many as you want.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ACTIVITY_TYPE_OPTIONS.map((o) => (
          <MultiCard key={o.value} emoji={o.emoji} label={o.label}
            selected={selected.includes(o.value)} onClick={() => toggle(o.value)} />
        ))}
      </div>
      <button
        disabled={selected.length === 0}
        onClick={onNext}
        className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500
          text-white font-bold py-4 rounded-2xl transition-all"
      >
        Continue →
      </button>
    </div>
  )
}

function StepBodyData({ heightVal, weightVal, onHeightChange, onWeightChange, onNext, gender }: {
  heightVal: string; weightVal: string
  onHeightChange: (v: string) => void; onWeightChange: (v: string) => void
  onNext: () => void; gender?: 'male' | 'female'
}) {
  const h = parseFloat(heightVal); const w = parseFloat(weightVal)
  const isValid = h >= 100 && h <= 250 && w >= 30 && w <= 300
  const bmi = isValid ? w / ((h / 100) ** 2) : 22

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Your current measurements</h2>
      <p className="text-slate-400 text-sm mb-4">Enter your height and weight — watch your body shape update live.</p>

      {/* Live body visualisation */}
      <div className="mb-5 flex justify-center">
        <div className="w-36">
          <BodyCard
            label="You right now"
            gender={gender}
            bmi={bmi}
            weightKg={isValid ? w : 70}
            outfitColor="#34D399"
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <NumberInput label="Height" unit="cm" value={heightVal} onChange={onHeightChange}
          min={100} max={250} placeholder="e.g. 170" />
        <NumberInput label="Current weight" unit="kg" value={weightVal} onChange={onWeightChange}
          min={30} max={300} placeholder="e.g. 75" />
      </div>
      {heightVal && weightVal && !isValid && (
        <p className="mt-3 text-sm text-red-500">
          Please enter realistic values (height 100-250 cm, weight 30-300 kg).
        </p>
      )}
      <button disabled={!isValid} onClick={onNext}
        className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500
          text-white font-bold py-4 rounded-2xl transition-all">
        Continue →
      </button>
    </div>
  )
}

function StepTargetWeight({ currentWeight, heightCm, targetVal, onChange, onNext, gender }: {
  currentWeight?: number; heightCm?: number; targetVal: string
  onChange: (v: string) => void; onNext: () => void; gender?: 'male' | 'female'
}) {
  const t = parseFloat(targetVal); const isValid = t >= 30 && t <= 300
  const h = heightCm ?? 170
  const currentBmi = currentWeight ? currentWeight / ((h / 100) ** 2) : 25
  const goalBmi    = isValid       ? t           / ((h / 100) ** 2) : currentBmi

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">What&apos;s your goal weight?</h2>
      <p className="text-slate-400 text-sm mb-4">
        {currentWeight ? `Currently ${currentWeight} kg. ` : ''}We&apos;ll show you the transformation and calculate exactly how long it will take.
      </p>

      {/* Before / After visualisation */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <BodyCard
          label="Now"
          gender={gender}
          bmi={currentBmi}
          weightKg={currentWeight ?? 70}
          outfitColor="#F472B6"
        />
        <BodyCard
          label="Goal"
          gender={gender}
          bmi={goalBmi}
          weightKg={isValid ? t : currentWeight ?? 70}
          outfitColor="#34D399"
          isGoal
        />
      </div>

      <NumberInput label="Target weight" unit="kg" value={targetVal} onChange={onChange}
        min={30} max={300} placeholder="e.g. 65" />
      <button disabled={!isValid} onClick={onNext}
        className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500
          text-white font-bold py-4 rounded-2xl transition-all">
        Continue →
      </button>
    </div>
  )
}

function StepActivity({ selected, onSelect }: { selected?: ActivityLevel; onSelect: (v: ActivityLevel) => void }) {
  const options: { value: ActivityLevel; emoji: string; label: string; sublabel: string }[] = [
    { value: 'sedentary', emoji: '🛋️', label: 'Sedentary',         sublabel: 'Little or no exercise' },
    { value: 'light',     emoji: '🚶',          label: 'Lightly active',    sublabel: 'Exercise 1-2x/week' },
    { value: 'moderate',  emoji: '🏃',          label: 'Moderately active', sublabel: 'Exercise 3-4x/week' },
    { value: 'active',    emoji: '🏋️',  label: 'Very active',       sublabel: 'Exercise 5+x/week' },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">How active are you?</h2>
      <p className="text-slate-400 text-sm mb-6">Your activity level multiplies your calorie needs.</p>
      <div className="flex flex-col gap-3">
        {options.map((o) => (
          <OptionCard key={o.value} emoji={o.emoji} label={o.label} sublabel={o.sublabel}
            selected={selected === o.value} onClick={() => onSelect(o.value)} />
        ))}
      </div>
    </div>
  )
}

function StepDiet({ selected, onSelect }: { selected?: DietPreference; onSelect: (v: DietPreference) => void }) {
  const options: { value: DietPreference; emoji: string; label: string }[] = [
    { value: 'no_preference', emoji: '🍽️', label: 'No specific preference' },
    { value: 'vegetarian',    emoji: '🥦',          label: 'Vegetarian' },
    { value: 'vegan',         emoji: '🌱',          label: 'Vegan' },
    { value: 'keto',          emoji: '🥑',          label: 'Keto / Low-carb' },
    { value: 'paleo',         emoji: '🥩',          label: 'Paleo' },
  ]
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Any dietary preference?</h2>
      <p className="text-slate-400 text-sm mb-6">Optional -- helps tailor your nutrition recommendations.</p>
      <div className="flex flex-col gap-3">
        {options.map((o) => (
          <OptionCard key={o.value} emoji={o.emoji} label={o.label}
            selected={selected === o.value} onClick={() => onSelect(o.value)} />
        ))}
      </div>
    </div>
  )
}

function StepEmail({ emailVal, onChange, onNext, isSaving }: {
  emailVal: string; onChange: (v: string) => void; onNext: () => void; isSaving: boolean
}) {
  const isValidEmail = !emailVal || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)
  return (
    <div>
      <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl">
        <p className="text-orange-300 font-semibold text-sm">🎉 Almost there!</p>
        <p className="text-orange-400 text-sm mt-1">Your personalised plan is being generated. Enter your email to unlock your full workout programme -- or skip and see a preview now.</p>
      </div>
      <h2 className="text-2xl font-bold text-white mb-1">Where should we send your plan?</h2>
      <p className="text-slate-400 text-sm mb-6">Optional. We don&apos;t spam. Unsubscribe anytime.</p>
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">Email address</label>
        <input
          type="email"
          value={emailVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3.5 border-2 border-slate-700 bg-slate-800 rounded-xl text-white
            focus:outline-none focus:border-orange-500 transition-colors"
        />
        {!isValidEmail && <p className="mt-1.5 text-sm text-red-500">Please enter a valid email</p>}
      </div>
      <button
        disabled={!isValidEmail || isSaving}
        onClick={onNext}
        className="mt-5 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500
          text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <><div className="spinner w-5 h-5" /> Calculating...</>
        ) : (
          'See My Results →'
        )}
      </button>
      <button onClick={onNext} disabled={isSaving}
        className="mt-3 w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors">
        Skip and see results
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculating screen
// ─────────────────────────────────────────────────────────────────────────────

function BrandMoment({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  return (
    <main className="brand-moment min-h-screen bg-[#fcfbf8] text-[#2d241e]">
      <header className="border-b border-[#eee9e1] px-5 py-3 flex items-center gap-3">
        <button onClick={onBack} aria-label="Back to quiz" className="w-10 h-10 rounded-full border border-[#dfd8cf] flex items-center justify-center hover:bg-[#f3efe9]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span className="font-extrabold text-xl tracking-[-0.05em]">HealthPath</span>
      </header>
      <section className="max-w-5xl mx-auto px-5 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="max-w-md">
          <p className="text-xs font-bold tracking-[0.18em] text-[#9a7556]">PERSONALISED WELLNESS</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold tracking-[-0.055em] leading-[0.97]">We turn your answers into a plan you can actually follow.</h1>
          <p className="mt-6 text-lg leading-relaxed text-[#655a51]">HealthPath combines your goal, activity preferences and measurements to create practical nutrition targets and workouts made for your life.</p>
          <div className="mt-7 grid grid-cols-3 gap-3 text-center">
            {[['01', 'Your inputs'], ['02', 'Our guide'], ['03', 'Your next step']].map(([number, label]) => <div key={number} className="rounded-2xl border border-[#e8e1d8] bg-white p-3"><p className="font-extrabold text-[#9a7556]">{number}</p><p className="mt-1 text-xs font-medium text-[#655a51]">{label}</p></div>)}
          </div>
          <button onClick={onContinue} className="mt-8 rounded-full bg-[#34271f] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#4b382c]">Continue building my guide →</button>
        </div>
        <div className="relative mx-auto w-full max-w-md h-[360px] md:h-[430px] rounded-[2rem] bg-[#f0ece5] overflow-hidden">
          <div className="absolute left-1/2 top-8 -translate-x-1/2 w-52 rounded-[1.8rem] border-[7px] border-[#34271f] bg-white shadow-2xl overflow-hidden z-10">
            <div className="px-4 pt-5 pb-3 bg-[#fffdfa]"><p className="text-[9px] text-[#86796d]">YOUR HEALTHPATH</p><p className="mt-1 font-extrabold text-sm">Today&apos;s movement</p></div>
            <img src="/female30-39.png" alt="Fitness workout preview" className="h-48 w-full object-cover object-top" />
            <div className="p-3"><div className="h-2 rounded bg-[#e8e1d8] w-3/4" /><div className="mt-2 h-2 rounded bg-[#f1ece5] w-full" /></div>
          </div>
          <div className="absolute left-3 bottom-8 w-28 rounded-[1.4rem] border-4 border-[#6a5a4d] bg-white shadow-xl overflow-hidden rotate-[-8deg]"><img src="/female18-29.png" alt="Workout companion" className="h-36 w-full object-cover object-top" /></div>
          <div className="absolute right-2 bottom-3 w-28 rounded-[1.4rem] border-4 border-[#6a5a4d] bg-white shadow-xl overflow-hidden rotate-[8deg]"><img src="/male40-49.png" alt="Workout companion" className="h-36 w-full object-cover object-top" /></div>
        </div>
      </section>
    </main>
  )
}

function CalculatingScreen() {
  const steps = [
    { label: 'Calculating your BMI...', done: true },
    { label: 'Computing TDEE with activity factor...', done: true },
    { label: 'Building your macro breakdown...', done: true },
    { label: 'Generating your workout programme...', done: false },
  ]
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-orange-500/15 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Building your plan...</h2>
        <p className="text-slate-400 text-sm mb-8">This only takes a moment</p>
        <div className="space-y-3 text-left">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-orange-500' : 'bg-slate-700'}`}>
                {s.done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${s.done ? 'text-slate-200' : 'text-slate-500'}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Completed session choice screen
// ─────────────────────────────────────────────────────────────────────────────

function CompletedSessionScreen({
  sessionId,
  onStartFresh,
}: {
  sessionId: string
  onStartFresh: () => void
}) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* Card */}
        <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8 text-center shadow-2xl">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-orange-500/15 flex items-center justify-center">
            <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">You already have a plan!</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Your health assessment is complete. Jump back to your results,
            or reset and build a new personalised plan from scratch.
          </p>

          {/* View results */}
          <Link
            href={`/results/${sessionId}`}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600
                       text-white font-bold py-4 rounded-2xl mb-3 transition-colors shadow-lg shadow-orange-500/20"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View My Results
          </Link>

          {/* Start fresh */}
          <button
            onClick={onStartFresh}
            className="flex items-center justify-center gap-2 w-full
                       border-2 border-slate-600 hover:border-orange-500/50
                       text-slate-300 hover:text-white font-semibold
                       py-4 rounded-2xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Start Fresh Assessment
          </button>

          <p className="mt-5 text-xs text-slate-600">
            Starting fresh creates a new plan — your old results stay accessible via the link above.
          </p>
        </div>
      </div>
    </div>
  )
}
