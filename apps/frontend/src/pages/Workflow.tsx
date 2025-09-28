import { useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";

import TopNav from "../components/TopNav";
import WorkflowHeader from "../components/workflow/WorkflowHeader";
import ToolBoxSidebar from "../components/workflow/ToolBoxSidebar";
import NodeSettingsPanel from "../components/workflow/NodeSettingsPanel";
import { useWorkflowEditor } from "../hooks/useWorkflowEditor";

import ManualTriggerNode from "../nodes/Triggers/ManualTriggerNode";
import AIAgentNode from "../nodes/Actions/AIAgentNode";
import WebhookTriggerNode from "../nodes/Triggers/WebhookTriggerNode";
import TelegramActionNode from "../nodes/Actions/TelegramActionNode";
import EmailActionNode from "../nodes/Actions/EmailActionNode";
import GeminiModelNode from "../nodes/Models/GeminiModelNode";
import RedisMemoryNode from "../nodes/Memory/RedisMemoryNode";
import HttpToolNode from "../nodes/Tools/HttpToolNode";
import CodeToolNode from "../nodes/Tools/CodeToolNode";
import WorkflowToolNode from "../nodes/Tools/WorkflowToolNode";

const BASE = import.meta.env.VITE_BASE_API!;

const nodeTypes = {
  manualTrigger: ManualTriggerNode,
  webhookTrigger: WebhookTriggerNode,
  telegramAction: TelegramActionNode,
  emailAction: EmailActionNode,
  aiAgent: AIAgentNode,
  geminiModel: GeminiModelNode,
  redisMemory: RedisMemoryNode,
  httpTool: HttpToolNode,
  codeTool: CodeToolNode,
  workflowTool: WorkflowToolNode
};

function WorkflowEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const {
    nodes,
    edges,
    title,
    saving,
    enabled,
    credentials,
    workflows,
    selectedNode,
    isEditing,
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
    toggleEnabled,
    isValidConnection
  } = useWorkflowEditor(id);

  // Execute workflow handler
  const executeWorkflow = useCallback(async (payload?: any) => {
    if (!id) {
      alert("Please save the workflow first before executing");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BASE}/execute/workflow/${id}`,
        { triggerData: payload || {} },
        { headers: { token } }
      );
      
      const execution = response.data.execution;
      if (execution.success) {
        alert("Workflow executed successfully!");
      } else {
        const failedNodes = execution.results.filter((r: any) => !r.success);
        alert(`Workflow execution failed. Errors: ${failedNodes.map((r: any) => r.error).join(', ')}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Execution failed");
    }
  }, [id]);

  // Listen for manual trigger execution
  useEffect(() => {
    const handler = (e: any) => executeWorkflow(e.detail.payload);
    window.addEventListener('executeWorkflow', handler as EventListener);
    return () => window.removeEventListener('executeWorkflow', handler as EventListener);
  }, [executeWorkflow]);

  const handleSave = useCallback(() => {
    if (nodes.length === 0) {
      alert("Cannot save an empty workflow. Please add at least one node.");
      return;
    }
    // Use the current title from the header, or default to "Untitled Workflow"
    const workflowTitle = title || "Untitled Workflow";
    saveWorkflow(workflowTitle);
  }, [title, nodes.length, saveWorkflow]);


  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedNode) deleteSelectedNode();
      if (e.key === "Escape") setSelectedNode(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedNode, deleteSelectedNode, setSelectedNode]);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <TopNav activeTab="workflows" />

      <WorkflowHeader
        title={title}
        saving={saving}
        nodesCount={nodes.length}
        onBack={() => navigate("/Home")}
        onSave={handleSave}
        onUpdateTitle={updateTitle}
        onToggleEnabled={toggleEnabled}
        enabled={enabled}
        isEditing={isEditing}
      />

      <div className="flex-1 relative bg-gray-900">
        <ToolBoxSidebar onAddNode={addNode} />

        <div className="w-full h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
            connectionLineStyle={{ stroke: "#3b82f6", strokeWidth: 2 }}
            defaultEdgeOptions={{
              style: { stroke: "#3b82f6", strokeWidth: 2 },
              type: "bezier",
            }}
            edgesFocusable={true}
            isValidConnection={isValidConnection}
          >
            <Background color="#374151" gap={18} variant={BackgroundVariant.Dots} />
            <Controls className="bg-gray-800 border border-gray-700" />
          </ReactFlow>
        </div>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <div className="mb-2 text-lg font-medium">Add a trigger to begin</div>
              <div className="text-sm text-gray-600">
                Click items in the floating sidebar to add nodes
              </div>
            </div>
          </div>
        )}

        <NodeSettingsPanel
          selectedNode={selectedNode}
          credentials={credentials}
          workflows={workflows}
          onClose={() => setSelectedNode(null)}
          onUpdateNode={updateNodeData}
          onDeleteNode={deleteSelectedNode}
        />
      </div>

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