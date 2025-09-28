import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Workflow from "./pages/Workflow";

function isAuthenticated() {
  return !!localStorage.getItem("token");
}

function RootRedirect() {
  return <Navigate to={isAuthenticated() ? "/Home" : "/signin"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/signin" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/create/workflow" element={<Workflow />} />
        <Route path="/create/workflow/:id" element={<Workflow />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster
        position="bottom-right"
        reverseOrder={true}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
          },
          success: {
            style: {
              background: "#059669",
            },
          },
          error: {
            style: {
              background: "#dc2626",
            },
          },
        }}
      />
    </BrowserRouter>
  );
}
