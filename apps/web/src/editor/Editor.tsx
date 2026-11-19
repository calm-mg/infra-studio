import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { XYPosition } from '@xyflow/react';
import { exampleDesign } from '../catalog/example';
import { roleGroups, roleStyle } from '../catalog/roles';
import { emptyDesign, parseDesign, removeBlock, serializeDesign, type Block, type Design } from '../design/document';
import Canvas, { NODE_HEIGHT, NODE_WIDTH, roleDragType, type FlowInstance, type Selection } from './Canvas';
import Inspector from './Inspector';
import Icon from './Icon';
import './editor.css';

const storageKey = 'infra-studio.last-design';
function openLastDesign() {
  try {
    const saved = localStorage.getItem(storageKey);
    return { doc: saved === null ? emptyDesign() : parseDesign(saved), error: '' };
  } catch {
    return { doc: emptyDesign(), error: '마지막 설계를 불러오지 못했습니다. 보관한 설계 파일이 있으면 열어주세요.' };
  }
}
function newId() {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), n => n.toString(16).padStart(8, '0')).join('');
}

function nextPosition(blocks: Block[], flow: FlowInstance | null, area: DOMRect | undefined): XYPosition {
  const start = flow && area ? flow.screenToFlowPosition({ x: area.left + 28, y: area.top + 38 }) : { x: 28, y: 38 };
  const end = flow && area ? flow.screenToFlowPosition({ x: area.right - 20, y: area.bottom - 60 }) : { x: 560, y: 400 };
  for (let y = start.y; y <= Math.max(start.y, end.y - NODE_HEIGHT); y += NODE_HEIGHT + 72) {
    for (let x = start.x; x <= Math.max(start.x, end.x - NODE_WIDTH); x += NODE_WIDTH + 86) {
      if (!blocks.some(b => Math.abs(x - b.x) < NODE_WIDTH + 20 && Math.abs(y - b.y) < NODE_HEIGHT + 20)) return { x, y };
    }
  }
  const position = { x: start.x, y: blocks.reduce((bottom, b) => Math.max(bottom, b.y + NODE_HEIGHT), start.y) + 72 };
  if (flow) void flow.setCenter(position.x + NODE_WIDTH / 2, position.y + NODE_HEIGHT / 2, { zoom: flow.getZoom() });
  return position;
}

