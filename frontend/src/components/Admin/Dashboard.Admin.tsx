import { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "./Header.Admin";
import AdminSidebar from "./Sidebar.Admin";
import { useNavigate } from "react-router-dom";
import Spinner from "../Utility/Spinner.Utility";

axios.defaults.withCredentials = true;

function AdminDashboard() {
  const [validSession, setValidSession] = useState(false);
  const [meetings, setMeetings] = useState<any[]>([]); // State to hold fetched meetings
  const [loading, setLoading] = useState(false);
  const [adminDetails, setAdminDetails] = useState<{
    admin_username: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1); // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true); // Set loading to true when starting
      try {
        const token = sessionStorage.getItem("token");
        const adminUsername = sessionStorage.getItem("admin_username") ?? "";
        if (!token || !adminUsername) {
          navigate("/"); // Use 'navigate' for redirection, not 'navigator'
          return;
        }

        const response = await axios.post<{ valid: boolean }>(
          "/admin/validateToken",
          { token } // Send the token in the request body
        );
        if (response.data.valid) {
          setValidSession(true);
          // Fetch specific admin details after session validation
          await fetchAdminDetails(); // Ensure async fetch completion
          await fetchMeetingDetails();
        } else {
          navigate("/"); // Navigate to login page if token is invalid
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigate("/"); // Navigate to login page if there's an error
      } finally {
        setLoading(false); // Set loading to false after everything is done
      }
    };

    checkSession();
  }, [navigate]); // Correct dependency is 'navigate'

  // Function to fetch specific admin details
  const fetchAdminDetails = async () => {
    try {
      // Make an API call to fetch admin details
      const response = await axios.get("/admin/details", {});
      // Set admin details in state
      setAdminDetails(response.data);
    } catch (error) {
      console.error("Error fetching admin details:", error);
    }
  };

  const fetchMeetingDetails = async () => {
    try {
      // Make an API call to fetch meeting details
      const response = await axios.get(`/admin/meetings/details`);
      // Set meeting details in state
      const reversedSchedule = response.data.reverse();
      setMeetings(reversedSchedule);
    } catch (error) {
      console.error("Error fetching meeting details:", error);
    }
  };

  // Calculate paginated data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = meetings.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = Math.ceil(meetings.length / itemsPerPage);

  // Add this inside your component
  const itemsPerPageOptions = [10, 20, 30, 50];

  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <>
      {loading && <Spinner />}
      {validSession && (
        <div>
          <AdminHeader dashboardType="Dashboard" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <AdminSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-gray-400/50 flex flex-col">
              {adminDetails && (
                <>
                  <div className="bg-sky-600 border-t border-r border-b border-black mt-2 p-1.5">
                    <h1 className="text-xl font-serif text-center text-white">
                      Admin Dashboard
                    </h1>
                  </div>
                  <div className="bg-white px-1 py-1 mt-2 mb-2 border-r border-t border-b border-black flex items-center">
                  <label className="block text-sm font-medium text-gray-700 ml-2 mr-2">
                    Items per Page:
                  </label>
                  <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    className="border border-gray-300 px-2 py-1 rounded-md"
                  >
                    {itemsPerPageOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <h1 className="text-sm font-serif ml-4 mr-6">
                    Username: {adminDetails.admin_username}
                  </h1>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mx-4 mt-4">
                    {currentItems.map((meeting, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-md font-serif"
                      >
                        <p>Room Name: {meeting.room_name}</p>
                        <p>Approver Name: {meeting.authority_name}</p>
                        <p>Username: {meeting.meeting_username}</p>
                      </div>
                    ))}
                  </div>
                  {/* Pagination Controls */}
                  <div className="flex justify-between items-center mt-4 mb-2 px-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || totalPages === 0}
                      className="px-3 py-1 text-white rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span
                      className={`px-3 py-1 rounded-md mx-1 ${
                        totalPages === 0
                          ? "bg-gray-300 hover:bg-gray-400 opacity-50 "
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {totalPages === 0
                        ? "No Pages"
                        : `${currentPage} / ${totalPages}`}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1 text-white rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                  
                </>
              )}
            </div>
          </div>
          <footer className="text-center -mb-6 px-2 py-2 border-t border-black">
            Copyright &copy; {new Date().getFullYear()} Concept. All rights
            reserved.
          </footer>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;
