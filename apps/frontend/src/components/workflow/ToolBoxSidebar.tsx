// apps/frontend/src/components/workflow/ToolBoxSidebar.tsx
import { memo, useState } from "react";
import { 
  Play, 
  Webhook, 
  Send,
  MessageSquare, 
  Mail, 
  Bot, 
  Cpu, 
  Database, 
  Globe, 
  Code, 
  Workflow,
  ChevronDown,
} from "lucide-react";

interface ToolBoxSidebarProps {
  onAddNode: (type: string) => void;
}

const ToolBoxSidebar = memo(({ onAddNode }: ToolBoxSidebarProps) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    // If clicking the same section, close it. Otherwise, open the new section
    setExpandedSection(prev => prev === section ? null : section);
  };

  const sections = [
    {
      id: "triggers",
      title: "Triggers",
      icon: <Play size={16} />,
      color: "text-green-400",
      items: [
        {
          type: "manualTrigger",
          label: "Manual",
          description: "Start manually",
          icon: <Play size={16} />,
          color: "bg-green-500"
        },
        {
          type: "webhookTrigger", 
          label: "Webhook",
          description: "HTTP endpoint",
          icon: <Webhook size={16} />,
          color: "bg-yellow-500"
        }
      ]
    },
    {
      id: "actions",
      title: "Actions", 
      icon: <MessageSquare size={16} />,
      color: "text-blue-400",
      items: [
        {
          type: "telegramAction",
          label: "Telegram",
          description: "Send message",
          icon: <Send size={16} />,
          color: "bg-blue-500"
        },
        {
          type: "emailAction",
          label: "Email", 
          description: "Send via Resend",
          icon: <Mail size={16} />,
          color: "bg-orange-400"
        }
      ]
    },
    {
      id: "aiAgent",
      title: "AI Agent",
      icon: <Bot size={16} />,
      color: "text-purple-400",
      items: [
        {
          type: "aiAgent",
          label: "AI Agent",
          description: "AI-powered automation",
          icon: <Bot size={16} />,
          color: "bg-white"
        }
      ]
    },
    {
      id: "aiComponents",
      title: "AI Components",
      icon: <Cpu size={16} />,
      color: "text-orange-400",
      items: [
        {
          type: "geminiModel",
          label: "Gemini Model",
          description: "AI model configuration",
          icon: <Cpu size={16} />,
          color: "bg-red-400"
        },
        {
          type: "redisMemory",
          label: "Redis Memory",
          description: "Conversation memory",
          icon: <Database size={16} />,
          color: "bg-red-500"
        }
      ]
    },
    {
      id: "aiTools",
      title: "AI Tools",
      icon: <Code size={16} />,
      color: "text-red-400",
      items: [
        {
          type: "httpTool",
          label: "HTTP Tool",
          description: "Make HTTP requests",
          icon: <Globe size={16} />,
          color: "bg-purple-500"
        },
        {
          type: "codeTool",
          label: "Code Tool",
          description: "Execute custom code",
          icon: <Code size={16} />,
          color: "bg-green-600"
        },
        {
          type: "workflowTool",
          label: "Workflow Tool",
          description: "Call another workflow",
          icon: <Workflow size={16} />,
          color: "bg-blue-600"
        }
      ]
    }
  ];

  return (
    <div className="absolute left-4 top-20 w-64 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl z-10 max-h-[calc(100vh-6rem)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white text-center">ToolBox</h3>
      </div>

      {/* Collapsible Sections */}
      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
        {sections.map((section) => {
          const isExpanded = expandedSection === section.id;
          
          return (
            <div key={section.id} className="border-b border-gray-700 last:border-b-0">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={section.color}>
                    {section.icon}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {section.title}
                  </span>
                </div>
                <div className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                  <ChevronDown size={16} />
                </div>
              </button>

              {/* Section Items with Smooth Animation */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 pb-3 space-y-2">
                  {section.items.map((item, index) => (
                    <button
                      key={item.type}
                      onClick={() => onAddNode(item.type)}
                      className="w-full p-3 rounded-lg hover:bg-gray-700/50 transition-all duration-200 text-left group transform hover:scale-[1.02]"
                      style={{
                        animationDelay: isExpanded ? `${index * 50}ms` : '0ms',
                        animation: isExpanded ? 'slideInFromTop 0.3s ease-out forwards' : 'none'
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${item.color} group-hover:scale-110 transition-transform duration-200`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {item.label}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

ToolBoxSidebar.displayName = "ToolBoxSidebar";

export default ToolBoxSidebar;