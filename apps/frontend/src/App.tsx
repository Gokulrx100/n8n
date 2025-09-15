import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
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
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/create/workflow" element={<Workflow />} />
        <Route path="/create/workflow/:id" element={<Workflow />}/>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
