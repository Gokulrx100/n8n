import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNodesState, useEdgesState, useReactFlow, addEdge, type Node, type Edge } from "@xyflow/react";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_API!;

interface NodeConfig {
  label: string;
  [key: string]: any;
}

const NODE_CONFIGS: Record<string, NodeConfig> = {
  manualTrigger: { label: "Manual", payload: "" },
  webhookTrigger: {
    label: "Webhook",
    method: "POST",
    path: "", // Will be generated dynamically
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

const CONNECTION_RULES = {
  redisMemory: ['memory'],
  geminiModel: ['chatModel'],
  httpTool: ['tool'],
  codeTool: ['tool'],
  workflowTool: ['tool']
};

export function useWorkflowEditor(id?: string) {
  const navigate = useNavigate();
  const { fitView, zoomOut } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const authHeaders = useCallback(() => ({
    token: localStorage.getItem("token") ?? "",
  }), []);

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/credentials`, {
        headers: authHeaders(),
      });
      setCredentials(res.data?.credentials ?? res.data ?? []);
    } catch (error) {
      console.error("Failed to fetch credentials:", error);
      setCredentials([]);
    }
  }, [authHeaders]);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE}/workflow`, {
        headers: authHeaders(),
      });
      setWorkflows(res.data?.workflows ?? res.data ?? []);
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      setWorkflows([]);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchCredentials();
    fetchWorkflows();
  }, [fetchCredentials, fetchWorkflows]);

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
  const spacing = rightmostNode.type === 'aiAgent' ? 220 : 120;
  return { x: rightmostNode.position.x + spacing, y: rightmostNode.position.y };
}, [nodes]);


  const saveWorkflow = useCallback(
    async (workflowTitle?: string) => {
      const finalTitle = workflowTitle || title;
      if (!finalTitle.trim()) {
        alert("Please enter a workflow title.");
        return;
      }
      setSaving(true);
      const payload = { title: finalTitle, nodes, connections: edges };
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
        setTitle(finalTitle);
      } catch (err) {
        console.error("save failed", err);
        alert("Failed to save workflow");
      } finally {
        setSaving(false);
      }
    },
    [id, nodes, edges, title, navigate, authHeaders]
  );

  const updateTitle = useCallback((newTitle: string) => {
    setTitle(newTitle);
  }, []);

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

const addNode = useCallback((nodeType: string) => {
  const position = getNextNodePosition();
  const defaultData = NODE_CONFIGS[nodeType as keyof typeof NODE_CONFIGS];
  
  const nodeData = defaultData ? JSON.parse(JSON.stringify(defaultData)) : { label: nodeType };
  
  if (nodeType === 'webhookTrigger' && nodeData && 'path' in nodeData) {
    nodeData.path = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  if (nodeType === 'redisMemory' && nodeData && 'sessionId' in nodeData) {
    nodeData.sessionId = `session_${Date.now()}`;
  }
  
  const newNode = {
    id: `${nodeType}-${Date.now()}`,
    type: nodeType,
    position,
    data: nodeData,
  };
  
  setNodes((nds) => [...nds, newNode]);
  setSelectedNode(newNode);

  setTimeout(() => {
      zoomOut({ duration: 300 });
      setTimeout(() => fitView({ duration: 500, padding: 0.1 }), 100);
    }, 50);
}, [getNextNodePosition, setNodes, setSelectedNode, zoomOut, fitView]);

const isValidConnection = useCallback((connection: any) => {
  const sourceNode = nodes.find(n => n.id === connection.source);
  const targetNode = nodes.find(n => n.id === connection.target);
  const sourceType = sourceNode?.type;
  const targetType = targetNode?.type;
  if (!sourceNode || !targetNode) return false;
  if (connection.source === connection.target) return false;
  const subNodeRules = CONNECTION_RULES[sourceType as keyof typeof CONNECTION_RULES];
  if (subNodeRules) {
    return targetType === 'aiAgent' && subNodeRules.includes(connection.targetHandle);
  }
  return true;
}, [nodes]);

  return {
    // State
    nodes,
    edges,
    title,
    saving,
    credentials,
    workflows,
    selectedNode,
    isEditing: !!id,
    // Handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick,
    setSelectedNode,
    updateNodeData,
    deleteSelectedNode,
    saveWorkflow,
    updateTitle,
    addNode,
    isValidConnection
  };
}