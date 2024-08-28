import { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "./Header.Admin";
import AdminSidebar from "./Sidebar.Admin";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Spinner from "../Utility/Spinner.Utility";
import { Select } from "antd";

axios.defaults.withCredentials = true;

function LocalMeetingEdit() {
  const [validSession, setValidSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminDetails, setAdminDetails] = useState<{
    admin_username: string;
  } | null>(null);
  const [meetingId, setMeetingId] = useState("");
  const [requestDate, setRequestDate] = useState<string>("");
  const [labOrInstitution, setLabOrInstitution] = useState<string>("");
  const [manualInstitution, setManualInstitution] = useState<string>("");
  const [requesterName, setRequesterName] = useState<string>("");
  const [designation, setDesignation] = useState<string>("");
  const [division, setDivision] = useState<string>("");
  const [contactDetails, setContactDetails] = useState<string>("");
  const [vcVenueName, setVcVenueName] = useState<string>("");
  const [vcVenueManualName, setVcVenueManualName] = useState<string>("");
  const [meetingDate, setMeetingDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [parties, setParties] = useState<string>("");
  const [partiesManual, setPartiesManual] = useState<string>("");
  const [labOrInstitutionFarSight, setLabOrInstitutionFarSight] = useState<
    string[]
  >([]);

  const [manualInstitutionFarSight, setManualInstitutionFarSight] =
    useState<string>("");
  const { Option } = Select;
  const [personName, setPersonName] = useState<string>("");
  const [personContact, setPersonContact] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [connectivityDetails, setConnectivityDetails] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [members, setMembers] = useState<string>("");
  const [presentationRequired, setPresentationRequired] =
    useState<boolean>(false);
  const [recordingRequired, setRecordingRequired] = useState<boolean>(false);
  const [remarks, setRemarks] = useState<string>("");
  const [agree, setAgree] = useState<boolean>(false);

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
        } else {
          navigator("/");
        }
      } catch (error) {
        console.error("Error validating session:", error);
        navigator("/");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigator]);

  const fetchAdminDetails = async () => {
    try {
      const response = await axios.get("/admin/details", {});
      setAdminDetails(response.data);
    } catch (error) {
      console.error("Error fetching admin details:", error);
    }
  };

  const fetchFormData = async (meetingId: string): Promise<void> => {
    try {
      // Fetch data from the API
      const response = await axios.get<{ [key: string]: any }>(
        `/admin/vcdata?meetingId=${meetingId}`
      );
      const data = response.data;

      // Ensure the data received is of the expected type
      
      if (data && Object.keys(data).length > 0) {
        // Update state with fetched data
        setRequestDate(data.requestDate || "");
        setLabOrInstitution(data.labOrInstitution || "");
        setRequesterName(data.requesterName || "");
        setDesignation(data.designation || "");
        setDivision(data.division || "");
        setContactDetails(data.contactDetails || "");
        setVcVenueName(data.vcVenueName || "");
        setMeetingDate(data.meetingDate || "");
        setStartTime(data.startTime || "");
        setEndTime(data.endTime || "");
        setParties(data.parties || "");
        setLabOrInstitutionFarSight(
          data.labOrInstitutionFarSight
            ? data.labOrInstitutionFarSight.split(", ")
            : []
        );
        setPersonName(data.personName || "");
        setPersonContact(data.personContact || "");
        setLocation(data.location || "");
        setConnectivityDetails(data.connectivityDetails || "");
        setSubject(data.subject || "");
        setMembers(data.members || "");
        setPresentationRequired(data.presentationRequired || false);
        setRecordingRequired(data.recordingRequired || false);
        setRemarks(data.remarks || "");
        setAgree(data.agree || false);
        toast.success("Fetch Successfully");
      } else {
        toast.error("No data found for the selected date.");
      }
    } catch (error) {
      console.error("Error fetching form data:", error);
      toast.error("Error fetching form data");
    }
  };

  const handleSearch = () => {
    if (meetingId) {
      fetchFormData(meetingId);
    } else {
      toast.error("Please provide a Meeting ID.");
    }
  };
  

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const filteredLabOrInstitutionFarSight = labOrInstitutionFarSight.filter(
      (item) => item !== "OTH-Other"
    );

    try {
      const formData = {
        meetingId,
        requestDate,
        labOrInstitution,
        manualInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        vcVenueManualName,
        meetingDate,
        startTime,
        endTime,
        parties,
        partiesManual,
        labOrInstitutionFarSight: labOrInstitutionFarSight.join(", "),
        manualInstitutionFarSight: manualInstitutionFarSight
          ? (filteredLabOrInstitutionFarSight.length > 0
              ? filteredLabOrInstitutionFarSight.join(", ") + ", "
              : "") + manualInstitutionFarSight
          : "",
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks,
        agree,
      };

      await axios.post(
        "/admin/vc/update",
        formData,
        { withCredentials: true } // Ensure credentials are sent with the request if using cookies for session management
      );

      toast.success("Form submission successful");

      // Clear form fields after successful submission
      setMeetingId("");
      setRequestDate("");
      setLabOrInstitution("");
      setManualInstitution("");
      setRequesterName("");
      setDesignation("");
      setDivision("");
      setContactDetails("");
      setVcVenueName("");
      setVcVenueManualName("");
      setMeetingDate("");
      setStartTime("");
      setEndTime("");
      setParties("");
      setPartiesManual("");
      setLabOrInstitutionFarSight([]);
      setManualInstitutionFarSight("");
      setPersonName("");
      setPersonContact("");
      setLocation("");
      setConnectivityDetails("");
      setSubject("");
      setMembers("");
      setPresentationRequired(false);
      setRecordingRequired(false);
      setRemarks("");
      setAgree(false);
      setLoading(false);

    // Optionally, reset any other form state or redirect to another page on success
  } catch (error: any) {
    setLoading(false);

    if (error.response && error.response.status === 400) {
      // Specific error message for end time greater than start time
      toast.error("End time cannot be earlier than start time. Please correct the times.");
    } else {
      // General error message for other errors
      toast.error("Make sure the form is correctly filled.");
    }
  }
};

  const institutions = [
    "ACSIR-Academy of Scientific and Innovative Research",
    "AMPRI-Advanced Materials and Processes Research Institute",
    "CBRI-Central Building Research Institute",
    "CCMB-Centre for Cellular and Molecular Biology",
    "CDRI-Central Drug Research Institute",
    "CECRI-Central ElectroChemical Research Institute",
    "CEERI-Central Electronics Engineering Research Institute",
    "CFTRI-Central Food Technological Research Institute",
    "CGCRI-Central Glass and Ceramic Research Institute",
    "CIMAP-Central Institute of Medicinal and Aromatic Plants",
    "CIMFR-Central Institute of Mining and Fuel Research",
    "CLRI-Central Leather Research Institute",
    "CMC-CSIR Madas Complex",
    "CMERI-Central Mechanical Engineering Research Institute",
    "CMMACS-Centre for Mathematical Modelling And Computer Simulation",
    "CRRI-Central Road Research Institute",
    "CSIO-Central Scientific Instruments Organisation",
    "CSIR-Council of Scientific and Industrial Research, Head Quarter",
    "CSMCRI-Central Salt and Marine Chemicals Research Institute",
    "DGB-DG Bungalow",
    "HRDC-Human Resource Development Centre",
    "HRDG-Human Resource Development Group",
    "IGIB-Institute of Genomics and Integrative Biology",
    "IHBT-Institute of Himalayan Bioresource Technology",
    "IICB-Indian Institute of Chemical Biology",
    "IICT-Indian Institute of Chemical Technology",
    "IIIM-Indian Institute of Integrative Medicine",
    "IIP-Indian Institute of Petroleum",
    "IITR-Indian Institute of Toxicology Research",
    "IMMT-Institute of Minerals and Materials Technology",
    "IMT-Institute of Microbial Technology",
    "IPU-Innovation Protection Unit",
    "NAL-National Aerospace Laboratories",
    "NBRI-National Botanical Research Institute",
    "NCL-National Chemical Laboratory",
    "NEERI-National Environmental Engineering Research Institute",
    "NEIST-North East Institute of Science and Technology",
    "NGRI-National Geophysical Research Institute",
    "NIIST-National Institute for Interdisciplinary Science and Technology",
    "NIO-National Institute of Oceanography",
    "NISCAIR-National Institute of Science Communication and Information Resources",
    "NISTADS-National Institute of Science, Technology and Development Studies",
    "NML-National Metallurgical Laboratory",
    "NPL-National Physical Laboratory",
    "RAB-Recruitment and Assessment Board",
    "SERC-Structural Engineering Research Centre",
    "URDIP-Unit for Research and Development of Information Products",
  ];

  const farInstitutions = [
    {
      name: "ACSIR-Academy of Scientific and Innovative Research",
      code: "ACSIR",
    },
    {
      name: "AMPRI-Advanced Materials and Processes Research Institute",
      code: "AMPRI",
    },
    { name: "CBRI-Central Building Research Institute", code: "CBRI" },
    { name: "CCMB-Centre for Cellular and Molecular Biology", code: "CCMB" },
    { name: "CDRI-Central Drug Research Institute", code: "CDRI" },
    { name: "CECRI-Central ElectroChemical Research Institute", code: "CECRI" },
    {
      name: "CEERI-Central Electronics Engineering Research Institute",
      code: "CEERI",
    },
    {
      name: "CFTRI-Central Food Technological Research Institute",
      code: "CFTRI",
    },
    {
      name: "CGCRI-Central Glass and Ceramic Research Institute",
      code: "CGCRI",
    },
    {
      name: "CIMAP-Central Institute of Medicinal and Aromatic Plants",
      code: "CIMAP",
    },
    {
      name: "CIMFR-Central Institute of Mining and Fuel Research",
      code: "CIMFR",
    },
    { name: "CLRI-Central Leather Research Institute", code: "CLRI" },
    { name: "CMC-CSIR Madas Complex", code: "CMC" },
    {
      name: "CMERI-Central Mechanical Engineering Research Institute",
      code: "CMERI",
    },
    {
      name: "CMMACS-Centre for Mathematical Modelling And Computer Simulation",
      code: "CMMACS",
    },
    { name: "CRRI-Central Road Research Institute", code: "CRRI" },
    { name: "CSIO-Central Scientific Instruments Organisation", code: "CSIO" },
    {
      name: "CSIR-Council of Scientific and Industrial Research, Head Quarter",
      code: "CSIR",
    },
    {
      name: "CSMCRI-Central Salt and Marine Chemicals Research Institute",
      code: "CSMCRI",
    },
    { name: "DGB-DG Bungalow", code: "DGB" },
    { name: "HRDC-Human Resource Development Centre", code: "HRDC" },
    { name: "HRDG-Human Resource Development Group", code: "HRDG" },
    {
      name: "IGIB-Institute of Genomics and Integrative Biology",
      code: "IGIB",
    },
    {
      name: "IHBT-Institute of Himalayan Bioresource Technology",
      code: "IHBT",
    },
    { name: "IICB-Indian Institute of Chemical Biology", code: "IICB" },
    { name: "IICT-Indian Institute of Chemical Technology", code: "IICT" },
    { name: "IIIM-Indian Institute of Integrative Medicine", code: "IIIM" },
    { name: "IIP-Indian Institute of Petroleum", code: "IIP" },
    { name: "IITR-Indian Institute of Toxicology Research", code: "IITR" },
    {
      name: "IMMT-Institute of Minerals and Materials Technology",
      code: "IMMT",
    },
    { name: "IMT-Institute of Microbial Technology", code: "IMT" },
    { name: "IPU-Innovation Protection Unit", code: "IPU" },
    { name: "NAL-National Aerospace Laboratories", code: "NAL" },
    { name: "NBRI-National Botanical Research Institute", code: "NBRI" },
    { name: "NCL-National Chemical Laboratory", code: "NCL" },
    {
      name: "NEERI-National Environmental Engineering Research Institute",
      code: "NEERI",
    },
    {
      name: "NEIST-North East Institute of Science and Technology",
      code: "NEIST",
    },
    { name: "NGRI-National Geophysical Research Institute", code: "NGRI" },
    {
      name: "NIIST-National Institute for Interdisciplinary Science and Technology",
      code: "NIIST",
    },
    { name: "NIO-National Institute of Oceanography", code: "NIO" },
    {
      name: "NISCAIR-National Institute of Science Communication and Information Resources",
      code: "NISCAIR",
    },
    {
      name: "NISTADS-National Institute of Science, Technology and Development Studies",
      code: "NISTADS",
    },
    { name: "NML-National Metallurgical Laboratory", code: "NML" },
    { name: "NPL-National Physical Laboratory", code: "NPL" },
    { name: "RAB-Recruitment and Assessment Board", code: "RAB" },
    { name: "SERC-Structural Engineering Research Centre", code: "SERC" },
    {
      name: "URDIP-Unit for Research and Development of Information Products",
      code: "URDIP",
    },
  ];

  const vcVenues = [
    "[R-118]-Room No.: 118, 1st Floor, GJB, CSIR HQ",
    "[R-101]-Room No.: 101, 1st Floor, CSIR HQ",
    "[R-318]-Room No.: 318, 3rd Floor, GJB, CSIR HQ",
    "JS(A)",
    "FA",
    "LA",
    "CVO",
    "Head DGED",
    "Head IT",
    "Head CPD",
    "Head IMD",
    "Head SCDD",
    "[SSBH]-Shanti Swaroop Bhatnagar Hall, CSIR HQ",
    "[Control Room]-VC Control Room, CSIR HQ",
    "[Science Centre]-CSIR Science Centre, Lodhi Road",
  ];

  //for lab info in req details
  const handleInstitutionChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setLabOrInstitution(event.target.value);
    if (event.target.value !== "Other") {
      setManualInstitution(""); // Reset manual input when a predefined option is selected
    }
  };

  const handleVcChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setVcVenueName(event.target.value);
    if (event.target.value !== "[Oth]-Other") {
      setVcVenueManualName(""); // Reset manual input when a predefined option is selected
    }
  };

  const handlePartiesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setParties(event.target.value);
    if (event.target.value !== "Other") {
      setPartiesManual(""); // Reset parties name when a predefined option is selected
    }
  };

  //for far sight lab information
  const handleFarSightInstitutionChange = (value: string[]) => {
    setLabOrInstitutionFarSight(value);
    if (!value.includes("OTH-Other")) {
      setManualInstitutionFarSight(""); // Reset manual input when a predefined option is selected
    }
  };

  return (
    <>
      {loading && <Spinner />}
      {validSession && (
        <div>
          <AdminHeader dashboardType="Local/Vc Edit Form" />
          <div className="flex min-h-screen">
            <div className="px-2 py-2 pr-4 bg-gray-400/50">
              <AdminSidebar />
            </div>
            <div className="flex-1 border-l border-black bg-white flex flex-col">
              {adminDetails && (
                <div className="bg-sky-600 border-t border-r border-b border-black mt-2 p-1.5">
                  <h1 className="text-xl font-serif text-center text-white">
                    Local/Vc Form Edit
                  </h1>
                </div>
              )}
              <div className="flex flex-col justify-between p-3 bg-gray-200 border-black space-y-3">
                <div>
                  <label
                    htmlFor="meetingId"
                    className="block mb-2 text-xl font-bold underline"
                  >
                    Meeting ID:
                  </label>
                  <input
                    type="number"
                    id="meetingId"
                    placeholder="Enter Meeting ID"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    className="border border-gray-300 px-1 py-2 w-36 rounded-md"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-serif px-12 py-2 mt-2 ml-2 rounded-md transition duration-300 ease-in-out"
                  >
                    Search
                  </button>
                </div>
              </div>
              {/* Form Section */}
              <form
                onSubmit={handleFormSubmit}
                className="flex-1 p-3 bg-white border-black"
              >
                {/* Request Date */}
                <div className="">
                  <label className="block mb-2 text-xl font-bold underline">
                    Request Date:
                  </label>
                  <label className="block mb-1 font-medium">
                    Date:<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    className="border border-gray-300 px-1 py-2 w-36 rounded-md"
                    required
                  />
                  <hr className="mt-4 border-t-2 border-black" />
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  {/* Requester Details */}
                  <div>
                    <label className="block mb-1 text-xl font-bold underline">
                      Requester Details:{" "}
                    </label>
                    <label className="block mb-1 font-medium">
                      Lab/Institution Name:
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={labOrInstitution}
                      onChange={handleInstitutionChange}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      required
                    >
                      <option value="">Select Lab/Institution</option>
                      {institutions.map((institution, index) => (
                        <option key={index} value={institution}>
                          {institution}
                        </option>
                      ))}
                      <option value="OTH-Other">OTH-Other</option>
                    </select>
                    {labOrInstitution === "OTH-Other" && (
                      <input
                        type="text"
                        placeholder="Enter Lab/Institution manually"
                        value={manualInstitution}
                        onChange={(e) => setManualInstitution(e.target.value)}
                        className="border border-gray-300 mb-4 mt-2 px-3 py-2 w-full rounded-md"
                        maxLength={100}
                        required
                      />
                    )}
                  </div>
                  <div className="mt-8">
                    <div>
                      <label className="block mb-1 font-medium">
                        Requester Name:<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter requester's name"
                        value={requesterName}
                        onChange={(e) => setRequesterName(e.target.value)}
                        className="border border-gray-300 px-3 py-2 w-full rounded-md"
                        maxLength={56}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 mt-8 font-medium">
                      Designation:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter designation"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      maxLength={56}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Division/Section:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter division or section"
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      maxLength={56}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Contact Details:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Enter contact details"
                      value={contactDetails}
                      onChange={(e) => setContactDetails(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      maxLength={200}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      VC Venue Name:<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={vcVenueName}
                      onChange={handleVcChange}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      required
                    >
                      <option value="">Select VC Venue</option>
                      {vcVenues.map((venue, index) => (
                        <option key={index} value={venue}>
                          {venue}
                        </option>
                      ))}
                      <option value="[Oth]-Other">[Oth]-Other</option>
                    </select>
                    {vcVenueName === "[Oth]-Other" && (
                      <input
                        type="text"
                        placeholder="Enter VC Venue Name Manually"
                        value={vcVenueManualName}
                        onChange={(e) => setVcVenueManualName(e.target.value)}
                        className="border border-gray-300 mb-4 mt-2 px-3 py-2 w-full rounded-md"
                        maxLength={100}
                        required
                      />
                    )}
                  </div>
                </div>

                <hr className="mt-4 border-t-2 border-black" />

                {/* Date and Time of Meeting */}
                <div className="mt-1">
                  <label className="block mb-2 text-xl font-bold underline">
                    Date & Time of the VC/Local Meeting:
                  </label>
                  <label className="block mb-1 font-medium">
                    Date:
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="border border-gray-300 px-1 py-2 w-36 rounded-md cursor-pointer"
                    required
                  />
                </div>
                <div className="grid grid-cols-5">
                  <div className="mt-2">
                    <label className="block mb-1 font-medium">
                      Start Time:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="border border-gray-300 px-9 py-2 rounded-md cursor-pointer"
                      required
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block mb-1 font-medium">
                      End Time:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="border border-gray-300 px-9 py-2 rounded-md cursor-pointer"
                      required
                    />
                  </div>
                </div>
                <hr className="mt-5 border-t-2 border-black" />

                {/* Parties */}
                <div className="mt-2 grid grid-cols-1">
                  <label className="block mb-1 text-xl font-bold underline">
                    Parties:
                  </label>
                  <select
                    value={parties}
                    onChange={handlePartiesChange}
                    className="border border-gray-300 px-6 py-2 rounded-md"
                    required
                  >
                    <option value="">Select parties</option>
                    <option value="Single/Multiple Party within CSIR">
                      Single/Multiple Party within CSIR
                    </option>
                    <option value="Single/Multiple Party from CSIR">
                      Single/Multiple Party from CSIR
                    </option>
                    <option value="Local Meeting Only">
                      Local Meeting Only
                    </option>
                    <option value="Video Conference (V.C)">
                      Video Conference (V.C)
                    </option>
                    <option value="MS Teams">MS Teams</option>
                    <option value="Bharat V.C">Bharat V.C</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Google Meet">Google Meet</option>
                    <option value="Other">Other</option>
                  </select>
                  {parties === "Other" && (
                    <input
                      type="text"
                      placeholder="Enter Party Name manually"
                      value={partiesManual}
                      onChange={(e) => setPartiesManual(e.target.value)}
                      className="border border-gray-300 mb-4 mt-2 px-3 py-2 w-89 rounded-md"
                      maxLength={100}
                      required
                    />
                  )}
                  <hr className="mt-4 border-t-2 border-black" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Far-sighted Details */}
                  <div className="mt-2">
                    <label className="block mb-1 text-xl font-bold underline">
                      Far-sighted Details:
                    </label>

                    {/* Lab/Institution */}
                    <div className="mt-2">
                      <label className="block mb-1 font-medium">
                        Lab/Institution Name:
                        <span className="text-red-500">*</span>
                      </label>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }} // Adjust minHeight as needed
                        placeholder="Select Lab./Institution"
                        value={labOrInstitutionFarSight}
                        onChange={handleFarSightInstitutionChange}
                      >
                        {farInstitutions.map((institution, index) => (
                          <Option key={index} value={institution.code}>
                            {institution.name}
                          </Option>
                        ))}
                        <Option value="OTH-Other">OTH-Other</Option>
                      </Select>
                      {labOrInstitutionFarSight.includes("OTH-Other") && (
                        <input
                          type="text"
                          placeholder="Enter Lab/Institution manually"
                          value={manualInstitutionFarSight}
                          onChange={(e) =>
                            setManualInstitutionFarSight(e.target.value)
                          }
                          className="border border-gray-300 mt-2 px-3 py-2 w-full rounded-md"
                          maxLength={100}
                          required
                        />
                      )}
                    </div>
                  </div>

                  {/* Person Name */}
                  <div className="mt-2">
                    <label className="block mb-1 mt-9 font-medium">
                      Person Name:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter person's name"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      maxLength={56}
                      required
                    />
                  </div>

                  {/* Person Contact */}
                  <div className="mt-1">
                    <label className="block mb-1 font-medium">
                      Person Contact:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Enter person's contact"
                      value={personContact}
                      onChange={(e) => setPersonContact(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      maxLength={200}
                      required
                    />
                  </div>

                  {/* Location */}
                  <div className="mt-1">
                    <label className="block mb-1 font-medium">
                      Location:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      maxLength={56}
                      required
                    />
                  </div>

                  {/* Connectivity Details */}
                  <div className="mt-1">
                    <label className="block mb-1 font-medium">
                      Connectivity Details (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="Enter connectivity details"
                      value={connectivityDetails}
                      onChange={(e) => setConnectivityDetails(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      maxLength={256}
                    />
                  </div>

                  {/* Subject */}
                  <div className="mt-1">
                    <label className="block mb-1 font-medium">
                      Subject:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      maxLength={256}
                      required
                    />
                  </div>

                  {/* Members */}
                  <div className="mt-1">
                    <label className="block mb-1 font-medium">
                      Members:<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Enter members"
                      value={members}
                      onChange={(e) => setMembers(e.target.value)}
                      className="border border-gray-300 px-3 py-2 w-full rounded-md"
                      maxLength={256}
                      required
                    />
                  </div>

                  {/* Presentation Required */}
                  <div className="mt-2 ml-2">
                    <label className="block mb-1 mt-5 font-medium">
                      Presentation Required:
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="presentation_yes"
                        name="presentation"
                        value="yes"
                        checked={presentationRequired}
                        onChange={() => setPresentationRequired(true)}
                        className="mr-2"
                      />
                      <label htmlFor="presentation_yes" className="mr-4">
                        Yes
                      </label>
                      <input
                        type="radio"
                        id="presentation_no"
                        name="presentation"
                        value="no"
                        checked={!presentationRequired}
                        onChange={() => setPresentationRequired(false)}
                        className="mr-2"
                      />
                      <label htmlFor="presentation_no">No</label>
                    </div>
                  </div>

                  {/* Recording Required */}
                  <div className="mt-1 mb-2 ml-1">
                    <label className="block mb-1 font-medium">
                      Recording Required:<span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="recording_yes"
                        name="recording"
                        value="yes"
                        checked={recordingRequired}
                        onChange={() => setRecordingRequired(true)}
                        className="mr-2"
                      />
                      <label htmlFor="recording_yes" className="mr-4">
                        Yes
                      </label>
                      <input
                        type="radio"
                        id="recording_no"
                        name="recording"
                        value="no"
                        checked={!recordingRequired}
                        onChange={() => setRecordingRequired(false)}
                        className="mr-2"
                      />
                      <label htmlFor="recording_no">No</label>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="mt-1 ">
                  <label className="block mb-1 font-medium">
                    Remarks (Optional):
                  </label>
                  <textarea
                    placeholder="Enter remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="border border-gray-300 px-3 py-2 w-full rounded-md"
                    maxLength={512}
                  />
                </div>

                {/* Agreement Checkbox */}
                <div className="mt-1 flex items-center">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agree}
                    onChange={() => setAgree(!agree)}
                    className="mr-2"
                  />
                  <label htmlFor="agree" className="font-medium">
                    I agree to check before submission.
                  </label>
                </div>

                {/* Submit Button */}
                <div className="mt-1 ml-2">
                  <button
                    type="submit"
                    className={`bg-blue-500 hover:bg-blue-600 text-white font-serif px-12 py-2 mt-2 rounded-md transition duration-300 ease-in-out ${
                      !agree ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={!agree}
                  >
                    Submit
                  </button>
                  <ToastContainer />
                </div>
              </form>
            </div>
          </div>
          <footer className="text-center -mb-6 px-4 py-2 border-t border-black">
            Copyright &copy; {new Date().getFullYear()} Concept. All rights
            reserved.
          </footer>
        </div>
      )}
    </>
  );
}

export default LocalMeetingEdit;
