import { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "./Header.Admin";
import AdminSidebar from "./Sidebar.Admin";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx";
import Spinner from "../Utility/Spinner.Utility";

axios.defaults.withCredentials = true;

interface Meeting {
  meeting_username: string;
}

interface MeetingDetail {
  user_email: string;
  meeting_title: string;
  meeting_option: string;
  added_by: string;
  request_status: number;
  room_name: string;
  meeting_link: string;
  formatted_meeting_date: string;
  formatted_start_time: string;
  formatted_end_time: string;
}

function BookingSchedule() {
  const [validSession, setValidSession] = useState(false);
  const [meetingUsernames, setMeetingUsernames] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<string>("");
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetail[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1); // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOption, setFilterOption] = useState<string>("");
  const [loading, setLoading] = useState(false); // Add loading state

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const adminUsername = sessionStorage.getItem("admin_username") ?? "";
        if (!token || !adminUsername) {
          navigate("/");
          return;
        }

        const response = await axios.post<{ valid: boolean }>(
          "/admin/validateToken",
          { token }
        );
        if (response.data.valid) {
          setValidSession(true);
          fetchMeetingUsernames();
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigate("/");
      }
    };

    checkSession();
  }, [navigate]);

  const fetchMeetingUsernames = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.get<Meeting[]>(
        "/admin/meetings/username/bookingcheck"
      );
      setMeetingUsernames(response.data);
    } catch (error) {
      console.error("Error fetching meeting usernames:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const fetchMeetingDetails = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.get<MeetingDetail[]>(
        `/admin/booking/meeting/user/detail?meetingUsername=${selectedMeeting}`
      );
      if (response.data.length > 0) {
        setMeetingDetails(response.data);
        toast.success("Meeting details fetched successfully!");
      }
    } catch (error) {
      setMeetingDetails([]); // Clear previous data on error
      toast.warn("No meeting details available.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const handleMeetingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMeeting(event.target.value);
  };

  useEffect(() => {
    if (selectedMeeting) {
      fetchMeetingDetails();
    } else {
      setMeetingDetails([]); // Clear data if no meeting is selected
    }
  }, [selectedMeeting]);

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

  const handleSearch = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.post<MeetingDetail[]>(
        "/admin/booking/meeting/filter",
        {
          filterOption: filterOption,
          searchTerm: searchTerm,
          meetingUsername: selectedMeeting,
        }
      );

      if (response.data.length > 0) {
        setMeetingDetails(response.data);
        toast.success("Search results fetched successfully!");
      } else {
        setMeetingDetails([]);
        toast.warn("No matching records found.");
      }
    } catch (error) {
      console.error("Error fetching search results:", error);

      const err = error as any;

      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Error fetching search results.");
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Calculate paginated data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = meetingDetails.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = Math.ceil(meetingDetails.length / itemsPerPage);

  // Add this inside your component
  const itemsPerPageOptions = [10, 20, 30, 50];

  // Handle items per page change
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to the first page
  };

  const handlePrintClick = () => {
    const ws = XLSX.utils.json_to_sheet(meetingDetails);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Meeting Booking Schedule Information");
    XLSX.writeFile(wb, "BookingSchedule.xlsx");
  };

  const handleResetClick = () => {
    setMeetingDetails([]); // Clear data if no meeting is selected
    setFilterOption("");
    setSearchTerm("");
    setItemsPerPage(10);
  };

  return (
    <>
      {loading && <Spinner />}
      {validSession && (
        <div>
          <AdminHeader dashboardType="Admin" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <AdminSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-gray-400/50 flex flex-col">
              <div className="bg-sky-600 border-t border-r border-b border-black mt-2 p-1.5">
                <h1 className="text-xl font-serif text-center text-white">
                  Booking Details
                </h1>
              </div>
              <div className="bg-white text-black border-r border-b border-t border-black p-1 mt-2.5">
                <div className="flex items-center">
                  <p className="text-md text-gray-700 font-medium">
                   Booking information:
                  </p>
                  <div className="flex items-center ml-5">
                    <select
                      className="border border-gray-300 px-2 py-1 rounded-md"
                      onChange={(e) => setFilterOption(e.target.value)} // Update to your dropdown handler
                    >
                      <option value="">Not Selected</option>
                      <option value="Meeting Title">Meeting Title</option>
                      <option value="Month">Month</option>
                      <option value="Meeting Date">Meeting Date</option>
                      <option value="User Email">User Email</option>
                    </select>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-300 px-2 py-1 rounded-md ml-2"
                      placeholder="Search..."
                    />
                    <button
                      onClick={handleSearch} // Update to your search handler
                      className="ml-2 px-3 py-1 border border-black rounded-md bg-green-500 hover:bg-green-600 text-white"
                    >
                      Search
                    </button>
                    <button
                      onClick={handlePrintClick} // Update to your search handler
                      className="ml-2 px-3 py-1 border border-black rounded-md bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Print
                    </button>
                    <button
                      onClick={handleResetClick} // Update to your search handler
                      className="ml-2 px-3 py-1 border border-black rounded-md bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div className="flex items-center mt-2 mb-1">
                  <label className="mr-2 text-md font-medium text-gray-700">
                    Select Meeting Room:
                  </label>
                  <select
                      className="border border-gray-300 px-2.5 py-1 ml-2 rounded-md"
                      onChange={handleMeetingChange}
                  >
                    <option value="">Not Selected</option>
                    {meetingUsernames.map((meeting, index) => (
                      <option key={index} value={meeting.meeting_username}>
                        {meeting.meeting_username}
                      </option>
                    ))}
                  </select>
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
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-white text-black border-t border-r border-b border-black p-1">
                  <p className="text-xl font-serif">
                    Booking schedules:{" "}
                    <span className="text-green-500">{selectedMeeting}</span>
                  </p>
                </div>
                <table className="w-full bg-white rounded-b-lg">
                  <thead className="bg-gray-200 text-xs font-serif">
                    <tr>
                      <th className="px-4 py-2 text-center">User Email</th>
                      <th className="px-4 py-2 text-center">Meeting Title</th>
                      <th className="px-4 py-2 text-center">Room Name</th>
                      <th className="px-4 py-2 text-center">Meeting Date</th>
                      <th className="px-4 py-2 text-center">Start Time</th>
                      <th className="px-4 py-2 text-center">End Time</th>
                      <th className="px-4 py-2 text-center">Meeting Mode</th>
                      <th className="px-4 py-2 text-center">Meeting Link</th>
                      <th className="px-4 py-2 text-center">Added By</th>
                      <th className="px-4 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td className="px-4 py-2 text-center" colSpan={10}>
                          No data found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((detail, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-center">
                            {detail.user_email ? (
                              detail.user_email
                            ) : (
                              <span className="text-green-500">
                                MEETING OWNER
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {detail.meeting_title}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {detail.room_name}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {detail.formatted_meeting_date}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {detail.formatted_start_time}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {detail.formatted_end_time}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {detail.meeting_option}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {detail.meeting_link ? (
                              <a
                                href="#"
                                onClick={() =>
                                  handleLinkClick(detail.meeting_link)
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
                            className={`px-4 py-2 text-center ${
                              detail.added_by === "USER"
                                ? "text-yellow-500"
                                : "text-green-500"
                            }`}
                          >
                            {detail.added_by}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {detail.request_status === 0 && (
                              <span className="text-red-500">Rejected</span>
                            )}
                            {detail.request_status === null && (
                              <span className="text-yellow-500">Pending</span>
                            )}
                            {detail.request_status === 1 && (
                              <span className="text-green-500">Accepted</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
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
            </div>
          </div>
          <footer className="text-center -mb-6 px-2 py-2 border-t border-black">
            Copyright &copy; {new Date().getFullYear()} Concept. All rights
            reserved.
          </footer>
          <ToastContainer />
        </div>
      )}
    </>
  );
}

export default BookingSchedule;
