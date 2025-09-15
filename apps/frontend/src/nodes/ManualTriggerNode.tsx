// src/nodes/ManualTriggerNode.tsx
import React from "react";
import { Handle, Position } from "@xyflow/react";

export default function ManualTriggerNode({ data }: any) {
  return (
    <div className="bg-green-600 text-white rounded-md p-3 w-48 text-sm shadow">
      <div className="font-semibold text-center">{data?.label ?? "Manual Trigger"}</div>
      <div className="text-xs text-green-100 text-center mt-1">(click to configure)</div>

      {/* output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#fff", width: 12, height: 12, border: "2px solid rgba(0,0,0,0.15)" }}
        isConnectable
      />
    </div>
  );
}
