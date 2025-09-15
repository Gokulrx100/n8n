// src/pages/Workflow.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import TopNav from "../components/TopNav";
import ManualTriggerNode from "../nodes/ManualTriggerNode";
import WebhookTriggerNode from "../nodes/WebhookTriggerNode";
import TelegramActionNode from "../nodes/TelegramActionNode";
import EmailActionNode from "../nodes/EmailActionNode";

const BASE = import.meta.env.VITE_BASE_API!;
const nodeTypes = {
  manualTrigger: ManualTriggerNode,
  webhookTrigger: WebhookTriggerNode,
  telegramAction: TelegramActionNode,
  emailAction: EmailActionNode,
};

export default function Workflow() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const flowInstance = useRef<any>(null);

  const initialNodes: Node[] = []; 
  const initialEdges: Edge[] = []; 
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes); 
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const [credentials, setCredentials] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalData, setModalData] = useState<Record<string, any>>({});
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${BASE}/credentials`, {
          headers: { token: localStorage.getItem("token") ?? "" },
        });
        setCredentials(res.data?.credentials ?? res.data ?? []);
      } catch {
        setCredentials([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
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
    })();
  }, [id, setNodes, setEdges]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const payload = { title, nodes, connections: edges };
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
    } catch (err) {
      console.error("save failed", err);
      alert("Failed to save workflow");
    } finally {
      setSaving(false);
    }
  }, [id, title, nodes, edges, navigate]);

  // Helpers
  const getCenterPosition = useCallback(() => {
    let position = { x: 220, y: 120 };
    try {
      if (wrapperRef.current && flowInstance.current) {
        const bounds = wrapperRef.current.getBoundingClientRect();
        const center = { x: bounds.width / 2, y: bounds.height / 2 };
        const screenPt = { x: center.x + bounds.left, y: center.y + bounds.top };
        if (flowInstance.current.screenToFlowPosition) {
          position = flowInstance.current.screenToFlowPosition(screenPt);
        } else if (flowInstance.current.project) {
          position = flowInstance.current.project(screenPt);
        }
      }
    } catch {}
    return position;
  }, []);

  const createNodeWithData = useCallback(
    (type: string, data: Record<string, any>) => {
      const position = getCenterPosition();
      const nid = `${type}-${Date.now()}`;
      const node: Node = { id: nid, type, position, data };
      setNodes((nds) => nds.concat(node));
      setTimeout(() => setSelectedNode(node), 50);
    },
    [getCenterPosition, setNodes]
  );

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onInit = useCallback((instance: any) => (flowInstance.current = instance), []);
  const onNodeClick = useCallback((_e: any, node: Node) => setSelectedNode(node), []);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedNode) deleteSelectedNode();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedNode, deleteSelectedNode]);

  // ----- Modal logic (unchanged) -----
  const openNodeModal = useCallback((type: string) => {
    setModalType(type);
    if (type === "manualTrigger") {
      setModalData({ label: "Manual", payload: "" });
    } else if (type === "webhookTrigger") {
      setModalData({
        label: "Webhook",
        method: "POST",
        path: `wh_${Date.now().toString(36)}`,
        header: "",
        secret: "",
      });
    } else if (type === "telegramAction") {
      setModalData({ label: "Telegram", credentialId: "", chatId: "", message: "" });
    } else if (type === "emailAction") {
      setModalData({ label: "Email", credentialId: "", to: "", subject: "", body: "" });
    } else setModalData({});
    setModalOpen(true);
  }, []);

  const handleModalSubmit = useCallback(() => {
    if (!modalType) return;
    const data = { ...modalData };
    if (data.credentialId) {
      const cred = credentials.find((c) => String(c._1d ?? c.id) === String(data.credentialId));
      if (cred) data.credentialTitle = cred.title ?? cred.name;
    }
    if (modalType === "webhookTrigger" && !data.path) data.path = `wh_${Date.now().toString(36)}`;
    createNodeWithData(modalType, data);
    setModalOpen(false);
    setModalType(null);
    setModalData({});
  }, [modalType, modalData, credentials, createNodeWithData]);

  const handleModalCancel = useCallback(() => {
    setModalOpen(false);
    setModalType(null);
    setModalData({});
  }, []);

  const addManual = () => openNodeModal("manualTrigger");
  const addWebhook = () => openNodeModal("webhookTrigger");
  const addTG = () => openNodeModal("telegramAction");
  const addEmail = () => openNodeModal("emailAction");

  const nodeTypesMemo = useMemo(() => nodeTypes, []);
  const telegramCreds = credentials.filter((c) => (c.platform ?? "").toLowerCase().includes("telegram"));
  const emailCreds = credentials.filter((c) =>
    ["resend", "email", "smtp"].some((p) => String(c.platform ?? "").toLowerCase().includes(p))
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <TopNav activeTab="workflows" setActiveTab={() => {}} />

      {/* header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Workflow Editor</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Workflow title..."
            className="px-3 py-1 rounded border border-gray-300 text-sm"
          />
        </div>

        <button onClick={handleSave} disabled={saving} className="px-4 py-1 bg-blue-600 text-white rounded text-sm">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="flex-1 flex">
        {/* left sidebar */}
        <div className="w-64 bg-white border-r p-4 space-y-6">
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Triggers</h4>
            <button onClick={addManual} className="w-full mb-2 p-2 bg-green-50 rounded border text-left">Manual</button>
            <button onClick={addWebhook} className="w-full p-2 bg-indigo-50 rounded border text-left">Webhook</button>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Actions</h4>
            <button onClick={addTG} className="w-full mb-2 p-2 bg-blue-50 rounded border text-left">Telegram</button>
            <button onClick={addEmail} className="w-full p-2 bg-rose-50 rounded border text-left">Email (Resend)</button>
          </div>
        </div>

        {/* canvas */}
        <div className="flex-1 relative bg-gray-50">
          <div ref={wrapperRef} className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypesMemo}
              onInit={onInit}
              onNodeClick={onNodeClick}
              fitView
              connectionLineStyle={{ stroke: "#3b82f6", strokeWidth: 2 }}
              defaultEdgeOptions={{ style: { stroke: "#3b82f6", strokeWidth: 2 }, type: "smoothstep" }}
            >
              <Background color="#e5e7eb" gap={18} variant={BackgroundVariant.Dots} />
              <Controls />
            </ReactFlow>
          </div>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-500">
                <div className="mb-2">Add a trigger to begin</div>
                <div className="text-xs">Click items in the left sidebar to add nodes</div>
              </div>
            </div>
          )}

          {/* right drawer for selected node */}
          {selectedNode && (
            <div className="absolute right-0 top-0 h-full w-72 bg-white border-l p-4 overflow-auto shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Node settings</h3>
                <button className="text-sm text-gray-500" onClick={() => setSelectedNode(null)}>Close</button>
              </div>

              <div className="mt-4">
                <label className="block text-xs text-gray-600">Label</label>
                <input
                  className="w-full mt-1 p-2 border rounded text-sm"
                  //@ts-ignore
                  value={selectedNode.data.label ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: value } } : n)));
                    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: value } });
                  }}
                />
              </div>

              {selectedNode.type === "webhookTrigger" && (
                <>
                  <label className="block text-xs text-gray-600 mt-4">Path</label>
                  <input
                    className="w-full mt-1 p-2 border rounded text-sm"
                    //@ts-ignore
                    value={selectedNode.data.path ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, path: v } } : n)));
                      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, path: v } });
                    }}
                  />
                </>
              )}

              {(selectedNode.type === "telegramAction" || selectedNode.type === "emailAction") && (
                <>
                  <label className="block text-xs text-gray-600 mt-4">Credential</label>
                  <select
                    className="w-full mt-1 p-2 border rounded text-sm"
                    //@ts-ignore
                    value={selectedNode.data.credentialId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cred = credentials.find((c) => String(c._id ?? c.id) === val);
                      const title = cred?.title ?? cred?.name ?? "";
                      setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, credentialId: val, credentialTitle: title } } : n)));
                      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, credentialId: val, credentialTitle: title } });
                    }}
                  >
                    <option value="">-- Select --</option>
                    {(selectedNode.type === "telegramAction" ? telegramCreds : emailCreds).map((c) => (
                      <option key={c._id ?? c.id} value={c._id ?? c.id}>{c.title ?? c.name}</option>
                    ))}
                  </select>
                </>
              )}

              <div className="mt-6">
                <button onClick={deleteSelectedNode} className="w-full bg-red-600 text-white py-2 rounded">Delete Node</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for pre-create node configuration */}
      {modalOpen && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[560px] bg-white rounded shadow-lg p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Add {modalType}</h3>
              <button className="text-gray-500" onClick={handleModalCancel}>Cancel</button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-600">Label</label>
                <input className="w-full mt-1 p-2 border rounded text-sm" value={modalData.label ?? ""} onChange={(e) => setModalData((d) => ({ ...d, label: e.target.value }))} />
              </div>

              {modalType === "manualTrigger" && (
                <div>
                  <label className="block text-xs text-gray-600">Payload (JSON or text)</label>
                  <textarea className="w-full mt-1 p-2 border rounded text-sm" rows={4} value={modalData.payload ?? ""} onChange={(e) => setModalData((d) => ({ ...d, payload: e.target.value }))} />
                </div>
              )}

              {modalType === "webhookTrigger" && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600">HTTP Method</label>
                    <select className="w-full mt-1 p-2 border rounded text-sm" value={modalData.method ?? "POST"} onChange={(e) => setModalData((d) => ({ ...d, method: e.target.value }))}>
                      <option>POST</option>
                      <option>GET</option>
                      <option>PUT</option>
                      <option>DELETE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Path (unique fragment)</label>
                    <input className="w-full mt-1 p-2 border rounded text-sm" value={modalData.path ?? ""} onChange={(e) => setModalData((d) => ({ ...d, path: e.target.value }))} />
                    <p className="text-xs text-gray-400 mt-1">If empty, a unique path will be generated.</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Secret (optional)</label>
                    <input className="w-full mt-1 p-2 border rounded text-sm" value={modalData.secret ?? ""} onChange={(e) => setModalData((d) => ({ ...d, secret: e.target.value }))} />
                  </div>
                </>
              )}

              {modalType === "telegramAction" && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600">Credential</label>
                    <select className="w-full mt-1 p-2 border rounded text-sm" value={modalData.credentialId ?? ""} onChange={(e) => setModalData((d) => ({ ...d, credentialId: e.target.value }))}>
                      <option value="">-- Select bot credential --</option>
                      {telegramCreds.map((c) => <option key={c._id ?? c.id} value={c._id ?? c.id}>{c.title ?? c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Chat ID (optional)</label>
                    <input className="w-full mt-1 p-2 border rounded text-sm" value={modalData.chatId ?? ""} onChange={(e) => setModalData((d) => ({ ...d, chatId: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Message</label>
                    <textarea className="w-full mt-1 p-2 border rounded text-sm" rows={3} value={modalData.message ?? ""} onChange={(e) => setModalData((d) => ({ ...d, message: e.target.value }))} />
                  </div>
                </>
              )}

              {modalType === "emailAction" && (
                <>
                  <div>
                    <label className="block text-xs text-gray-600">Credential</label>
                    <select className="w-full mt-1 p-2 border rounded text-sm" value={modalData.credentialId ?? ""} onChange={(e) => setModalData((d) => ({ ...d, credentialId: e.target.value }))}>
                      <option value="">-- Select email credential --</option>
                      {emailCreds.map((c) => <option key={c._1d ?? c.id} value={c._id ?? c.id}>{c.title ?? c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">To (optional, taken from trigger if empty)</label>
                    <input className="w-full mt-1 p-2 border rounded text-sm" value={modalData.to ?? ""} onChange={(e) => setModalData((d) => ({ ...d, to: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Subject</label>
                    <input className="w-full mt-1 p-2 border rounded text-sm" value={modalData.subject ?? ""} onChange={(e) => setModalData((d) => ({ ...d, subject: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Body</label>
                    <textarea className="w-full mt-1 p-2 border rounded text-sm" rows={3} value={modalData.body ?? ""} onChange={(e) => setModalData((d) => ({ ...d, body: e.target.value }))} />
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button className="px-3 py-1 border rounded" onClick={handleModalCancel}>Cancel</button>
              <button className="px-4 py-1 bg-blue-600 text-white rounded" onClick={handleModalSubmit}>Add Node</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}