import { useNavigate } from "react-router-dom";

interface TopNavProps {
  activeTab: "workflows" | "credentials";
  setActiveTab?: (tab: "workflows" | "credentials") => void;
}

export default function TopNav({ activeTab, setActiveTab }: TopNavProps) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/signin", { replace: true });
  };

  const base = "px-4 py-2 rounded text-base font-medium cursor-pointer";
  const active = "text-white bg-gray-800 shadow-sm";
  const inactive = "text-gray-300 hover:text-white hover:bg-gray-800";

  return (
    <header className="w-full bg-gray-900 border-b border-gray-800">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-indigo-400">N8N</span>
          <span className="text-sm text-gray-400">clone</span>
        </div>

        <nav className="flex items-center gap-25">
          <button
            onClick={() => setActiveTab?.("workflows")}
            className={`${base} ${
              activeTab === "workflows" ? active : inactive
            }`}
          >
            Workflows
          </button>

          <button
            onClick={() => setActiveTab?.("credentials")}
            className={`${base} ${
              activeTab === "credentials" ? active : inactive
            }`}
          >
            Credentials
          </button>

          <button
            className="px-4 py-2 rounded text-sm text-gray-500 cursor-not-allowed opacity-60"
            title="Executions are disabled in V0"
            disabled
          >
            Executions
          </button>
        </nav>

        <div className="flex items-center gap-6">
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
