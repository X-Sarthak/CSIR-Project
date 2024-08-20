import { FaUser } from 'react-icons/fa';
import { IoMdArrowDropdown } from 'react-icons/io';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ResetPasswordForm from './ResetPasswordForm.Users'; // Import the ResetPasswordForm component
import axios from 'axios';

function UserHeader({ dashboardType }: { dashboardType: string }) {
  const navigator = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false); // State to control visibility of reset password form
  const [validSession, setValidSession] = useState(false); // State to manage session validity

  const dropdownRef = useRef<HTMLDivElement>(null);

  const checkSession = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const userEmail = sessionStorage.getItem("user_email") ?? "";
      if (!token || !userEmail) {
        handleLogout();
        return;
      }

      const response = await axios.post<{ valid: boolean }>(
        '/user/validateToken',
        { token }
      );
      if (response.data.valid) {
        setValidSession(true);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Error validating session:', error);
      handleLogout();
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user_email');
    setValidSession(false); // Clear session state
    navigator('/');
  };

  const handleChangePassword = () => {
    // Toggle the visibility of reset password form
    setShowResetPassword(!showResetPassword);
  };

  const handleCancelResetPassword = () => {
    // Cancel the reset password action and close the form
    setShowResetPassword(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!validSession) {
    return null; // Render nothing if the session is not valid
  }

  return (
    <div className="bg-sky-600 font-serif text-white">
      <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
        <span>{dashboardType}</span>
        <div className='relative'>
          <div className='flex items-center justify-end cursor-pointer' onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <FaUser />
            <IoMdArrowDropdown />
          </div>
          {isDropdownOpen && (
            <div ref={dropdownRef} className='absolute right-0 mt-2 bg-white shadow-md rounded-md' style={{ width: 'max-content' }}>
              <button className='block w-full py-2 px-4 text-left border-b border-gray-300' onClick={handleChangePassword} style={{ color: 'black' }}>Change Password</button>
              <button className='block w-full py-2 px-4 text-left' onClick={handleLogout} style={{ color: 'black' }}>Logout</button>
            </div>
          )}
        </div>
      </div>
      {showResetPassword && <ResetPasswordForm onSubmit={() => setShowResetPassword(false)} onCancel={handleCancelResetPassword} />}
    </div>
  );
}

export default UserHeader;
