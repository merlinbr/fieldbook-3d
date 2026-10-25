import type { StudyVersion } from '../viewer/study-data.ts';

export type AnatomyId = string;
export type AnatomyNote = Readonly<{ label: string; heading: string; body: string }>;
export type AnatomyText = Readonly<Record<AnatomyId, AnatomyNote>>;
export type MeshSelector =
  | Readonly<{ kind: 'mesh'; name: string }>
  | Readonly<{ kind: 'subtree'; name: string; excludePrefixes?: readonly string[] }>
  | Readonly<{ kind: 'prefix'; prefix: string }>;
export type AnatomyRegionConfig = Readonly<{
  id: AnatomyId;
  pick: readonly MeshSelector[];
  highlight: readonly MeshSelector[];
  bounds: readonly MeshSelector[];
  anchor: Readonly<{ node: string; point: readonly [number, number, number] }>;
  upperSurface?: Readonly<{ mesh: string; minHeightRatio: number }>;
}>;
export type SpecimenScale = Readonly<{ lengthMetres: number }>;
export type StudyTarget = Readonly<{ regionId: AnatomyId; emphasis: readonly MeshSelector[] }>;
export type StudyCapability = Readonly<{ kind: 'none' }> | Readonly<{
  kind: 'guided'; targets: Readonly<Record<'armor' | 'tailClub', StudyTarget>>;
}>;
export type SpecimenViewerConfig = Readonly<{
  id: string; modelUrl: string; regions: readonly AnatomyRegionConfig[];
  scale: SpecimenScale | null; study: StudyCapability;
}>;
export type SpecimenViewerText = Readonly<{ viewerLabel: string; anatomy: AnatomyText }>;
export type StudyRecording = Readonly<{ version: StudyVersion | null; error: 'missing' | 'data' | null }>;
export type ViewerStudy = Readonly<{ kind: 'none' }> | Readonly<{
  kind: 'guided'; recording: StudyRecording; versions: readonly StudyVersion[];
}>;

function nonempty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateMeshSelectors(selectors: readonly MeshSelector[]): void {
  if (!Array.isArray(selectors) || !selectors.length) throw new TypeError('Region selectors must not be empty');
  for (const selector of selectors) {
    if (!selector || !['mesh', 'subtree', 'prefix'].includes(selector.kind) ||
      !nonempty(selector.kind === 'prefix' ? selector.prefix : selector.name) ||
      (selector.kind === 'subtree' && selector.excludePrefixes !== undefined &&
        (!Array.isArray(selector.excludePrefixes) || !selector.excludePrefixes.every(nonempty)))) {
      throw new TypeError('Region selector requires an explicit mesh, subtree, or prefix');
    }
  }
}

export function validateAnatomyRegions(regions: readonly AnatomyRegionConfig[]): void {
  if (!Array.isArray(regions) || !regions.length) throw new TypeError('Specimen regions must not be empty');
  const ids = new Set<string>();
  for (const region of regions) {
    if (!region || !nonempty(region.id) || ids.has(region.id)) throw new TypeError('Region IDs must be nonempty and unique');
    ids.add(region.id);
    for (const selectors of [region.pick, region.highlight, region.bounds]) validateMeshSelectors(selectors);
    if (!region.anchor || !nonempty(region.anchor.node) || !Array.isArray(region.anchor.point) ||
      region.anchor.point.length !== 3 || !region.anchor.point.every(Number.isFinite)) {
      throw new TypeError('Region anchor requires a node and three finite coordinates');
    }
    const surface = region.upperSurface;
    if (surface && (!nonempty(surface.mesh) || !Number.isFinite(surface.minHeightRatio) ||
      surface.minHeightRatio < 0 || surface.minHeightRatio > 1)) {
      throw new TypeError('Region upper surface requires a local height ratio from 0 to 1');
    }
  }
}

export function validateSpecimenConfig(config: SpecimenViewerConfig): void {
  if (!config || !nonempty(config.id) || !nonempty(config.modelUrl)) throw new TypeError('Specimen requires an ID and model URL');
  validateAnatomyRegions(config.regions);
  if (config.scale !== null && (!config.scale || !Number.isFinite(config.scale.lengthMetres) || config.scale.lengthMetres <= 0)) {
    throw new RangeError('Specimen scale requires a finite positive length');
  }
  if (!config.study || !['none', 'guided'].includes(config.study.kind)) throw new TypeError('Explicit study capability required');
  if (config.study.kind === 'guided') {
    for (const id of ['armor', 'tailClub'] as const) {
      const target = config.study.targets?.[id];
      if (!target || !config.regions.some(region => region.id === target.regionId)) throw new TypeError('Study target requires a configured region');
      validateMeshSelectors(target.emphasis);
    }
  }
}

export function validateViewerInputs(config: SpecimenViewerConfig, text: SpecimenViewerText, study: ViewerStudy): void {
  validateSpecimenConfig(config);
  if (!study || study.kind !== config.study.kind) throw new TypeError('Viewer study input must match specimen capability');
  if (!text || !nonempty(text.viewerLabel) || !text.anatomy ||
    Object.keys(text.anatomy).length !== config.regions.length || config.regions.some(region => {
      const note = text.anatomy[region.id];
      return !note || ![note.label, note.heading, note.body].every(nonempty);
    })) throw new TypeError('Viewer text must describe every configured region exactly once');
}
