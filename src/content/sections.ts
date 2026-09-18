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

// Imersão Virtual — real brand content. Sources: the 2026 brand manual
// (positioning, mission, colors, fonts), imersaovirtual.com (contact),
// and the "Rebranding - Comunicação" deck (richer product copy, the
// definitive 6-sector list, and the "Decisões precisas, sem ruídos"
// line). The deck also contains an obvious placeholder joke testimonial
// ("Henrique Maderite... in memoriam") — not real client content, not
// used here. Numbers below are only ones honestly derivable from real
// material (counts of sectors, platforms and named solutions) — no
// business metric (projects delivered, clients served, years active)
// has been invented; those still need Patrick's real figures.
export const SECTIONS: Section[] = [
  {
    kind: 'hero',
    id: 'hero',
    z: 0,
    lineA: 'Onde pessoas, empresas',
    lineB: 'e dados se encontram',
    caption: 'A dimensão que faltava no seu projeto.',
  },
  {
    kind: 'stat',
    id: 'stat-1',
    z: -8,
    label: 'Setores atendidos',
    value: '6',
    caption: 'Imobiliário, turismo, educação, eventos, indústria e cidades inteligentes.',
  },
  {
    kind: 'stat',
    id: 'stat-2',
    z: -16,
    label: 'Plataformas',
    value: '6',
    caption: 'Web, desktop, touch, VR, AR e MR — a mesma engenharia, qualquer tela.',
  },
  {
    kind: 'stat',
    id: 'stat-3',
    z: -24,
    label: 'Soluções',
    value: '3',
    caption: 'Tour 360°, simulações XR e SmartView — três formas de usar a mesma engenharia.',
  },
  {
    kind: 'maker',
    id: 'maker',
    z: -32,
    kicker: 'DIRETOR EXECUTIVO',
    name: 'Samuel Goulart',
    caption: 'Decisões precisas, sem ruídos.',
  },
  {
    kind: 'pick',
    id: 'pick-3',
    z: -40,
    kicker: 'SOLUÇÃO',
    title: 'Tour Virtual 360°',
    byline: 'Alta fidelidade, qualquer dispositivo',
    caption: 'Plantas industriais e patrimônio histórico, com consulta remota ágil e sem instalação pesada.',
    image: '/placeholders/tour-360.jpg',
    tilesX: 10,
    tilesY: 7,
  },
  {
    kind: 'pick',
    id: 'pick-2',
    z: -48,
    kicker: 'SOLUÇÃO',
    title: 'Simulações Interativas (XR)',
    byline: 'VR · AR · MR em escala real',
    caption: 'Capacitação prática e reconstruções navegáveis, com física em tempo real e sem risco operacional.',
    image: '/placeholders/xr.jpg',
    tilesX: 10,
    tilesY: 7,
  },
  {
    kind: 'pick',
    id: 'pick-1',
    z: -56,
    kicker: 'SOLUÇÃO',
    title: 'SmartView',
    byline: 'Totem · estação · navegador',
    caption: 'Navegação de plantas e dados em tempo real, do totem touch ao navegador web.',
    image: '/placeholders/smartview.jpg',
    tilesX: 10,
    tilesY: 7,
  },
  {
    kind: 'outro',
    id: 'outro',
    z: -64,
    linesA: ['Você já viu', 'as soluções'],
    linesB: ['Agora vamos', 'ao seu projeto'],
    cta: 'Fale conosco',
    ctaHref: 'https://imersaovirtual.com',
  },
]

export const SCROLL_END_Z = -64
export const STATION_Z = SECTIONS.map((s) => s.z)
