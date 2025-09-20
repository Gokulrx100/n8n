import TopNav from "../components/TopNav";
import HomeHeader from "../components/home/HomeHeader";
import WorkflowsList from "../components/home/WorkflowsList";
import CredentialsList from "../components/home/CredentialsList";
import CredentialModel from "../components/home/CredentialModel";
import { useHomeData } from "../hooks/useHomeData";

export default function Home() {
  const {
    activeTab,
    workflows,
    credentials,
    loading,
    error,
    showCredentialModel,
    creating,
    editingCredential,
    itemsCount,
    setActiveTab,
    deleteWorkflow,
    deleteCredential,
    createCredential,
    updateCredential,
    editCredential,
    handleCreateNew,
    closeCredentialModel,
  } = useHomeData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-6xl mx-auto p-6">
        <HomeHeader 
          activeTab={activeTab} 
          itemsCount={itemsCount} 
          onCreateNew={handleCreateNew} 
        />

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-md p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {activeTab === "workflows" ? (
          <WorkflowsList
            workflows={workflows}
            loading={loading}
            onDelete={deleteWorkflow}
          />
        ) : (
          <CredentialsList
            credentials={credentials}
            loading={loading}
            onDelete={deleteCredential}
            onEdit={editCredential}
            onCreateNew={handleCreateNew}
          />
        )}

        <CredentialModel
          isOpen={showCredentialModel}
          creating={creating}
          editingCredential={editingCredential}
          onClose={closeCredentialModel}
          onSubmit={createCredential}
          onUpdate={updateCredential}
        />
      </main>
    </div>
  );
}