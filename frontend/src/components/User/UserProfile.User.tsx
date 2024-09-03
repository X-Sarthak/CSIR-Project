import { useEffect, useState } from "react";
import axios from "axios";
import UserHeader from "./Header.User";
import UserSidebar from "./SideBar.User";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

axios.defaults.withCredentials = true;

function UserProfile() {
  const [validSession, setValidSession] = useState(false);
  const [userDetails, setUserDetails] = useState<{
    user_email: string;
    user_name: string;
    user_division: string;
    user_designation: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedDetails, setUpdatedDetails] = useState<{
    user_email: string;
    user_name: string;
    user_division: string;
    user_designation: string;
  } | null>(null);

  const navigator = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const userEmail = sessionStorage.getItem("user_email") ?? "";
        if (!token || !userEmail) {
          navigator("/");
          return;
        }

        const response = await axios.post<{ valid: boolean }>(
          "/user/validateToken",
          { token }
        );
        if (response.data.valid) {
          setValidSession(true);
          // Fetch specific user details after session validation
          fetchUserDetails();
        } else {
          navigator("/");
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigator("/");
      }
    };

    checkSession();
  }, [navigator]);

  // Function to fetch user details
  const fetchUserDetails = async () => {
    try {
      const response = await axios.get("/user/details");
      setUserDetails(response.data);
      setUpdatedDetails(response.data);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (updatedDetails) {
      // If the input field is for user_email, remove spaces from the value
      const value =
        e.target.name === "user_email"
          ? e.target.value.replace(/\s/g, "")
          : e.target.value;
      setUpdatedDetails({
        ...updatedDetails,
        [e.target.name]: value,
      });
    }
  };

  const handleSave = async () => {
    try {
      if (updatedDetails && areRequiredFieldsFilled(updatedDetails)) {
        await axios.put(
          "/user/edit/profile",
          updatedDetails
        );
        setUserDetails(updatedDetails);
        setIsEditing(false);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Please fill in all required fields.");
      }
    } catch (error) {
      console.error("Error updating user details:", error);
      alert("Failed to update details");
    }
  };

  const areRequiredFieldsFilled = (details: any) => {
    // Define an array of required field names
    const requiredFields = [
      "user_email",
      "user_name",
      "user_division",
      "user_designation",
    ];
    // Check if all required fields have values
    return requiredFields.every((field) => !!details[field]);
  };

  return (
    <>
      {validSession && (
        <div>
          <UserHeader dashboardType="Profile" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <UserSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-gray-400/50 flex flex-col">
              {userDetails && (
                <>
                  <h1 className="bg-sky-600 text-white text-center text-xl font-serif border-t border-r border-b border-black mt-2 p-1.5">
                    User Profile:
                  </h1>
                  <div className="bg-white p-4 shadow-md mt-2 mb-2 border-t border-b border-r border-black">
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-sm font-semibold">Email:</p>
                        {isEditing ? (
                          <input
                            type="text"
                            name="user_email"
                            value={updatedDetails?.user_email}
                            onChange={handleInputChange}
                            className="text-lg font-serif border p-1 w-80 rounded-lg"
                            pattern="^\S+@\S+$" // This pattern ensures no spaces are allowed
                            title="Please enter a valid email address without spaces"
                          />
                        ) : (
                          <p className="text-lg font-serif">
                            {userDetails.user_email}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Name:</p>
                        {isEditing ? (
                          <input
                            type="text"
                            name="user_name"
                            value={updatedDetails?.user_name}
                            onChange={handleInputChange}
                            className="text-lg font-serif border p-1 w-80 rounded-lg"
                            required
                          />
                        ) : (
                          <p className="text-lg font-serif">
                            {userDetails.user_name}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Division:</p>
                        {isEditing ? (
                          <input
                            type="text"
                            name="user_division"
                            value={updatedDetails?.user_division}
                            onChange={handleInputChange}
                            className="text-lg font-serif border p-1 w-80 rounded-lg"
                            required
                          />
                        ) : (
                          <p className="text-lg font-serif">
                            {userDetails.user_division}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Designation:</p>
                        {isEditing ? (
                          <input
                            type="text"
                            name="user_designation"
                            value={updatedDetails?.user_designation}
                            onChange={handleInputChange}
                            className="text-lg font-serif border p-1 w-80 rounded-lg"
                            required
                          />
                        ) : (
                          <p className="text-lg font-serif">
                            {userDetails.user_designation}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      {isEditing ? (
                        <button
                          onClick={handleSave}
                          className="bg-green-500 hover:bg-green-600 text-white font-serif shadow-md px-4 py-2 rounded-md transition duration-300 ease-in-out"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-serif shadow-md px-4 py-2 rounded-md transition duration-300 ease-in-out"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <footer className="text-center -mb-6 px-2 py-2 border-t border-black">
            Copyright &copy; {new Date().getFullYear()} Concept. All rights
            reserved.
          </footer>
          <ToastContainer />
        </div>
      )}
    </>
  );
}

export default UserProfile;
