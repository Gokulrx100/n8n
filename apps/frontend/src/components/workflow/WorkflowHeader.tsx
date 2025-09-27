import { ArrowLeft, Edit2, Check, X } from "lucide-react";
import { useState, useEffect } from "react";

interface WorkflowHeaderProps {
  title: string;
  saving: boolean;
  nodesCount: number;
  onBack: () => void;
  onSave: () => void;
  onUpdateTitle?: (newTitle: string) => void;
  isEditing?: boolean;
}

export default function WorkflowHeader({ 
  title, 
  saving, 
  nodesCount, 
  onBack, 
  onSave, 
  onUpdateTitle,
  isEditing = false
}: WorkflowHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  const handleTitleSave = () => {
    if (editTitle.trim() && onUpdateTitle) {
      onUpdateTitle(editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(title);
    setIsEditingTitle(false);
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">Back</span>
      </button>

      <div className="flex items-center gap-2">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') handleTitleCancel();
              }}
            />
            <button
              onClick={handleTitleSave}
              className="p-1 text-green-400 hover:text-green-300"
            >
              <Check size={16} />
            </button>
            <button
              onClick={handleTitleCancel}
              className="p-1 text-red-400 hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white">{title || "Untitled Workflow"}</h1>
            {onUpdateTitle && (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onSave}
        disabled={saving || nodesCount === 0}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          saving || nodesCount === 0
            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {saving ? "Saving…" : isEditing ? "Update" : "Save"}
      </button>
    </div>
  );
}