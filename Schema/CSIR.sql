CREATE DATABASE CSIR;



USE CSIR;


CREATE TABLE Superadmin (
    superadmin_username VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,
    superadmin_password VARCHAR(255) NOT NULL
);


INSERT INTO Superadmin (superadmin_username, superadmin_password) 
VALUES ('admin', '$2b$10$6.K/PiroxjwilBYZJ9kjqeAbHeM2X0SPGJJ9y6DSrCoLquWUX35dO');


CREATE TABLE Admins (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    admin_username VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE,
    admin_password VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    admin_status BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    superadmin_username VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
    FOREIGN KEY (superadmin_username) REFERENCES superadmin(superadmin_username)
);


CREATE TABLE Meetings (
    meeting_id INT PRIMARY KEY AUTO_INCREMENT,
    room_name VARCHAR(255) NOT NULL,
    authority_name VARCHAR(255) NOT NULL,
    meeting_username VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE,
    meeting_password VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    meeting_status BOOLEAN NOT NULL,
    meeting_days VARCHAR(1024),
    start_time TIME,
    end_time TIME,
    admin_username VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_username) REFERENCES Admins(admin_username)
);

CREATE TABLE Users (	
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(255) NOT NULL,
    user_division VARCHAR(255) NOT NULL,
    user_designation VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE,
    user_password VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    user_status BOOLEAN NOT NULL,
    admin_username VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_username) REFERENCES Admins(admin_username)
);

CREATE TABLE MeetingSchedule (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    added_by ENUM('USER', 'MEETING') NOT NULL,
    user_id INT,
    meeting_id INT NOT NULL,
    meeting_title VARCHAR(225) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_day VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    meeting_option VARCHAR(255) NOT NULL,
    meeting_link VARCHAR(255),
    request_status BOOLEAN,
    reason_for_rejection VARCHAR(225),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES Meetings(meeting_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);


CREATE TABLE VCinformation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requestDate DATE NOT NULL,
    labOrInstitution VARCHAR(255) NOT NULL,
    requesterName VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    division VARCHAR(255) NOT NULL,
    contactDetails VARCHAR(255) NOT NULL,
    vcVenueName VARCHAR(255) NOT NULL,
    meetingDate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    parties TEXT NOT NULL,
    labOrInstitutionFarSight VARCHAR(1024) NOT NULL,
    personName VARCHAR(255) NOT NULL,
    personContact VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    connectivityDetails TEXT,
    subject VARCHAR(255) NOT NULL,
    members TEXT NOT NULL,
    presentationRequired BOOLEAN NOT NULL,
    recordingRequired BOOLEAN NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    admin_username VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    FOREIGN KEY (admin_username) REFERENCES Admins(admin_username)
);




SELECT * FROM Admins;
SELECT * FROM Users;
SELECT * FROM Superadmin;
SELECT * FROM Meetings;
SELECT * FROM MeetingSchedule;
SELECT * FROM Vcinformation;

TRUNCATE TABLE Admins;	
TRUNCATE TABLE Meetings;
TRUNCATE TABLE Users;
TRUNCATE TABLE MeetingSchedule;

DROP TABLE Superadmin;
DROP TABLE Admins;	
DROP TABLE Users;
DROP TABLE Meetingschedule;
DROP TABLE Meetings;
DROP TABLE Vcinformation;


DESC Superadmin;
DESC Admins;
DESC Meetings;
DESC Users;


-- for .env file
-- SESSION_SECRET=session
-- SECRET_KEY=123456789
-- DB_HOST=localhost
-- DB_USER=root
-- DB_PASSWORD=Sarthak@1234
-- DB_NAME=CSIR
-- PORT=8000
