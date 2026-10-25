import { specimens, type Specimen, type DietId, type PeriodId } from '../../src/lib/specimens/catalog.ts';

// Verification only. No sample has media, an exhibit destination or a production import.
const diets: readonly (DietId | null)[] = ['herbivore', 'carnivore', 'omnivore', null];
const periods: readonly (readonly PeriodId[])[] = [['triassic'], ['jurassic'], ['cretaceous'], ['jurassic', 'cretaceous'], []];
export const discoveryFixtures: readonly Specimen[] = [
  ...specimens,
  ...Array.from({ length: 50 }, (_, i): Specimen => {
    const number = String(i + 1).padStart(2, '0');
    const text = (locale: 'en' | 'de') => ({
      name: locale === 'en' ? `Layout sample ${number}${i === 49 ? ' — an exceptionally long collection entry for wrapping verification' : ''}` :
        `Layoutbeispiel ${number}${i === 49 ? ' — ein außergewöhnlich langer Sammlungsname zur Überprüfung des Zeilenumbruchs' : ''}`,
      description: locale === 'en' ? 'Layout verification sample. Not a real specimen or exhibit.' : 'Beispiel zur Layoutprüfung. Kein echtes Exemplar und keine Ausstellung.',
      reconstruction: '', age: '', posterAlt: ''
    });
    return {
      id: `layout-sample-${number}`, scientificName: `Layout sample scientific ${number}`,
      exhibitPath: null, poster: null, diet: diets[i % diets.length],
      periods: periods[i % periods.length], period: null, studyCapability: null, source: null,
      text: { en: text('en'), de: text('de') }
    };
  })
];
