import {
  ankylosaurusScientificName,
  ankylosaurusText,
  stegosaurusScientificName,
  stegosaurusText
} from './content.ts';

export type SpecimenId = 'ankylosaurus' | 'stegosaurus';
export type DietId = 'herbivore' | 'carnivore' | 'omnivore';
export type PeriodId = 'triassic' | 'jurassic' | 'cretaceous';

export type Specimen = Readonly<{
  id: string;
  scientificName: string;
  exhibitPath: `/specimens/${SpecimenId}/` | null;
  poster: `${SpecimenId}-poster.png` | null;
  diet: DietId | null;
  periods: readonly PeriodId[];
  period: 'late-cretaceous' | 'late-jurassic' | null;
  studyCapability: 'guided' | 'exploration' | null;
  source: string | null;
  text: Readonly<Record<'en' | 'de', Readonly<{
    name: string;
    description: string;
    reconstruction: string;
    age: string;
    posterAlt: string;
  }>>>;
}>;

export const specimens = [
  {
    id: 'ankylosaurus',
    scientificName: ankylosaurusScientificName,
    exhibitPath: '/specimens/ankylosaurus/',
    poster: 'ankylosaurus-poster.png',
    diet: 'herbivore',
    period: 'late-cretaceous',
    periods: ['cretaceous'],
    studyCapability: 'guided',
    source: 'https://www.nhm.ac.uk/discover/dino-directory/Ankylosaurus.html',
    text: {
      en: {
        name: ankylosaurusText.en.name,
        description: ankylosaurusText.en.description,
        reconstruction: ankylosaurusText.en.reconstruction,
        age: '68–66 million years ago',
        posterAlt: 'Illustration of an armored Ankylosaurus with a tail club.'
      },
      de: {
        name: ankylosaurusText.de.name,
        description: ankylosaurusText.de.description,
        reconstruction: ankylosaurusText.de.reconstruction,
        age: 'vor 68–66 Millionen Jahren',
        posterAlt: 'Illustration eines gepanzerten Ankylosaurus mit Schwanzkeule.'
      }
    }
  },
  {
    id: 'stegosaurus',
    scientificName: stegosaurusScientificName,
    exhibitPath: '/specimens/stegosaurus/',
    poster: 'stegosaurus-poster.png',
    diet: 'herbivore',
    period: 'late-jurassic',
    periods: ['jurassic'],
    studyCapability: 'exploration',
    source: 'https://www.nhm.ac.uk/discover/stegosaurus-brought-to-life.html',
    text: {
      en: {
        name: stegosaurusText.en.name,
        description: stegosaurusText.en.description,
        reconstruction: stegosaurusText.en.reconstruction,
        age: 'approximately 150 million years ago',
        posterAlt: 'Illustration of a Stegosaurus with tall back plates and tail spikes.'
      },
      de: {
        name: stegosaurusText.de.name,
        description: stegosaurusText.de.description,
        reconstruction: stegosaurusText.de.reconstruction,
        age: 'vor etwa 150 Millionen Jahren',
        posterAlt: 'Illustration eines Stegosaurus mit hohen Rückenplatten und Schwanzstacheln.'
      }
    }
  }
] as const satisfies readonly Specimen[];

export function getSpecimen(id: string | null | undefined): typeof specimens[number] {
  return specimens.find((specimen) => specimen.id === id) ?? specimens[0];
}
