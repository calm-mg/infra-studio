import { roleGroups, roleStyle } from '../catalog/roles';
import type { Block, Design, Relation } from '../design/document';
import type { Selection } from './Canvas';
import Icon from './Icon';

type Props = {
  doc: Design; selection: Selection; connecting: boolean; onLink: () => void;
  onBlock: (id: string, changes: Partial<Pick<Block, 'name' | 'role' | 'technology' | 'note'>>) => void;
  onRelation: (id: string, changes: Partial<Pick<Relation, 'from' | 'to' | 'label'>>) => void;
  onDelete: () => void;
};

export default function Inspector({ doc, selection, connecting, onLink, onBlock, onRelation, onDelete }: Props) {
  const b = selection?.kind === 'block' ? doc.blocks.find(b => b.id === selection.id) : undefined;
  const r = selection?.kind === 'relation' ? doc.relations.find(r => r.id === selection.id) : undefined;
  return <aside className="inspector side-panel" aria-label="속성 패널">
    <div className="panel-heading"><span className="eyebrow">INSPECTOR</span><h2>{b ? '블록 속성' : r ? '관계 속성' : '속성 패널'}</h2></div>
    {b ? <div className="property-body">
      <div className={`selection-chip ${roleStyle(b.role).tone}`}><Icon name={roleStyle(b.role).icon} size={15} />선택한 블록</div>
      <label className="field">블록 이름<input value={b.name} onChange={e => onBlock(b.id, { name: e.target.value })} placeholder="인스턴스 이름" /></label>
      <label className="field">역할<select value={b.role} onChange={e => onBlock(b.id, { role: e.target.value })}>
        {!roleGroups.some(g => g.roles.some(role => role === b.role)) && <option value={b.role}>{b.role || '미지정'}</option>}
        {roleGroups.map(g => <optgroup key={g.title} label={g.title}>{g.roles.map(role => <option key={role}>{role}</option>)}</optgroup>)}
      </select></label>
      <label className="field">사용 기술<input list="technology-options" value={b.technology} onChange={e => onBlock(b.id, { technology: e.target.value })} placeholder="직접 입력 또는 선택" /></label>
      <datalist id="technology-options">{roleStyle(b.role).technologies.map(t => <option key={t} value={t} />)}</datalist>
      <label className="field">메모<textarea rows={4} value={b.note} onChange={e => onBlock(b.id, { note: e.target.value })} placeholder="실행 위치나 확인할 점을 기록하세요." /></label>
      <div className="property-actions"><button className="button connect-action" onClick={onLink}><Icon name="connect" size={16} />{connecting ? '연결 취소' : '연결 시작'}</button>
        <p>출발 블록에서 연결을 시작하고 도착 블록을 선택하세요.</p></div>
      <button className="delete-button" onClick={onDelete}><Icon name="trash" size={15} />블록 삭제</button>
    </div> : r ? <div className="property-body">
      <div className="selection-chip green"><Icon name="connect" size={15} />선택한 관계</div>
      <label className="field">관계 이름<input value={r.label} onChange={e => onRelation(r.id, { label: e.target.value })} placeholder="예: 요청 전달" /></label>
      <label className="field">출발 블록<select value={r.from} onChange={e => onRelation(r.id, { from: e.target.value })}>{doc.blocks.map(b => <option key={b.id} value={b.id}>{b.name || '이름 없는 블록'}</option>)}</select></label>
      <label className="field">도착 블록<select value={r.to} onChange={e => onRelation(r.id, { to: e.target.value })}>{doc.blocks.map(b => <option key={b.id} value={b.id}>{b.name || '이름 없는 블록'}</option>)}</select></label>
      <div className="property-actions"><button className="button" onClick={() => onRelation(r.id, { from: r.to, to: r.from })}><Icon name="reverse" size={16} />방향 뒤집기</button></div>
      <button className="delete-button" onClick={onDelete}><Icon name="trash" size={15} />관계 삭제</button>
    </div> : <div className="inspector-empty"><span className="empty-pointer"><Icon name="pointer" size={22} /></span><h3>선택된 대상 없음</h3><p>캔버스에서 블록이나 연결선을<br />선택하면 속성을 편집할 수 있어요.</p>
      <div className="quick-guide"><span className="eyebrow">QUICK GUIDE</span><h3>작업 순서</h3><ol><li>역할을 골라 블록 추가</li><li>이름과 사용 기술 입력</li><li>블록을 연결하고 관계 기록</li></ol></div>
    </div>}
  </aside>;
}
