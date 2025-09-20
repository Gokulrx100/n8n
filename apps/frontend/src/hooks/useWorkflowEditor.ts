import { useCallback, useState, useEffect, useMemo } from "react";
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
  aiAgent: { 
    label: "AI Agent", 
    systemPrompt: "You are a helpful assistant",
    temperature: 0.7,
    maxTokens: 1000,
    tools: [],
    model: "gemini-pro",
    memory: "default"
  },
  geminiModel: { 
    label: "Gemini Model", 
    model: "gemini-pro",
    apiKey: "",
    temperature: 0.7,
    maxTokens: 1000
  },
  redisMemory: { 
    label: "Redis Memory", 
    sessionId: `session_${Date.now()}`,
    maxHistory: 10,
    ttl: 3600
  },
  httpTool: { 
    label: "HTTP Tool", 
    method: "GET",
    url: "",
    headers: {},
    body: ""
  },
  codeTool: { 
    label: "Code Tool", 
    language: "javascript",
    code: ""
  },
  workflowTool: { 
    label: "Workflow Tool", 
    workflowId: "",
    inputData: {}
  }
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

  // Model states
  const [modelOpen, setModelOpen] = useState(false);
  const [modelType, setModelType] = useState<string | null>(null);
  const [modelData, setModelData] = useState<Record<string, any>>({});

  const authHeaders = useCallback(() => ({
    token: localStorage.getItem("token") ?? "",
  }), []);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/credentials`, {
        headers: authHeaders(),
      });
      setCredentials(res.data?.credentials ?? res.data ?? []);
    } catch {
      setCredentials([]);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  useEffect(() => {
    if (!id) return;
    const loadWorkflow = async () => {
      try {
        const res = await axios.get(`${BASE}/workflow/${id}`, {
          headers: authHeaders(),
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
  }, [id, authHeaders]); 

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
            headers: authHeaders(),
          });
        } else {
          const res = await axios.post(`${BASE}/workflow`, payload, {
            headers: authHeaders(),
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
    [id, nodes, edges, navigate, authHeaders]
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

  const openNodeModel = useCallback((type: string) => {
    setModelType(type);
    setModelData(NODE_CONFIGS[type as keyof typeof NODE_CONFIGS] || {});
    setModelOpen(true);
  }, []);

  const closeModel = useCallback(() => {
    setModelOpen(false);
    setModelType(null);
    setModelData({});
  }, []);

  const handleModelSubmit = useCallback(() => {
    if (!modelType) return;
    const data = { ...modelData };

    if (data.credentialId) {
      const cred = credentials.find(
        (c) => String(c._id ?? c.id) === String(data.credentialId)
      );
      if (cred) data.credentialTitle = cred.title ?? cred.name;
    }

    if (modelType === "webhookTrigger" && !data.path) {
      data.path = `wh_${Date.now().toString(36)}`;
    }

    createNodeWithData(modelType, data);
    closeModel();
  }, [modelType, modelData, credentials, createNodeWithData, closeModel]);

  const updateModelData = useCallback((updates: Record<string, any>) => {
    setModelData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    nodes,
    edges,
    title,
    saving,
    credentials,
    selectedNode,
    modelOpen,
    modelType,
    modelData,
    // Handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    setSelectedNode,
    updateNodeData,
    deleteSelectedNode,
    saveWorkflow,
    openNodeModel,
    closeModel,
    handleModelSubmit,
    updateModelData,
  }), [
    nodes,
    edges,
    title,
    saving,
    credentials,
    selectedNode,
    modelOpen,
    modelType,
    modelData,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    setSelectedNode,
    updateNodeData,
    deleteSelectedNode,
    saveWorkflow,
    openNodeModel,
    closeModel,
    handleModelSubmit,
    updateModelData,
  ]);
}