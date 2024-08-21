import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface SidebarItem {
  label: string;
  link: string;
}

const items: SidebarItem[] = [
  { label: 'Dashboard', link: '/login/admin/dashboard' },
  { label: 'Meeting Room', link: '/login/admin/meeting-room' },
  { label: 'Users', link: '/login/admin/users' },
  { label: 'Booking Details', link: '/login/admin/booking-details' },
  { label: 'Local/VC Form', link: '/login/admin/LocalVCconferencingform' },
  { label: 'Local/VC Details', link: '/login/admin/LocalVCconferencingDetails' },
  { label: 'Calendar View', link: '/login/admin/CalendarView' },
];

function AdminSidebar(): JSX.Element {
  const [validSession, setValidSession] = useState(false);
  const location = useLocation();
  const navigator = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const adminUsername = sessionStorage.getItem("admin_username") ?? "";
        if (!token || !adminUsername) {
          navigator("/");
          return;
        }

        const response = await axios.post<{ valid: boolean }>(
          "/admin/validateToken",
          { token }
        );
        if (response.data.valid) {
          setValidSession(true);
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

  const handleLinkClick = (link: string) => {
    if (location.pathname === link) {
      window.location.reload(); // Refresh the page if clicking on the current tab
    } else {
      navigator(link); // Navigate to the new tab otherwise
    }
  };

  if (!validSession) {
    return <></>; // Return an empty fragment if admin is not logged in
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
                      ${location.pathname === item.link ? 'border-black ring-1 ring-black ring-opacity-100' : 'border-black'}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default AdminSidebar;
