interface Credential {
  _id: string;
  title: string;
  platform: string;
  createdAt: string;
}

interface CredentialsListProps {
  credentials: Credential[];
  loading: boolean;
  onDelete: (credentialId: string) => void;
  onEdit: (credentialId: string) => void;
  onCreateNew: () => void;
}

export default function CredentialsList({ 
  credentials, 
  loading, 
  onDelete, 
  onEdit, 
  onCreateNew 
}: CredentialsListProps) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Loading credentials...</p>
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">No credentials found</p>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
        >
          Add Your First Credential
        </button>
      </div>
    );
  }

  return (
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
                onClick={() => onEdit(credential._id)}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(credential._id)}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}