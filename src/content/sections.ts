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

// Imersão Virtual — real brand content, adapted from the 2026 brand
// manual (positioning, mission, platforms, solution names) and
// imersaovirtual.com (sector list, contact). Numbers below are only
// ones honestly derivable from that material (counts of sectors,
// platforms and named solutions) — no business metric (projects
// delivered, clients served, years active) has been invented; those
// still need Patrick's real figures before shipping.
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
    value: '5',
    caption: 'Imobiliário, indústria, turismo, educação e muito mais.',
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
    value: '4',
    caption: 'Totem interativo, treinamentos, tour virtual e software sob medida.',
  },
  {
    kind: 'maker',
    id: 'maker',
    z: -32,
    kicker: 'DIRETOR EXECUTIVO',
    name: 'Samuel Goulart',
    caption: 'À frente da engenharia e de cada relação com o cliente.',
  },
  {
    kind: 'pick',
    id: 'pick-3',
    z: -40,
    kicker: 'SOLUÇÃO',
    title: 'Treinamentos Corporativos',
    byline: 'Simulações e capacitação em 3D',
    caption: 'Indústria e segurança treinando para o risco real, sem o risco real.',
    image: '/placeholders/treinamentos.jpg',
    tilesX: 10,
    tilesY: 7,
  },
  {
    kind: 'pick',
    id: 'pick-2',
    z: -48,
    kicker: 'SOLUÇÃO',
    title: 'Tour Virtual 360°',
    byline: 'Espaços que se exploram sozinhos',
    caption: 'Imobiliário e turismo mostrando cada ambiente antes da primeira visita.',
    image: '/placeholders/tour-360.jpg',
    tilesX: 10,
    tilesY: 7,
  },
  {
    kind: 'pick',
    id: 'pick-1',
    z: -56,
    kicker: 'SOLUÇÃO',
    title: 'Totem SmartView',
    byline: 'Interação físico-digital em touch',
    caption: 'A ponte entre o ambiente real e o modelo 3D, a um toque de distância.',
    image: '/placeholders/totem-smartview.jpg',
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
