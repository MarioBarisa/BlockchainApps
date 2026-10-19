import type { IconName } from '@/icons'

export type ProjectCategory = 'Hrana' | 'Kultura' | 'Zajednica' | 'Okoliš' | 'Edukacija'

export type Project = {
  id: number
  title: string
  description: string
  category: ProjectCategory
  icon: IconName
  raised: number
  goal: number
  supporters: number
  featured?: boolean
}

export const categories: Array<ProjectCategory | 'Sve'> = [
  'Sve',
  'Hrana',
  'Kultura',
  'Zajednica',
  'Okoliš',
  'Edukacija',
]

export const projects: Project[] = [
  {
    id: 1,
    title: 'Kolektivna kupnja kave',
    description: 'Zajednička narudžba zrna kave od malog pržionika iz kvarta, bez posrednika.',
    category: 'Hrana',
    icon: 'hand-coins',
    raised: 2.4,
    goal: 3,
    supporters: 34,
    featured: true,
  },
  {
    id: 2,
    title: 'Ljetno kino na parkingu',
    description: 'Platno, projektor i pet večeri filmova za susjede. Ulaz besplatan za sve.',
    category: 'Kultura',
    icon: 'note-pencil',
    raised: 1.15,
    goal: 2,
    supporters: 21,
    featured: true,
  },
  {
    id: 3,
    title: 'Zelena terasa zajednice',
    description: 'Sadnice, tegle i klupice za zajedničku terasu na krovu zgrade.',
    category: 'Okoliš',
    icon: 'tree',
    raised: 0.8,
    goal: 1.5,
    supporters: 12,
    featured: true,
  },
  {
    id: 4,
    title: 'Radionica za starije susjede',
    description: 'Besplatna radionica o sigurnom korištenju interneta i digitalnih servisa.',
    category: 'Edukacija',
    icon: 'coin',
    raised: 0.45,
    goal: 1,
    supporters: 9,
  },
  {
    id: 5,
    title: 'Popravak društvene sobe',
    description: 'Nova rasvjeta, boja i stolice za prostor u kojem se sastaje cijela zgrada.',
    category: 'Zajednica',
    icon: 'users-three',
    raised: 3.1,
    goal: 4,
    supporters: 47,
  },
  {
    id: 6,
    title: 'Doručak za volontere',
    description: 'Hrana i piće za ekipu koja svaki vikend čisti okolna dvorišta.',
    category: 'Hrana',
    icon: 'hand-coins',
    raised: 0.6,
    goal: 0.8,
    supporters: 15,
  },
  {
    id: 7,
    title: 'Mural na ulazu u kvart',
    description: 'Lokalni umjetnici oslikavaju zid uz igralište, uz dogovor sa susjedima.',
    category: 'Kultura',
    icon: 'note-pencil',
    raised: 1.9,
    goal: 2.5,
    supporters: 28,
  },
  {
    id: 8,
    title: 'Kutija za razmjenu knjiga',
    description: 'Mala drvena kućica za knjige ispred ulaza. Uzmi jednu, ostavi jednu.',
    category: 'Edukacija',
    icon: 'coin',
    raised: 0.25,
    goal: 0.5,
    supporters: 6,
  },
]

export const featuredProjects = projects.filter((project) => project.featured)
