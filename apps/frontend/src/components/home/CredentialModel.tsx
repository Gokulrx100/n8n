import { useState, useEffect, memo } from "react";

interface Credential {
  _id: string;
  title: string;
  platform: string;
  data: Record<string, any>;
  createdAt: string;
}

interface CredentialModelProps {
  isOpen: boolean;
  creating: boolean;
  editingCredential?: Credential | null;
  onClose: () => void;
  onSubmit: (credentialData: {
    title: string;
    platform: string;
    data: Record<string, any>;
  }) => void;
  onUpdate?: (credentialId: string, credentialData: {
    title: string;
    platform: string;
    data: Record<string, any>;
  }) => void;
}

const CredentialModel = memo(({ 
  isOpen, 
  creating, 
  editingCredential,
  onClose, 
  onSubmit,
  onUpdate
}: CredentialModelProps) => {
  const [credentialPlatform, setCredentialPlatform] = useState<"email" | "telegram">("email");
  const [credTitle, setCredTitle] = useState("");
  const [botToken, setBotToken] = useState("");
  const [emailAddr, setEmailAddr] = useState("");
  const [appPassword, setAppPassword] = useState("");

  const isEditing = !!editingCredential;

  useEffect(() => {
    if (editingCredential) {
      setCredTitle(editingCredential.title);
      setCredentialPlatform(editingCredential.platform as "email" | "telegram");
      
      if (editingCredential.platform === "telegram") {
        setBotToken(editingCredential.data.botToken || "");
      } else if (editingCredential.platform === "email") {
        setEmailAddr(editingCredential.data.email || "");
        setAppPassword(editingCredential.data.appPassword || "");
      }
    }
  }, [editingCredential]);

  const resetForm = () => {
    setCredTitle("");
    setBotToken("");
    setEmailAddr("");
    setAppPassword("");
    setCredentialPlatform("email");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!credTitle.trim()) {
      alert("Please enter a title for the credential");
      return;
    }

    if (credentialPlatform === "telegram" && !botToken.trim()) {
      alert("Please provide the Telegram Bot Token");
      return;
    }

    if (credentialPlatform === "email" && (!emailAddr.trim() || !appPassword.trim())) {
      alert("Please provide both email and app password");
      return;
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
      platform: credentialPlatform === "telegram" ? "telegram" : "email",
      data: dataPayload,
    };

    if (isEditing && editingCredential && onUpdate) {
      onUpdate(editingCredential._id, payload);
    } else {
      onSubmit(payload);
    }
    
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 w-full max-w-md rounded-lg shadow-lg p-6 relative">
        <h2 className="text-xl font-semibold text-white mb-4">
          {isEditing ? "Edit Credential" : "Add New Credential"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Title</label>
            <input
              value={credTitle}
              onChange={(e) => setCredTitle(e.target.value)}
              required
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Platform</label>
            <select
              value={credentialPlatform}
              onChange={(e) => setCredentialPlatform(e.target.value as "email" | "telegram")}
              required
              disabled={isEditing}
              className={`w-full p-2 rounded bg-gray-700 text-white border border-gray-600 ${
                isEditing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <option value="email">Email (Gmail)</option>
              <option value="telegram">Telegram</option>
            </select>
            {isEditing && (
              <p className="text-xs text-gray-400 mt-1">
                Platform cannot be changed when editing
              </p>
            )}
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
                  type="password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  required
                  placeholder={isEditing ? "Leave blank to keep current password" : ""}
                />
                {isEditing ? (
                  <p className="text-xs text-gray-400 mt-1">
                    Leave blank to keep the current password
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    Generate an app password in your Google Account settings under "2-Step Verification"
                  </p>
                )}
              </div>
            </>
          )}

          {credentialPlatform === "telegram" && (
            <div>
              <label className="block text-gray-300 text-sm mb-1">
                Telegram Bot Token
              </label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                required
                placeholder={isEditing ? "Leave blank to keep current token" : ""}
              />
              {isEditing ? (
                <p className="text-xs text-gray-400 mt-1">
                  Leave blank to keep the current token
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  Get this token from <strong>@BotFather</strong> on Telegram.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
            >
              {creating ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update" : "Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default CredentialModel;