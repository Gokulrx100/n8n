import { X } from "lucide-react";
import type { Node } from "@xyflow/react";

interface NodeSettingsPanelProps {
  selectedNode: Node | null;
  credentials: any[];
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: any) => void;
  onDeleteNode: () => void;
}

export default function NodeSettingsPanel({
  selectedNode,
  credentials,
  onClose,
  onUpdateNode,
  onDeleteNode,
}: NodeSettingsPanelProps) {
  if (!selectedNode) return null;

  const telegramCreds = credentials.filter((c) =>
    (c.platform ?? "").toLowerCase().includes("telegram")
  );
  const emailCreds = credentials.filter((c) =>
    ["resend", "email", "smtp"].some((p) =>
      String(c.platform ?? "")
        .toLowerCase()
        .includes(p)
    )
  );

  return (
    <div className="absolute top-4 right-4 w-80 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-3 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Node Settings</h3>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Configure your {selectedNode.type} node
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-2">
            Label
          </label>
          <input
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            //@ts-ignore
            value={selectedNode.data.label ?? ""}
            onChange={(e) =>
              onUpdateNode(selectedNode.id, { label: e.target.value })
            }
          />
        </div>

        {selectedNode.type === "webhookTrigger" && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Path
            </label>
            <input
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              //@ts-ignore
              value={selectedNode.data.path ?? ""}
              onChange={(e) =>
                onUpdateNode(selectedNode.id, { path: e.target.value })
              }
            />
          </div>
        )}

        {(selectedNode.type === "telegramAction" ||
          selectedNode.type === "emailAction") && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Credential
            </label>
            <select
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              //@ts-ignore
              value={selectedNode.data.credentialId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                const cred = credentials.find(
                  (c) => String(c._id ?? c.id) === val
                );
                const credTitle = cred?.title ?? cred?.name ?? "";
                onUpdateNode(selectedNode.id, {
                  credentialId: val,
                  credentialTitle: credTitle,
                });
              }}
            >
              <option value="">-- Select credential --</option>
              {(selectedNode.type === "telegramAction"
                ? telegramCreds
                : emailCreds
              ).map((c) => (
                <option key={c._id ?? c.id} value={c._id ?? c.id}>
                  {c.title ?? c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedNode.type === "aiAgent" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                System Prompt
              </label>
              <textarea
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                //@ts-ignore
                value={selectedNode.data.systemPrompt ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, {
                    systemPrompt: e.target.value,
                  })
                }
                placeholder="You are a helpful assistant..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Temperature
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  //@ts-ignore
                  value={selectedNode.data.temperature ?? 0.7}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      temperature: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="4000"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  //@ts-ignore
                  value={selectedNode.data.maxTokens ?? 1000}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      maxTokens: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </>
        )}

        <div className="pt-2">
          <button
            onClick={onDeleteNode}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            Delete Node
          </button>
        </div>
      </div>
    </div>
  );
}
