import { useState, useEffect, useMemo, useCallback } from "react";
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

  const authHeaders = useCallback(() => ({
    token: localStorage.getItem("token"),
  }), []);

  const fetchWorkflows = useCallback(async () => {
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
  }, [authHeaders]);

  const fetchCredentials = useCallback(async () => {
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
  }, [authHeaders]);

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      await axios.delete(`${BASE}/workflow/${workflowId}`, {
        headers: authHeaders(),
      });
      setWorkflows(prev => prev.filter((wf) => wf._id !== workflowId));
    } catch {
      alert("Failed to delete workflow");
    }
  }, [authHeaders]);

  const deleteCredential = useCallback(async (credentialId: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;
    try {
      await axios.delete(`${BASE}/credentials/${credentialId}`, {
        headers: authHeaders(),
      });
      setCredentials(prev => prev.filter((cred) => cred._id !== credentialId));
    } catch {
      alert("Failed to delete credential");
    }
  }, [authHeaders]);

  const createCredential = useCallback(async (credentialData: {
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
  }, [authHeaders, fetchCredentials]);

  const editCredential = useCallback((credentialId: string) => {
    const credential = credentials.find((cred) => cred._id === credentialId);
    if (credential) {
      setEditingCredential(credential);
      setShowCredentialModel(true);
    }
  }, [credentials]);

  const updateCredential = useCallback(async (credentialId: string, credentialData: {
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
  }, [authHeaders, fetchCredentials]);

  const closeCredentialModel = useCallback(() => {
    setShowCredentialModel(false);
    setEditingCredential(null);
  }, []);

  const handleCreateNew = useCallback(() => {
    if (activeTab === "workflows") {
      navigate("/create/workflow");
    } else {
      setShowCredentialModel(true);
    }
  }, [activeTab, navigate]);

  useEffect(() => {
    if (activeTab === "workflows") {
      fetchWorkflows();
    } else {
      fetchCredentials();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Memoize expensive calculations
  const itemsCount = useMemo(() => 
    activeTab === "workflows" ? workflows.length : credentials.length,
    [activeTab, workflows.length, credentials.length]
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    activeTab,
    workflows,
    credentials,
    loading,
    error,
    showCredentialModel,
    creating,
    editingCredential,
    itemsCount,
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
  }), [
    activeTab,
    workflows,
    credentials,
    loading,
    error,
    showCredentialModel,
    creating,
    editingCredential,
    itemsCount,
  ]);
}