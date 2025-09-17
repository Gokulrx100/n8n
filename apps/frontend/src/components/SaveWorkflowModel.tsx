import { X } from "lucide-react";

interface SaveWorkflowModelProps {
  isOpen: boolean;
  title: string;
  saving: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  onTitleChange: (title: string) => void;
}

const INPUT_CLASS = "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const CANCEL_BUTTON_CLASS = "px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg transition-colors";

export default function SaveWorkflowModel({ 
  isOpen, 
  title, 
  saving, 
  onClose, 
  onSave, 
  onTitleChange 
}: SaveWorkflowModelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[480px] bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Save Workflow</h3>
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Workflow Title
            </label>
            <input
              className={INPUT_CLASS}
              placeholder="Enter a title for your workflow..."
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="bg-gray-750 px-6 py-4 border-t border-gray-600 flex justify-end gap-3">
          <button className={CANCEL_BUTTON_CLASS} onClick={onClose}>
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !title.trim() || saving
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            onClick={() => onSave(title)}
            disabled={!title.trim() || saving}
          >
            {saving ? "Saving..." : "Save Workflow"}
          </button>
        </div>
      </div>
    </div>
  );
}