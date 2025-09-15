import React from "react";
import { Handle, Position } from "@xyflow/react";

export default function WebhookTriggerNode({ data }: any) {
  return (
    <div className="bg-indigo-600 text-white rounded-md p-3 w-56 text-sm shadow">
      <div className="font-semibold">{data?.label ?? "Webhook"}</div>
      <div className="text-xs text-indigo-100 mt-2 break-all">
        {data?.path ? <span className="font-mono">{data.path}</span> : <em>no path</em>}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#fff", width: 12, height: 12, border: "2px solid rgba(0,0,0,0.15)" }}
        isConnectable
      />
    </div>
  );
}
