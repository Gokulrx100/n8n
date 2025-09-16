import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  Background,
  Controls,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, X } from "lucide-react";

import TopNav from "../components/TopNav";
import ManualTriggerNode from "../nodes/Triggers/ManualTriggerNode";
import WebhookTriggerNode from "../nodes/Triggers/WebhookTriggerNode";
import TelegramActionNode from "../nodes/Actions/TelegramActionNode";
import EmailActionNode from "../nodes/Actions/EmailActionNode";

const BASE = import.meta.env.VITE_BASE_API!;
const nodeTypes = {
  manualTrigger: ManualTriggerNode,
  webhookTrigger: WebhookTriggerNode,
  telegramAction: TelegramActionNode,
  emailAction: EmailActionNode,
};

const NODE_CONFIGS = {
  manualTrigger: { label: "Manual", payload: "" },
  webhookTrigger: {
    label: "Webhook",
    method: "POST",
    path: `wh_${Date.now().toString(36)}`,
    header: "",
    secret: "",
  },
  telegramAction: {
    label: "Telegram",
    credentialId: "",
    chatId: "",
    message: "",
  },
  emailAction: {
    label: "Email",
    credentialId: "",
    to: "",
    subject: "",
    body: "",
  },
};

const INPUT_CLASS =
  "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const BUTTON_CLASS =
  "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors";
const CANCEL_BUTTON_CLASS =
  "px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg transition-colors";

function WorkflowEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { fitView, zoomOut } = useReactFlow();

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const flowInstance = useRef<any>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalData, setModalData] = useState<Record<string, any>>({});
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalTitle, setSaveModalTitle] = useState("");

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const res = await axios.get(`${BASE}/credentials`, {
          headers: { token: localStorage.getItem("token") ?? "" },
        });
        setCredentials(res.data?.credentials ?? res.data ?? []);
      } catch {
        setCredentials([]);
      }
    };
    fetchCredentials();
  }, []);

  useEffect(() => {
    if (!id) return;
    const loadWorkflow = async () => {
      try {
        const res = await axios.get(`${BASE}/workflow/${id}`, {
          headers: { token: localStorage.getItem("token") ?? "" },
        });
        const wf = res.data.workflow;
        setTitle(wf.title ?? "");
        setNodes(wf.nodes ?? []);
        setEdges(wf.connections ?? []);
      } catch (err) {
        console.error("load workflow error", err);
      }
    };
    loadWorkflow();
  }, [id, setNodes, setEdges]);

  const getNextNodePosition = useCallback(() => {
    if (nodes.length === 0) return { x: 200, y: 250 };
    const rightmostNode = nodes.reduce((prev, current) =>
      current.position.x > prev.position.x ? current : prev
    );
    return { x: rightmostNode.position.x + 100, y: rightmostNode.position.y };
  }, [nodes]);

  const createNodeWithData = useCallback(
    (type: string, data: Record<string, any>) => {
      const position = getNextNodePosition();
      const nid = `${type}-${Date.now()}`;
      const node: Node = { id: nid, type, position, data };
      setNodes((nds) => nds.concat(node));

      setTimeout(() => {
        zoomOut({ duration: 300 });
        setTimeout(() => fitView({ duration: 500, padding: 0.1 }), 100);
      }, 50);
    },
    [getNextNodePosition, setNodes, zoomOut, fitView]
  );

  const handleSave = useCallback(() => {
    if (nodes.length === 0) {
      alert("Cannot save an empty workflow. Please add at least one node.");
      return;
    }
    setSaveModalTitle(title || "");
    setSaveModalOpen(true);
  }, [title, nodes.length]);

  const performSave = useCallback(
    async (workflowTitle: string) => {
      if (!workflowTitle.trim()) {
        alert("Please enter a workflow title.");
        return;
      }
      setSaving(true);
      const payload = { title: workflowTitle, nodes, connections: edges };
      try {
        if (id) {
          await axios.put(`${BASE}/workflow/${id}`, payload, {
            headers: { token: localStorage.getItem("token") ?? "" },
          });
        } else {
          const res = await axios.post(`${BASE}/workflow`, payload, {
            headers: { token: localStorage.getItem("token") ?? "" },
          });
          const newId = res.data.workflow?._id;
          if (newId) navigate(`/create/workflow/${newId}`, { replace: true });
        }
        setTitle(workflowTitle);
        setSaveModalOpen(false);
      } catch (err) {
        console.error("save failed", err);
        alert("Failed to save workflow");
      } finally {
        setSaving(false);
      }
    },
    [id, nodes, edges, navigate]
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  const onInit = useCallback(
    (instance: any) => (flowInstance.current = instance),
    []
  );
  const onNodeClick = useCallback(
    (_e: any, node: Node) => setSelectedNode(node),
    []
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedNode) deleteSelectedNode();
      if (e.key === "Escape") setSelectedNode(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedNode, deleteSelectedNode]);

  // Modal handlers
  const openNodeModal = useCallback((type: string) => {
    setModalType(type);
    setModalData(NODE_CONFIGS[type as keyof typeof NODE_CONFIGS] || {});
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalType(null);
    setModalData({});
  }, []);

  const handleModalSubmit = useCallback(() => {
    if (!modalType) return;
    const data = { ...modalData };

    if (data.credentialId) {
      const cred = credentials.find(
        (c) => String(c._id ?? c.id) === String(data.credentialId)
      );
      if (cred) data.credentialTitle = cred.title ?? cred.name;
    }

    if (modalType === "webhookTrigger" && !data.path) {
      data.path = `wh_${Date.now().toString(36)}`;
    }

    createNodeWithData(modalType, data);
    closeModal();
  }, [modalType, modalData, credentials, createNodeWithData, closeModal]);

  // Node update helper
  const updateNodeData = useCallback(
    (nodeId: string, updates: any) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
        )
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode({
          ...selectedNode,
          data: { ...selectedNode.data, ...updates },
        });
      }
    },
    [setNodes, selectedNode]
  );

  const telegramCreds = useMemo(
    () =>
      credentials.filter((c) =>
        (c.platform ?? "").toLowerCase().includes("telegram")
      ),
    [credentials]
  );

  const emailCreds = useMemo(
    () =>
      credentials.filter((c) =>
        ["resend", "email", "smtp"].some((p) =>
          String(c.platform ?? "")
            .toLowerCase()
            .includes(p)
        )
      ),
    [credentials]
  );

  const renderModalContent = () => {
    if (!modalType) return null;

    const commonFields = (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Label
        </label>
        <input
          className={INPUT_CLASS}
          value={modalData.label ?? ""}
          onChange={(e) =>
            setModalData((d) => ({ ...d, label: e.target.value }))
          }
        />
      </div>
    );

    switch (modalType) {
      case "manualTrigger":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payload (JSON or text)
              </label>
              <textarea
                className={INPUT_CLASS}
                rows={4}
                value={modalData.payload ?? ""}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, payload: e.target.value }))
                }
              />
            </div>
          </>
        );

      case "webhookTrigger":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                HTTP Method
              </label>
              <select
                className={INPUT_CLASS}
                value={modalData.method ?? "POST"}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, method: e.target.value }))
                }
              >
                <option>POST</option>
                <option>GET</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Path (unique fragment)
              </label>
              <input
                className={INPUT_CLASS}
                value={modalData.path ?? ""}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, path: e.target.value }))
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                If empty, a unique path will be generated.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secret (optional)
              </label>
              <input
                className={INPUT_CLASS}
                value={modalData.secret ?? ""}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, secret: e.target.value }))
                }
              />
            </div>
          </>
        );

      case "telegramAction":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Credential
              </label>
              <select
                className={INPUT_CLASS}
                value={modalData.credentialId ?? ""}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, credentialId: e.target.value }))
                }
              >
                <option value="">-- Select bot credential --</option>
                {telegramCreds.map((c) => (
                  <option key={c._id ?? c.id} value={c._id ?? c.id}>
                    {c.title ?? c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Chat ID (optional)
              </label>
              <input
                className={INPUT_CLASS}
                value={modalData.chatId ?? ""}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, chatId: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                className={INPUT_CLASS}
                rows={3}
                value={modalData.message ?? ""}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, message: e.target.value }))
                }
              />
            </div>
          </>
        );

      case "emailAction":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Credential
              </label>
              <select
                className={INPUT_CLASS}
                value={modalData.credentialId ?? ""}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, credentialId: e.target.value }))
                }
              >
                <option value="">-- Select email credential --</option>
                {emailCreds.map((c) => (
                  <option key={c._id ?? c.id} value={c._id ?? c.id}>
                    {c.title ?? c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                To (optional, taken from trigger if empty)
              </label>
              <input
                className={INPUT_CLASS}
                value={modalData.to ?? ""}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, to: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                className={INPUT_CLASS}
                value={modalData.subject ?? ""}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, subject: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Body
              </label>
              <textarea
                className={INPUT_CLASS}
                rows={3}
                value={modalData.body ?? ""}
                onChange={(e) =>
                  setModalData((d) => ({ ...d, body: e.target.value }))
                }
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <TopNav activeTab="workflows" setActiveTab={() => {}} />

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <button
            onClick={() => navigate("/Home")}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Back</span>
          </button>
          <div className="w-px h-6 bg-gray-600"></div>
          <h2 className="text-lg font-semibold text-white">Workflow Editor</h2>
          {title && <span className="text-sm text-gray-400">({title})</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || nodes.length === 0}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            saving || nodes.length === 0
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="flex-1 relative bg-gray-900">
        {/* Floating Left Sidebar */}
        <div className="absolute top-4 left-4 w-64 bg-gray-800 border border-gray-600 rounded-xl overflow-hidden z-10">
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-600 text-center">
            <h3 className="font-semibold text-white">ToolBox</h3>
            <div className="text-xs text-gray-400 mt-1">
              Build your workflow
            </div>
          </div>
          <div className="p-4 space-y-6">
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Triggers
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => openNodeModal("manualTrigger")}
                  className="w-full p-3 bg-green-900/50 hover:bg-green-800/60 border border-green-700/50 rounded-lg text-left text-green-200 transition-colors"
                >
                  <div className="font-medium">Manual</div>
                  <div className="text-xs text-green-300/70">
                    Start manually
                  </div>
                </button>
                <button
                  onClick={() => openNodeModal("webhookTrigger")}
                  className="w-full p-3 bg-indigo-900/50 hover:bg-indigo-800/60 border border-indigo-700/50 rounded-lg text-left text-indigo-200 transition-colors"
                >
                  <div className="font-medium">Webhook</div>
                  <div className="text-xs text-indigo-300/70">
                    HTTP endpoint
                  </div>
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Actions
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => openNodeModal("telegramAction")}
                  className="w-full p-3 bg-blue-900/50 hover:bg-blue-800/60 border border-blue-700/50 rounded-lg text-left text-blue-200 transition-colors"
                >
                  <div className="font-medium">Telegram</div>
                  <div className="text-xs text-blue-300/70">Send message</div>
                </button>
                <button
                  onClick={() => openNodeModal("emailAction")}
                  className="w-full p-3 bg-rose-900/50 hover:bg-rose-800/60 border border-rose-700/50 rounded-lg text-left text-rose-200 transition-colors"
                >
                  <div className="font-medium">Email</div>
                  <div className="text-xs text-rose-300/70">
                    Send via Resend
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div ref={wrapperRef} className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onInit={onInit}
            onNodeClick={onNodeClick}
            fitView
            connectionLineStyle={{ stroke: "#3b82f6", strokeWidth: 2 }}
            defaultEdgeOptions={{
              style: { stroke: "#3b82f6", strokeWidth: 2 },
              type: "bezier",
            }}
          >
            <Background
              color="#374151"
              gap={18}
              variant={BackgroundVariant.Dots}
            />
            <Controls className="bg-gray-800 border border-gray-700" />
          </ReactFlow>
        </div>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <div className="mb-2 text-lg font-medium">
                Add a trigger to begin
              </div>
              <div className="text-sm text-gray-600">
                Click items in the floating sidebar to add nodes
              </div>
            </div>
          </div>
        )}

        {/* Floating Node Settings Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-3 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Node Settings</h3>
                <button
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => setSelectedNode(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Configure your {selectedNode.type} node
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Label
                </label>
                <input
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  //@ts-ignore
                  value={selectedNode.data.label ?? ""}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { label: e.target.value })
                  }
                />
              </div>

              {selectedNode.type === "webhookTrigger" && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">
                    Path
                  </label>
                  <input
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    //@ts-ignore
                    value={selectedNode.data.path ?? ""}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, { path: e.target.value })
                    }
                  />
                </div>
              )}

              {(selectedNode.type === "telegramAction" ||
                selectedNode.type === "emailAction") && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">
                    Credential
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    //@ts-ignore
                    value={selectedNode.data.credentialId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cred = credentials.find(
                        (c) => String(c._id ?? c.id) === val
                      );
                      const credTitle = cred?.title ?? cred?.name ?? "";
                      updateNodeData(selectedNode.id, {
                        credentialId: val,
                        credentialTitle: credTitle,
                      });
                    }}
                  >
                    <option value="">-- Select credential --</option>
                    {(selectedNode.type === "telegramAction"
                      ? telegramCreds
                      : emailCreds
                    ).map((c) => (
                      <option key={c._id ?? c.id} value={c._id ?? c.id}>
                        {c.title ?? c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={deleteSelectedNode}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                  Delete Node
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Workflow Title Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[480px] bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Save Workflow
                </h3>
                <button
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={() => setSaveModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Workflow Title
                </label>
                <input
                  className={INPUT_CLASS}
                  placeholder="Enter a title for your workflow..."
                  value={saveModalTitle}
                  onChange={(e) => setSaveModalTitle(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="bg-gray-750 px-6 py-4 border-t border-gray-600 flex justify-end gap-3">
              <button
                className={CANCEL_BUTTON_CLASS}
                onClick={() => setSaveModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !saveModalTitle.trim() || saving
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                onClick={() => performSave(saveModalTitle)}
                disabled={!saveModalTitle.trim() || saving}
              >
                {saving ? "Saving..." : "Save Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Node Modal */}
      {modalOpen && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[560px] bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Add {modalType}
                </h3>
                <button
                  className="text-gray-400 hover:text-white transition-colors"
                  onClick={closeModal}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {renderModalContent()}
            </div>
            <div className="bg-gray-750 px-6 py-4 border-t border-gray-600 flex justify-end gap-3">
              <button className={CANCEL_BUTTON_CLASS} onClick={closeModal}>
                Cancel
              </button>
              <button className={BUTTON_CLASS} onClick={handleModalSubmit}>
                Add Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Workflow() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}
