import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminLogin: React.FC = () => {
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const adminUsername = sessionStorage.getItem("admin_username") ?? "";
        if (token && adminUsername) {
          const response = await axios.post<{ valid: boolean }>(
            "/admin/validateToken",
            { token }
          );
          if (response.data.valid) {
            navigate("/login/admin/dashboard");
          }
        }
      } catch (error) {
        console.error("Error validating session:", error);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if username or password contains spaces
    if (adminUsername.includes(" ")) {
      setError("Username must not contain spaces.");
      return;
    }
    if (adminPassword.includes(" ")) {
      setError("Password must not contain spaces.");
      return;
    }

    try {
      const response = await axios.post("/login/admin", {
        admin_username: adminUsername,
        admin_password: adminPassword,
      });

      if (response.status === 200) {
        // Successful login
        const token = response.data.token;
        // Store the token in a cookie
        sessionStorage.setItem("token", token); // Store token in sessionStorage
        sessionStorage.setItem("admin_username", adminUsername); // Set expiration time for 1 day
        navigate("/login/admin/dashboard"); // Navigate to the dashboard
      }
    } catch (error: any) {
      // Handle error
      console.error("Login failed:", error.response.data.message);
      setError("Invalid Credentials or Unauthorize Access");
    }
  };

  return (
    <div className="bg-white rounded-md px-6 py-10 w-full sm:w-96 shadow-lg mt-1">
      <h3 className="text-center font-semibold font-serif text-xl">
        Admin Login Panel
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-2 py-4">
          <input
            type="text"
            className="rounded-md border-2 p-2"
            placeholder="Admin Username"
            required
            onChange={(e) => setAdminUsername(e.target.value)}
            value={adminUsername}
          />
          <input
            type="password"
            className="rounded-md border-2 p-2"
            placeholder="Admin Password"
            required
            onChange={(e) => setAdminPassword(e.target.value)}
            value={adminPassword}
          />
          {error && <p className="text-red-500">{error}</p>}

          <button
            className="my-2 rounded-md bg-sky-600/80 text-white px-6 py-3"
            type="submit"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;
