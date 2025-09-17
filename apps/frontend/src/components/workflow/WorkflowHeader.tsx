import { ArrowLeft } from "lucide-react";

interface WorkflowHeaderProps {
  title: string;
  saving: boolean;
  nodesCount: number;
  onBack: () => void;
  onSave: () => void;
}

export default function WorkflowHeader({ title, saving, nodesCount, onBack, onSave }: WorkflowHeaderProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Back</span>
        </button>
        <div className="w-px h-6 bg-gray-600"></div>
        <h2 className="text-lg font-semibold text-white">Workflow Editor</h2>
        {title && <span className="text-sm text-gray-400">({title})</span>}
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
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}