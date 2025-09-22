import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Bot, Plus, Database, Cpu, Globe, Code, Workflow } from "lucide-react";
import { useState } from "react";

export default function AIAgentNode({ id, data}: any) {
  const { addNodes, addEdges, getNode } = useReactFlow();
  const [showMenu, setShowMenu] = useState<null | "memory" | "model" | "tool">(null);

  const handleAddSubNode = (type: string, handle: string) => {
  const newNodeId = `${type}-${Date.now()}`;
  
  const currentNode = getNode(id);
  const aiAgentPos = currentNode?.position || { x: 0, y: 0 };
  
  const newNode = {
    id: newNodeId,
    type,
    position: { 
      x: aiAgentPos.x+30, 
      y: aiAgentPos.y + 220
    },
    data: { label: type },
  };
  
  const newEdge = {
    id: `${newNodeId}-${id}`,
    source: newNodeId,
    target: id,
    targetHandle: handle,
    type: "bezier",
  };
  
  addNodes(newNode);
  addEdges(newEdge);
  setShowMenu(null);
};

  return (
    <div className="relative">
      <div className="flex items-center justify-center w-46 h-22 rounded-lg shadow-lg text-white bg-gray-700 border border-gray-500 relative">
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{ 
            width: 12, 
            height: 12,
            background: "#6b7280",
            border: "2px solid #4b5563",
          }}
        />
        
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{ 
            width: 12,
            height: 12,
            background: "#6b7280",
            border: "2px solid #4b5563",
          }}
        />

        <Handle
          type="target"
          position={Position.Bottom}
          id="chatModel"
          style={{ 
            background: "#6b7280",
            width: 12,
            height: 12,
            border: "2px solid #4b5563",
            left: "20%",
            transform: "translateX(-50%)",
            bottom: "-6px"
          }}
        />
        
        <Handle
          type="target"
          position={Position.Bottom}
          id="memory"
          style={{ 
            background: "#6b7280",
            width: 12,
            height: 12,
            border: "2px solid #4b5563",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: "-6px"
          }}
        />
        
        <Handle
          type="target"
          position={Position.Bottom}
          id="tool"
          style={{ 
            background: "#6b7280",
            width: 12,
            height: 12,
            border: "2px solid #4b5563",
            left: "80%",
            transform: "translateX(-50%)",
            bottom: "-6px"
          }}
        />
        
        <div className="flex items-center gap-3">
          <Bot size={24} />
          <div className="text-lg font-medium">{data.label || "AI Agent"}</div>
        </div>
      </div>
      
      <div className="absolute -bottom-8 left-[20%] transform -translate-x-1/2">
        <div className="text-xs text-gray-400 font-medium">Model</div>
        <button
          onClick={() => setShowMenu(showMenu === "model" ? null : "model")}
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-700 border border-gray-500 rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-600 hover:text-white transition-colors shadow-sm"
        >
          <Plus size={10} strokeWidth={2.5} />
        </button>
        {showMenu === "model" && (
          <div className="absolute left-1/2 transform -translate-x-1/2 top-6 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg min-w-[120px] overflow-hidden">
            <button
              onClick={() => handleAddSubNode("geminiModel", "chatModel")}
              className="flex items-center gap-2 w-full px-3 py-2 text-white hover:bg-gray-700 text-xs text-left transition-colors"
            >
              <Cpu size={14} />
              <span>Gemini Model</span>
            </button>
          </div>
        )}
      </div>

      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="text-xs text-gray-400 font-medium">Memory</div>
        <button
          onClick={() => setShowMenu(showMenu === "memory" ? null : "memory")}
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-700 border border-gray-500 rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-600 hover:text-white transition-colors shadow-sm"
        >
          <Plus size={10} strokeWidth={2.5} />
        </button>
        {showMenu === "memory" && (
          <div className="absolute left-1/2 transform -translate-x-1/2 top-6 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg min-w-[120px] overflow-hidden">
            <button
              onClick={() => handleAddSubNode("redisMemory", "memory")}
              className="flex items-center gap-2 w-full px-3 py-2 text-white hover:bg-gray-700 text-xs text-left transition-colors"
            >
              <Database size={14} />
              <span>Redis Memory</span>
            </button>
          </div>
        )}
      </div>

      <div className="absolute -bottom-8 left-[80%] transform -translate-x-1/2">
        <div className="text-xs text-gray-400 font-medium">Tool</div>
        <button
          onClick={() => setShowMenu(showMenu === "tool" ? null : "tool")}
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-700 border border-gray-500 rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-600 hover:text-white transition-colors shadow-sm"
        >
          <Plus size={10} strokeWidth={2.5} />
        </button>
        {showMenu === "tool" && (
          <div className="absolute left-1/2 transform -translate-x-1/2 top-6 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg min-w-[130px] overflow-hidden">
            <button
              onClick={() => handleAddSubNode("httpTool", "tool")}
              className="flex items-center gap-2 w-full px-3 py-2 text-white hover:bg-gray-700 text-xs text-left transition-colors border-b border-gray-700"
            >
              <Globe size={14} />
              <span>HTTP Tool</span>
            </button>
            <button
              onClick={() => handleAddSubNode("codeTool", "tool")}
              className="flex items-center gap-2 w-full px-3 py-2 text-white hover:bg-gray-700 text-xs text-left transition-colors border-b border-gray-700"
            >
              <Code size={14} />
              <span>Code Tool</span>
            </button>
            <button
              onClick={() => handleAddSubNode("workflowTool", "tool")}
              className="flex items-center gap-2 w-full px-3 py-2 text-white hover:bg-gray-700 text-xs text-left transition-colors"
            >
              <Workflow size={14} />
              <span>Workflow Tool</span>
            </button>
          </div>
        )}
      </div>

      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
}