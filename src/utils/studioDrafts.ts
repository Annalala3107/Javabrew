export interface PeDraft {
  mainCode: string;
  entityCode: string;
  updatedAt: string;
}

function draftKey(peId: number): string {
  return `javabrew:pe_draft:${peId}`;
}

export function readPeDraft(peId: number): PeDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(peId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PeDraft>;
    if (typeof parsed.mainCode === 'string' && typeof parsed.entityCode === 'string') {
      return {
        mainCode: parsed.mainCode,
        entityCode: parsed.entityCode,
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function savePeDraft(peId: number, mainCode: string, entityCode: string): PeDraft {
  const draft: PeDraft = {
    mainCode,
    entityCode,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(draftKey(peId), JSON.stringify(draft));
  } catch {
    // ignore storage quota errors
  }
  return draft;
}

export function clearPeDraft(peId: number): void {
  try {
    localStorage.removeItem(draftKey(peId));
  } catch {
    // ignore storage errors
  }
}

export function exportAllPeDrafts(): Record<string, PeDraft> {
  const out: Record<string, PeDraft> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('javabrew:pe_draft:')) continue;
      const peId = Number(key.slice('javabrew:pe_draft:'.length));
      if (!Number.isInteger(peId) || peId < 1 || peId > 19) continue;
      const draft = readPeDraft(peId);
      if (draft) {
        out[String(peId)] = draft;
      }
    }
  } catch {
    // ignore storage read errors
  }
  return out;
}

export function importAllPeDrafts(drafts: Record<string, unknown>): number {
  let count = 0;
  for (const [rawId, value] of Object.entries(drafts)) {
    const peId = Number(rawId);
    if (!Number.isInteger(peId) || peId < 1 || peId > 19) continue;
    if (!value || typeof value !== 'object') continue;
    const obj = value as Partial<PeDraft>;
    if (typeof obj.mainCode !== 'string' || typeof obj.entityCode !== 'string') continue;
    savePeDraft(peId, obj.mainCode.slice(0, 10_000), obj.entityCode.slice(0, 10_000));
    count += 1;
  }
  return count;
}

export function clearAllPeDrafts(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('javabrew:pe_draft:')) {
        keys.push(key);
      }
    }
    for (const k of keys) {
      localStorage.removeItem(k);
    }
  } catch {
    // ignore storage errors
  }
}
