import { Handle, Position } from "@xyflow/react";
import { Bot } from "lucide-react";

export default function AIAgentNode() {
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
          <div className="text-lg font-medium">AI Agent</div>
        </div>
      </div>
      
      <div className="absolute -bottom-8 left-[20%] text-xs text-gray-400 font-medium transform -translate-x-1/2">
        Model
      </div>
      <div className="absolute -bottom-8 left-1/2 text-xs text-gray-400 font-medium transform -translate-x-1/2">
        Memory
      </div>
      <div className="absolute -bottom-8 left-[80%] text-xs text-gray-400 font-medium transform -translate-x-1/2">
        Tool
      </div>
    </div>
  );
}