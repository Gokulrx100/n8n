import { Handle, Position } from "@xyflow/react";
import { Globe } from "lucide-react";

export default function HttpToolNode() {
  return (
    <div className="relative">
      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg text-white bg-gray-700 border border-gray-600 relative">
        <Handle
          type="source"
          position={Position.Top}
          id="output"
          style={{ 
            width: 10, 
            height: 10,
            background: "#10b981",
            border: "2px solid #1f2937",
          }}
        />
        <div className="mb-1 text-red-400">
          <Globe size={14} />
        </div>
        <div className="text-[8px] font-medium text-center px-1 leading-tight">HTTP</div>
      </div>
    </div>
  );
}