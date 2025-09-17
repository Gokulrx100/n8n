interface ToolBoxSidebarProps {
  onAddNode: (type: string) => void;
}

export default function ToolBoxSidebar({ onAddNode }: ToolBoxSidebarProps) {
  return (
    <div className="absolute top-4 left-4 w-64 bg-gray-800 border border-gray-600 rounded-xl overflow-hidden z-10">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-600 text-center">
        <h3 className="font-semibold text-white">ToolBox</h3>
        <div className="text-xs text-gray-400 mt-1">Build your workflow</div>
      </div>
      
      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Triggers</h4>
          <div className="space-y-2">
            <button
              onClick={() => onAddNode("manualTrigger")}
              className="w-full p-3 bg-green-900/50 hover:bg-green-800/60 border border-green-700/50 rounded-lg text-left text-green-200 transition-colors"
            >
              <div className="font-medium">Manual</div>
              <div className="text-xs text-green-300/70">Start manually</div>
            </button>
            <button
              onClick={() => onAddNode("webhookTrigger")}
              className="w-full p-3 bg-indigo-900/50 hover:bg-indigo-800/60 border border-indigo-700/50 rounded-lg text-left text-indigo-200 transition-colors"
            >
              <div className="font-medium">Webhook</div>
              <div className="text-xs text-indigo-300/70">HTTP endpoint</div>
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => onAddNode("telegramAction")}
              className="w-full p-3 bg-blue-900/50 hover:bg-blue-800/60 border border-blue-700/50 rounded-lg text-left text-blue-200 transition-colors"
            >
              <div className="font-medium">Telegram</div>
              <div className="text-xs text-blue-300/70">Send message</div>
            </button>
            <button
              onClick={() => onAddNode("emailAction")}
              className="w-full p-3 bg-rose-900/50 hover:bg-rose-800/60 border border-rose-700/50 rounded-lg text-left text-rose-200 transition-colors"
            >
              <div className="font-medium">Email</div>
              <div className="text-xs text-rose-300/70">Send via Resend</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}