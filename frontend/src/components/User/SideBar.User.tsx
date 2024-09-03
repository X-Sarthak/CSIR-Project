import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface SidebarItem {
  label: string;
  link: string;
}

const items: SidebarItem[] = [
  { label: 'Dashboard', link: '/login/user/dashboard' },
  { label: 'Display Request', link: '/login/user/requests-display' },
  { label: 'Profile', link: '/login/user/profile' },
];

function UserSidebar(): JSX.Element {
  const [validSession, setValidSession] = useState(false);
  const [activeLink, setActiveLink] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const userEmail = sessionStorage.getItem("user_email") ?? "";
        if (!token || !userEmail) {
          navigate("/"); // Redirect to login if no session
          return;
        }

        const response = await axios.post<{ valid: boolean }>(
          "/user/validateToken",
          { token }
        );
        if (response.data.valid) {
          setValidSession(true);
        } else {
          navigate("/"); // Redirect to login if token is not valid
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigate("/"); // Redirect to login on error
      }
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    // Set the active link based on the current path
    setActiveLink(location.pathname);
  }, [location.pathname]);

  const handleLinkClick = (link: string) => {
    if (activeLink === link) {
      window.location.reload(); // Refresh the page if clicking on the current tab
    } else {
      navigate(link); // Navigate to the new tab otherwise
    }
  };

  if (!validSession) {
    return <></>; // Return an empty fragment if session is not valid
  }

  return (
    <div className='flex flex-col gap-2'>
      {items.map((item: SidebarItem) => (
        <button
          key={item.label}
          onClick={() => handleLinkClick(item.link)}
          className={`px-14 py-2 border font-serif bg-sky-600 text-white
                      transition-transform duration-200 ease-in-out
                      hover:bg-sky-700
                      focus:outline-none
                      ${activeLink === item.link ? 'border-black ring-1 ring-black ring-opacity-100' : 'border-black'}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default UserSidebar;