export default function Editor() {
  const [initial] = useState(openLastDesign);
  const [doc, setDoc] = useState(initial.doc);
  const [selection, select] = useState<Selection>(null);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState(initial.error);
  const [saveFailed, setSaveFailed] = useState(false);
  const [canvasKey, resetCanvas] = useState(0);
  const flow = useRef<FlowInstance | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const latest = useRef(doc);
  const importSequence = useRef(0);
  useLayoutEffect(() => { latest.current = doc; }, [doc]);
  useEffect(() => {
    if (doc === initial.doc) return;
    try { localStorage.setItem(storageKey, serializeDesign(doc)); setSaveFailed(false); }
    catch { setSaveFailed(true); }
  }, [doc, initial]);
  useEffect(() => {
    if (!source) return;
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') setSource(null); }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [source]);

  function clear() { select(null); setSource(null); }
  function replace(next: Design, description: string) {
    ++importSequence.current;
    if (latest.current.blocks.length && !window.confirm(`${description}(으)로 현재 설계를 바꿀까요? 현재 작업을 보관하려면 취소한 뒤 파일로 내보내세요.`)) return;
    flow.current = null;
    setDoc(next); clear(); setError(''); resetCanvas(k => k + 1);
  }
  function addBlock(role: string, position?: XYPosition) {
    const id = newId();
    const names = new Set(doc.blocks.map(b => b.name));
    let name = role;
    for (let i = 2; names.has(name); i++) name = `${role} ${i}`;
    const block = { id, role, name, technology: '', note: '', ...(position ?? nextPosition(doc.blocks, flow.current, area.current?.getBoundingClientRect())) };
    setDoc(d => ({ ...d, blocks: [...d.blocks, block] }));
    setSource(null); select({ kind: 'block', id });
  }
  const connect = useCallback((from: string, to: string) => {
    const relation = { id: newId(), from, to, label: '' };
    setDoc(d => ({ ...d, relations: [...d.relations, relation] }));
    setSource(null); select({ kind: 'relation', id: relation.id });
  }, []);
  const pick = useCallback((id: string) => {
    if (source !== null) connect(source, id);
    else select({ kind: 'block', id });
  }, [source, connect]);
  function deleteSelection() {
    if (!selection) return;
    setDoc(d => selection.kind === 'block' ? removeBlock(d, selection.id) : { ...d, relations: d.relations.filter(r => r.id !== selection.id) });
    clear();
  }
  async function openFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    const ticket = ++importSequence.current;
    try {
      const next = parseDesign(await file.text());
      if (ticket === importSequence.current) replace(next, '선택한 파일');
    } catch (cause) {
      if (ticket !== importSequence.current) return;
      const reason = cause instanceof Error && !(cause instanceof SyntaxError) ? cause.message : '올바른 설계 JSON 파일인지 확인하세요.';
      setError(`파일을 열 수 없습니다. ${reason} 현재 설계는 그대로입니다.`);
    }
  }
  function exportFile() {
    const url = URL.createObjectURL(new Blob([serializeDesign(doc)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'infra-design.json';
    a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const example = () => replace(exampleDesign(), '익명 예제');
  return <div className="studio-shell">
    <header className="app-header">
      <div className="identity"><span className="brand-icon"><Icon name="brand" size={26} /></span><div><div className="brand-name">인프라 스튜디오</div><span className="brand-sub">INFRA STUDIO</span></div></div>
      <nav className="header-actions" aria-label="설계 파일 작업">
        <button className="button quiet" onClick={() => replace(emptyDesign(), '빈 캔버스')}><Icon name="blank" size={16} />빈 캔버스</button>
        <button className="button quiet" onClick={example}><Icon name="example" size={16} />익명 예제</button>
        <span className="action-divider" />
        <label className="button file-button"><Icon name="open" size={16} />파일 열기<input type="file" accept=".json,application/json" aria-label="설계 파일 열기" onChange={openFile} /></label>
        <button className="button primary" onClick={exportFile}><Icon name="download" size={16} />파일 내보내기</button>
      </nav>
    </header>
    {error && <div className="error-bar" role="alert"><span>{error}</span><button aria-label="안내 닫기" onClick={() => setError('')}>닫기</button></div>}
    <div className="workbench">
      <aside className="palette side-panel" aria-label="블록 라이브러리">
        <div className="panel-heading"><span className="eyebrow">LIBRARY</span><h2>블록 라이브러리</h2><p>클릭하거나 캔버스로 끌어 놓으세요.</p></div>
        <div className="palette-scroll">{roleGroups.map(group => <section className="role-group" key={group.title}><h3>{group.title}</h3>
          {group.roles.map(role => { const style = roleStyle(role); return <button key={role} className="palette-role" aria-label={`${role} 추가`} onClick={() => addBlock(role)} draggable onDragStart={e => { e.dataTransfer.setData(roleDragType, role); e.dataTransfer.effectAllowed = 'copy'; }}>
            <span className={`role-icon ${style.tone}`}><Icon name={style.icon} size={16} /></span><span>{role}</span><span className="role-plus"><Icon name="plus" size={12} /></span>
          </button>; })}</section>)}</div>
      </aside>
      <main className="drafting-area"><div className="canvas-heading"><div><span className="eyebrow">WORKSPACE / 01</span><h1>설계 캔버스</h1></div><div className="counts"><span>블록 <b>{doc.blocks.length}</b></span><i /> <span>관계 <b>{doc.relations.length}</b></span></div></div>
        <div ref={area} className="canvas-holder"><Canvas key={canvasKey} doc={doc} selection={selection} source={source}
          onReady={instance => { flow.current = instance; }} onPick={pick} onEdge={id => { setSource(null); select({ kind: 'relation', id }); }}
          onClear={clear} onConnect={connect} onMove={positions => setDoc(d => ({ ...d, blocks: d.blocks.map(b => { const p = positions.get(b.id); return p ? { ...b, ...p } : b; }) }))}
          onDropRole={addBlock} onExample={example} onCancelLink={() => setSource(null)} /></div>
      </main>
      <Inspector doc={doc} selection={selection} connecting={source !== null} onLink={() => setSource(source || selection?.kind !== 'block' ? null : selection.id)}
        onBlock={(id, changes) => setDoc(d => ({ ...d, blocks: d.blocks.map(b => b.id === id ? { ...b, ...changes } : b) }))}
        onRelation={(id, changes) => setDoc(d => ({ ...d, relations: d.relations.map(r => r.id === id ? { ...r, ...changes } : r) }))} onDelete={deleteSelection} />
    </div>
    <footer className="status-bar"><span className={saveFailed ? 'save-warning' : ''} role="status"><i />{saveFailed ? '로컬 저장 실패 · 파일로 보관하세요' : '이 브라우저에 자동 저장'}</span><span>공유할 때는 설계 파일을 내보내세요.</span></footer>
  </div>;
}
