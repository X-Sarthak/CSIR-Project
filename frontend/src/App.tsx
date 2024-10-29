import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SuperadminLogin from './components/Superadmin/Login.Superadmin';
import SuperAdminDashboard from './components/Superadmin/Dashboard.Superadmin';
import Login from './components/Login/Login.Main';
import AdminDashboard from './components/Admin/Dashboard.Admin';
import MeetingRoom from './components/Admin/MeetingRoom.Admin';
import Users from './components/Admin/Users.Admin';
import UserDashboard from './components/User/Dashboard.User';
import MeetingDisplay from './components/User/DisplayRequest.User';
import UserProfile from './components/User/UserProfile.User';
import MeetingDashboard from './components/Meeting/Dashboard.Meeting';
import ShowRequest from './components/Meeting/ShowRequest.Meeting';
import BookingSchedule from './components/Admin/BookingSchedule.Admin';
import LocalMeetingRequest from './components/Admin/LocalMeetingRequestForm.Admin';
import LocalMeetingInfo from './components/Admin/LocalMeetingInformation.Admin';
import CalendarView from './components/Admin/CalendarView.Admin';
import LocalMeetingEdit from './components/Admin/LocalMeetingEditForm.Admin';
import axios from 'axios';
import MeetingCalendarView from './components/Meeting/CalendarView.Meeting';



axios.defaults.baseURL = ' http://localhost:8000';


function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/login/:panel' element={<Login />} />

        <Route path='/login/admin/dashboard' element={<AdminDashboard />} />
        <Route path='/login/admin/meeting-room' element={<MeetingRoom />} />
        <Route path='/login/admin/users' element={<Users />} />
        <Route path='/login/admin/booking-info' element={<BookingSchedule />} />
        <Route path='/login/admin/local-vc-conferencing-form'element={<LocalMeetingRequest />} />
        <Route path='/login/admin/local-vc-conferencing-info'element={<LocalMeetingInfo />} />
        <Route path='/login/admin/local-vc-conferencing-edit'element={<LocalMeetingEdit />} />
        <Route path='/login/admin/calendar-view'element={<CalendarView />} />




        <Route path='/login/meeting/dashboard' element={<MeetingDashboard />} />
        <Route path='/login/meeting/requests' element={<ShowRequest />} />
        <Route path='/login/meeting/calendar-view' element={<MeetingCalendarView />} />


        <Route path='/login/user/dashboard' element={<UserDashboard />} />
        <Route path='/login/user/requests-display' element={<MeetingDisplay />} />
        <Route path='/login/user/profile' element={<UserProfile />} />
        
        <Route path='/superadmin/login' element={<SuperadminLogin />} />
        <Route path='/superadmin/login/dashboard' element={<SuperAdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
