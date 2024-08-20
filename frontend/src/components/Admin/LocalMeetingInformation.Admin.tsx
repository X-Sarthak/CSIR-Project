import { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "./Header.Admin";
import AdminSidebar from "./Sidebar.Admin";
import { useNavigate } from "react-router-dom";
import Spinner from "../Utility/Spinner.Utility";
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";

axios.defaults.withCredentials = true;

function LocalMeetingInfo() {
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminDetails, setAdminDetails] = useState<{
    admin_username: string;
  } | null>(null);
  const [vcInformation, setVcInformation] = useState<any[]>([]);
  const [labOptions, setLabOptions] = useState<string[]>([]);
  const [selectedLab, setSelectedLab] = useState<string>("All Selected"); // Set default to "All Selected"
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary"); // Set default to "any"
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1); // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const navigator = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const adminUsername = sessionStorage.getItem("admin_username") ?? "";
        setLoading(true);
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
          fetchAdminDetails();
          fetchLabOptions(); // Fetch laboratory options
          setLoading(false);
        } else {
          navigator("/");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigator("/");
        setLoading(false);
      }
    };

    checkSession();
  }, [navigator]);

  useEffect(() => {
    const fetchFilteredVcInformation = async () => {
      try {
        setLoading(true);

        if (selectedLab !== "All Selected" && fromDate && toDate) {
          // Lab and date range are selected
          const response = await axios.post(
            "/admin/laboratory/date-range-lab-detail",
            { labOrInstitution: selectedLab, fromDate, toDate }
          );
          setVcInformation(response.data.reverse());
        } else if (fromDate && toDate) {
          // Only date range is selected
          const response = await axios.post(
            "/admin/laboratory/date-range-detail",
            { fromDate, toDate }
          );
          setVcInformation(response.data.reverse());
        } else if (
          selectedLab !== "All Selected" &&
          selectedYear !== "All" &&
          selectedMonth !== "All"
        ) {
          // Lab, year, and month are selected
          const response = await axios.post(
            "/admin/laboratory/year-month-lab-detail",
            {
              labOrInstitution: selectedLab,
              year: selectedYear,
              month: selectedMonth,
            }
          );
          setVcInformation(response.data.reverse());
        } else if (selectedLab !== "All Selected" && selectedYear !== "All") {
          // Lab and year are selected
          const response = await axios.post(
            "/admin/laboratory/lab-year-detail",
            { labOrInstitution: selectedLab, year: selectedYear }
          );
          setVcInformation(response.data.reverse());
        } else if (selectedLab !== "All Selected" && selectedMonth !== "All") {
          // Lab and month are selected
          const response = await axios.post(
            "/admin/laboratory/lab-month-detail",
            { labOrInstitution: selectedLab, month: selectedMonth }
          );
          setVcInformation(response.data.reverse());
        } else if (selectedYear !== "All" && selectedMonth !== "All") {
          // Year and month are selected
          const response = await axios.post(
            "/admin/laboratory/year-month-detail",
            { year: selectedYear, month: selectedMonth }
          );
          setVcInformation(response.data.reverse());
        } else if (selectedLab !== "All Selected") {
          // Only lab is selected
          fetchVcInformationByLab();
        } else if (selectedYear !== "All") {
          // Only year is selected
          fetchVcInformationByYear();
        } else if (selectedMonth !== "All") {
          // Only month is selected
          fetchVcInformationByMonth();
        } else {
          // No filters selected
          fetchVcInformation();
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching VC information with filters:", error);
        toast.info("No data found for the selected date filters.");
        setVcInformation([]); // Ensure vcInformation is cleared on error
        setLoading(false);
      }
    };

    fetchFilteredVcInformation();
  }, [selectedLab, selectedYear, selectedMonth, fromDate, toDate]);

  const fetchAdminDetails = async () => {
    try {
      const response = await axios.get("/admin/details");
      setAdminDetails(response.data);
    } catch (error) {
      console.error("Error fetching admin details:", error);
    }
  };

  const fetchVcInformation = async () => {
    try {
      const response = await axios.get("/admin/laboratory/All/meeting/detail");
      const reversedSchedule = response.data.reverse();
      setVcInformation(reversedSchedule);
    } catch (error) {
      console.error("Error fetching VC information:", error);
    }
  };

  const fetchVcInformationByLab = async () => {
    try {
      const response = await axios.post("/admin/laboratory/lab-detail", {
        labOrInstitution: selectedLab,
      });
      const reversedSchedule = response.data.reverse();
      setVcInformation(reversedSchedule);
    } catch (error) {
      console.error("Error fetching VC information:", error);
    }
  };

  const fetchVcInformationByYear = async () => {
    try {
      const response = await axios.post("/admin/laboratory/year-detail", {
        year: selectedYear,
      });
      const reversedSchedule = response.data.reverse();
      setVcInformation(reversedSchedule);
    } catch (error) {
      console.error("Error fetching VC information by year:", error);
    }
  };

  const fetchVcInformationByMonth = async () => {
    try {
      const response = await axios.post("/admin/laboratory/month-detail", {
        month: selectedMonth,
      });
      const reversedSchedule = response.data.reverse();
      setVcInformation(reversedSchedule);
    } catch (error) {
      console.error("Error fetching VC information by month:", error);
    }
  };

  const fetchLabOptions = async () => {
    try {
      const response = await axios.get("/admin/laboratory/options");
      const reversedSchedule = response.data.reverse();
      setLabOptions(reversedSchedule);
      setSelectedLab("All Selected"); // Set "All Selected" after fetching options
    } catch (error) {
      console.error("Error fetching laboratory options:", error);
    }
  };

  const fetchSummaryInformation = async () => {
    try {
      const response = await axios.get("/admin/laboratory/All/meeting/summary");

      const reversedSchedule = response.data.reverse();
      setVcInformation(reversedSchedule);
    } catch (error) {
      console.error("Error fetching summary information:", error);
    }
  };

  const handleViewModeChange = (mode: "summary" | "detailed") => {
    setViewMode(mode);
    if (mode === "summary") {
      fetchSummaryInformation();
    } else {
      setSelectedLab("All Selected");
      fetchVcInformation();
    }
  };

  const handleResetClick = () => {
    fetchVcInformation();
    setFromDate("");
    setToDate("");
    setSelectedMonth("All");
    setSelectedYear("All");
    setSelectedLab("All Selected");
    setItemsPerPage(10);
  };

  const handlePrintClick = () => {
    const ws = XLSX.utils.json_to_sheet(vcInformation);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Local Meeting Information");
    XLSX.writeFile(wb, "LocalMeetingInformation.xlsx");
  };

  const months = [
    "All",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const generateYears = (startYear: number, endYear: number): string[] => {
    const years = ["All"];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year.toString());
    }
    return years;
  };

  const startYear = 2007;
  const endYear = new Date().getFullYear() + 1; // Next year
  const years = generateYears(startYear, endYear);

  // Calculate paginated data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = vcInformation.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate total pages
  const totalPages = Math.ceil(vcInformation.length / itemsPerPage);

  // Add this inside your component
  const itemsPerPageOptions = [10, 20, 30, 50];

  // Handle items per page change
  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to the first page
  };

  return (
    <>
      {loading && <Spinner />}
      {validSession && (
        <div>
          <AdminHeader dashboardType="Local/VC Meeting Information" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <AdminSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-white flex flex-col overflow-hidden">
              {adminDetails && (
                <>
                  <div className="bg-sky-600 border-t border-r border-b border-black mt-2 p-1.5">
                    <h1 className="text-xl font-serif text-center text-white">
                      Local Meeting Information
                    </h1>
                  </div>
                  <div className="bg-white text-xs mt-1 p-1.5 flex items-center">
                    <label className="block font-medium mr-2 ml-2 text-center">
                      Laboratory Name:
                    </label>
                    <select
                      value={selectedLab}
                      onChange={(e) => setSelectedLab(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-28 rounded-md"
                    >
                      <option value="All Selected">All Selected</option>
                      {labOptions.map((lab, index) => (
                        <option key={index} value={lab}>
                          {lab}
                        </option>
                      ))}
                    </select>
                    <label className="block font-medium ml-2 mr-2">
                      Month:
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="border text-xs border-gray-300 px-3 py-2 w-28 rounded-md"
                      disabled={!!(fromDate && toDate)} // Convert to boolean using !!
                    >
                      {months.map((month, index) => (
                        <option key={index} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <label className="block text-xs font-medium ml-2 mr-2">
                      Year:
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-20 rounded-md"
                      disabled={!!(fromDate && toDate)} // Convert to boolean using !!
                    >
                      {years.map((year, index) => (
                        <option key={index} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center">
                      <label className="block text-xs font-medium text-center ml-2 mr-2">
                        From Date:
                      </label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="border border-gray-300 px-3 py-2 mr-1 rounded-md"
                      />
                      <label className="block text-xs font-medium text-center ml-2 mr-2">
                        To Date:
                      </label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md"
                      />
                      <button
                        onClick={handleResetClick}
                        className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Reset
                      </button>
                      <button
                        className="px-4 py-2 ml-2 bg-blue-500 text-white font-bold rounded"
                        onClick={handlePrintClick}
                      >
                        Print
                      </button>
                      <div className="flex items-center">
                        <label className="block text-xs  text-center font-medium ml-2 mr-2">
                          Items per Page:
                        </label>
                        <select
                          value={itemsPerPage}
                          onChange={handleItemsPerPageChange}
                          className="border border-gray-300 px-2 py-2 w-14 rounded-md"
                        >
                          {itemsPerPageOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-center mb-2">
                    <div className="mr-4">
                      <input
                        className="size-2 cursor-pointer"
                        type="radio"
                        id="summary"
                        name="viewMode"
                        value="summary"
                        checked={viewMode === "summary"}
                        onChange={() => handleViewModeChange("summary")}
                      />
                      <label
                        htmlFor="summary"
                        className="ml-2 text-xs font-bold font-serif cursor-pointer"
                      >
                        Summary View
                      </label>
                    </div>
                    <div>
                      <input
                        className="size-2 cursor-pointer"
                        type="radio"
                        id="detailed"
                        name="viewMode"
                        value="detailed"
                        checked={viewMode === "detailed"}
                        onChange={() => handleViewModeChange("detailed")}
                      />
                      <label
                        htmlFor="detailed"
                        className="ml-2 text-xs font-bold font-serif cursor-pointer"
                      >
                        Detailed View
                      </label>
                    </div>
                  </div>
                  <div className="mt-1 overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead className="bg-gray-200 text-xxs">
                        <tr>
                          <th className="border border-gray-300 px-1 py-1">
                            ID
                          </th>
                          <th className="border border-gray-300 px-7 py-1">
                            Meeting Date
                          </th>
                          <th className="border border-gray-300 px-37 py-1">
                            Lab/Institution
                          </th>
                          <th className="border border-gray-300 px-4 py-1">
                            Requester Name
                          </th>
                          {viewMode === "detailed" && (
                            <>
                              <th className="border border-gray-300 px-5 py-1">
                                Designation
                              </th>
                              <th className="border border-gray-300 px-10 py-1">
                                Division
                              </th>
                              <th className="border border-gray-300 px-5 py-1">
                                Contact Details
                              </th>
                              <th className="border border-gray-300 px-25 py-1">
                                VC Venue Name
                              </th>
                              <th className="border border-gray-300 px-6 py-1">
                                Requester Date
                              </th>
                              <th className="border border-gray-300 px-4 py-1">
                                Start Time
                              </th>
                              <th className="border border-gray-300 px-4 py-1">
                                End Time
                              </th>
                              <th className="border border-gray-300 px-21 py-1">
                                Parties
                              </th>
                              <th className="border border-gray-300 px-28 py-1">
                                Lab/Institution Far Sight
                              </th>
                              <th className="border border-gray-300 px-6 py-1">
                                Person Name
                              </th>
                              <th className="border border-gray-300 px-4 py-1">
                                Person Contact
                              </th>
                              <th className="border border-gray-300 px-5 py-1">
                                Location
                              </th>
                              <th className="border border-gray-300 px-3 py-1">
                                Connectivity Details
                              </th>
                              <th className="border border-gray-300 px-6 py-1">
                                Subject
                              </th>
                              <th className="border border-gray-300 px-5 py-1">
                                Members
                              </th>
                              <th className="border border-gray-300 px-1 py-1">
                                Presentation Required
                              </th>
                              <th className="border border-gray-300 px-1 py-1">
                                Recording Required
                              </th>
                              <th className="border border-gray-300 px-16 py-1">
                                Remarks
                              </th>
                            </>
                          )}
                          {viewMode === "summary" && (
                            <>
                              <th className="border border-gray-300 px-12 py-1">
                                Time Range
                              </th>
                              <th className="border border-gray-300 px-25 py-1">
                                VC Venue Name
                              </th>
                              <th className="border border-gray-300 px-28 py-1">
                                Lab/Institution Far Sight
                              </th>
                              <th className="border border-gray-300 px-6 py-1">
                                Subject
                              </th>
                              <th className="border border-gray-300 px-16 py-1">
                                Remarks
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={viewMode === "detailed" ? 20 : 10}
                              className="text-center py-2"
                            >
                              No data found for the selected filters.
                            </td>
                          </tr>
                        ) : (
                          currentItems.map((vcInfo) => (
                            <tr key={vcInfo.id}>
                              <td className="border border-gray-300 text-xxxs px-1 py-1 text-center">
                                {vcInfo.id}
                              </td>
                              <td className="border border-gray-300 text-xxs  px-1 py-1 text-center">
                                {vcInfo.meetingDate}
                              </td>
                              <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                {vcInfo.labOrInstitution}
                              </td>
                              <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                {vcInfo.requesterName}
                              </td>
                              {viewMode === "detailed" && (
                                <>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.designation}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.division}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.contactDetails}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.vcVenueName}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.requestDate}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.startTime}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.endTime}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.parties}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.labOrInstitutionFarSight}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.personName}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.personContact}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.location}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.connectivityDetails ? (
                                      vcInfo.connectivityDetails
                                    ) : (
                                      <span className="text-red-600">N/A</span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.subject}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.members}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.presentationRequired ? "Yes" : "No"}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.recordingRequired ? "Yes" : "No"}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.remarks ? (
                                      vcInfo.remarks
                                    ) : (
                                      <span className="text-red-600">N/A</span>
                                    )}
                                  </td>
                                </>
                              )}
                              {viewMode === "summary" && (
                                <>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">{`${vcInfo.startTime} to ${vcInfo.endTime}`}</td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.vcVenueName}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.labOrInstitutionFarSight}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.subject}
                                  </td>
                                  <td className="border border-gray-300 text-xxs px-1 py-1 text-center">
                                    {vcInfo.remarks ? (
                                      vcInfo.remarks
                                    ) : (
                                      <span className="text-red-600">N/A</span>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-2 mb-2 px-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="px-3 py-1 text-white rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <span
                  className={`px-3 py-1 rounded-md mx-1 ${
                    totalPages === 0 ? "bg-gray-300 hover:bg-gray-400 opacity-50 " : "bg-blue-500 text-white"
                  }`}
                >
                  {totalPages === 0
                    ? "No Pages"
                    : `${currentPage} | ${totalPages}`}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 text-white rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
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

export default LocalMeetingInfo;
