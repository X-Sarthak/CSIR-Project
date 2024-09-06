import { useEffect, useState } from "react";
import axios from "axios";
import SuperAdminHeader from "./Header.Superadmin";
import SuperAdminSidebar from "./Sidebar.Superadmin";
import CreateAdminForm from "./CreateAdminForm.Superadmin";
import EditPasswordForm from "./EditPasswordForm.Superadmin";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaLock } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../Utility/Spinner.Utility";

axios.defaults.withCredentials = true;

function SuperAdminDashboard() {
  const [validSession, setValidSession] = useState(false);
  const [admins, setAdmins] = useState<
    {
      admin_id: string;
      admin_username: string;
      admin_password: string;
      admin_status: boolean;
    }[]
  >([]);
  const [showEditPasswordForm, setShowEditPasswordForm] = useState(false); // State to manage edit password form visibility
  const [selectedAdminId, setSelectedAdminId] = useState(""); // State to keep track of the admin being edited
  const [loading, setLoading] = useState(false);

  const navigator = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const superadminUsername =
          sessionStorage.getItem("superadmin_username") ?? "";
        setLoading(true);
  
        if (!token || !superadminUsername) {
          navigator("/superadmin/login"); // Redirect to login page
          return;
        }
  
        const response = await axios.post<{ valid: boolean, message?: string }>(
          "/superadmin/validateToken",
          { token }
        );
  
        if (response.data.valid) {
          setValidSession(true);
          fetchAdmins(); // Fetch admin data once the session is valid
        } else {
          if (response.data.message === "Token has expired") {
            // Handle token expiration specifically
            console.error("Token expired. Clearing session and redirecting to login.");
          } else {
            // Handle other reasons for invalid tokens
            console.error("Invalid token:", response.data.message);
          }
          // Clear session data and redirect to login page
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("superadmin_username");
          navigator("/superadmin/login"); // Redirect to login page
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error validating session:", error);
        // Clear session data and redirect to login page
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("superadmin_username");
        navigator("/superadmin/login"); // Redirect to login page
        setLoading(false);
      }
    };
  
    checkSession();
  }, [navigator]);
  

  const fetchAdmins = async () => {
    try {
      const response = await axios.get("/admins", {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      const reversedSchedule = response.data.reverse();
      setAdmins(reversedSchedule);
    } catch (error) {
      console.error("Error fetching admins:", error);
      // Handle error
    }
  };

  const deleteAdmin = async (adminId: string) => {
    try {
      await axios.delete(`/admin/${adminId}`);
      // Remove the deleted admin from the state
      setAdmins(admins.filter((admin) => admin.admin_id !== adminId));
    } catch (error) {
      console.error("Error deleting admin:", error);
      // Handle error
    }
  };

  const disableAdmin = async (adminId: string) => {
    try {
      await axios.put(`/admin/disable/${adminId}`);
      // Update admin status in state
      setAdmins(
        admins.map((admin) => {
          if (admin.admin_id === adminId) {
            return { ...admin, admin_status: false };
          }
          return admin;
        })
      );
    } catch (error) {
      console.error("Error disabling admin:", error);
      // Handle error
    }
  };

  const enableAdmin = async (adminId: string) => {
    try {
      await axios.put(`/admin/enable/${adminId}`);
      // Update admin status in state
      setAdmins(
        admins.map((admin) => {
          if (admin.admin_id === adminId) {
            return { ...admin, admin_status: true };
          }
          return admin;
        })
      );
    } catch (error) {
      console.error("Error enabling admin:", error);
      // Handle error
    }
  };

  const openEditPasswordForm = (adminId: string) => {
    setSelectedAdminId(adminId);
    setShowEditPasswordForm(true);
  };

  const closeEditPasswordForm = () => {
    setShowEditPasswordForm(false);
  };

  const handleUpdatePassword = async (newPassword: any) => {
    try {
      const response = await axios.put(
        `/admin/password/${selectedAdminId}`,
        { adminPassword: newPassword }
      );
      if (response.status === 200) {
        // Password updated successfully
        console.log("Admin password updated successfully");
        // Optionally, you may want to refetch the admin data here
        closeEditPasswordForm();
      } else {
        console.error("Failed to update admin password");
        // Handle other status codes if needed
      }
    } catch (error) {
      console.error("Error updating password:", error);
      // Handle error
    }
  };

  return (
    <>
    {loading && <Spinner />}
      {validSession && (
        <div>
          <SuperAdminHeader dashboardType="Super Admin" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <SuperAdminSidebar />
            </div>

            <div className="flex-1 border-l border-black bg-gray-400/50 flex flex-col">
              <div className="bg-white border-t border-r border-b border-black mt-2 p-1.5">
                <h1 className="text-xl font-serif text-center text-black">
                  Super Administrator Dashboard
                </h1>
              </div>
              <CreateAdminForm onCreateAdmin={() => fetchAdmins()} />
              <table className="w-full overflow-hidden mt-2">
                <thead className="bg-gray-200 font-serif">
                  <tr>
                    <th className="px-4 py-2 text-left">Admin Username</th>
                    <th className="px-4 py-2 text-left">Admin Password</th>
                    <th className="px-4 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin, index) => (
                    <tr key={index} className="bg-white hover:bg-gray-100">
                      <td className="px-4 py-2">{admin.admin_username}</td>
                      <td className="px-4 py-2">*******</td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md mr-2"
                          onClick={() => openEditPasswordForm(admin.admin_id)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md mr-2"
                          onClick={() => deleteAdmin(admin.admin_id)}
                        >
                          <FaTrash />
                        </button>
                        <button
                          className={`px-2 py-1 rounded-md mr-2 ${
                            admin.admin_status
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                          onClick={() =>
                            admin.admin_status
                              ? disableAdmin(admin.admin_id)
                              : enableAdmin(admin.admin_id)
                          }
                        >
                          <FaLock className="text-white mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {showEditPasswordForm && (
                <EditPasswordForm
                  onUpdatePassword={handleUpdatePassword}
                  onCancel={closeEditPasswordForm}
                />
              )}
            </div>
          </div>
          <footer className="text-center px-4 py-2 border-t border-black">
            Copyright &copy; {new Date().getFullYear()} Concept. All rights
            reserved.
          </footer>
        </div>
      )}
    </>
  );
}

export default SuperAdminDashboard;
