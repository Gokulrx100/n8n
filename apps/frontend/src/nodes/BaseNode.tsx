// src/nodes/BaseNode.tsx
import React from "react";
import { Handle, Position } from "@xyflow/react";

interface BaseNodeProps {
  title: string;
  icon: React.ReactNode;
  bg?: string;
  type?: "trigger" | "action";
}

export default function BaseNode({
  title,
  icon,
  bg = "bg-gray-700",
  type = "action",
}: BaseNodeProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center
                  w-28 h-28 rounded-xl shadow-lg text-white ${bg} relative`}
    >
      {type !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: 10, 
            height: 10,
            background: "#d1d5db",
            border: "2px solid white",
          }}
        />
      )}

      <div className="mb-2">{icon}</div>
      <div className="text-sm font-medium text-center">{title}</div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 10,
          height: 10,
          background: "#d1d5db",
          border: "2px solid white",
        }}
      />
    </div>
  );
}
