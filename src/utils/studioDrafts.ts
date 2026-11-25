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
