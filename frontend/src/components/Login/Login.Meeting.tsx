import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MeetingLogin: React.FC = () => {
  const [meetingUsername, setMeetingUsername] = useState<string>("");
  const [meetingPassword, setMeetingPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const meetingUsername =
          sessionStorage.getItem("meeting_username") ?? "";

        if (token && meetingUsername) {
          const response = await axios.post<{ valid: boolean }>(
            "/meeting/validateToken",
            { token }
          );
          if (response.data.valid) {
            navigate("/login/meeting/dashboard");
          }
        }
      } catch (error) {
        console.error("Error validating session:", error);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Add async keyword to function
    e.preventDefault();

    // Check if username or password contains spaces
    if (meetingUsername.includes(" ")) {
      setError("Username must not contain spaces.");
      return;
    }
    if (meetingPassword.includes(" ")) {
      setError("Password must not contain spaces.");
      return;
    }

    try {
      const response = await axios.post("/login/meeting", {
        meeting_username: meetingUsername,
        meeting_password: meetingPassword,
      });

      if (response.status === 200) {
        // Successful login
        const token = response.data.token;
        // Store the token in a cookie
        sessionStorage.setItem("token", token); // Store token in sessionStorage
        sessionStorage.setItem("meeting_username", meetingUsername); // Set expiration time for 1 day
        navigate("/login/meeting/dashboard"); // Navigate to the dashboard
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
        Meeting Login Panel
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-2 py-4">
          <input
            type="text"
            className="rounded-md border-2 p-2"
            placeholder="Meeting Username/No."
            required
            onChange={(e) => setMeetingUsername(e.target.value)}
            value={meetingUsername}
          />
          <input
            type="password"
            className="rounded-md border-2 p-2"
            placeholder="Meeting Password"
            required
            onChange={(e) => setMeetingPassword(e.target.value)}
            value={meetingPassword}
          />
          {error && <p className="text-red-500">{error}</p>}

          <button
            className="my-2 rounded-md bg-green-500 text-white px-6 py-3"
            type="submit"
          >
            Login
          </button>
        </div>
      </form>
      <div className="flex justify-center"></div>
    </div>
  );
};

export default MeetingLogin;
