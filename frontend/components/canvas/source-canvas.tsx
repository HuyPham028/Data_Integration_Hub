'use client';

import { useEffect, useState, useCallback } from 'react';

import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
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
}

function maskToken(token?: string) {
  if (!token) return '';

  if (token.length <= 8) {
    return '********';
  }

  return `${token.slice(0, 4)}********${token.slice(-4)}`;
}

export default function SourceCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const [selectedSource, setSelectedSource] =
    useState<SourceConfig | null>(null);

  const [editData, setEditData] =
    useState<Partial<SourceConfig>>({});

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const data: SourceConfig[] =
      await SourceConfigAPI.getAll();

    const generatedNodes: Node[] = [
      {
        id: 'hub',
        position: { x: 600, y: 200 },
        data: {
          label: '🏢 Central Data Hub',
        },
      },
    ];

    const generatedEdges: Edge[] = [];

    data.forEach((source, index) => {
      generatedNodes.push({
        id: source._id,
        position: {
          x: 100,
          y: 100 + index * 150,
        },
        data: {
          label: source.displayName,
          source,
        },
      });

      generatedEdges.push({
        id: `${source._id}-hub`,
        source: source._id,
        target: 'hub',
        animated: source.isActive,

        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      });
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) =>
        applyNodeChanges(changes, nodesSnapshot)
      ),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) =>
        applyEdgeChanges(changes, edgesSnapshot)
      ),
    []
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) =>
        addEdge(params, edgesSnapshot)
      ),
    []
  );

  const onNodeClick = async (_: any, node: Node) => {
    if (node.id === 'hub') return;

    const clickedSourceId = (node.data as { source: SourceConfig }).source?.sourceId;
    const source = await SourceConfigAPI.getById(clickedSourceId);

    setSelectedSource(source);

    setEditData({
      displayName: source.displayName,
      baseUrl: source.baseUrl,
      authType: source.authType,
      isActive: source.isActive,
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

    // chỉ update token nếu user nhập mới
    if (editData.token) {
      payload.token = editData.token;
    }

    await SourceConfigAPI.update(
      selectedSource.sourceId,
      payload
    );

    await fetchSources();

    setSelectedSource(null);
  };

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      />

      {/* MODAL */}
      {selectedSource && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: 500,
              background: 'white',
              borderRadius: 12,
              padding: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2>Edit Source Config</h2>

              <button
                onClick={() =>
                  setSelectedSource(null)
                }
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div>
                <label>Display Name</label>

                <input
                  value={editData.displayName || ''}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      displayName: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: 8,
                    marginTop: 4,
                  }}
                />
              </div>

              <div>
                <label>Base URL</label>

                <input
                  value={editData.baseUrl || ''}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      baseUrl: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: 8,
                    marginTop: 4,
                  }}
                />
              </div>

              <div>
                <label>Auth Type</label>

                <select
                  value={editData.authType || ''}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      authType: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: 8,
                    marginTop: 4,
                  }}
                >
                  <option value="none">
                    none
                  </option>

                  <option value="bearer">
                    bearer
                  </option>
                </select>
              </div>

              <div>
                <label>
                  Current Token
                </label>

                <div
                  style={{
                    marginTop: 4,
                    padding: 8,
                    background: '#f5f5f5',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                  }}
                >
                  {maskToken(selectedSource.token)}
                </div>
              </div>

              <div>
                <label>New Token</label>

                <input
                  type="password"
                  placeholder="Leave empty to keep old token"
                  value={editData.token || ''}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      token: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: 8,
                    marginTop: 4,
                  }}
                />
              </div>

              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={
                      editData.isActive || false
                    }
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        isActive:
                          e.target.checked,
                      })
                    }
                  />

                  {' '}Active
                </label>
              </div>

              <button
                onClick={saveChanges}
                style={{
                  padding: 12,
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
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