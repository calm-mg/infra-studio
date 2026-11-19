import { describe, expect, it } from 'vitest';
import { emptyDesign, parseDesign, removeBlock, serializeDesign, type Block, type Design } from './document';

const block: Block = { id: 'a', role: '사용자 역할', name: ' 진입점 ', technology: '', note: '첫 줄\n둘째 줄', x: -40.25, y: 120.5 };
const doc: Design = {
  schemaVersion: 1,
  blocks: [block, { ...block, id: 'b', technology: '자유 입력' }, { ...block, id: 'c' }],
  relations: [
    { id: 'ab', from: 'a', to: 'b', label: '요청 전달' },
    { id: 'ca', from: 'c', to: 'a', label: '응답' },
    { id: 'aa', from: 'a', to: 'a', label: '' },
    { id: 'bc', from: 'b', to: 'c', label: ' 별도 관계 ' },
  ],
};

describe('design documents', () => {
  it('creates independent empty designs', () => {
    const first = emptyDesign();
    first.blocks.push(block);
    expect(emptyDesign()).toEqual({ schemaVersion: 1, blocks: [], relations: [] });
  });

  it('round-trips every editable field, placement and edge in display order', () => {
    expect(parseDesign(serializeDesign(doc))).toEqual(doc);
  });

  it('serializes independently of input key order', () => {
    const reordered = { relations: doc.relations.map(({ id, label, from, to }) => ({ to, label, from, id })),
      blocks: doc.blocks.map(({ id, role, name, technology, note, x, y }) => ({ y, x, note, technology, name, role, id })),
      schemaVersion: doc.schemaVersion };
    expect(serializeDesign(reordered)).toBe(serializeDesign(doc));
  });

  it.each([
    ['malformed JSON', '{'], ['null root', 'null'], ['array root', '[]'],
    ['unsupported version', JSON.stringify({ ...doc, schemaVersion: 2 })],
    ['wrong version type', JSON.stringify({ ...doc, schemaVersion: '1' })],
    ['missing blocks', JSON.stringify({ ...doc, blocks: undefined })],
    ['non-array relations', JSON.stringify({ ...doc, relations: {} })],
    ['null block', JSON.stringify({ ...doc, blocks: [null] })],
    ...['role', 'name', 'technology', 'note', 'id', 'x', 'y'].map(key => [
      `missing ${key}`, JSON.stringify({ ...emptyDesign(), blocks: [{ ...block, [key]: undefined }] }),
    ]),
    ['non-string note', JSON.stringify({ ...emptyDesign(), blocks: [{ ...block, note: 12 }] })],
    ['non-numeric coordinate', JSON.stringify({ ...emptyDesign(), blocks: [{ ...block, x: '2' }] })],
    ['overflow coordinate', JSON.stringify(doc).replace('-40.25', '1e999')],
    ['excessive coordinate', JSON.stringify(doc).replace('-40.25', '1e200')],
    ['blank id', JSON.stringify({ ...emptyDesign(), blocks: [{ ...block, id: ' ' }] })],
    ['duplicate block', JSON.stringify({ ...doc, blocks: [...doc.blocks, block] })],
    ['duplicate relation', JSON.stringify({ ...doc, relations: [...doc.relations, doc.relations[0]] })],
    ['id shared with block', JSON.stringify({ ...doc, relations: [{ ...doc.relations[0], id: block.id }] })],
    ['dangling source', JSON.stringify({ ...doc, relations: [{ ...doc.relations[0], from: 'missing' }] })],
    ['relation as endpoint', JSON.stringify({ ...doc, relations: [{ ...doc.relations[0], to: 'ab' }] })],
    ['non-string label', JSON.stringify({ ...doc, relations: [{ ...doc.relations[0], label: false }] })],
  ])('rejects %s without replacing the current document', (_name, input) => {
    let current = doc;
    expect(() => { current = parseDesign(input); }).toThrow();
    expect(current).toBe(doc);
  });

  it('removes only the specified block and all its incident relations without mutating the original', () => {
    const before = serializeDesign(doc);
    expect(removeBlock(doc, 'a')).toEqual({ ...doc, blocks: doc.blocks.slice(1), relations: doc.relations.slice(3) });
    expect(serializeDesign(doc)).toBe(before);
    expect(removeBlock(doc, 'unknown')).toBe(doc);
  });
});
