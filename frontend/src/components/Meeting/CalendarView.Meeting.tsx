import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Alert, Badge } from "antd";
import dayjs, { Dayjs } from "dayjs";
import MeetingHeader from "./Header.Meeting";
import MeetingSidebar from "./Sidebar.Meeting";
import { useNavigate } from "react-router-dom";
import Spinner from "../Utility/Spinner.Utility";
import "./CalendarView.Meeting.css";

axios.defaults.withCredentials = true;

interface Meeting {
  title: string;
  userName: string;
  userEmail: string;
  date: string; // Format: 'YYYY-MM-DD'
  startTime: string;
  endTime: string;
  requestStatus: boolean;
}

function MeetingCalendarView() {
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState<Meeting[] | null>(null);
  const [totalTime, setTotalTime] = useState<string>(""); // To hold total time of the month
  const [value, setValue] = useState(() => dayjs()); // Initialize with current date
  const [selectedValue, setSelectedValue] = useState(() => dayjs()); // Initialize with current date

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const navigate = useNavigate();

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
          fetchMeetingDetails();
          fetchMeetings(); // Fetch meeting details
          fetchTotalTime(); // Fetch total time for the initial month
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
    fetchTotalTime(); // Fetch total time whenever the selected month changes
  }, [selectedValue]);

  const fetchMeetingDetails = async () => {
    try {
      const response = await axios.get("/meeting/details");
      setMeetingDetails(response.data);
    } catch (error) {
      console.error("Error fetching meeting details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await axios.get<Meeting[]>(
        "/meeting/booking/schedule/detail/calendar"
      );
      setMeetings(response.data);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    }
  };

  const fetchTotalTime = async () => {
    const year = selectedValue.year();
    const month = selectedValue.month() + 1; // JavaScript months are 0-based

    try {
      const response = await axios.get<{ total_time: string }>(
        "/meeting/total-time/calendar",
        {
          params: {
            year,
            month,
          },
        }
      );
      setTotalTime(response.data.total_time);
    } catch (error) {
      console.error("Error fetching total time:", error);
      setTotalTime("0");
    }
  };

  const onDateSelect = (newValue: Dayjs) => {
    if (newValue.isSame(selectedValue, "date")) {
      // Only proceed if it's a new date selection, not a month change
      setSelectedValue(newValue);
    } else {
      // Just update the selected value if it's a month change
      setSelectedValue(newValue);
      setValue(newValue);
    }
  };

  const onPanelChange = (value: Dayjs, mode: string) => {
    // Handle month and year changes here if needed
    if (mode === "month") {
      setSelectedValue(value); // Update selected value to the new month
      setValue(value); // Update value to the new month
    }
  };

  const dateCellRender = (currentDate: Dayjs) => {
    const formattedDate = currentDate.format("YYYY-MM-DD");
    const dayMeetings = meetings.filter((meeting) => {
      return meeting.date === formattedDate;
    });

 const getBadgeStatus = (status: number | boolean | null) => 
  (status === true || status === 1) ? "success" : 
  (status === false || status === 0) ? "error" : "warning";

    return (
      <ul className="events">
        {dayMeetings.map((meeting, index) => (
          <li key={index}>
            <div className="meeting-details">
              <span className="meeting-title">
                <Badge
                  className="mr-2"
                  status={getBadgeStatus(meeting.requestStatus)} // Ensure this handles numeric values
                />
                Title - {meeting.title}
              </span>
              <span className="meeting-user">Name - {meeting.userName}</span>
              <span className="meeting-user">Email - {meeting.userEmail}</span>
              <span className="meeting-time">
                {meeting.startTime} - {meeting.endTime}
              </span>
            </div>
            {index < dayMeetings.length - 1 && (
              <div className="separator"></div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      {loading && <Spinner />}
      {validSession && (
        <div>
          <MeetingHeader dashboardType="Calendar" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <MeetingSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-white flex flex-col">
              {meetingDetails && (
                <>
                  <div className="mt-2">
                    <Alert
                      className="no-border-radius"
                      message={`You selected date: ${selectedValue?.format(
                        "DD-MM-YYYY"
                      )}`}
                    />
                    <Alert
                      className="no-border-radius mt-2"
                      message={`Total Month Meeting Time: ${selectedValue.format("MMMM YYYY")} / ${totalTime} Hrs`}
                      type="info"
                    />
                    <Calendar
                      className="no-border-radius"
                      value={value}
                      onSelect={onDateSelect}
                      onPanelChange={onPanelChange} // Handle month/year changes
                      cellRender={dateCellRender}
                    />
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

export default MeetingCalendarView;
