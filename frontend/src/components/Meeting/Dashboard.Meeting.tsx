import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MeetingHeader from "./Header.Meeting";
import MeetingSidebar from "./Sidebar.Meeting";
import { toast, ToastContainer } from "react-toastify";
import RegistrationForm from "./RegistrationForm.Meeting";
import Spinner from "../Utility/Spinner.Utility";

axios.defaults.withCredentials = true;

function MeetingDashboard() {
  const [validSession, setValidSession] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState<{
    meeting_id: string;
    meeting_username: string;
    meeting_days: string;
    formatted_start_time: string;
    formatted_end_time: string;
  } | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [previousStartTime] = useState<string>("");
  const [previousEndTime] = useState<string>("");
  const [buttonLoading, setButtonLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshPage, setRefreshPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showURLInput, setShowURLInput] = useState(false);
  const [url, setURL] = useState("");
  const [lastRequestCount, setLastRequestCount] = useState<number>(0); // Keep track of the last request count



  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const notification = new Audio("/notification.mp3");


  useEffect(() => {
    const checkSession = async () => {
      setLoading(true); // Set loading to true when starting
      try {
        const token = sessionStorage.getItem("token");
        const meetingUsername =
          sessionStorage.getItem("meeting_username") ?? "";
        if (!token || !meetingUsername) {
          navigate("/");
          return;
        }

        const response = await axios.post<{ valid: boolean }>(
          "/meeting/validateToken",
          { token }
        );
        if (response.data.valid) {
          setValidSession(true);
          fetchMeetingDetails(); // Wait for meeting details to be fetched
          fetchRequestCount();
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigate("/");
      } finally {
        setLoading(false); // Set loading to false after validation is complete
      }
    };

    checkSession();
  }, [navigate]);



  useEffect(() => {
    const pollingInterval = setInterval(() => {
      fetchRequestCount();
    }, 10000); // Poll every 10 seconds
  
    // Clear interval on component unmount
    return () => clearInterval(pollingInterval);
  }, [lastRequestCount]);
  

  const fetchRequestCount = async () => {
    try {
      const response = await axios.get<{ request_count: number }>("/meeting/schedule/count");
      const requestCount = response.data.request_count;

      // Trigger notification sound if the request count has increased
      if (requestCount > lastRequestCount) {
        notification.play();
      }

      // Update the last request count
      setLastRequestCount(requestCount);

      // Display toast notification
      toast.info(`You have ${requestCount} pending requests for meeting schedule approval.`);
    } catch (error: any) {
      console.error("Error fetching request count:", error);
    }
  };

  useEffect(() => {
    if (refreshPage) {
      window.location.reload();
      setRefreshPage(false);
    }
  }, [refreshPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowForm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [showForm]);

  const fetchMeetingDetails = async () => {
    try {
      const response = await axios.get("/meeting/details");
      setMeetingDetails(response.data);
      setSelectedDaysFromBackend();
    } catch (error) {
      console.error("Error fetching meeting details:", error);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedDaysFromBackend = async () => {
    try {
      const response = await axios.get("/meeting/selectedDays");
      const { selectedDays } = response.data;

      if (selectedDays.length > 0) {
        const daysArray = selectedDays[0].meeting_days.split(",");
        setSelectedDays(daysArray);
        setStartTime(selectedDays[0].start_time);
        setEndTime(selectedDays[0].end_time);
      } else {
        setSelectedDays([]);
      }
    } catch (error) {
      console.error("Error fetching selected days:", error);
    }
  };

  const handleCheckboxChange = (day: string) => {
    setSelectedDays((prevSelectedDays) =>
      prevSelectedDays.includes(day)
        ? prevSelectedDays.filter((d) => d !== day)
        : [...prevSelectedDays, day]
    );
  };

  const handleUpdateDaysAndTime = async () => {
    if (selectedDays.length === 0) {
      toast.info("Please select at least one day.");
      return;
    }

    if (!startTime || !endTime) {
      toast.info("Please select start and end times.");
      return;
    }

    try {
      setButtonLoading(true);
      const meetingId = meetingDetails?.meeting_id ?? "";

      await axios.put("/meeting/update-schedule", {
        meetingId,
        selectedDays,
        startTime,
        endTime,
        previousStartTime,
        previousEndTime,
      });

      toast.success("Meeting schedule updated successfully");
      setShowForm(false);
      fetchMeetingDetails();
    } catch (error: any) {
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 400) {
          const errorMessage = error.response.data.error;
          toast.error(errorMessage);
        } else if (statusCode === 404) {
          toast.error("Meeting not found");
        } else {
          toast.error("Failed to update meeting schedule");
        }
      } else if (error.request) {
        toast.error("No response received from the server");
      } else {
        toast.error("Error updating meeting schedule:", error.message);
      }
    } finally {
      setButtonLoading(false);
    }
  };

  const handleRegistrationButtonClick = (meeting_id: any) => {
    setSelectedMeeting(meeting_id);
    setShowRegistrationForm(true);
  };

  const handleURLSubmit = async () => {
    if (url) {
      try {
        // Make the API call to update the meeting link
        const response = await axios.post('/meeting/schedule/add-link', {
          meeting_link: url, // Send the URL as the meeting_link in the request body
        });
  
        // Check if the response was successful
        if (response.status === 200) {
          toast.success(`URL submitted successfully: ${url}`);
          setURL("");
          setShowURLInput(false);
        } else {
          toast.error("Failed to submit URL. Please try again.");
        }
      } catch (error) {
        console.error("Error submitting URL:", error);
        toast.error("Error submitting URL. Please try again.");
      }
    } else {
      toast.info("Please enter a URL.");
    }
  };

  return (
    <>
      {loading && <Spinner />}
      {validSession && (
        <div>
          <MeetingHeader dashboardType="Dashboard" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <MeetingSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-gray-400/50 flex flex-col">
              <div className="bg-sky-600 border-t border-r border-b border-black mt-2 p-1">
                <h2 className="text-xl text-white font-serif text-center mb-1">
                  Meeting Dashboard
                </h2>
              </div>
              <div className="bg-white border-t border-r border-b border-black mt-2 p-1.5 flex justify-between items-center">
                <h3 className="text-xl font-serif">
                  Username/No.: {meetingDetails?.meeting_username}
                </h3>
                {meetingDetails?.formatted_start_time &&
                  meetingDetails?.formatted_end_time && (
                    <button
                      onClick={() =>
                        handleRegistrationButtonClick(meetingDetails)
                      }
                      className="bg-green-500 hover:bg-green-600 text-white font-serif shadow-md px-9 py-3 mr-7 rounded-md transition duration-300 ease-in-out"
                    >
                      Book User Meeting
                    </button>
                  )}
              </div>
              <div className="bg-white text-xl text-center font-serif border-t border-r border-b border-black mt-2 p-1.5">
                <h4>Meeting Information</h4>
              </div>
              <div className="bg-white p-4 border-r border-b border-black">
                <h5 className="text-xl font-serif mb-2">
                  <div className="gap-2"></div>
                  Meeting Days:{" "}
                  {meetingDetails?.meeting_days?.split(",").join(" , ")}
                </h5>
                <h5 className="text-xl font-serif mb-2">
                  Start Time: {meetingDetails?.formatted_start_time}
                </h5>
                <h5 className="text-xl font-serif mb-2">
                  End Time: {meetingDetails?.formatted_end_time}
                </h5>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-serif shadow-md px-6 py-3 rounded-md transition duration-300 ease-in-out absolute top-40 right-4 mt-20  mx-4"
              >
                Update Days and Time
              </button>
              <button
                onClick={() => setShowURLInput(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white font-serif shadow-md px-6 py-3 rounded-md transition duration-300 ease-in-out absolute top-40 right-4 mt-37 mx-4"
              >
                Insert URL
              </button>
              {showForm && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                  <div ref={formRef} className="bg-white p-6 rounded-md w-auto">
                    <h3 className="text-xl font-serif mb-4 text-center">
                      Select Days and Time
                    </h3>
                    <div className="flex flex-wrap gap-4 mb-4 mt-4 font-semibold">
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ].map((day) => (
                        <label key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedDays.includes(day)}
                            onChange={() => handleCheckboxChange(day)}
                            className="mr-2 cursor-pointer"
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                    <div className="grid gap-4 mb-4 font-semibold">
                      <div>
                        <label htmlFor="start-time">Start Time: </label>
                        <input
                          type="time"
                          id="start-time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="p-2 border border-gray-300 rounded-md cursor-pointer"
                        />
                      </div>
                      <div>
                        <label htmlFor="end-time">End Time: </label>
                        <input
                          type="time"
                          id="end-time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="p-2 border border-gray-300 ml-2 rounded-md cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleUpdateDaysAndTime}
                        disabled={buttonLoading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out mr-2"
                      >
                        {buttonLoading ? "Updating..." : "Update Schedule"}
                      </button>
                      <button
                        onClick={() => setShowForm(false)}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md transition duration-300 ease-in-out"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
                 {showURLInput && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                  <div ref={formRef} className="bg-white p-6 rounded-md w-auto">
                    <h3 className="text-xl font-serif mb-4 text-center">
                      Enter URL
                    </h3>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setURL(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full p-2 border border-gray-300 rounded-md mb-4"
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleURLSubmit}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out mr-2"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setShowURLInput(false)}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md transition duration-300 ease-in-out"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {showRegistrationForm && (
                <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex justify-center items-center">
                  <RegistrationForm
                    meeting={selectedMeeting}
                    setShowRegistrationForm={setShowRegistrationForm}
                  />
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

export default MeetingDashboard;
