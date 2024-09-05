import React, { useState, useEffect, FormEvent, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface RegistrationFormProps {
  meeting: any; // Adjust the type according to your requirement
  setShowRegistrationForm: React.Dispatch<React.SetStateAction<boolean>>;
}

function RegistrationForm({ meeting, setShowRegistrationForm }: RegistrationFormProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [meetingOption, setMeetingOption] = useState("");
  const [meetingSchedule, setMeetingSchedule] = useState<any[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [link, setLink] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMeetingSchedule();
  }, []);

  useEffect(() => {
    if (meetingSchedule.length > 0) {
      const currentMeeting = meetingSchedule.find((m) =>
        m.meeting_days.includes(selectedDay)
      );
      if (currentMeeting) {
        setStartTime(currentMeeting.start_time);
        setEndTime(currentMeeting.end_time); 
      }
    }
  }, [selectedDay, meetingSchedule]);

  const fetchMeetingSchedule = async () => {
    try {
      // Fetch the current date from the World Clock API
      // const worldClockResponse = await axios.get(
      //   "/currentDateTime"
      // );
      // const currentDate = new Date(worldClockResponse.data.currentDateTime);
      
      // Fetch the current date from the computer's local time
      const currentDate = new Date();

      const response = await axios.get(
        `/user/calendar/meetings/${meeting.meeting_id}`
      );
      setMeetingSchedule(response.data); // Assuming the response data is an array of meeting schedule objects

      // Generate available dates from the current date to the same date of the next 2 months
      
      currentDate.setDate(currentDate.getDate() + 1); // Start from the next day
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const currentDay = currentDate.getDate();
      const nextMonth =
        currentMonth + 2 > 11 ? (currentMonth + 2) % 12 : currentMonth + 2; // Handle December and wrap around
      const nextYear = currentMonth + 2 > 11 ? currentYear + 1 : currentYear;
      const endDate = new Date(nextYear, nextMonth, currentDay); // Set end date to the same date two months later

      const availableDatesInRange: string[] = [];
      for (
        let date = new Date(currentYear, currentMonth, currentDay);
        date <= endDate;
        date.setDate(date.getDate() + 1)
      ) {
        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "long",
          day: "numeric",
        };
        const formattedDate = date.toLocaleDateString("en-US", options);
        const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
        const isMeetingDay = response.data.some((meeting: any) =>
          meeting.meeting_days.includes(dayOfWeek)
        );
        if (isMeetingDay) {
          availableDatesInRange.push(formattedDate);
        }
      }

      // Set available dates to state
      setAvailableDates(availableDatesInRange);
    } catch (error) {
      console.error("Error fetching meeting schedule:", error);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setButtonLoading(true);

    if (!selectedDate) {
      toast.info("Please select a date.");
      setButtonLoading(false);
      return;
    }
    if (!meetingOption) {
      toast.info("Please select a meeting option.");
      setButtonLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "/meeting/booking/schedule/send",
        {
          meeting_title: title,
          meeting_date: selectedDate,
          meeting_day: selectedDay,
          start_time: startTime,
          end_time: endTime,
          meeting_option: meetingOption,
          meeting_link: link,
        }
      );

      console.log("Booking data inserted successfully:", response.data);
      setSelectedDate("");
      setSelectedDay("");
      setStartTime("");
      setEndTime("");
      setTitle("");
      setLink("");

      setShowRegistrationForm(false);
    } catch (error: any) {
      console.error("Error inserting booking data:", error.response?.data);

      if (error.response?.data.error === "User not authenticated") {
        toast.error("User not authenticated. Please log in.");
      } else if (error.response?.data.error === "Meeting not found") {
        toast.error("Meeting not found. Please choose a valid meeting.");
      } else if (error.response?.data.error === "Meeting day not available") {
        toast.error("Selected meeting day is not available.");
      } else if (error.response?.data.error === "Time slot not available") {
        toast.error(
          "Selected time slot is not available. Please choose a different time."
        );
      } else if (
        error.response?.data.error === "Slot not available on selected date"
      ) {
        toast.error(
          "Selected time slot is not available on the selected date. Please choose a different time."
        );
      } else {
        toast.error("An error occurred while booking. Please try again later.");
      }
    } finally {
      setButtonLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form fields
    setSelectedDate("");
    setSelectedDay("");
    setStartTime("");
    setEndTime("");
    setTitle("");
    setLink("");
    // Close the booking form
    setShowRegistrationForm(false);
  };

  const handleDateChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedDate = event.target.value;

    setSelectedDate(selectedDate);

    const dateObj = new Date(selectedDate);
    const options: Intl.DateTimeFormatOptions = { weekday: "long" };
    const selectedDay = dateObj.toLocaleDateString("en-US", options);

    setSelectedDay(selectedDay);

    // Clear booked slots
    setBookedSlots([]);

    // Fetch booked slots for the selected date and day
    try {
      const response = await axios.get(
        `/user/booked/slot/${meeting.meeting_id}?date=${selectedDate}&day=${selectedDay}`
      );
      setBookedSlots(response.data);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (    formRef.current && !formRef.current.contains(event.target as Node)
      ) {
        setShowRegistrationForm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      document.body.style.overflow = "auto";
    };
  }, [setShowRegistrationForm]);

  return (
    <div className="relative w-full h-full overflow-y-auto flex justify-center items-center bg-gray-800 bg-opacity-50">
      <div
        ref={formRef}
        className="bg-white p-6 rounded-md shadow-md w-5/12 max-h-fit"
      >
        <h2 className="text-xl font-serif mb-4">Booking Form For Meeting User</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Date:
            </label>
            <select
              value={selectedDate}
              onChange={handleDateChange}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-500 cursor-pointer"
            >
              <option value="">Not Selected</option>
              {availableDates.map((date, index) => (
                <option key={index} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Meeting Options:
            </label>
            <select
              value={meetingOption}
              onChange={(e) => setMeetingOption(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-500 cursor-pointer"
            >
              <option value="">Not Selected</option>
              <option value="Hybrid">Hybrid (Online/Offline)</option>
              <option value="Offline">Offline</option>
            </select>
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Day : <span style={{ color: "green" }}>{selectedDay}</span>
            </label>
          </div>

          <div className="flex flex-wrap w-60 mt-4 mb-4">
            <div className="mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Already Booked Slot: {selectedDate}
              </label>
            </div>
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-1 text-sm font-semibold">
                    Start Time
                  </th>
                  <th className="border border-gray-300 p-1 text-sm font-semibold">
                    End Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookedSlots.map((slot, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1 text-xs text-center text-red-600">
                      {slot.start_time}
                    </td>
                    <td className="border border-gray-300 p-1 text-xs text-center text-red-600">
                      {slot.end_time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-2">
            <label
              htmlFor="start-time"
              className="block text-sm font-medium text-gray-700"
            >
              Start Time:
            </label>
            <input
              type="time"
              id="start-time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 p-2 w-24 border rounded-md focus:outline-none focus:ring focus:border-blue-500 cursor-pointer"
            />
          </div>
          <div className="mb-2">
            <label
              htmlFor="end-time"
              className="block text-sm font-medium text-gray-700"
            >
              End Time:
            </label>
            <input
              type="time"
              id="end-time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 p-2 w-24 border rounded-md focus:outline-none focus:ring focus:border-blue-500 cursor-pointer"
            />
          </div>
          <div className="mb-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title:
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-2">
            <label
              htmlFor="link"
              className="block text-sm font-medium text-gray-700"
            >
              Link (Optional):
            </label>
            <input
              type="url"
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 mr-2 bg-gray-200 text-gray-800 rounded-md focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none ${
                buttonLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={buttonLoading}
            >
              {buttonLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}

export default RegistrationForm;

