export const ANATOMY_IDS = ['armor', 'head', 'tailClub'] as const;
export type AnatomyId = (typeof ANATOMY_IDS)[number];
export type AnatomyHit = AnatomyId | null | undefined;

export function createAnatomyInput() {
  let selected: AnatomyId | null = null;
  const pointers = new Map<number, { x: number; y: number }>();
  let blocked = false;
  function select(hit: AnatomyHit): boolean {
    if (hit === undefined || hit === selected) return false;
    selected = hit;
    return true;
  }
  function move(id: number, x: number, y: number): void {
    const start = pointers.get(id);
    if (start && (x - start.x) ** 2 + (y - start.y) ** 2 > 36) blocked = true;
  }
  return {
    get selected() { return selected; },
    get active() { return pointers.size > 0; },
    select,
    down(id: number, x: number, y: number): void {
      if (pointers.size === 0) blocked = false;
      pointers.set(id, { x, y });
      if (pointers.size > 1) blocked = true;
    },
    move,
    up(id: number, x: number, y: number, inside: boolean): boolean {
      if (!pointers.has(id)) return false;
      move(id, x, y);
      const activate = !blocked && pointers.size === 1 && inside;
      pointers.delete(id);
      if (pointers.size === 0) blocked = false;
      return activate;
    },
    cancel(id: number): void {
      if (!pointers.has(id)) return;
      pointers.delete(id);
      blocked = pointers.size > 0;
    },
    resetGesture(): void {
      pointers.clear();
      blocked = false;
    }
  };
}
