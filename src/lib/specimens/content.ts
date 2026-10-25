import type { AnatomyText } from './specimen-config.ts';

export const ankylosaurusScientificName = 'Ankylosaurus magniventris';
export const ankylosaurusText = {
  en: {
    viewerLabel: 'Interactive 3D Ankylosaurus specimen',
    name: 'Ankylosaurus',
    description: 'An armored dinosaur with a distinctive tail club.',
    reconstruction: 'A stylized reconstruction.',
    anatomy: {
      armor: { label: 'Armor', heading: 'Bone-built armor', body: 'Bony plates called osteoderms formed within the skin. They probably helped protect Ankylosaurus like a suit of armor.' },
      head: { label: 'Head', heading: 'Built for eating plants', body: 'Ankylosaurus had a beak at the front of its mouth and small teeth behind it. Despite its tough appearance, it was a plant-eater.' },
      tailClub: { label: 'Tail club', heading: 'A powerful defense', body: 'A large bony knob formed the end of the tail. Scientists think Ankylosaurus could swing it to strike an attacker.' }
    } satisfies AnatomyText
  },
  de: {
    viewerLabel: 'Interaktives 3D-Exemplar eines Ankylosaurus',
    name: 'Ankylosaurus',
    description: 'Ein gepanzerter Dinosaurier mit einer markanten Schwanzkeule.',
    reconstruction: 'Eine stilisierte Rekonstruktion.',
    anatomy: {
      armor: { label: 'Panzerung', heading: 'Ein Panzer aus Knochen', body: 'Knochenplatten, die Osteoderme heißen, bildeten sich in der Haut. Sie schützten Ankylosaurus vermutlich wie eine Rüstung.' },
      head: { label: 'Kopf', heading: 'Für Pflanzenkost gebaut', body: 'Ankylosaurus hatte vorne am Maul einen Schnabel und dahinter kleine Zähne. Trotz seines wehrhaften Aussehens war er ein Pflanzenfresser.' },
      tailClub: { label: 'Schwanzkeule', heading: 'Eine starke Verteidigung', body: 'Am Schwanzende saß eine große Verdickung aus Knochen. Forschende vermuten, dass Ankylosaurus sie schwingen konnte, um einen Angreifer zu treffen.' }
    } satisfies AnatomyText
  }
} as const;

export const stegosaurusScientificName = 'Stegosaurus stenops';
// Scientific interpretation and claim-to-source mapping: docs/assets/stegosaurus.md.
export const stegosaurusText = {
  en: {
    viewerLabel: 'Interactive 3D Stegosaurus specimen',
    name: 'Stegosaurus',
    description: 'A plant-eating dinosaur with tall back plates and four tail spikes.',
    reconstruction: 'A stylized reconstruction.',
    scaleLabel: (length: string) => `Represented length: ${length} m`,
    scaleNote: (length: string) => `Shown at a represented length of ${length} m for comparison; this stylized model is not a measured reconstruction of a particular individual.`,
    anatomy: {
      head: { label: 'Head', heading: 'A small head for a plant-eater', body: 'Stegosaurus ate plants. Its small head had jaws lined with tiny teeth. Its brain was very small compared with its large body.' },
      plates: { label: 'Dorsal plates', heading: 'Plates with an uncertain purpose', body: 'Bony plates stood along the neck, back and tail. Their function is uncertain: display and temperature regulation are possible explanations. This reconstruction has 19 plates.' },
      spikes: { label: 'Tail spikes', heading: 'Four pointed tail spikes', body: 'The four tail spikes are collectively called the thagomizer. They may have helped Stegosaurus defend itself against attackers.' }
    } satisfies AnatomyText
  },
  de: {
    viewerLabel: 'Interaktives 3D-Exemplar eines Stegosaurus',
    name: 'Stegosaurus',
    description: 'Ein pflanzenfressender Dinosaurier mit hohen Rückenplatten und vier Schwanzstacheln.',
    reconstruction: 'Eine stilisierte Rekonstruktion.',
    scaleLabel: (length: string) => `Dargestellte Länge: ${length} m`,
    scaleNote: (length: string) => `Zum Vergleich mit einer dargestellten Länge von ${length} m gezeigt; dieses stilisierte Modell ist keine vermessene Rekonstruktion eines bestimmten Individuums.`,
    anatomy: {
      head: { label: 'Kopf', heading: 'Ein kleiner Kopf für Pflanzenkost', body: 'Stegosaurus fraß Pflanzen. In den Kiefern seines kleinen Kopfes saßen winzige Zähne. Sein Gehirn war im Vergleich zu seinem großen Körper sehr klein.' },
      plates: { label: 'Rückenplatten', heading: 'Platten mit ungeklärter Funktion', body: 'Knochenplatten standen entlang von Hals, Rücken und Schwanz. Ihre Funktion ist ungeklärt: Schauwirkung und Temperaturregelung sind mögliche Erklärungen. Diese Rekonstruktion hat 19 Platten.' },
      spikes: { label: 'Schwanzstacheln', heading: 'Vier spitze Schwanzstacheln', body: 'Die vier Schwanzstacheln werden zusammen als Thagomizer bezeichnet. Sie könnten Stegosaurus bei der Verteidigung gegen Angreifer geholfen haben.' }
    } satisfies AnatomyText
  }
} as const;
