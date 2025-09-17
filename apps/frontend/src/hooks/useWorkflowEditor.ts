import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNodesState, useEdgesState, useReactFlow, addEdge, type Node, type Edge } from "@xyflow/react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_API!;

const NODE_CONFIGS = {
  manualTrigger: { label: "Manual", payload: "" },
  webhookTrigger: {
    label: "Webhook",
    method: "POST",
    path: `wh_${Date.now().toString(36)}`,
    header: "",
    secret: "",
  },
  telegramAction: { label: "Telegram", credentialId: "", chatId: "", message: "" },
  emailAction: { label: "Email", credentialId: "", to: "", subject: "", body: "" },
};

export function useWorkflowEditor(id?: string) {
  const navigate = useNavigate();
  const { fitView, zoomOut } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalData, setModalData] = useState<Record<string, any>>({});

  // Fetch credentials on mount
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

  // Load workflow if editing
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

  const saveWorkflow = useCallback(
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

  const updateModalData = useCallback((updates: Record<string, any>) => {
    setModalData((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    // State
    nodes,
    edges,
    title,
    saving,
    credentials,
    selectedNode,
    modalOpen,
    modalType,
    modalData,
    // Handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    setSelectedNode,
    updateNodeData,
    deleteSelectedNode,
    saveWorkflow,
    openNodeModal,
    closeModal,
    handleModalSubmit,
    updateModalData,
  };
}