import { Handle, Position } from "@xyflow/react";
import { Play } from "lucide-react";

export default function ManualTriggerNode() {
  return (
    <div className="relative">
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