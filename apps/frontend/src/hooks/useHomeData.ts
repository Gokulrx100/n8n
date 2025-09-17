import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  data: Record<string, any>;
  createdAt: string;
}

export function useHomeData() {
  const [activeTab, setActiveTab] = useState<"workflows" | "credentials">("workflows");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialModel, setShowCredentialModel] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const navigate = useNavigate();

  const authHeaders = () => ({
    token: localStorage.getItem("token"),
  });

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError(null);
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

  const createCredential = async (credentialData: {
    title: string;
    platform: string;
    data: Record<string, any>;
  }) => {
    try {
      setCreating(true);
      await axios.post(`${BASE}/credentials`, credentialData, {
        headers: authHeaders(),
      });
      setShowCredentialModel(false);
      fetchCredentials();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create credential");
    } finally {
      setCreating(false);
    }
  };

  const editCredential = (credentialId: string) => {
    const credential = credentials.find((cred) => cred._id === credentialId);
    if (credential) {
      setEditingCredential(credential);
      setShowCredentialModel(true);
    }
  };

  const updateCredential = async (credentialId: string, credentialData: {
    title: string;
    platform: string;
    data: Record<string, any>;
  }) => {
    try {
      setCreating(true);
      await axios.put(`${BASE}/credentials/${credentialId}`, credentialData, {
        headers: authHeaders(),
      });
      setShowCredentialModel(false);
      setEditingCredential(null);
      fetchCredentials();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update credential");
    } finally {
      setCreating(false);
    }
  };

  const closeCredentialModel = () => {
    setShowCredentialModel(false);
    setEditingCredential(null);
  };

  const handleCreateNew = () => {
    if (activeTab === "workflows") {
      navigate("/create/workflow");
    } else {
      setShowCredentialModel(true);
    }
  };

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

  return {
    // State
    activeTab,
    workflows,
    credentials,
    loading,
    error,
    showCredentialModel,
    creating,
    editingCredential,
    // Actions
    setActiveTab,
    setShowCredentialModel,
    deleteWorkflow,
    deleteCredential,
    createCredential,
    updateCredential,
    editCredential,
    handleCreateNew,
    fetchWorkflows,
    fetchCredentials,
    closeCredentialModel,
  };
}