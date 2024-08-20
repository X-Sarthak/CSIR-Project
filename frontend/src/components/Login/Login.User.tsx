import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserLogin: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPassword, setUserPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const userEmail = sessionStorage.getItem("user_email") ?? "";
        if (token && userEmail) {
          const response = await axios.post<{ valid: boolean }>(
            "/user/validateToken",
            { token }
          );
          if (response.data.valid) {
            navigate("/login/user/dashboard");
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
    if (userEmail.includes(" ")) {
      setError("Username must not contain spaces.");
      return;
    }
    if (userPassword.includes(" ")) {
      setError("Password must not contain spaces.");
      return;
    }

    try {
      const response = await axios.post("/login/user", {
        user_email: userEmail,
        user_password: userPassword,
      });

      if (response.status === 200) {
        // Successful login
        const token = response.data.token;
        // Store the token in a cookie
        sessionStorage.setItem("token", token); // Set expiration time for 1 day
        sessionStorage.setItem("user_email", userEmail); // Set expiration time for 1 day
        navigate("/login/user/dashboard"); // Navigate to the dashboard
      }
    } catch (error: any) {
      // Handle error
      console.error("Login failed:", error.response.data.message);
      setError("Invalid Credentials or Unauthorized Access");
    }
  };

  return (
    <div className="bg-white rounded-md px-6 py-10 w-full sm:w-96 shadow-lg mt-1">
      <h3 className="text-center font-semibold font-serif text-xl">
        User Login Panel
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-2 py-4">
          <input
            type="email"
            className="rounded-md border-2 p-2"
            placeholder="User Email"
            required
            onChange={(e) => setUserEmail(e.target.value)}
            value={userEmail}
          />
          <input
            type="password"
            className="rounded-md border-2 p-2"
            placeholder="User Password"
            required
            onChange={(e) => setUserPassword(e.target.value)}
            value={userPassword}
          />
          {error && <p className="text-red-500">{error}</p>}
          <button
            className="my-2 rounded-md bg-purple-500 text-white px-6 py-3"
            type="submit"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserLogin;
