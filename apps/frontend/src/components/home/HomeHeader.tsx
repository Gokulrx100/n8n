interface HomeHeaderProps {
  activeTab: "workflows" | "credentials";
  itemsCount: number;
  onCreateNew: () => void;
}

export default function HomeHeader({ activeTab, itemsCount, onCreateNew }: HomeHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-white">
        {activeTab === "workflows" ? "Workflows" : "Credentials"}
      </h1>

      {itemsCount > 0 && (
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm font-medium"
        >
          {activeTab === "workflows" ? "Create New Workflow" : "Add New Credential"}
        </button>
      )}
    </div>
  );
}