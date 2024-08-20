import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

interface UserDetails {
  user_id: string;
  user_name: string;
  user_division: string;
  user_designation: string;
  user_email: string;
  user_password: string; // Added user_password field
}

interface Props {
  userDetails: UserDetails;
  onClose: () => void;
}

function EditUserForm({ userDetails, onClose }: Props) {
  const [formData, setFormData] = useState<UserDetails>({
    user_id: userDetails.user_id || "",
    user_name: userDetails.user_name || "",
    user_division: userDetails.user_division || "",
    user_designation: userDetails.user_designation || "",
    user_email: userDetails.user_email || "",
    user_password: userDetails.user_password || "", // Initialize user_password field
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Make API call using Axios
      await axios.put(
        `/admin/users/update/${formData.user_id}`,
        formData
      );
      // Close the form after successful submission
      onClose();
      // Reload the window
      window.location.reload();
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        toast.error("Email already exists");
      } else {
        console.error("Error updating user details:", error);
        toast.error("An error occurred while updating user details.");
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
      <div ref={formRef} className="bg-white p-6 rounded-md shadow-lg w-96">
        <h2 className="text-xl font-serif mb-4">Edit User Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="user_name"
              className="block font-semibold mb-1"
              >
              User Name:
            </label>
            <input
              type="text"
              id="user_name"
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="user_division"
              className="block font-semibold mb-1"
              >
              Division:
            </label>
            <input
              type="text"
              id="user_division"
              name="user_division"
              value={formData.user_division}
              onChange={handleChange}
              className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="user_designation"
              className="block font-semibold mb-1"
              >
              Designation:
            </label>
            <input
              type="text"
              id="user_designation"
              name="user_designation"
              value={formData.user_designation}
              onChange={handleChange}
              className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="user_email"
              className="block font-semibold mb-1"
              >
              Email:
            </label>
            <input
              type="email"
              id="user_email"
              name="user_email"
              value={formData.user_email}
              onChange={handleChange}
              className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="user_password"
              className="block font-semibold mb-1"
              >
              Password:
            </label>
            <input
              type="password"
              id="user_password"
              name="user_password"
              value={formData.user_password}
              onChange={handleChange}
              className="rounded-md border border-black p-2 w-full focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="mr-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
            >
              Save
            </button>
          </div>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
}

export default EditUserForm;
