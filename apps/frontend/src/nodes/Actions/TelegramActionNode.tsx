import { Handle, Position } from "@xyflow/react";
import { Send } from "lucide-react";

export default function TelegramActionNode() {
  return (
    <div className="relative">
      <div className="flex flex-col items-center justify-center w-20 h-20 rounded-lg shadow-lg text-white bg-gray-700 border border-gray-600 relative">
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{ 
            width: 12, 
            height: 12,
            background: "#10b981",
            border: "2px solid #1f2937",
          }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{ 
            width: 12,
            height: 12,
            background: "#3b82f6",
            border: "2px solid #1f2937",
          }}
        />
        <div className="mb-1 text-blue-400">
          <Send size={20} />
        </div>
        <div className="text-[10px] font-medium text-center px-1 leading-tight">Telegram</div>
      </div>
    </div>
  );
}