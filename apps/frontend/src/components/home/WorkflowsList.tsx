import { useNavigate } from "react-router-dom";
import { memo } from "react";

interface Workflow {
  _id: string;
  title: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowsListProps {
  workflows: Workflow[];
  loading: boolean;
  onDelete: (workflowId: string) => void;
}

const WorkflowsList = memo(({ workflows, loading, onDelete }: WorkflowsListProps) => {
  const navigate = useNavigate();

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
        <p className="text-gray-400">Loading workflows...</p>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">No workflows found</p>
        <button
          onClick={() => navigate("/create/workflow")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
        >
          Create Your First Workflow
        </button>
      </div>
    );
  }

  return (
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
                onClick={() => navigate(`/create/workflow/${workflow._id}`)}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(workflow._id)}
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
});

export default WorkflowsList;