export type SectionKind = 'hero' | 'stat' | 'maker' | 'pick' | 'outro'

export interface StatSection {
  kind: 'stat'
  id: string
  z: number
  label: string
  value: string
  caption: string
}

export interface PickSection {
  kind: 'pick'
  id: string
  z: number
  kicker: string
  title: string
  byline: string
  caption: string
  image: string
  tilesX: number
  tilesY: number
}

export interface HeroSection {
  kind: 'hero'
  id: string
  z: number
  lineA: string
  lineB: string
  caption: string
}

export interface MakerSection {
  kind: 'maker'
  id: string
  z: number
  kicker: string
  name: string
  caption: string
}

export interface OutroSection {
  kind: 'outro'
  id: string
  z: number
  linesA: string[]
  linesB: string[]
  cta: string
  ctaHref: string
}

export type Section = HeroSection | StatSection | MakerSection | PickSection | OutroSection

// Placeholder / neutral content — swap for a real client's copy later.
// Structure mirrors a "portfolio gallery in numbers" narrative without
// reusing any wording from a specific reference site.
export const SECTIONS: Section[] = [
  {
    kind: 'hero',
    id: 'hero',
    z: 0,
    lineA: 'The story',
    lineB: 'so far',
    caption:
      "A running tally of the work: what's shipped, what's in progress, and what's rising to the top right now.",
  },
  {
    kind: 'stat',
    id: 'stat-1',
    z: -8,
    label: 'Projects delivered',
    value: '128',
    caption: "Every project we've shipped, in one place.",
  },
  {
    kind: 'stat',
    id: 'stat-2',
    z: -16,
    label: 'Live today',
    value: '94',
    caption: 'Live, in production, out in the world right now.',
  },
  {
    kind: 'stat',
    id: 'stat-3',
    z: -24,
    label: 'Prototypes',
    value: '37',
    caption: 'Drafts, concepts and dares that shaped the final work.',
  },
  {
    kind: 'stat',
    id: 'stat-4',
    z: -32,
    label: 'People involved',
    value: '19',
    caption: 'Studios and solo hands building alongside us.',
  },
  {
    kind: 'maker',
    id: 'maker',
    z: -40,
    kicker: 'TOP CONTRIBUTOR',
    name: 'Studio Placeholder',
    caption: 'The name behind the largest share of this run.',
  },
  {
    kind: 'pick',
    id: 'pick-3',
    z: -48,
    kicker: 'FEATURED WORK №3',
    title: 'Project Name',
    byline: 'by Client Name',
    caption: 'Rounding out the three that keep coming back.',
    image: '/placeholders/pick-3.jpg',
    tilesX: 10,
    tilesY: 7,
  },
  {
    kind: 'pick',
    id: 'pick-2',
    z: -56,
    kicker: 'FEATURED WORK №2',
    title: 'Second Project',
    byline: 'by Another Client',
    caption: 'Close behind, and closing the gap.',
    image: '/placeholders/pick-2.jpg',
    tilesX: 10,
    tilesY: 7,
  },
  {
    kind: 'pick',
    id: 'pick-1',
    z: -64,
    kicker: 'FEATURED WORK №1',
    title: 'Top Project',
    byline: 'by Lead Client',
    caption: 'The one everyone keeps sending around.',
    image: '/placeholders/pick-1.jpg',
    tilesX: 10,
    tilesY: 7,
  },
  {
    kind: 'outro',
    id: 'outro',
    z: -72,
    linesA: ["You've seen", 'the numbers'],
    linesB: ['Now explore', 'the work'],
    cta: 'View all projects',
    ctaHref: '#',
  },
]

export const SCROLL_END_Z = -72
export const STATION_Z = SECTIONS.map((s) => s.z)
