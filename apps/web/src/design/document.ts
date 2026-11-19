export type Block = {
  id: string;
  role: string;
  name: string;
  technology: string;
  runtimeLocation?: string;
  note: string;
  x: number;
  y: number;
};

export type Relation = { id: string; from: string; to: string; label: string };
export type Design = { schemaVersion: 1; blocks: Block[]; relations: Relation[] };

export function emptyDesign(): Design {
  return { schemaVersion: 1, blocks: [], relations: [] };
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('설계 항목은 객체여야 합니다.');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`${field}: 문자열이 필요합니다.`);
  return value;
}

function coordinate(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new Error('표시할 수 없는 블록 좌표입니다.');
  }
  return value;
}

function uniqueId(value: unknown, ids: Set<string>): string {
  const id = text(value, 'id');
  if (!id.trim() || ids.has(id)) throw new Error('비어 있거나 중복된 ID입니다.');
  ids.add(id);
  return id;
}

// Project onto the versioned schema in a fixed key order. Array order is part of the design.
function decode(value: unknown): Design {
  const doc = record(value);
  if (doc.schemaVersion !== 1) throw new Error('지원하지 않는 설계 버전입니다.');
  if (!Array.isArray(doc.blocks) || !Array.isArray(doc.relations)) throw new Error('블록과 관계 목록이 필요합니다.');
  const ids = new Set<string>();
  const blocks = doc.blocks.map((item: unknown) => {
    const b = record(item);
    return {
      id: uniqueId(b.id, ids), role: text(b.role, 'role'), name: text(b.name, 'name'),
      technology: text(b.technology, 'technology'), note: text(b.note, 'note'),
      ...(b.runtimeLocation === undefined ? {} : { runtimeLocation: text(b.runtimeLocation, 'runtimeLocation') }),
      x: coordinate(b.x), y: coordinate(b.y),
    };
  });
  const blockIds = new Set(ids);
  const relations = doc.relations.map((item: unknown) => {
    const r = record(item);
    const id = uniqueId(r.id, ids);
    const from = text(r.from, 'from');
    const to = text(r.to, 'to');
    if (!blockIds.has(from) || !blockIds.has(to)) throw new Error('존재하지 않는 블록에 연결된 관계입니다.');
    return { id, from, to, label: text(r.label, 'label') };
  });
  return { schemaVersion: 1, blocks, relations };
}

export function parseDesign(text: string): Design {
  return decode(JSON.parse(text));
}

export function serializeDesign(doc: Design): string {
  return JSON.stringify(decode(doc), null, 2);
}

export function removeBlock(doc: Design, id: string): Design {
  if (!doc.blocks.some(block => block.id === id)) return doc;
  return {
    schemaVersion: 1,
    blocks: doc.blocks.filter(block => block.id !== id),
    relations: doc.relations.filter(relation => relation.from !== id && relation.to !== id),
  };
}
