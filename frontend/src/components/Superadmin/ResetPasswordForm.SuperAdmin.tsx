import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Spinner from "../Utility/Spinner.Utility";

function ResetPasswordForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false); // State variable for loading

  const formRef = useRef<HTMLFormElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when form submission starts

    try {
      await axios.put(
        "/superadmin/reset/password",
        formData
      );
      onSubmit(formData);
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      if (error.response) {
        const { data } = error.response;
        if (data.error === "Incorrect old password") {
          toast.error("Incorrect old password");
        } else if (
          data.error === "New password and confirm password do not match"
        ) {
          toast.error("New password and confirm password do not match");
        } else {
          toast.error("An error occurred while resetting password");
        }
      } else {
        toast.error("An error occurred while resetting password");
      }
    } finally {
      setLoading(false); // Set loading back to false regardless of success or error
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (formRef.current && !formRef.current.contains(e.target as Node)) {
      onCancel();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50 z-50">
      {loading && <Spinner/>
}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="oldPassword"
          >
            Old Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="oldPassword"
            type="password"
            name="oldPassword"
            placeholder="Old Password"
            value={formData.oldPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="newPassword"
          >
            New Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="newPassword"
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="confirmPassword"
          >
            Confirm Password
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
            type="submit"
          >
            Reset
          </button>
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
            onClick={onCancel}
          >
            Cancel
          </button>

          <ToastContainer />
        </div>
      </form>
    </div>
  );
}

export default ResetPasswordForm;
