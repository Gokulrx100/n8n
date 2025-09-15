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
                  w-16 h-16 rounded-lg shadow-lg text-white ${bg} relative`}
    >
      {type !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: 10, 
            height: 10,
            background: "#3b82f6",
            border: "2px solid white",
          }}
        />
      )}

      <div className="mb-0.5">{React.cloneElement(icon as React.ReactElement, { size: 16 } as any)}</div>
      <div className="text-[10px] font-medium text-center px-0.5 leading-tight">{title}</div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 10,
          height: 10,
          background: "#10b981",
          border: "2px solid white",
        }}
      />
    </div>
  );
}
