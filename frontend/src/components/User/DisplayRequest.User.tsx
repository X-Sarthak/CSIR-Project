import { useEffect, useState } from "react";
import axios from "axios";
import UserHeader from "./Header.User";
import UserSidebar from "./SideBar.User";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { FaTimes } from "react-icons/fa";

axios.defaults.withCredentials = true;

function MeetingDisplay() {
  const [validSession, setValidSession] = useState(false);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const navigator = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const userEmail = sessionStorage.getItem("user_email") ?? "";
        if (!token || !userEmail) {
          navigator("/");
          return;
        }

        const response = await axios.post<{ valid: boolean }>(
          "/user/validateToken",
          { token }
        );
        if (response.data.valid) {
          setValidSession(true);
          // Fetch booking requests for the user
          fetchBookingRequests();
        } else {
          navigator("/");
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigator("/");
      }
    };

    checkSession();
  }, [navigator]);

  const fetchBookingRequests = async () => {
    try {
      const response = await axios.get("/user/booking/schedule");
      setBookingRequests(response.data);
    } catch (error) {
      console.error("Error fetching booking requests:", error);
    }
  };

  const handleLinkClick = (url: string) => {
    toast.info(
      <div>
        Meeting Link:{" "}
        <div className="text-sky-400 underline cursor-pointer">
          <a href="#" onClick={() => window.open(url, "_blank")}>
            {url}
          </a>
        </div>
      </div>
    );
  };

  const handleCancelRequest = async (schedule_id: number) => {
    console.log("Cancel Request Schedule ID:", schedule_id); // Debug log
    try {
      const response = await axios.put(`/user/booking/cancel/${schedule_id}`);
      if (response.status === 200) {
        toast.success("Meeting request canceled successfully.");
        fetchBookingRequests(); // Refresh the booking requests
      }
    } catch (error) {
      console.error("Error canceling meeting request:", error);
      toast.error("Failed to cancel meeting request.");
    }
  };

  // Calculate paginated data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = bookingRequests.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = Math.ceil(bookingRequests.length / itemsPerPage);

  // Add this inside your component
  const itemsPerPageOptions = [10, 20, 30, 50];

  // Handle items per page change
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <>
      {validSession && (
        <div>
          <UserHeader dashboardType="Requests Display" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <UserSidebar />
            </div>

            <div className="flex-1 border-l border-black bg-gray-400/50 flex flex-col">
              <div className="bg-sky-600 border-t border-r border-b border-black mt-2 p-1.5 mb-2">
                <h1 className="text-xl font-serif text-center text-white">
                  Requests Sent{" "}
                </h1>
              </div>
              <div className="bg-white border-t border-r px-1 py-1 border-b border-black flex items-center">
                <label className="block text-sm font-medium text-gray-700 ml-2 mr-2">
                  Items per Page:
                </label>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="border border-gray-300 p-1 rounded-md"
                >
                  {itemsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="overflow-x-auto w-full mt-2">
                <table className="w-full rounded-b-xl bg-white">
                  <thead className="bg-gray-200 font-serif">
                    <tr>
                      <th className="px-4 py-2">Meeting Title</th>
                      <th className="px-4 py-2">Username</th>
                      <th className="px-4 py-2">Approver Name</th>
                      <th className="px-4 py-2">Meeting Room Name</th>
                      <th className="px-4 py-2">Meeting Date</th>
                      <th className="px-4 py-2">Start Time</th>
                      <th className="px-4 py-2">End Time</th>
                      <th className="px-4 py-2">Meeting Mode</th>
                      <th className="px-4 py-2">Meeting Link</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Reason For Rejection</th>
                      <th className="px-4 py-2">Cancel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td className="px-4 py-2 text-center" colSpan={12}>
                          No data found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((request) => (
                        <tr
                          key={request.schedule_id}
                          className="bg-white hover:bg-gray-100 text-medium"
                        >
                          <td className="px-4 py-2 text-center">
                            {request.meeting_title}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {request.meeting_username}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {request.room_name}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {request.authority_name}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {request.formatted_meeting_date}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {request.formatted_start_time}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {request.formatted_end_time}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {request.meeting_option}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {request.meeting_link ? (
                              <a
                                href="#"
                                onClick={() =>
                                  handleLinkClick(request.meeting_link)
                                }
                                className="text-blue-500 underline"
                              >
                                Link
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td
                            className={`px-4 py-2 ${
                              request.request_status === null
                                ? "text-yellow-500"
                                : request.request_status === 1
                                  ? "text-green-500"
                                  : "text-red-500"
                            }`}
                          >
                            {request.request_status === null
                              ? "Pending"
                              : request.request_status === 1
                                ? "Accepted"
                                : "Rejected"}
                          </td>
                          <td className="px-4 py-2 text-center text-red-600">
                            {request.reason_for_rejection ? (
                              request.reason_for_rejection
                            ) : (
                              <span className="text-black">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() =>
                                handleCancelRequest(request.schedule_id)
                              }
                              className=" hover:text-red-700 p-1 border border-red-600 rounded-xl"
                            >
                              <FaTimes />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-2 mb-2 px-1">
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
                      ? "bg-gray-300 hover:bg-gray-400 opacity-50"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {totalPages === 0
                    ? "No Pages"
                    : `${currentPage} | ${totalPages}`}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 text-white rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          <ToastContainer />
          <footer className="text-center -mb-6 px-2 py-2 border-t border-black">
            Copyright &copy; {new Date().getFullYear()} Concept. All rights
            reserved.
          </footer>
        </div>
      )}
    </>
  );
}

export default MeetingDisplay;
