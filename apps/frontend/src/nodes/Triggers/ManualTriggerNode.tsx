import { Handle, Position } from "@xyflow/react";
import { Play } from "lucide-react";
import { useState } from "react";

export default function ManualTriggerNode({ id, data }: any) {
  const [isHovered, setIsHovered] = useState(false);

  const handleExecute = (e: React.MouseEvent) => {
    e.stopPropagation();
    let payload = {};
    
    // Try to parse JSON payload, fallback to plain text
    if (data.payload) {
      try {
        payload = JSON.parse(data.payload);
      } catch {
        // If not valid JSON, treat as plain text
        payload = { message: data.payload };
      }
    }
    
    window.dispatchEvent(new CustomEvent('executeWorkflow', { 
      detail: { payload } 
    }));
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <button
          onClick={handleExecute}
          className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg z-10 transition-all"
          title="Execute Workflow"
        >
          <Play size={10} fill="white" color="white" />
        </button>
      )}
      
      <div className="flex flex-col items-center justify-center w-20 h-20 rounded-lg shadow-lg text-white bg-gray-700 border border-gray-600 relative">
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{ 
            width: 12, 
            height: 12,
            background: "#10b981",
            border: "2px solid #1f2937",
          }}
        />
        <div className="mb-1 text-green-400">
          <Play size={20} />
        </div>
        <div className="text-[10px] font-medium text-center px-1 leading-tight">Manual</div>
      </div>
    </div>
  );
}