import { useMemo, useState } from 'react';
import {
  Background, Handle, MarkerType, Panel, Position, ReactFlow, useReactFlow,
  type Edge, type Node, type NodeChange, type NodeProps, type ReactFlowInstance, type XYPosition,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { roleGroups, roleStyle } from '../catalog/roles';
import type { Block, Design } from '../design/document';
import Icon from './Icon';

export const NODE_WIDTH = 178;
export const NODE_HEIGHT = 98;
export const roleDragType = 'application/x-infra-studio-role';
export type StudioNode = Node<{ block: Block; pick: (id: string) => void }, 'block'>;
export type FlowInstance = ReactFlowInstance<StudioNode, Edge>;
export type Selection = { kind: 'block' | 'relation'; id: string } | null;
const fitOptions = { padding: 0.13, maxZoom: 1 };

function BlockNode({ data, selected }: NodeProps<StudioNode>) {
  const b = data.block;
  const style = roleStyle(b.role);
  const locationLabel = b.runtimeLocation?.trim() ? `실행 위치: ${b.runtimeLocation}` : undefined;
  return <div className={`diagram-node ${style.tone}${selected ? ' is-selected' : ''}`}>
    <Handle type="target" position={Position.Left} id="in" />
    <Handle type="target" position={Position.Top} id="top" className="route-handle" isConnectable={false} />
    <Handle type="target" position={Position.Bottom} id="in-bottom" className="route-handle" isConnectable={false} />
    <button className="node-face" aria-label={b.name || '이름 없는 블록'} aria-description={locationLabel} title={`${b.name}\n${b.role}${b.technology && ` · ${b.technology}`}${locationLabel ? `\n${locationLabel}` : ''}`} onClick={() => data.pick(b.id)}>
      <span className="node-kind"><Icon name={style.icon} size={15} />{b.role || '기타 역할'}</span>
      <strong>{b.name || '이름 없는 블록'}</strong>
      <small>{b.technology || '기술 미정'}</small>
      {locationLabel && <small className="node-location">{locationLabel}</small>}
    </button>
    <Handle type="source" position={Position.Right} id="out" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="route-handle" isConnectable={false} />
    <Handle type="source" position={Position.Top} id="out-top" className="route-handle" isConnectable={false} />
  </div>;
}
const nodeTypes = { block: BlockNode };

function ViewControls() {
  const flow = useReactFlow();
  return <Panel position="bottom-left" className="view-controls">
    <button title="축소" aria-label="축소" onClick={() => void flow.zoomOut()}><Icon name="minus" size={16} /></button>
    <button title="확대" aria-label="확대" onClick={() => void flow.zoomIn()}><Icon name="plus" size={16} /></button>
    <button title="전체 보기" aria-label="전체 보기" onClick={() => void flow.fitView(fitOptions)}><Icon name="fit" size={16} /></button>
  </Panel>;
}

function EmptyDiagram({ example }: { example: () => void }) {
  return <div className="empty-diagram"><div className="empty-card">
    <svg viewBox="0 0 166 65" width="166" height="65" fill="none" aria-hidden="true">
      <path d="M30 34h27q4 0 4-4v-9q0-4 4-4h29 M91 17h15q5 0 5 5v20q0 5 5 5h22" stroke="#8ca39a" strokeWidth="1.6" strokeDasharray="4 3" />
      <rect x="7" y="20" width="29" height="27" rx="5" fill="#f3f7ff" stroke="#9eafc9"/><path d="M14 27h15v10H14z M18 40h7" stroke="#577397" strokeWidth="1.6" />
      <rect x="68" y="3" width="32" height="29" rx="5" fill="#dceee4" stroke="#80a98d"/><path d="M75 10h18v5H75z M75 19h18v5H75z" stroke="#347054" strokeWidth="1.6" />
      <rect x="128" y="31" width="30" height="29" rx="5" fill="#f1edf8" stroke="#b6a6ca"/><ellipse cx="143" cy="39" rx="7" ry="3" stroke="#7a658e" strokeWidth="1.6"/><path d="M136 39v11c0 4 14 4 14 0V39" stroke="#7a658e" strokeWidth="1.6" />
    </svg>
    <span className="eyebrow">START HERE</span><h2>첫 블록을 놓아보세요</h2>
    <p>왼쪽에서 역할을 골라 추가한 뒤,<br />요청과 데이터가 오가는 경로를 연결하세요.</p>
    <button className="example-link" onClick={example}>익명 예제로 살펴보기 <span aria-hidden="true">→</span></button>
  </div></div>;
}

type Props = {
  doc: Design; selection: Selection; source: string | null;
  onReady: (flow: FlowInstance) => void; onPick: (id: string) => void; onEdge: (id: string) => void;
  onClear: () => void; onConnect: (from: string, to: string) => void;
  onMove: (changes: Map<string, XYPosition>) => void; onDropRole: (role: string, position: XYPosition) => void;
  onExample: () => void; onCancelLink: () => void;
};

export default function Canvas({ doc, selection, source, onReady, onPick, onEdge, onClear, onConnect, onMove, onDropRole, onExample, onCancelLink }: Props) {
  const [flow, setFlow] = useState<FlowInstance | null>(null);
  const nodes = useMemo<StudioNode[]>(() => doc.blocks.map(b => ({
    id: b.id, type: 'block', position: { x: b.x, y: b.y }, width: NODE_WIDTH, height: NODE_HEIGHT,
    data: { block: b, pick: onPick }, selected: selection?.kind === 'block' && selection.id === b.id,
  })), [doc.blocks, selection, onPick]);
  const edges = useMemo<Edge[]>(() => {
    const blocks = new Map(doc.blocks.map(b => [b.id, b]));
    return doc.relations.map(r => {
      const a = blocks.get(r.from)!;
      const b = blocks.get(r.to)!;
      // Approach a separate row from above/below, not along its horizontal connections.
      const rowGap = NODE_HEIGHT + 20; // clearance for the smoothstep bend
      const below = b.y > a.y + rowGap;
      const above = b.y < a.y - rowGap;
      const targetHandle = below ? 'top' : above ? 'in-bottom' : 'in';
      const exitsRight = b.x >= a.x + NODE_WIDTH;
      const sourceHandle = exitsRight ? 'out' : below ? 'bottom' : above ? 'out-top' : 'out';
      const selected = selection?.kind === 'relation' && selection.id === r.id;
      const color = selected ? '#176949' : '#6c8178';
      return {
        id: r.id, source: r.from, target: r.to, type: 'smoothstep', sourceHandle, targetHandle,
        label: r.label || '관계', selected, ariaLabel: `${a.name} → ${b.name}: ${r.label || '관계'}`,
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 }, style: { stroke: color, strokeWidth: selected ? 2.3 : 1.6 },
        labelStyle: { fill: selected ? '#176949' : '#465c51', fontWeight: 600, fontSize: 11 },
        labelBgStyle: { fill: '#f8faf6' }, labelBgPadding: [5, 3],
      };
    });
  }, [doc.blocks, doc.relations, selection]);
  function move(changes: NodeChange<StudioNode>[]) {
    const positions = new Map<string, XYPosition>();
    for (const change of changes) if (change.type === 'position' && change.position) positions.set(change.id, change.position);
    if (positions.size) onMove(positions);
  }
  return <div className={`canvas-area${source ? ' is-connecting' : ''}`} onDragOver={e => {
    if (e.dataTransfer.types.includes(roleDragType)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
  }} onDrop={e => {
    e.preventDefault();
    const role = e.dataTransfer.getData(roleDragType);
    if (!flow || !roleGroups.some(g => g.roles.some(r => r === role))) return;
    onDropRole(role, flow.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  }}>
    <ReactFlow<StudioNode, Edge> nodes={nodes} edges={edges} nodeTypes={nodeTypes}
      onInit={instance => { setFlow(instance); onReady(instance); }} onNodesChange={move}
      onConnect={({ source: from, target: to }) => onConnect(from, to)} onPaneClick={onClear}
      onEdgeClick={(_, edge) => onEdge(edge.id)} onEdgesChange={changes => {
        for (const change of changes) if (change.type === 'select' && change.selected) onEdge(change.id);
      }}
      nodesFocusable={false} multiSelectionKeyCode={null} selectionKeyCode={null} deleteKeyCode={null}
      minZoom={0.1} maxZoom={2.5} fitView={doc.blocks.length > 0} fitViewOptions={fitOptions} defaultViewport={{ x: 0, y: 0, zoom: 1 }}>
      <Background color="#c5cec3" gap={19} size={1.05} /><ViewControls />
    </ReactFlow>
    {!doc.blocks.length && <EmptyDiagram example={onExample} />}
    {source && <div className="connect-banner" role="status"><Icon name="connect" size={16} />도착 블록을 선택하세요<button onClick={onCancelLink}>취소</button></div>}
  </div>;
}
