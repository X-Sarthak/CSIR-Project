import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

axios.defaults.withCredentials = true;

const UsersCreateForm = ({ onClose }: { onClose: () => void }) => {
  const [userData, setUserData] = useState({
    username: "",
    userdivision: "",
    userdesignation: "",
    useremail: "",
    userpassword: "",
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
    e.preventDefault();
    try {
  
      // Make a POST request to create a user
      await axios.post("/admin/users/create", {
        user_name: userData.username,
        user_division: userData.userdivision,
        user_designation: userData.userdesignation,
        user_email: userData.useremail,
        user_password: userData.userpassword,
        user_status: true,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
  
      // Close the form after successful submission
      onClose();
      // Reload the window
      window.location.reload();
    } catch (error: any) {
      if (error.response && error.response.data.error === "Email already exists") {
        toast.error("Email already exists");   
      } else {
        console.error("Error creating user:", error);
      }
    }
  };
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
      <div ref={formRef} className="bg-white p-6 rounded-md shadow-md w-96">
        <h2 className="text-xl font-serif mb-4">Add New User</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={userData.username}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="userdivision"
              className="block text-sm font-medium text-gray-700"
            >
              Division
            </label>
            <input
              type="text"
              id="userdivision"
              name="userdivision"
              value={userData.userdivision}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="userdesignation"
              className="block text-sm font-medium text-gray-700"
            >
              Designation
            </label>
            <input
              type="text"
              id="userdesignation"
              name="userdesignation"
              value={userData.userdesignation}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="useremail"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="useremail"
              name="useremail"
              value={userData.useremail}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="userpassword"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="userpassword"
              name="userpassword"
              value={userData.userpassword}
              onChange={handleChange}
              className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring focus:border-blue-500"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 mr-2 bg-gray-200 text-gray-800 rounded-md focus:outline-none"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md focus:outline-none"
            >
              Submit
            </button>
            <ToastContainer/>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersCreateForm;
