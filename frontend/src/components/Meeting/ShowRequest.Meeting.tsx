import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MeetingHeader from "./Header.Meeting";
import MeetingSidebar from "./Sidebar.Meeting";
import { toast, ToastContainer } from "react-toastify";
import * as XLSX from "xlsx"; // Import XLSX library
import Spinner from "../Utility/Spinner.Utility";

axios.defaults.withCredentials = true;

function ShowRequest() {
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meetingScheduleDetails, setMeetingScheduleDetails] = useState<any[]>(
    []
  );

  const [reasonForRejection, setReasonForRejection] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const formRef = useRef<HTMLDivElement>(null);
  const navigator = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const meetingUsername =
          sessionStorage.getItem("meeting_username") ?? "";
        if (!token || !meetingUsername) {
          navigator("/");
          return;
        }

        const response = await axios.post<{ valid: boolean }>(
          "/meeting/validateToken",
          { token }
        );
        if (response.data.valid) {
          setValidSession(true);
          fetchMeetingSchedule();
        } else {
          navigator("/");
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigator("/");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigator]);

  const fetchMeetingSchedule = async () => {
    try {
      const response = await axios.get("/meeting/details/schedule");
      const reversedSchedule = response.data.reverse();
      setMeetingScheduleDetails(reversedSchedule);
    } catch (error) {
      console.error("Error fetching meeting schedule:", error);
    }
  };

  const acceptMeeting = async (schedule_id: number) => {
    try {
      await axios.put(`/meeting/accept/${schedule_id}`);
      await fetchMeetingSchedule();
    } catch (error) {
      console.error("Error accepting meeting:", error);
    }
  };

  const openRejectionModal = (schedule_id: number) => {
    setSelectedScheduleId(schedule_id);
    setShowRejectionModal(true);
  };

  const closeRejectionModal = () => {
    setSelectedScheduleId(null);
    setShowRejectionModal(false);
    setReasonForRejection("");
  };

  const declineMeeting = async () => {
    try {
      if (!reasonForRejection.trim()) {
        // If reason is empty, display an error toast and return
        toast.error("Please enter a valid reason for rejection.");
        return;
      }

      await axios.put(`/meeting/decline/${selectedScheduleId}`, {
        reason: reasonForRejection,
      });
      closeRejectionModal();
      await fetchMeetingSchedule();
    } catch (error) {
      console.error("Error declining meeting:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowRejectionModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    if (showRejectionModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [showRejectionModal]);
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

  const handlePrintClick = () => {
    if (currentItems.length === 0) {
      toast.info("No meeting data available to export.");
      return;
    }

    // Define custom headers
    const headers = [
      "User Email",
      "Meeting Title",
      "Room Name",
      "Meeting Date",
      "Start Time",
      "End Time",
      "Meeting Mode",
      "Meeting Link",
      "Added By",
      "Status",
    ];

    // Ensure you're using the MeetingDetail type
    const meetingsWithCustomHeaders = currentItems.map((schedule) => ({
      "User Email": schedule.user_email || "ROOM OWNER",
      "Meeting Title": schedule.meeting_title || "",
      "Room Name": schedule.room_name || "",
      "Meeting Date": schedule.formatted_meeting_date || "",
      "Start Time": schedule.formatted_start_time || "",
      "End Time": schedule.formatted_end_time || "",
      "Meeting Mode": schedule.meeting_option || "",
      "Meeting Link": schedule.meeting_link || "N/A",
      "Added By": schedule.added_by || "",
      Status:
        schedule.request_status === 0
          ? "Rejected"
          : schedule.request_status === null
            ? "Pending"
            : schedule.request_status === 1
              ? "Accepted"
              : "",
    }));

    // Create worksheet with custom headers
    const ws = XLSX.utils.json_to_sheet(meetingsWithCustomHeaders, {
      header: headers,
    });

    // Set column widths (optional)
    ws["!cols"] = [
      { width: 25 }, // User Email
      { width: 30 }, // Meeting Title
      { width: 20 }, // Room Name
      { width: 20 }, // Meeting Date
      { width: 15 }, // Start Time
      { width: 15 }, // End Time
      { width: 20 }, // Meeting Mode
      { width: 30 }, // Meeting Link
      { width: 20 }, // Added By
      { width: 15 }, // Status
    ];

    // Create workbook and append worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Booking Schedule");

    // Generate Excel file and trigger download
    XLSX.writeFile(wb, "Meetings_Booking_Schedule.xlsx");
  };

  // Calculate paginated data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = meetingScheduleDetails.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = Math.ceil(meetingScheduleDetails.length / itemsPerPage);

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
    {loading && <Spinner />}
      {validSession && (
        <div>
          <MeetingHeader dashboardType="Requests" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <MeetingSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-gray-400/50 flex flex-col">
              <div className="bg-sky-600 border-t border-r border-b border-black mt-2 p-1.5 mb-2">
                <h1 className="text-xl font-serif text-center text-white">
                  Meeting Schedule
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
                <button
                  onClick={handlePrintClick} // Update to your search handler
                  className="ml-2 px-3 py-1 border border-black rounded-md bg-blue-500 text-white hover:bg-blue-600"
                >
                  Print
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full mt-2 rounded-b-xl bg-white">
                  <thead className="bg-gray-200 font-serif">
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
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td className="px-4 py-2 text-center" colSpan={11}>
                          No data found for the selected filters.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((schedule) => (
                        <tr key={schedule.schedule_id}>
                          <td className="px-4 py-2 text-center">
                            {schedule.user_email ? (
                              schedule.user_email
                            ) : (
                              <span className="text-green-500">ROOM OWNER</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {schedule.meeting_title}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {schedule.room_name}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {schedule.formatted_meeting_date}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {schedule.formatted_start_time}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {schedule.formatted_end_time}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {schedule.meeting_option}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {schedule.meeting_link ? (
                              <a
                                href="#"
                                onClick={() =>
                                  handleLinkClick(schedule.meeting_link)
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
                              schedule.added_by === "USER"
                                ? "text-yellow-500"
                                : "text-green-500"
                            }`}
                          >
                            {schedule.added_by}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {schedule.request_status === 0 && (
                              <span className="text-red-500">Rejected</span>
                            )}
                            {schedule.request_status === null && (
                              <span className="text-yellow-500">Pending</span>
                            )}
                            {schedule.request_status === 1 && (
                              <span className="text-green-500">Accepted</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {schedule.request_status === null && (
                              <>
                                <button
                                  className="underline text-green-500 hover:transition duration-300 ease-in-out transform hover:scale-105"
                                  onClick={() =>
                                    acceptMeeting(schedule.schedule_id)
                                  }
                                >
                                  Accept
                                </button>
                                <button
                                  className="underline text-red-500 transition duration-300 ease-in-out transform hover:scale-105"
                                  onClick={() =>
                                    openRejectionModal(schedule.schedule_id)
                                  }
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {schedule.request_status === 0 && (
                              <button
                                className="underline text-green-500 transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() =>
                                  acceptMeeting(schedule.schedule_id)
                                }
                              >
                                Accept
                              </button>
                            )}
                            {schedule.request_status === 1 && (
                              <button
                                className="underline text-red-500 hover:transition duration-300 ease-in-out transform hover:scale-105"
                                onClick={() =>
                                  openRejectionModal(schedule.schedule_id)
                                }
                              >
                                Reject
                              </button>
                            )}
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
                    : `${currentPage} / ${totalPages}`}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 text-white rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              {showRejectionModal && (
                <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
                  <div ref={formRef} className="bg-white p-4 rounded-lg">
                    <h3 className="text-lg font-serif mb-2">
                      Enter Reason for Rejection:
                    </h3>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-500"
                      value={reasonForRejection}
                      onChange={(e) => setReasonForRejection(e.target.value)}
                    ></input>
                    <div className="flex justify-end mt-2">
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white font-serif py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105 mr-2"
                        onClick={closeRejectionModal}
                      >
                        Cancel
                      </button>
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white font-serif py-2 px-4 rounded transition duration-300 ease-in-out transform hover:scale-105"
                        onClick={declineMeeting}
                      >
                        Submit Reason
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

export default ShowRequest;
