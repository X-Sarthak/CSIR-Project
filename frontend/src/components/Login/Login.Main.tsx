import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLogin from "./Login.Admin";
import MeetingLogin from "./Login.Meeting";
import UserLogin from "./Login.User";
import { icons } from "../../constants";
import axios from "axios";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<string | null>(null);

  //Check Session for superadmin
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const superadminUsername =
          sessionStorage.getItem("superadmin_username") ?? "";
        if (token && superadminUsername) {
          const response = await axios.post<{ valid: boolean }>(
            "/superadmin/validateToken",
            { token }
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

  // for admin
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

  // for meeting
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

  // for user
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

  const handleLogin = (panel: string) => {
    setActivePanel(panel);
    navigate(`/login/${panel}`); // Navigate to /login/admin, /login/meeting, or /login/user
  };

  const handleBackToLogin = () => {
    setActivePanel(null);
    navigate("/");
  };

  return (
    <div
      className="h-screen w-full flex flex-col items-center justify-center"
      style={{ backgroundColor: "rgb(82, 128, 188)" }}
    >
      <div className="bg-white p-4 w-full mb-40 -mt-40">
        <div className="flex items-center justify-between">
          <div className="h-16 w-auto">
            <a
              href="https://www.csir.res.in/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={icons.CSIRlogo}
                alt="CSIR Logo"
                className="h-28 w-auto -mt-6"
              />
            </a>
          </div>
          <div className="text-sm font-serif font-bold text-center flex-1">
            <p>वैज्ञानिक तथा औद्योगिक अनुसंधान परिषद्</p>
            <p>Council of Scientific &amp; Industrial Research</p>
            <p>(विज्ञान एवं प्रौद्योगिकी मंत्रालय, भारत सरकार)</p>
            <p>Ministry of Science &amp; Technology, Govt. of India</p>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="https://www.csir.res.in/csir-one-week-one-lab-program"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={icons.OneLabCSIR}
                alt="CSIR OneLab Logo"
                className="h-12 w-auto"
              />
            </a>
            <a
              href="https://www.g20.org/en/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={icons.g20} alt="g20 Logo" className="h-16 w-auto" />
            </a>
            <a
              href="https://covid19csir.urdip.res.in/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={icons.CovidCSIR}
                alt="CovidCSIR Logo"
                className="h-16 w-auto"
              />
            </a>
            <a
              href="https://www.prabhass.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={icons.PrabhasCSIR}
                alt="PrabhasCSIR Logo"
                className="h-16 w-auto"
              />
            </a>
            <a
              href="https://innovateindia.mygov.in/csir-societal-platform/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={icons.PortalCSIR}
                alt="PortalCSIR Logo"
                className="h-16 w-auto"
              />
            </a>
          </div>
        </div>
      </div>

      <div
        className={`bg-white p-4 mb-8 rounded-lg text-center ${
          activePanel ? "hidden" : ""
        }`}
        style={{ width: "48%" }}
      >
        <h1 className="text-2xl font-serif">Conference Room Booking</h1>
      </div>

      <div className="flex flex-col lg:flex-row space-x-4 items-center justify-center">
        {!activePanel && (
          <div className="bg-white rounded-lg p-10 mb-4">
            <div className="flex flex-col items-center justify-center">
              <button
                className="my-2 rounded-full text-white font-serif px-12 py-4"
                type="button"
                onClick={() => handleLogin("admin")}
                style={{ backgroundColor: "rgb(82, 128, 188)" }}
              >
                <img src={icons.AdminIcon} alt="Meeting Login" />
              </button>
              <span
                className="font-serif"
                style={{ color: "rgb(82, 128, 188)" }}
              >
                Admin Login
              </span>
            </div>
          </div>
        )}

        {/* Meeting Login Container */}
        {!activePanel && (
          <div className="bg-white rounded-lg p-10 mb-4">
            <div className="flex flex-col items-center justify-center">
              <button
                className="my-2 rounded-full text-white font-serif px-12 py-4"
                type="button"
                onClick={() => handleLogin("meeting")}
                style={{ backgroundColor: "rgb(82, 128, 188)" }}
              >
                <img src={icons.LoginIcon} alt="Meeting Login" />
              </button>
              <span
                className="font-serif"
                style={{ color: "rgb(82, 128, 188)" }}
              >
                Approval Meeting Login
              </span>
            </div>
          </div>
        )}

        {/* User Login Container */}
        {!activePanel && (
          <div className="bg-white rounded-lg p-10 mb-4">
            <div className="flex flex-col items-center justify-center">
              <button
                className="my-2 rounded-full text-white font-serif px-12 py-4"
                type="button"
                onClick={() => handleLogin("user")}
                style={{ backgroundColor: "rgb(82, 128, 188)" }}
              >
                <img src={icons.LoginIcon} alt="User Login" />
              </button>
              <span
                className="font-serif"
                style={{ color: "rgb(82, 128, 188)" }}
              >
                User Login
              </span>
            </div>
          </div>
        )}
      </div>

      {activePanel === "admin" && <AdminLogin />}
      {activePanel === "meeting" && <MeetingLogin />}
      {activePanel === "user" && <UserLogin />}

      {activePanel && (
        <div className="flex justify-center">
          <button
            className="my-2 rounded-md bg-red-500 text-white px-6 py-3"
            type="button"
            onClick={handleBackToLogin}
          >
            Back to Login
          </button>
        </div>
      )}

      <footer className="text-center font-serif px-4 py-2 fixed bottom-0 w-full bg-white">
        Copyright &copy; {new Date().getFullYear()} Concept. All rights
        reserved.
      </footer>
    </div>
  );
};
export default Login;
