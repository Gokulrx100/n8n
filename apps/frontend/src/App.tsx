import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";

function isAuthenticated() {
  return !!localStorage.getItem("jwt");
}

function RootRedirect() {
  return <Navigate to={isAuthenticated() ? "/workflows" : "/signin"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Placeholder route for when you add workflows page */}
        <Route path="/workflows" element={
          isAuthenticated() ? <div className="p-6">Workflows placeholder (add page later)</div> : <Navigate to="/signin" replace />
        } />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
