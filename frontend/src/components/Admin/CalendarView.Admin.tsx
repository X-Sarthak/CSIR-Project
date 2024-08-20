import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Alert, Badge } from "antd";
import dayjs, { Dayjs } from "dayjs";
import AdminHeader from "./Header.Admin";
import AdminSidebar from "./Sidebar.Admin";
import { useNavigate } from "react-router-dom";
import Spinner from "../Utility/Spinner.Utility";
import "./CalendarView.Admin.css";

axios.defaults.withCredentials = true;

interface Meeting {
  requesterName: string;
  meetingDate: string; // Format: 'DD-MMM-YYYY'
  startTime: string;
  endTime: string;
  vcVenueName: string; 
}

function CalendarView() {
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminDetails, setAdminDetails] = useState<{
    admin_username: string;
  } | null>(null);
  const [totalTime, setTotalTime] = useState<string>(''); // To hold total time of the month

  const [value, setValue] = useState(() => dayjs()); // Initialize with current date
  const [selectedValue, setSelectedValue] = useState(() => dayjs()); // Initialize with current date

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const adminUsername = sessionStorage.getItem("admin_username") ?? "";
        setLoading(true);
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
          fetchAdminDetails();
          fetchMeetings();
          fetchTotalTime(); // Fetch total time when the component loads
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate, value]);

  useEffect(() => {
    fetchTotalTime(); // Fetch total time whenever the selected month changes
  }, [selectedValue]);

  const fetchAdminDetails = async () => {
    try {
      const response = await axios.get("/admin/details");
      setAdminDetails(response.data);
    } catch (error) {
      console.error("Error fetching admin details:", error);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await axios.get<Meeting[]>(
        "/admin/local/meeting/detail/calendar"
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
        "/admin/local/meeting/total-time",
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
    if (newValue.isSame(selectedValue, 'date')) {
      // Only proceed if it's a new date selection, not a month change
      setSelectedValue(newValue);
      const formattedDate = newValue.format("YYYY-MM-DD");
      navigate(`/login/admin/LocalVCconferencingform?date=${formattedDate}`);
    } else {
      // Just update the selected value if it's a month change
      setSelectedValue(newValue);
      setValue(newValue);
    }
  };

  const onPanelChange = (value: Dayjs, mode: string) => {
    // Handle month and year changes here if needed
    if (mode === 'month') {
      setSelectedValue(value); // Update selected value to the new month
      setValue(value); // Update value to the new month
    }
  };

  const dateCellRender = (currentDate: Dayjs) => {
    const formattedDate = currentDate.format("YYYY-MM-DD");
    const dayMeetings = meetings.filter(meeting => {
      return dayjs(meeting.meetingDate).format("YYYY-MM-DD") === formattedDate;
    });
  
    return (
      <ul className="events">
        {dayMeetings.map((meeting, index) => (
          <li key={index}>
            <div className="meeting-details">
              <span className="meeting-name">
                <Badge status="success" style={{ marginRight: '8px' }} />
                {meeting.requesterName}
              </span>
              <span className="meeting-time">
                {meeting.startTime} - {meeting.endTime}
              </span>
              <span className="meeting-venue">
                {meeting.vcVenueName}
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
          <AdminHeader dashboardType="Admin" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <AdminSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-white flex flex-col">
              {adminDetails && (
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
                      message={`Total time for ${selectedValue.format("MMMM YYYY")}: ${totalTime} Hours`}
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

export default CalendarView;
