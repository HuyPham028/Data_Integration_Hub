'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  NodeProps,
  Handle,
  Position,
  Background,
  Controls,
} from '@xyflow/react';

import { SourceConfigAPI } from '@/lib/api-client';

type SourceConfig = {
  _id: string;
  sourceId: string;
  displayName: string;
  baseUrl: string;
  isActive: boolean;
  authType: string;
  description?: string;
  token?: string;
};

function maskToken(token?: string) {
  if (!token) return '';
  if (token.length <= 8) return '********';
  return `${token.slice(0, 4)}********${token.slice(-4)}`;
}

// ── Custom node: API Source ─────────────────────────────────────────────────
function SourceNode({ data }: NodeProps) {
  const src = (data as any).source as SourceConfig;
  return (
    <div
      className={`px-3.5 py-3 rounded-xl border-2 shadow-md min-w-[170px] select-none
        ${src.isActive
          ? 'bg-white border-blue-400 hover:border-blue-500 hover:shadow-blue-100 hover:shadow-lg'
          : 'bg-slate-50 border-slate-300'
        }`}
    >
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: src.isActive ? '#60a5fa' : '#94a3b8', width: 8, height: 8, border: 'none' }}
      />
      <div className="flex items-center gap-2 mb-0.5">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${src.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
        <span className="text-xs font-bold text-slate-700 truncate">{src.displayName}</span>
      </div>
      <div className="text-[10px] text-slate-400 pl-4 truncate">
        {src.authType !== 'none' ? `🔑 ${src.authType}` : '🔓 no auth'}
      </div>
    </div>
  );
}

// ── Custom node: Central Hub (handles spread per source) ────────────────────
function HubNode({ data }: NodeProps) {
  const count = (data as any).sourceCount as number;
  return (
    <div
      style={{ minHeight: Math.max(80, count * 44) }}
      className="px-5 py-4 rounded-2xl border-2 border-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 shadow-xl min-w-[180px] flex flex-col items-center justify-center relative"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Handle
          key={i}
          type="target"
          position={Position.Left}
          id={`t-${i}`}
          style={{
            top: `${((i + 0.5) / count) * 100}%`,
            background: '#93c5fd',
            width: 8,
            height: 8,
            border: 'none',
          }}
        />
      ))}
      <div className="text-2xl mb-1 select-none">🏢</div>
      <div className="text-white font-bold text-sm text-center leading-tight">Central Data Hub</div>
      <div className="text-blue-200 text-[10px] mt-0.5">ETL Integration Hub</div>
    </div>
  );
}

const nodeTypes = { sourceNode: SourceNode, hubNode: HubNode };

export default function SourceCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceConfig | null>(null);
  const [editData, setEditData] = useState<Partial<SourceConfig>>({});

  useEffect(() => { fetchSources(); }, []);

  const fetchSources = async () => {
    const data: SourceConfig[] = await SourceConfigAPI.getAll();
    const count = data.length;
    const ROW_GAP = 120;
    const totalH = (count - 1) * ROW_GAP;
    const hubH = Math.max(80, count * 44);

    const generatedNodes: Node[] = [
      {
        id: 'hub',
        type: 'hubNode',
        position: { x: 640, y: totalH / 2 - hubH / 2 },
        data: { label: 'Central Data Hub', sourceCount: count },
      },
    ];

    const generatedEdges: Edge[] = [];

    data.forEach((source, index) => {
      generatedNodes.push({
        id: source._id,
        type: 'sourceNode',
        position: { x: 60, y: index * ROW_GAP },
        data: { label: source.displayName, source },
      });

      generatedEdges.push({
        id: `${source._id}-hub`,
        source: source._id,
        target: 'hub',
        targetHandle: `t-${index}`,
        type: 'straight',
        animated: source.isActive,
        style: {
          stroke: source.isActive ? '#3b82f6' : '#cbd5e1',
          strokeWidth: source.isActive ? 2 : 1.5,
          strokeDasharray: source.isActive ? undefined : '6 4',
          opacity: source.isActive ? 1 : 0.55,
        },
      });
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((n) => applyNodeChanges(changes, n)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((e) => applyEdgeChanges(changes, e)),
    []
  );

  const onNodeClick = async (_: any, node: Node) => {
    if (node.id === 'hub') return;
    const src = (node.data as any).source as SourceConfig;
    const full = await SourceConfigAPI.getById(src.sourceId);
    setSelectedSource(full);
    setEditData({
      displayName: full.displayName,
      baseUrl: full.baseUrl,
      authType: full.authType,
      isActive: full.isActive,
      token: '',
    });
  };

  const saveChanges = async () => {
    if (!selectedSource) return;
    const payload: any = {
      displayName: editData.displayName,
      baseUrl: editData.baseUrl,
      authType: editData.authType,
      isActive: editData.isActive,
    };
    if (editData.token) payload.token = editData.token;
    await SourceConfigAPI.update(selectedSource.sourceId, payload);
    await fetchSources();
    setSelectedSource(null);
  };

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        className="bg-slate-50"
      >
        <Background color="#e2e8f0" gap={24} />
        <Controls />
      </ReactFlow>

      {/* ── Edit modal ──────────────────────────────────────────────────────── */}
      {selectedSource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
          <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-semibold text-slate-800">Edit Source Config</h2>
              <button
                onClick={() => setSelectedSource(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {(['displayName', 'baseUrl'] as const).map((key) => (
                <div key={key}>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    {key === 'displayName' ? 'Display Name' : 'Base URL'}
                  </label>
                  <input
                    type="text"
                    value={editData[key] || ''}
                    onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Auth Type</label>
                <select
                  value={editData.authType || ''}
                  onChange={(e) => setEditData({ ...editData, authType: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="none">none</option>
                  <option value="bearer">bearer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Current Token</label>
                <div className="bg-slate-100 rounded-lg px-3 py-2 text-sm font-mono text-slate-500">
                  {maskToken(selectedSource.token)}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">New Token</label>
                <input
                  type="password"
                  placeholder="Leave empty to keep old token"
                  value={editData.token || ''}
                  onChange={(e) => setEditData({ ...editData, token: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editData.isActive || false}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                Active
              </label>

              <button
                onClick={saveChanges}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
