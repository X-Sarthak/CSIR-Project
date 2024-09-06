import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Spinner from "../Utility/Spinner.Utility";

const SuperadminLogin: React.FC = () => {
  const [superadminUsername, setSuperadminUsername] = useState("");
  const [superadminPassword, setSuperadminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); 

  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const superadminUsername =
          sessionStorage.getItem("superadmin_username") ?? "";

        if (token && superadminUsername) {
          const response = await axios.post<{ valid: boolean }>(
            "/superadmin/validateToken",
            { token },
            {
              headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
              }
            }
          );
          if (response.data.valid) {
            navigate("/superadmin/login/dashboard");
          }
        }
      } catch (error) {
        console.error("Error validating session:", error);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true); // Set loading to true when login request starts

    // Check for spaces in the input
    if (superadminUsername.includes(" ") || superadminPassword.includes(" ")) {
      setError("Spaces are not allowed in the input fields.");
      setLoading(false); 
      return;
    }

    try {
      const response = await axios.post<{ message: string; token: string }>(
        "/superadmin",
        {
          superadmin_username: superadminUsername,
          superadmin_password: superadminPassword,
        },
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          }
        }
      );
      if (response.status === 200) {
        // Store token securely in session storage
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("superadmin_username", superadminUsername); // Set expiration time for 1 day

        navigate("/superadmin/login/dashboard");
      }
     
    } catch (error: any) {
      console.error("Login failed:", error.message);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 h-screen flex items-center justify-center p-4 relative">
      {loading && <Spinner/>}
      <div className={`bg-white rounded-md px-6 py-10 w-full sm:w-96 shadow-lg ${loading ? 'opacity-20' : ''}`}>
        <h3 className="text-center font-semibold font-serif text-xl">
          Super Admin Login Panel
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-2 py-4">
            <input
              type="text"
              className="rounded-md border-2 p-2 w-full"
              placeholder="Username"
              required
              value={superadminUsername}
              onChange={(e) => setSuperadminUsername(e.target.value)}
            />
            <input
              type="password"
              className="rounded-md border-2 p-2 w-full"
              placeholder="Password"
              required
              value={superadminPassword}
              onChange={(e) => setSuperadminPassword(e.target.value)}
            />
            {error && <p className="text-red-500">{error}</p>}

            <button
              className="rounded-md bg-blue-500 text-white px-4 py-2"
              type="submit"
              disabled={loading}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperadminLogin;
