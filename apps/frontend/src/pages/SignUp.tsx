import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router";

const BASE = import.meta.env.VITE_BASE_API!;

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return setError("Provide email and password");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    try {
      setBusy(true);
      await axios.post(`${BASE}/auth/signup`, { email, password });
      const signinRes = await axios.post(`${BASE}/auth/signin`, { email, password });
      const token = signinRes.data?.token;
      if (!token) throw new Error(signinRes.data?.message || "No token returned after signup");
      localStorage.setItem("jwt", token);
      navigate("/workflows", { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Sign up failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
      <form onSubmit={submit} className="w-full max-w-md p-6 rounded bg-gray-800 shadow">
        <h1 className="text-2xl mb-4 text-center">Sign up</h1>

        {error && <div className="mb-3 text-sm text-red-400">{error}</div>}

        <label className="block mb-2">
          <div className="text-sm text-gray-300">Email</div>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-700 rounded"
            type="email"
            required
          />
        </label>

        <label className="block mb-4">
          <div className="text-sm text-gray-300">Password</div>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mt-1 p-2 bg-gray-700 rounded"
            type="password"
            required
          />
        </label>

        <button type="submit" disabled={busy} className="w-full p-2 bg-orange-600 rounded">
          {busy ? "Creating..." : "Create account"}
        </button>

        <p className="mt-3 text-sm text-gray-400 text-center">
          Already have an account? <Link to="/signin" className="text-orange-400">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
