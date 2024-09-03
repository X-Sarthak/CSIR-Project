import { useEffect, useState } from "react";
import axios from "axios";
import UserHeader from "./Header.User";
import UserSidebar from "./SideBar.User";
import { useNavigate } from "react-router-dom";
import BookingForm from "./BookingForm.User"; // Import the BookingForm component
import { toast, ToastContainer } from "react-toastify";

axios.defaults.withCredentials = true;

function UserDashboard() {
  const [validSession, setValidSession] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false); // State to manage booking form visibility
  const [selectedMeeting, setSelectedMeeting] = useState(null); // State to store the selected meeting

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
          // Fetch meetings associated with the user's admin
          fetchMeetings();
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

  const fetchRequestCount = async () => {
    try {
      const response = await axios.get<{
        request_count: number;
      }>("/user/pending/count");
      const requestCount = response.data.request_count;
      if (requestCount > 0) {
        toast.info(
          `You have ${requestCount} booking requests pending is status`
        );
      }
    } catch (error) {
      console.error("Error fetching request count:", error);
    }
  };

  // Function to fetch meetings associated with the user's admin
  const fetchMeetings = async () => {
    try {
      const response = await axios.get(
        "/user/meetings/details"
      );
      setMeetings(response.data);
      fetchRequestCount();
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  // Function to handle booking button click
  const handleBookingButtonClick = (meeting: any) => {
    setSelectedMeeting(meeting); // Set the selected meeting
    setShowBookingForm(true); // Show the booking form
  };

  return (
    <>
        {validSession && (
          <div>
            <UserHeader dashboardType="Dashboard" />
            <div className="flex min-h-screen">
              <div className="px-2 py-2 pr-4 bg-gray-400/50">
                <UserSidebar />
              </div>
              <div className="flex-1 border-l border-black bg-gray-400/50 flex flex-col">
                <div>
                  <h2 className="bg-sky-600 text-white text-center text-xl font-serif border-t border-r border-b border-black mt-2 p-1.5">
                    Meetings Available
                  </h2>
                  <div className="overflow-x-auto mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {meetings.map((meeting: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 border border-gray-300 rounded-lg shadow-lg ml-2 bg-white hover:shadow-2xl transition-shadow duration-300"
                        >
                          <div className="mt-2 p-2 border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                          <p className="break-words">
                          <strong className="font-medium">Room Name:</strong>{" "}
                              {meeting.room_name}
                            </p>
                            <p className="break-words">
                            <strong className="font-medium">Approver Name:</strong>{" "}
                              {meeting.authority_name}
                            </p>
                            <p>
                              <strong className="font-medium">Username:</strong>{" "}
                              {meeting.meeting_username}
                            </p>
                            <p className="break-words">
                            <strong className="font-medium">
                                Meeting Days:
                              </strong>{" "}
                              {meeting?.meeting_days?.split(",").join(' , ')}
                            </p>
                            <p>
                              <strong className="font-medium">Start Time:</strong>{" "}
                              {meeting.formatted_start_time}
                            </p>
                            <p>
                              <strong className="font-medium">End Time:</strong>{" "}
                              {meeting.formatted_end_time}
                            </p>
                            <div className="flex justify-center">
                              <button
                                className="bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-1 mt-2 right-6 font-serif shadow-md rounded-full hover:from-green-500 hover:to-green-600 transition duration-300"
                                onClick={() => handleBookingButtonClick(meeting)}
                              >
                                Book Now
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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

        {showBookingForm && (
          <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center">
            <BookingForm
              meeting={selectedMeeting}
              setShowBookingForm={setShowBookingForm}
            />
          </div>
        )}
      </>
    );
  }

export default UserDashboard;
