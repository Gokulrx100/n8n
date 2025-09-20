import { X } from "lucide-react";
import { memo } from "react";

interface AddNodeModelProps {
  isOpen: boolean;
  modelType: string | null;
  modelData: Record<string, any>;
  credentials: any[];
  onClose: () => void;
  onSubmit: () => void;
  onDataChange: (updates: Record<string, any>) => void;
}

const INPUT_CLASS = "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const BUTTON_CLASS = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors";
const CANCEL_BUTTON_CLASS = "px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg transition-colors";

const AddNodeModel = memo(({
  isOpen,
  modelType,
  modelData,
  credentials,
  onClose,
  onSubmit,
  onDataChange
}: AddNodeModelProps) => {
  if (!isOpen || !modelType) return null;

  const telegramCreds = credentials.filter((c) =>
    (c.platform ?? "").toLowerCase().includes("telegram")
  );
  const emailCreds = credentials.filter((c) =>
    ["resend", "email", "smtp"].some((p) =>
      String(c.platform ?? "").toLowerCase().includes(p)
    )
  );

  const renderModelContent = () => {
    const commonFields = (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Label</label>
        <input
          className={INPUT_CLASS}
          value={modelData.label ?? ""}
          onChange={(e) => onDataChange({ label: e.target.value })}
        />
      </div>
    );

    switch (modelType) {
      case "manualTrigger":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payload (JSON or text)
              </label>
              <textarea
                className={INPUT_CLASS}
                rows={4}
                value={modelData.payload ?? ""}
                onChange={(e) => onDataChange({ payload: e.target.value })}
              />
            </div>
          </>
        );

      case "webhookTrigger":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">HTTP Method</label>
              <select
                className={INPUT_CLASS}
                value={modelData.method ?? "POST"}
                onChange={(e) => onDataChange({ method: e.target.value })}
              >
                <option>POST</option>
                <option>GET</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Path (unique fragment)
              </label>
              <input
                className={INPUT_CLASS}
                value={modelData.path ?? ""}
                onChange={(e) => onDataChange({ path: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">
                If empty, a unique path will be generated.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secret (optional)
              </label>
              <input
                className={INPUT_CLASS}
                value={modelData.secret ?? ""}
                onChange={(e) => onDataChange({ secret: e.target.value })}
              />
            </div>
          </>
        );

      case "telegramAction":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Credential</label>
              <select
                className={INPUT_CLASS}
                value={modelData.credentialId ?? ""}
                onChange={(e) => onDataChange({ credentialId: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Chat ID (optional)
              </label>
              <input
                className={INPUT_CLASS}
                value={modelData.chatId ?? ""}
                onChange={(e) => onDataChange({ chatId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
              <textarea
                className={INPUT_CLASS}
                rows={3}
                value={modelData.message ?? ""}
                onChange={(e) => onDataChange({ message: e.target.value })}
              />
            </div>
          </>
        );

      case "emailAction":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Credential</label>
              <select
                className={INPUT_CLASS}
                value={modelData.credentialId ?? ""}
                onChange={(e) => onDataChange({ credentialId: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                To (optional, taken from trigger if empty)
              </label>
              <input
                className={INPUT_CLASS}
                value={modelData.to ?? ""}
                onChange={(e) => onDataChange({ to: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
              <input
                className={INPUT_CLASS}
                value={modelData.subject ?? ""}
                onChange={(e) => onDataChange({ subject: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Body</label>
              <textarea
                className={INPUT_CLASS}
                rows={3}
                value={modelData.body ?? ""}
                onChange={(e) => onDataChange({ body: e.target.value })}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[560px] bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Add {modelType}</h3>
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {renderModelContent()}
        </div>
        <div className="bg-gray-750 px-6 py-4 border-t border-gray-600 flex justify-end gap-3">
          <button className={CANCEL_BUTTON_CLASS} onClick={onClose}>
            Cancel
          </button>
          <button className={BUTTON_CLASS} onClick={onSubmit}>
            Add Node
          </button>
        </div>
      </div>
    </div>
  );
});

export default AddNodeModel;