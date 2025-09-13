import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TopNav from "../components/TopNav";

const BASE = import.meta.env.VITE_BASE_API!;

interface Workflow {
  _id: string;
  title: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Credential {
  _id: string;
  title: string;
  platform: string;
  createdAt: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"workflows" | "credentials">(
    "workflows"
  );
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false); // NEW
  const navigate = useNavigate();
  const [credentialPlatform, setCredentialPlatform] = useState<
    "email" | "telegram"
  >("email");
  const [credTitle, setCredTitle] = useState("");
  const [botToken, setBotToken] = useState("");
  const [emailAddr, setEmailAddr] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const authHeaders = () => ({
    token: localStorage.getItem("token"),
  });

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE}/workflow`, {
        headers: authHeaders(),
      });
      setWorkflows(response.data.workflows || []);
    } catch (err: any) {
      console.error("Error fetching workflows:", err);
      setError("Failed to fetch workflows");
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE}/credentials`, {
        headers: authHeaders(),
      });
      setCredentials(response.data.credentials || []);
    } catch (err: any) {
      console.error("Error fetching credentials:", err);
      setError("Failed to fetch credentials");
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      await axios.delete(`${BASE}/workflow/${workflowId}`, {
        headers: authHeaders(),
      });
      setWorkflows(workflows.filter((wf) => wf._id !== workflowId));
    } catch {
      alert("Failed to delete workflow");
    }
  };

  const deleteCredential = async (credentialId: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;
    try {
      await axios.delete(`${BASE}/credentials/${credentialId}`, {
        headers: authHeaders(),
      });
      setCredentials(credentials.filter((cred) => cred._id !== credentialId));
    } catch {
      alert("Failed to delete credential");
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  useEffect(() => {
    if (activeTab === "workflows") {
      fetchWorkflows();
    } else {
      fetchCredentials();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const showTopButton =
    activeTab === "workflows" ? workflows.length > 0 : credentials.length > 0;

  return (
    <>
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">
            {activeTab === "workflows" ? "Workflows" : "Credentials"}
          </h1>

          {showTopButton && (
            <button
              onClick={() => {
                if (activeTab === "workflows") {
                  navigate("/create/workflow");
                } else {
                  setShowCredentialModal(true); // OPEN MODAL
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm font-medium"
            >
              {activeTab === "workflows"
                ? "Create New Workflow"
                : "Add New Credential"}
            </button>
          )}
        </div>

        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading {activeTab}...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-md p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Workflows List */}
        {activeTab === "workflows" && !loading && (
          <>
            {workflows.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No workflows found</p>
                <button
                  onClick={() => navigate("/create/workflow")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  Create Your First Workflow
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div
                    key={workflow._id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-white mb-1">
                          {workflow.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Created: {formatDate(workflow.createdAt)}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              workflow.enabled
                                ? "bg-green-900 text-green-300"
                                : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {workflow.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/create/workflow?id=${workflow._id}`)
                          }
                          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteWorkflow(workflow._id)}
                          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Credentials List */}
        {activeTab === "credentials" && !loading && (
          <>
            {credentials.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No credentials found</p>
                <button
                  onClick={() => setShowCredentialModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  Add Your First Credential
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {credentials.map((credential) => (
                  <div
                    key={credential._id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-white mb-1">
                          {credential.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-1">
                          Platform: {credential.platform}
                        </p>
                        <p className="text-sm text-gray-400">
                          Created: {formatDate(credential.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            alert("Edit credential functionality coming soon!")
                          }
                          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCredential(credential._id)}
                          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/*Credential Creation*/}
        {showCredentialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-gray-800 w-full max-w-md rounded-lg shadow-lg p-6 relative">
              <h2 className="text-xl font-semibold text-white mb-4">
                Add New Credential
              </h2>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);

                  if (!credTitle.trim())
                    return alert("Please enter a title for the credential");

                  if (credentialPlatform === "telegram" && !botToken.trim()) {
                    return alert("Please provide the Telegram Bot Token");
                  }

                  if (
                    credentialPlatform === "email" &&
                    (!emailAddr.trim() || !appPassword.trim())
                  ) {
                    return alert("Please provide both email and app password");
                  }

                  const dataPayload: Record<string, any> =
                    credentialPlatform === "telegram"
                      ? { botToken: botToken.trim() }
                      : {
                          email: emailAddr.trim(),
                          appPassword: appPassword.trim(),
                        };

                  const payload = {
                    title: credTitle.trim(),
                    platform:
                      credentialPlatform === "telegram" ? "telegram" : "email",
                    data: dataPayload,
                  };

                  try {
                    setCreating(true);
                    await axios.post(`${BASE}/credentials`, payload, {
                      headers: authHeaders(),
                    });
                    setShowCredentialModal(false);
                    setCredTitle("");
                    setBotToken("");
                    setEmailAddr("");
                    setAppPassword("");
                    setCredentialPlatform("email");
                    fetchCredentials();
                  } catch (err: any) {
                    console.error(err);
                    alert(
                      err?.response?.data?.message ||
                        "Failed to create credential"
                    );
                  } finally {
                    setCreating(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-gray-300 text-sm mb-1">
                    Title
                  </label>
                  <input
                    value={credTitle}
                    onChange={(e) => setCredTitle(e.target.value)}
                    required
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-1">
                    Platform
                  </label>
                  <select
                    value={credentialPlatform}
                    onChange={(e) =>
                      setCredentialPlatform(
                        e.target.value as "email" | "telegram"
                      )
                    }
                    required
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  >
                    <option value="email">Email (Resend)</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>

                {credentialPlatform === "email" && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">
                        Email (sender)
                      </label>
                      <input
                        type="email"
                        value={emailAddr}
                        onChange={(e) => setEmailAddr(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 text-sm mb-1">
                        App Password
                      </label>
                      <input
                        type="text"
                        value={appPassword}
                        onChange={(e) => setAppPassword(e.target.value)}
                        className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                        required
                      />
                    </div>
                  </>
                )}

                {credentialPlatform === "telegram" && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">
                      Telegram Bot Token
                    </label>
                    <input
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Get this token from <strong>@BotFather</strong> on
                      Telegram.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCredentialModal(false);
                      setCredentialPlatform("email");
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                  >
                    {creating ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
