import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import TopNav from "../components/TopNav";
import WorkflowHeader from "../components/workflow/WorkflowHeader";
import ToolBoxSidebar from "../components/workflow/ToolBoxSidebar";
import NodeSettingsPanel from "../components/workflow/NodeSettingsPanel";
import SaveWorkflowModal from "../components/SaveWorkflowModel";
import AddNodeModal from "../components/AddNodeModel";
import { useWorkflowEditor } from "../hooks/useWorkflowEditor";

import ManualTriggerNode from "../nodes/Triggers/ManualTriggerNode";
import WebhookTriggerNode from "../nodes/Triggers/WebhookTriggerNode";
import TelegramActionNode from "../nodes/Actions/TelegramActionNode";
import EmailActionNode from "../nodes/Actions/EmailActionNode";

const nodeTypes = {
  manualTrigger: ManualTriggerNode,
  webhookTrigger: WebhookTriggerNode,
  telegramAction: TelegramActionNode,
  emailAction: EmailActionNode,
};

function WorkflowEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const flowInstance = useRef<any>(null);

  const {
    nodes,
    edges,
    title,
    saving,
    credentials,
    selectedNode,
    modalOpen,
    modalType,
    modalData,
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
  } = useWorkflowEditor(id);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalTitle, setSaveModalTitle] = useState("");

  const handleSave = useCallback(() => {
    if (nodes.length === 0) {
      alert("Cannot save an empty workflow. Please add at least one node.");
      return;
    }
    setSaveModalTitle(title || "");
    setSaveModalOpen(true);
  }, [title, nodes.length]);

  const onInit = useCallback((instance: any) => (flowInstance.current = instance), []);

  // Keyboard shortcuts
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
      <TopNav activeTab="workflows" setActiveTab={() => {}} />

      <WorkflowHeader
        title={title}
        saving={saving}
        nodesCount={nodes.length}
        onBack={() => navigate("/Home")}
        onSave={handleSave}
      />

      <div className="flex-1 relative bg-gray-900">
        <ToolBoxSidebar onAddNode={openNodeModal} />

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
          onClose={() => setSelectedNode(null)}
          onUpdateNode={updateNodeData}
          onDeleteNode={deleteSelectedNode}
        />
      </div>

      <SaveWorkflowModal
        isOpen={saveModalOpen}
        title={saveModalTitle}
        saving={saving}
        onClose={() => setSaveModalOpen(false)}
        onSave={(title) => {
          saveWorkflow(title);
          setSaveModalOpen(false);
        }}
        onTitleChange={setSaveModalTitle}
      />

      <AddNodeModal
        isOpen={modalOpen}
        modalType={modalType}
        modalData={modalData}
        credentials={credentials}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        onDataChange={updateModalData}
      />
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