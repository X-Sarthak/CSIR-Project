import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

axios.defaults.withCredentials = true;

type MeetingCreateFormProps = {
  onClose: () => void;
};

const MeetingCreateForm: React.FC<MeetingCreateFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    meetingRoomName: "",
    authorityName: "",
    username: "",
    password: "",
    startTime: "",
    endTime: "",
  });

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Check if meeting username or password contains spaces
    if (formData.username.includes(" ")) {
      toast.error("Spaces are not allowed in the meeting username.");
      return;
    }
    if (formData.password.includes(" ")) {
      toast.error("Spaces are not allowed in the meeting password.");
      return;
    }

    try {
      // Make a POST request to create a meeting
      await axios.post("/admin/meetings/create", {
        room_name: formData.meetingRoomName,
        authority_name: formData.authorityName,
        meeting_username: formData.username,
        meeting_password: formData.password,
        start_time: formData.startTime,
        end_time: formData.endTime,
        meeting_status: true,
      });
      onClose();
      window.location.reload();
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 400) {
          toast.error(error.response.data.error);
        } else if (error.response.status === 401) {
          toast.error(error.response.data.error);
        } else if (error.response.status === 409) {
          toast.error(error.response.data.error);
        } else if (error.response.status === 500) {
          toast.error("Internal server error. Please try again later.");
        } else {
          toast.error("An error occurred. Please try again later.");
        }
      } else {
        toast.error("Network error. Please try again later.");
      }
      console.error("Error creating meeting:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div ref={formRef} className="bg-white rounded-md p-8 w-96">
        <h2 className="text-2xl font-semibold mb-4">Create Meeting</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div>
              <label
                htmlFor="meetingRoomName"
                className="block font-semibold mb-1"
              >
                Meeting Room Name:
              </label>
              <input
                type="text"
                id="meetingRoomName"
                name="meetingRoomName"
                value={formData.meetingRoomName}
                onChange={handleChange}
                className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="authorityName"
                className="block font-semibold mb-1"
              >
                Approver Name:
              </label>
              <input
                type="text"
                id="authorityName"
                name="authorityName"
                value={formData.authorityName}
                onChange={handleChange}
                className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="username" className="block font-semibold mb-1">
                Username:
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-semibold mb-1">
                Password:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="flex justify-between">
              <div className="flex-1 mr-2">
                <label htmlFor="startTime" className="block font-semibold mb-1">
                  Start Time:
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex-1 ml-2">
                <label htmlFor="endTime" className="block font-semibold mb-1">
                  End Time:
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="mr-2 px-4 py-2 rounded-md border border-gray-300"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                Create
              </button>
            </div>
          </div>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
};

export default MeetingCreateForm;
