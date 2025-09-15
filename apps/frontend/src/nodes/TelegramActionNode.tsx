import React from "react";
import { Handle, Position } from "@xyflow/react";

export default function TelegramActionNode({ data }: any) {
  return (
    <div className="bg-blue-600 text-white rounded-md p-3 w-52 text-sm shadow">
      <div className="font-semibold">{data?.label ?? "Telegram"}</div>
      <div className="text-xs text-blue-100 mt-1">
        {data?.credentialTitle ?? "no credential"}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#fff", width: 12, height: 12, border: "2px solid rgba(0,0,0,0.15)" }}
        isConnectable
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#fff", width: 12, height: 12, border: "2px solid rgba(0,0,0,0.15)" }}
        isConnectable
      />
    </div>
  );
}
