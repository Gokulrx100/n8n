import { Handle, Position } from "@xyflow/react";
import { Webhook, Copy } from "lucide-react";
import { useState } from "react";

export default function WebhookTriggerNode({ data }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const webhookPath = data?.path || "";
  const webhookUrl = webhookPath 
    ? `${import.meta.env.VITE_BASE_API}/execute/webhook/${webhookPath}`
    : "";

  const copyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && webhookUrl && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-600 rounded px-2 py-1 flex items-center gap-2 whitespace-nowrap z-10 shadow-lg">
          <span className="text-xs text-gray-300 font-mono">{webhookUrl}</span>
          <button
            onClick={copyUrl}
            className="text-gray-400 hover:text-white transition-colors"
            title="Copy URL"
          >
            <Copy size={12} />
          </button>
        </div>
      )}
      
      <div className="flex flex-col items-center justify-center w-20 h-20 rounded-lg shadow-lg text-white bg-gray-700 border border-gray-600 relative">
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
          <Webhook size={20} />
        </div>
        <div className="text-[10px] font-medium text-center px-1 leading-tight">Webhook</div>
      </div>
    </div>
  );
}