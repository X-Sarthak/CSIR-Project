import { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Spinner from "../Utility/Spinner.Utility";

interface CreateAdminFormProps {
  onCreateAdmin: (adminUsername: string, adminPassword: string) => void;
}

function CreateAdminForm({ onCreateAdmin }: CreateAdminFormProps) {
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false); // State variable for loading

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when form submission starts

    // Check for spaces in the input
    if (adminUsername.includes(" ") || adminPassword.includes(" ")) {
      toast.error("Spaces are not allowed in the input fields.");
      setLoading(false); // Set loading back to false
      return;
    }

    try {
      const response = await axios.post("/admin", {
        adminUsername,
        adminPassword,
      });

      if (response.status === 201) {
        onCreateAdmin(adminUsername, adminPassword);
        setAdminUsername("");
        setAdminPassword("");
        setIsOpen(false);
      }
    } catch (error: any) {
      console.error(
        "Error creating admin:",
        error.response?.data?.error || error.message
      );
      toast.error(error.response?.data?.error || "An error occurred.");
    } finally {
      setLoading(false); // Set loading back to false when form submission completes
    }
  };

  return (
    <div>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white font-serif px-4 py-1 rounded-md transition duration-300 ease-in-out absolute top-14 right-4 mt-3"
        onClick={() => setIsOpen(true)}
      >
        Create Admin
      </button>
      {isOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-75">
          {loading && <Spinner />}
          <div
            ref={formRef}
            className="bg-white p-6 rounded-md shadow-lg font-serif"
          >
            <h2 className="text-xl font-semibold mb-4">Create Admin</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="adminUsername"
                  className="block text-sm font-medium text-gray-700"
                >
                  Admin Username
                </label>
                <input
                  type="text"
                  id="adminUsername"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="adminPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Admin Password
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  className="text-gray-600 mr-4"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md relative"
                  disabled={loading} // Disable button when loading
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

export default CreateAdminForm;
