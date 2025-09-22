import { X, Trash2 } from "lucide-react";
import type { Node } from "@xyflow/react";

interface NodeSettingsPanelProps {
  selectedNode: Node | null;
  credentials: any[];
  workflows: any[];
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: any) => void;
  onDeleteNode: () => void;
}

const INPUT_CLASS =
  "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function NodeSettingsPanel({
  selectedNode,
  credentials,
  workflows, // Add this line
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

  const getNodeData = (key: string) => {
    return (selectedNode?.data as any)?.[key];
  };

  const renderNodeContent = () => {
    const commonFields = (
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-2">
          Label
        </label>
        <input
          className={INPUT_CLASS}
          //@ts-ignore
          value={selectedNode.data.label ?? ""}
          onChange={(e) =>
            onUpdateNode(selectedNode.id, { label: e.target.value })
          }
        />
      </div>
    );

    switch (selectedNode.type) {
      case "manualTrigger":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Payload (JSON or text)
              </label>
              <textarea
                className={INPUT_CLASS}
                rows={4}
                //@ts-ignore
                value={selectedNode.data.payload ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { payload: e.target.value })
                }
              />
            </div>
          </>
        );

      case "webhookTrigger":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                HTTP Method
              </label>
              <select
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.method ?? "POST"}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { method: e.target.value })
                }
              >
                <option>POST</option>
                <option>GET</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Path
              </label>
              <input
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.path ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { path: e.target.value })
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                If empty, a unique path will be generated.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Secret (optional)
              </label>
              <input
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.secret ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { secret: e.target.value })
                }
              />
            </div>
          </>
        );

      case "telegramAction":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Credential
              </label>
              <select
                className={INPUT_CLASS}
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
                <option value="">-- Select bot credential --</option>
                {telegramCreds.map((c) => (
                  <option key={c._id ?? c.id} value={c._id ?? c.id}>
                    {c.title ?? c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Chat ID (optional)
              </label>
              <input
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.chatId ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { chatId: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                className={INPUT_CLASS}
                rows={3}
                //@ts-ignore
                value={selectedNode.data.message ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { message: e.target.value })
                }
              />
            </div>
          </>
        );

      case "emailAction":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Credential
              </label>
              <select
                className={INPUT_CLASS}
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
                <option value="">-- Select email credential --</option>
                {emailCreds.map((c) => (
                  <option key={c._id ?? c.id} value={c._id ?? c.id}>
                    {c.title ?? c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                To (optional, taken from trigger if empty)
              </label>
              <input
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.to ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { to: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.subject ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { subject: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Body
              </label>
              <textarea
                className={INPUT_CLASS}
                rows={3}
                //@ts-ignore
                value={selectedNode.data.body ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { body: e.target.value })
                }
              />
            </div>
          </>
        );

      case "aiAgent":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                System Prompt
              </label>
              <textarea
                className={INPUT_CLASS}
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
                  className={INPUT_CLASS}
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
                  className={INPUT_CLASS}
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
        );

      case "geminiModel":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.apiKey ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { apiKey: e.target.value })
                }
                placeholder="Enter your Gemini API key"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Model
              </label>
              <select
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.model ?? "gemini-pro"}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { model: e.target.value })
                }
              >
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
            </div>
          </>
        );

      case "redisMemory":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Session ID
              </label>
              <input
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.sessionId ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { sessionId: e.target.value })
                }
                placeholder="Unique session identifier"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Max History
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={INPUT_CLASS}
                  //@ts-ignore
                  value={selectedNode.data.maxHistory ?? 10}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      maxHistory: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  TTL (seconds)
                </label>
                <input
                  type="number"
                  min="60"
                  max="86400"
                  className={INPUT_CLASS}
                  //@ts-ignore
                  value={selectedNode.data.ttl ?? 3600}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      ttl: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
          </>
        );

      case "httpTool":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                URL
              </label>
              <input
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.url ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { url: e.target.value })
                }
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Method
              </label>
              <select
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.method ?? "GET"}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { method: e.target.value })
                }
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </>
        );

      case "codeTool":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Language
              </label>
              <select
                className={INPUT_CLASS}
                //@ts-ignore
                value={selectedNode.data.language ?? "javascript"}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { language: e.target.value })
                }
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Code
              </label>
              <textarea
                className={INPUT_CLASS}
                rows={6}
                //@ts-ignore
                value={selectedNode.data.code ?? ""}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { code: e.target.value })
                }
                placeholder="// Your code here"
              />
            </div>
          </>
        );

      case "workflowTool":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Target Workflow
              </label>
              <select
                className={INPUT_CLASS}
                value={getNodeData("workflowId") || ""}
                onChange={(e) => {
                  const selectedWorkflow = workflows.find(
                    (w) => w._id === e.target.value
                  );
                  onUpdateNode(selectedNode.id, {
                    workflowId: e.target.value,
                    workflowTitle: selectedWorkflow?.title || "",
                  });
                }}
              >
                <option value="">Select a workflow</option>
                {workflows.map((workflow) => (
                  <option key={workflow._id} value={workflow._id}>
                    {workflow.title}{" "}
                    {workflow.enabled ? "(Active)" : "(Inactive)"}
                  </option>
                ))}
              </select>
              {getNodeData("workflowId") && (
                <div className="mt-1 text-xs text-gray-400">
                  Selected:{" "}
                  {String(getNodeData("workflowTitle") || "Unknown Workflow")}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Input Data (JSON)
              </label>
              <textarea
                className={INPUT_CLASS}
                rows={3}
                value={
                  getNodeData("inputData")
                    ? JSON.stringify(getNodeData("inputData"), null, 2)
                    : "{}"
                }
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    onUpdateNode(selectedNode.id, { inputData: parsed });
                  } catch {
                    onUpdateNode(selectedNode.id, {
                      inputDataRaw: e.target.value,
                    });
                  }
                }}
                placeholder='{"key": "value"}'
              />
            </div>
          </>
        );

      default:
        return commonFields;
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-gray-800 border border-gray-600 rounded-xl overflow-hidden">
      <div className="border-gray-700 px-4 py-3 border-b relative">
        <div className="flex items-center justify-center relative">
          <h3 className="font-semibold text-white text-center w-full">
            Node Settings
          </h3>
          <button
            className="absolute right-0 text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1 text-center">
          Configure your {selectedNode.type} node
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {renderNodeContent()}

        <div className="pt-4 border-t border-gray-600">
          <button
            onClick={onDeleteNode}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
