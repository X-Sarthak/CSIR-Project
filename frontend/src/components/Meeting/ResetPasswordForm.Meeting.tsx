import { useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

function ResetPasswordForm({ onSubmit, onCancel }: { onSubmit: (data: { oldPassword: string, newPassword: string, confirmPassword: string }) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.put("/meeting/reset/password", formData, {
        withCredentials: true, // Include cookies in the request
      });
      onSubmit(formData); // Optionally, you can handle success in onSubmit callback
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 400) {
          toast.error(error.response.data.error);
        } else if (error.response.status === 401) {
          toast.error(error.response.data.error);
        } else if (error.response.status === 404) {
          toast.error(error.response.data.error);
        } else if (error.response.status === 500) {
          toast.error("Internal server error. Please try again later.");
        } else {
          toast.error("An error occurred. Please try again later.");
        }
      } else {
        toast.error("Network error. Please try again later.");
      }
    }
  }; 

  return (
    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-900 bg-opacity-50 z-50">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="oldPassword">
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
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
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
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
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
        </div>
      </form>
      <ToastContainer/>
    </div>
  );
}

export default ResetPasswordForm;
