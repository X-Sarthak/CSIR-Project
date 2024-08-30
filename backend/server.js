import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mysql from 'mysql2';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import axios from 'axios';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173", // Replace this with the origin of your frontend application
    credentials: true, // Allow credentials (cookies)
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // A secret string used to sign the session ID cookie
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 5000000,
    },
  }) 
);

// Connection to MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: '',
  database: process.env.DB_NAME,
});

// Attempt to connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to database successfully");
});



//Superadmin Login only for insert superadmin data into the database
// app.post("/superadmin", (req, res) => {
//   const { superadmin_username, superadmin_password } = req.body;

//   // Query the database to check if the provided credentials match a Super Admin
//   connection.query(
//     "SELECT * FROM Superadmin WHERE Superadmin_username = ? AND Superadmin_password = ?",
//     [superadmin_username, superadmin_password],
//     (error, results) => {
//       if (error) {
//         console.error("Error querying the database:", error);
//         return res.sendStatus(500); // Internal server error
//       }

//       if (results.length === 1) {
//         // Generate a session token
//         const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
//         const token = jwt.sign({ username: superadmin_username }, secretKey);
//         // Store the token in the session
//         req.session.token = token;
//         return res.status(200).json({ message: "Successful login", token }); // Send success response with token
//       } else {
//         return res.sendStatus(401); // Unauthorized
//       }
//     }
//   );
// });


//*****
// Superadmin Login for main login application use this after superadmn credentials have inserted into database
app.post("/superadmin", (req, res) => {
  const { superadmin_username, superadmin_password } = req.body;

  // Query the database to fetch the hashed password of the provided superadmin_username
  connection.query(
    "SELECT Superadmin_password FROM Superadmin WHERE superadmin_username = ?",
    [superadmin_username],
    (error, results) => {
      if (error) {
        console.error("Error querying the database:", error);
        return res.sendStatus(500); // Internal server error
      }

      if (results.length === 1) {
        const hashedPassword = results[0].Superadmin_password;

        // Compare the provided password with the stored hashed password using bcrypt
        bcrypt.compare(superadmin_password, hashedPassword, (err, isMatch) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return res.sendStatus(500); // Internal server error
          }

          if (isMatch) {
            // Generate a session token
            const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
            const token = jwt.sign(
              { username: superadmin_username },
              secretKey
            );
            // Store the token in the session
            req.session.token = token;
            return res.status(200).json({ message: "Successful login", token }); // Send success response with token
          } else {
            return res.sendStatus(401); // Unauthorized
          }
        });
      } else {
        return res.sendStatus(401); // Unauthorized
      }
    }
  );
});

// Endpoint to validate token for superadmin
app.post("/superadmin/validateToken", (req, res) => {
  const { token } = req.body;

  // Verify the token
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      // Token is invalid
      console.error("Invalid token:", err);
      // res.redirect('/login');
      return res.status(401).json({ valid: false });
    } else {
      // Token is valid
      console.log("Valid token for:", decoded.username);
      return res.status(200).json({ valid: true });
    }
  });
});

//Create Admin Data
app.post("/admin", (req, res) => {
  const { adminUsername, adminPassword } = req.body;

  // Check if adminUsername or adminPassword is empty
  if (!adminUsername || !adminPassword) {
    return res.status(400).json({ error: "Admin username and password are required" });
  }

  // Define the number of salt rounds
  const saltRounds = 10;

  // Hash the admin password
  bcrypt.hash(adminPassword, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing admin password:", err);
      return res.sendStatus(500); // Internal server error
    }

    // Retrieve the token from session
    const token = req.session.token;

    // Check if token is provided
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
      // Verify the token
      const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
      const decoded = jwt.verify(token, secretKey);
      const superadminUsername = decoded.username; // Extract superadmin_username from decoded token

      // Check if adminUsername already exists
      connection.query(
        "SELECT * FROM Admins WHERE admin_username = ?",
        [adminUsername],
        (error, results) => {
          if (error) {
            console.error("Error checking admin data:", error);
            return res.sendStatus(500); // Internal server error
          }

          if (results.length > 0) {
            // Admin username already exists
            return res.status(400).json({ error: "Admin username already exists" });
          }

          // Insert the admin data into the database with hashed password and admin_status set to true
          connection.query(
            "INSERT INTO Admins (admin_username, admin_password, admin_status, Superadmin_username) VALUES (?, ?, true, ?)",
            [adminUsername, hashedPassword, superadminUsername],
            (insertError, insertResults) => {
              if (insertError) {
                console.error("Error inserting admin data:", insertError);
                return res.sendStatus(500); // Internal server error
              }
              
              // Data successfully inserted
              return res.status(201).json({ message: "Admin data inserted successfully" });
            }
          );
        }
      );
    } catch (error) {
      // Handle invalid token
      console.error("Error verifying token:", error);
      return res.status(401).json({ error: "Invalid token" });
    }
  });
});

// Endpoint to fetch admin data
app.get("/admins", (req, res) => {
  // Retrieve the token from the session
  const token = req.session.token;

  // Check if token exists
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // Decode the token to get the superadmin_username
    const secretKey = process.env.SECRET_KEY;
    const decoded = jwt.verify(token, secretKey);
    const superadminUsername = decoded.username;

    // Query the database to retrieve admin data for the specific superadmin
    connection.query("SELECT * FROM Admins WHERE Superadmin_username = ?", [superadminUsername], (error, results) => {
      if (error) {
        console.error("Error fetching admin data:", error);
        return res.sendStatus(500); // Internal server error
      }

      // Admin data retrieved successfully
      return res.status(200).json(results);
    });
  } catch (error) {
    // Handle invalid token
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Endpoint to delete admin data by ID
app.delete("/admin/:adminId", (req, res) => {
  const adminId = req.params.adminId; // Extract admin ID from URL parameters

  // Fetch admin username corresponding to the admin ID
  connection.query(
    "SELECT admin_username FROM Admins WHERE admin_id = ?",
    [adminId],
    (error, results) => {
      if (error) {
        console.error("Error fetching admin data:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Admin not found" });
      }

      const adminUsername = results[0].admin_username;

      // Begin a transaction
      connection.beginTransaction(async (error) => {
        if (error) {
          console.error("Error starting transaction:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        try {
          // Delete records from related tables (Meetings, Users, MeetingSchedule)
          await deleteMeetings(adminUsername);
          await deleteUsers(adminUsername);
          await deleteMeetingSchedule(adminUsername);

          // Delete the admin data from the Admins table
          connection.query(
            "DELETE FROM Admins WHERE admin_id = ?",
            [adminId],
            (error, results) => {
              if (error) {
                console.error("Error deleting admin data:", error);
                connection.rollback(() => {
                  res.status(500).json({ error: "Internal server error" });
                });
              } else {
                if (results.affectedRows === 0) {
                  // No admin found with the specified ID
                  connection.rollback(() => {
                    res.status(404).json({ error: "Admin not found" });
                  });
                } else {
                  // Commit the transaction
                  connection.commit((error) => {
                    if (error) {
                      console.error("Error committing transaction:", error);
                      connection.rollback(() => {
                        res.status(500).json({ error: "Internal server error" });
                      });
                    } else {
                      // Admin data and related records successfully deleted
                      res.status(200).json({
                        message: "Admin data and related records deleted successfully",
                      });
                    }
                  });
                }
              }
            }
          );
        } catch (error) {
          console.error("Error deleting related records:", error);
          connection.rollback(() => {
            res.status(500).json({ error: "Internal server error" });
          });
        }
      });
    }
  );
});

async function deleteMeetings(adminUsername) {
  return new Promise((resolve, reject) => {
    connection.query(
      "DELETE FROM Meetings WHERE admin_username = ?",
      [adminUsername],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}

async function deleteUsers(adminUsername) {
  return new Promise((resolve, reject) => {
    connection.query(
      "DELETE FROM Users WHERE admin_username = ?",
      [adminUsername],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}

async function deleteMeetingSchedule(adminUsername) {
  return new Promise((resolve, reject) => {
    connection.query(
      "DELETE FROM MeetingSchedule WHERE meeting_username IN (SELECT meeting_username FROM Meetings WHERE admin_username = ?)",
      [adminUsername],
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });
}



// Endpoint to change admin_status to false
app.put("/admin/disable/:adminId", (req, res) => {
  const adminId = req.params.adminId; // Extract admin ID from URL parameters

  // Update the admin_status in the database based on the admin ID
  connection.query(
    "UPDATE Admins SET admin_status = false WHERE admin_id = ?",
    [adminId],
    (error, results) => {
      if (error) {
        console.error("Error updating admin status:", error);
        return res.status(500).json({ error: "Internal server error" }); // Internal server error
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Admin not found" }); // Admin with the specified ID was not found
      }

      // Admin status successfully updated
      return res
        .status(200)
        .json({ message: "Admin status updated successfully" });
    }
  );
});

// Endpoint to change admin_status to true
app.put("/admin/enable/:adminId", (req, res) => {
  const adminId = req.params.adminId; // Extract admin ID from URL parameters

  // Update the admin_status in the database based on the admin ID
  connection.query(
    "UPDATE Admins SET admin_status = true WHERE admin_id = ?",
    [adminId],
    (error, results) => {
      if (error) {
        console.error("Error updating admin status:", error);
        return res.status(500).json({ error: "Internal server error" }); // Internal server error
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Admin not found" }); // Admin with the specified ID was not found
      }

      // Admin status successfully updated
      return res
        .status(200)
        .json({ message: "Admin status updated successfully" });
    }
  );
});

// Endpoint to handle editing admin password
app.put("/admin/password/:adminId", (req, res) => {
  const adminId = req.params.adminId;
  const { adminPassword } = req.body;

  // Hash the new password
  bcrypt.hash(adminPassword, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res.status(500).json({ error: "Failed to hash password" });
    }
    // Implement logic to update admin password in your database with hashed password
    connection.query(
      "UPDATE Admins SET admin_password = ? WHERE admin_id = ?",
      [hashedPassword, adminId],
      (error, results) => {
        if (error) {
          console.error("Error updating admin password:", error);
          return res
            .status(500)
            .json({ error: "Failed to update admin password" });
        }
        // Check if any rows were affected by the update operation
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Admin not found" });
        }
        // Admin password updated successfully
        return res
          .status(200)
          .json({ message: "Admin password updated successfully" });
      }
    );
  });
});

//RESET PASSWORD
// Endpoint to reset superadmin password use for main password reset*********
app.put("/superadmin/reset/password", (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Validate if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ error: "New password and confirm password do not match" });
  }

  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const superadminUsername = decoded.username; // Get superadmin username from decoded token

    // Fetch superadmin details from the database
    connection.query(
      "SELECT Superadmin_password FROM Superadmin WHERE superadmin_username = ?",
      [superadminUsername],
      (error, results) => {
        if (error) {
          console.error("Error querying the database:", error);
          return res.sendStatus(500); // Internal server error
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Superadmin not found" });
        }

        const hashedPassword = results[0].Superadmin_password;

        // Compare old password with stored hashed password
        bcrypt.compare(oldPassword, hashedPassword, (err, isMatch) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return res.sendStatus(500); // Internal server error
          }

          if (!isMatch) {
            return res.status(401).json({ error: "Incorrect old password" });
          }

          // Hash the new password
          bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
            if (err) {
              console.error("Error hashing new password:", err);
              return res.sendStatus(500); // Internal server error
            }

            // Update superadmin's password in the database with hashed new password
            connection.query(
              "UPDATE Superadmin SET Superadmin_password = ? WHERE superadmin_username = ?",
              [hashedNewPassword, superadminUsername],
              (error) => {
                if (error) {
                  console.error("Error updating superadmin password:", error);
                  return res.sendStatus(500); // Internal server error
                }

                // Password updated successfully
                return res
                  .status(200)
                  .json({ message: "Password updated successfully" });
              }
            );
          });
        });
      }
    );
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});


//for reset password  into bycrpt password only then use this api method
// app.put("/superadmin/reset/password", (req, res) => {
//   const { oldPassword, newPassword, confirmPassword } = req.body;

//   // Validate if newPassword and confirmPassword match
//   if (newPassword !== confirmPassword) {
//     return res
//       .status(400)
//       .json({ error: "New password and confirm password do not match" });
//   }

//   // Extract the token from session
//   const token = req.session.token;

//   if (!token) {
//     return res.status(401).json({ error: "Access denied. No token provided." });
//   }

//   try {
//     const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
//     const decoded = jwt.verify(token, secretKey);
//     const superadminUsername = decoded.username; // Get superadmin username from decoded token

//     // Fetch superadmin details from the database
//     connection.query(
//       "SELECT superadmin_password FROM Superadmin WHERE superadmin_username = ?",
//       [superadminUsername],
//       (error, results) => {
//         if (error) {
//           console.error("Error querying the database:", error);
//           return res.sendStatus(500); // Internal server error
//         }

//         if (results.length === 0) {
//           return res.status(404).json({ error: "Superadmin not found" });
//         }

//         const storedPassword = results[0].superadmin_password;

//         // Directly compare old password with stored password
//         if (oldPassword !== storedPassword) {
//           return res.status(401).json({ error: "Incorrect old password" });
//         }

//         // Hash the new password
//         bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
//           if (err) {
//             console.error("Error hashing new password:", err);
//             return res.sendStatus(500); // Internal server error
//           }

//           // Update superadmin's password in the database with hashed new password
//           connection.query(
//             "UPDATE Superadmin SET superadmin_password = ? WHERE superadmin_username = ?",
//             [hashedNewPassword, superadminUsername],
//             (error) => {
//               if (error) {
//                 console.error("Error updating superadmin password:", error);
//                 return res.sendStatus(500); // Internal server error
//               }

//               // Password updated successfully
//               return res
//                 .status(200)
//                 .json({ message: "Password updated successfully" });
//             }
//           );
//         });
//       }
//     );
//   } catch (err) {
//     console.error("Error decoding token:", err);
//     res.status(401).json({ error: "Invalid token" });
//   }
// });



//Superadmin Done

// Admin Login
app.post("/login/admin", (req, res) => {
  const { admin_username, admin_password } = req.body;

  // Query the database to check if the provided credentials match an active Admin
  connection.query(
    "SELECT * FROM Admins WHERE admin_username = ? AND admin_status = 1",
    [admin_username],
    (error, results) => {
      if (error) {
        console.error("Error querying the database:", error);
        return res.sendStatus(500); // Internal server error
      }

      if (results.length === 1) {
        const admin = results[0];
        // Compare the provided password with the hashed password
        bcrypt.compare(
          admin_password,
          admin.admin_password,
          (err, passwordMatch) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return res.sendStatus(500); // Internal server error
            }

            if (passwordMatch) {
              // Admin exists, password matches, and is active
              const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
              const token = jwt.sign({ admin_username }, secretKey);
              // Store the token in the session
              req.session.token = token;
              return res
                .status(200)
                .json({ message: "Successful login", token });
            } else {
              // Password mismatch
              return res.status(401).json({ message: "Invalid credentials" });
            }
          }
        );
      } else {
        // Admin does not exist or is not active
        return res.status(401).json({ message: "Invalid credentials" });
      }
    }
  );
});

app.post("/admin/validateToken", (req, res) => {
  const { token } = req.body;

  // Check if the token is undefined
  if (!token) {
    console.error("Undefined token");
    return res.status(401).json({ valid: false });
  }

  // Verify the token
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      // Token is invalid
      console.error("Invalid token:", err);
      return res.status(401).json({ valid: false });
    } else {
      // Token is valid 
      console.log("Valid token for:", decoded.admin_username);
      return res
        .status(200)
        .json({ valid: true, meeting_username: decoded.admin_username });
    }
  });
});


app.get("/admin/details", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;

    // SELECT query to fetch admin details except for admin_password
    const sql =
      "SELECT admin_id, admin_username, created_at, updated_at FROM Admins WHERE admin_username = ?";

    // Execute the query with the decoded admin username
    connection.query(sql, [adminUsername], (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        return res.status(500).json({ error: "An error occurred while fetching admin details" });
      }

      // Check if admin with the provided username exists
      if (results.length === 0) {
        return res.status(404).json({ error: "Admin not found" });
      }

      // Send the admin details as JSON response
      res.json(results[0]);
    });
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});



//RESET PASSWORD
// Endpoint to reset admin password
app.put("/admin/reset/password", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;

    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });
    }

    // Fetch admin details from the database
    connection.query(
      "SELECT admin_password FROM Admins WHERE admin_username = ?",
      [adminUsername],
      (error, results) => {
        if (error) {
          console.error("Error querying the database:", error);
          return res.sendStatus(500); // Internal server error
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Admin not found" });
        }

        const hashedPassword = results[0].admin_password;

        // Compare old password with stored hashed password
        bcrypt.compare(oldPassword, hashedPassword, (err, isMatch) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return res.sendStatus(500); // Internal server error
          }

          if (!isMatch) {
            return res.status(401).json({ error: "Incorrect old password" });
          }

          // Hash the new password
          bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
            if (err) {
              console.error("Error hashing new password:", err);
              return res.sendStatus(500); // Internal server error
            }

            // Update admin's password in the database with hashed new password
            connection.query(
              "UPDATE Admins SET admin_password = ? WHERE admin_username = ?",
              [hashedNewPassword, adminUsername],
              (error) => {
                if (error) {
                  console.error("Error updating admin password:", error);
                  return res.sendStatus(500); // Internal server error
                }

                // Password updated successfully
                return res
                  .status(200)
                  .json({ message: "Password updated successfully" });
              }
            );
          });
        });
      }
    );
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});


//Meeting Data Start here

// Endpoint to insert meeting data for the logged-in admin
app.post("/admin/meetings/create", (req, res) => {
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY;
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;

    const {
      room_name,
      authority_name,
      meeting_username,
      meeting_password,
      start_time,
      end_time,
      meeting_status,
    } = req.body;

    // Check if any of the required fields are empty
    if (
      !room_name ||
      !authority_name ||
      !meeting_username ||
      !meeting_password ||
      !start_time ||
      !end_time ||
      meeting_status === undefined
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const formattedStartTime = formatTime(start_time);
    const formattedEndTime = formatTime(end_time);

    // Check if start_time is less than end_time
    if (formattedStartTime >= formattedEndTime) {
      return res.status(400).json({ error: "End time must be greater than start time" });
    }

    // Encrypt the meeting password
    bcrypt.hash(meeting_password, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Error encrypting password:", err);
        return res.sendStatus(500); // Internal server error
      }

      // Check if the meeting username already exists
      connection.query(
        "SELECT * FROM Meetings WHERE meeting_username = ?",
        [meeting_username],
        (error, results) => {
          if (error) {
            console.error("Error querying the database:", error);
            return res.sendStatus(500); // Internal server error
          }

          if (results.length > 0) {
            return res
              .status(409)
              .json({ error: "Meeting username already exists" });
          }

          // Insert meeting data into the database with hashed password, decoded admin username, and predefined meeting days
          const meeting_days = "Monday,Tuesday,Wednesday,Thursday,Friday";

          connection.query(
            "INSERT INTO Meetings (room_name, authority_name, meeting_username, meeting_password, meeting_status, meeting_days, start_time, end_time, admin_username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              room_name,
              authority_name,
              meeting_username,
              hashedPassword,
              meeting_status,
              meeting_days,
              formattedStartTime,
              formattedEndTime,
              adminUsername,
            ],
            (error, results) => {
              if (error) {
                console.error("Error inserting meeting data:", error);
                return res.sendStatus(500); // Internal server error
              }

              // Meeting data successfully inserted
              return res
                .status(201)
                .json({ message: "Meeting data inserted successfully" });
            }
          );
        }
      );
    });
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Endpoint to fetch meeting details based on admin_username from cookies
app.get("/admin/meetings/details", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;

    // Query database to get meeting details for the specified admin
    connection.query(
      "SELECT  meeting_id, room_name, authority_name, meeting_username, meeting_status, meeting_days, DATE_FORMAT(start_time, '%H:%i') AS start_time, DATE_FORMAT(end_time, '%H:%i') AS end_time FROM Meetings WHERE admin_username = ?",
      [adminUsername],
      (error, meetings) => {
        if (error) {
          console.error("Error fetching meetings:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Respond with meeting details
        res.json(meetings);
      }
    );
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Endpoint to delete meeting record by admin_username and meeting_id
app.delete("/admin/meetings/delete/:meeting_id", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;
    
    const meetingId = req.params.meeting_id;

    // Query to delete meeting record based on admin_username and meeting_id
    const sql =
      "DELETE FROM Meetings WHERE admin_username = ? AND meeting_id = ?";

    // Execute the query with adminUsername and meetingId as parameters
    connection.query(sql, [adminUsername, meetingId], (error, results) => {
      if (error) {
        console.error("Error deleting meeting record:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Meeting record not found" });
      }

      // Meeting record deleted successfully
      return res
        .status(200)
        .json({ message: "Meeting record deleted successfully" });
    });
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});


// Disable
app.put("/admin/meetings/status/disable/:meetingId", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;
    
    const meetingId = req.params.meetingId;

    // Update the meeting_status in the database based on the admin username and meeting ID
    connection.query(
      "UPDATE Meetings SET meeting_status = 0 WHERE admin_username = ? AND meeting_id = ?",
      [adminUsername, meetingId],
      (error, results) => {
        if (error) {
          console.error("Error updating meeting status:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Meeting not found" });
        }

        // Meeting status successfully updated
        return res
          .status(200)
          .json({ message: "Meeting status updated successfully" });
      }
    );
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Enable
app.put("/admin/meetings/status/enable/:meetingId", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;
    
    const meetingId = req.params.meetingId;

    // Update the meeting_status in the database based on the admin username and meeting ID
    connection.query(
      "UPDATE Meetings SET meeting_status = 1 WHERE admin_username = ? AND meeting_id = ?",
      [adminUsername, meetingId],
      (error, results) => {
        if (error) {
          console.error("Error updating meeting status:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Meeting not found" });
        }

        // Meeting status successfully updated
        return res
          .status(200)
          .json({ message: "Meeting status updated successfully" });
      }
    );
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

//edit meeting details
//previous api for testing purposes
// app.put("/admin/meetings/update/:meetingId", async (req, res) => {
//   const { roomName, authorityName, meetingUsername, meetingPassword } =
//     req.body;

//   // Extract the token from session
//   const token = req.session.token;

//   if (!token) {
//     return res.status(401).json({ error: "Access denied. No token provided." });
//   }

//   try {
//     const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
//     const decoded = jwt.verify(token, secretKey);
//     const adminUsername = decoded.admin_username;
    
//     // Retrieve meeting ID from request parameters
//     const meetingId = req.params.meetingId;

//     // Hash the password using bcrypt
//     const hashedPassword = await bcrypt.hash(meetingPassword, 10);

//     // Check if the meeting username already exists
//     connection.query(
//       "SELECT * FROM Meetings WHERE meeting_username = ? AND admin_username != ?",
//       [meetingUsername, adminUsername],
//       (err, results) => {
//         if (err) {
//           console.error("Error checking meeting username:", err);
//           return res.status(500).json({
//             error: "An error occurred while updating meeting details.",
//           });
//         }

//         if (results.length > 0) {
//           return res.status(400).json({ error: "Meeting username already exists." });
//         }

//         // Update meeting details in MySQL database
//         const sql = `
//           UPDATE meetings
//           SET room_name = ?,
//               authority_name = ?,
//               meeting_username = ?,
//               meeting_password = ?
//           WHERE admin_username = ? AND meeting_id = ?
//         `;

//         connection.query(
//           sql,
//           [
//             roomName,
//             authorityName,
//             meetingUsername,
//             hashedPassword,
//             adminUsername,
//             meetingId,
//           ],
//           (err, result) => {
//             if (err) {
//               console.error("Error updating meeting details:", err);
//               return res.status(500).json({
//                 error: "An error occurred while updating meeting details.",
//               });
//             }

//             if (result.affectedRows === 0) {
//               return res.status(404).json({ error: "Meeting not found" });
//             }

//             // Meeting details updated successfully
//             return res
//               .status(200)
//               .json({ message: "Meeting details updated successfully." });
//           }
//         );
//       }
//     );
//   } catch (error) {
//     console.error("Error decoding token or updating meeting details:", error);
//     res.status(401).json({ error: "Invalid token" });
//   }
// });
app.put("/admin/meetings/update/:meetingId", async (req, res) => {
  const { roomName, authorityName, meetingUsername, meetingPassword, startTime, endTime } = req.body;

  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;

    const formattedStartTime = startTime ? formatTime(startTime) : "";
    const formattedEndTime = endTime ? formatTime(endTime) : "";

    // Check if both startTime and endTime are empty strings, allow it to pass
    if ((formattedStartTime === "" && formattedEndTime === "") || (formattedStartTime && formattedEndTime && formattedStartTime < formattedEndTime)) {
      // Valid cases: both empty or startTime < endTime
    } else {
      return res.status(400).json({ error: "End time must be greater than start time, or both must be empty." });
    }

    // Retrieve meeting ID from request parameters
    const meetingId = req.params.meetingId;

    // Build the fields to update
    let fieldsToUpdate = [];
    let valuesToUpdate = [];
    let shouldDeleteSchedule = false;

    if (roomName) {
      fieldsToUpdate.push("room_name = ?");
      valuesToUpdate.push(roomName);
    }
    if (authorityName) {
      fieldsToUpdate.push("authority_name = ?");
      valuesToUpdate.push(authorityName);
    }
    if (meetingUsername) {
      fieldsToUpdate.push("meeting_username = ?");
      valuesToUpdate.push(meetingUsername);
    }
    if (meetingPassword) {
      const hashedPassword = await bcrypt.hash(meetingPassword, 10);
      fieldsToUpdate.push("meeting_password = ?");
      valuesToUpdate.push(hashedPassword);
    }
    if (formattedStartTime) {
      fieldsToUpdate.push("start_time = ?");
      valuesToUpdate.push(formattedStartTime);
      shouldDeleteSchedule = true; // Mark that schedule needs to be deleted if start_time changes
    }
    if (formattedEndTime) {
      fieldsToUpdate.push("end_time = ?");
      valuesToUpdate.push(formattedEndTime);
      shouldDeleteSchedule = true; // Mark that schedule needs to be deleted if end_time changes
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: "No fields to update." });
    }

    // Check if the meeting username already exists for any other meeting
    if (meetingUsername) {
      connection.query(
        "SELECT * FROM Meetings WHERE meeting_username = ? AND meeting_id != ?",
        [meetingUsername, meetingId],
        (err, results) => {
          if (err) {
            console.error("Error checking meeting username:", err);
            return res.status(500).json({
              error: "An error occurred while updating meeting details.",
            });
          }

          if (results.length > 0) {
            return res.status(400).json({ error: "Meeting username already exists for another meeting." });
          }

          // Proceed to delete schedule if needed and then update the meeting details
          if (shouldDeleteSchedule) {
            deleteMeetingSchedule();
          } else {
            updateMeetingDetails();
          }
        }
      );
    } else {
      // Proceed to delete schedule if needed and then update the meeting details
      if (shouldDeleteSchedule) {
        deleteMeetingSchedule();
      } else {
        updateMeetingDetails();
      }
    }

    function deleteMeetingSchedule() {
      // Delete the existing meeting schedule
      connection.query(
        "DELETE FROM MeetingSchedule WHERE meeting_id = ?",
        [meetingId],
        (err, result) => {
          if (err) {
            console.error("Error deleting meeting schedule:", err);
            return res.status(500).json({
              error: "An error occurred while deleting meeting schedule.",
            });
          }

          // Proceed to update the meeting details after deleting the schedule
          updateMeetingDetails();
        }
      );
    }

    function updateMeetingDetails() {
      // Add adminUsername and meetingId to the values
      valuesToUpdate.push(adminUsername, meetingId);

      // Construct the SQL query
      const sql = `
        UPDATE meetings
        SET ${fieldsToUpdate.join(", ")}
        WHERE admin_username = ? AND meeting_id = ?
      `;

      connection.query(sql, valuesToUpdate, (err, result) => {
        if (err) {
          console.error("Error updating meeting details:", err);
          return res.status(500).json({
            error: "An error occurred while updating meeting details.",
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Meeting not found" });
        }

        // Meeting details updated successfully
        return res.status(200).json({ message: "Meeting details updated successfully." });
      });
    }
  } catch (error) {
    console.error("Error decoding token or updating meeting details:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

//filter for meeting room search results
app.post("/admin/meetings/search", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  // Check if token is present
  if (!token) {
    return res.status(401).json({ error: "Admin not logged in" });
  }

  // Decode token to get admin username
  const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.error("Error decoding token:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const adminUsername = decoded.admin_username;
    const { text, category } = req.body;

    // Validate the text
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    // Build the query based on the selected category
    let query = "SELECT meeting_id, room_name, authority_name, meeting_username, meeting_status, meeting_days, DATE_FORMAT(start_time, '%H:%i') AS start_time, DATE_FORMAT(end_time, '%H:%i') AS end_time FROM Meetings WHERE admin_username = ? AND ";
    
    let queryParams = [adminUsername];

    switch (category) {
      case "Room Name":
        query += "room_name LIKE ?";
        queryParams.push(`%${text}%`);
        break;
      case "Approver Name":
        query += "authority_name LIKE ?";
        queryParams.push(`%${text}%`);
        break;
      default:
        query += "meeting_username LIKE ?";
        queryParams.push(`%${text}%`);
        break;
    }

    // Query the database with the constructed query and parameters
    connection.query(query, queryParams, (error, meetings) => {
      if (error) {
        console.error("Error fetching meetings:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Respond with meeting details
      res.json(meetings);
    });
  });
});



//admin meeting finished successfully

//users admin start here

app.post("/admin/users/create", (req, res) => {
  const {
    user_name,
    user_division,
    user_designation,
    user_email,
    user_status,
    user_password,
  } = req.body;

  // Retrieve and decode admin username from session token
  const token = req.session.token;
  if (!token) {
    return res.status(401).json({ error: "Admin not logged in" });
  }
  const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
  const decoded = jwt.verify(token, secretKey);
  const admin_username = decoded.admin_username;

  // Check if any of the required fields are empty
  if (
    !user_name ||
    !user_division ||
    !user_designation ||
    !user_email ||
    !user_password ||
    user_status === undefined
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Encrypt the user password
  bcrypt.hash(user_password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error encrypting password:", err);
      return res.sendStatus(500); // Internal server error
    }

    // Check if the email already exists
    connection.query(
      "SELECT * FROM Users WHERE user_email = ?",
      [user_email],
      (error, results) => {
        if (error) {
          console.error("Error checking email:", error);
          return res.sendStatus(500); // Internal server error
        }

        if (results.length > 0) {
          return res.status(409).json({ error: "Email already exists" });
        }

        // Insert user data into the database with hashed password
        connection.query(
          "INSERT INTO Users (user_name, user_division, user_designation, user_email, user_password, user_status, admin_username) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            user_name,
            user_division,
            user_designation,
            user_email,
            hashedPassword,
            user_status,
            admin_username,
          ],
          (error, results) => {
            if (error) {
              console.error("Error inserting Users data:", error);
              return res.sendStatus(500); // Internal server error
            }

            // User data successfully inserted
            return res
              .status(201)
              .json({ message: "Users data inserted successfully" });
          }
        );
      }
    );
  });
}); 

//User Details Fetching
app.get("/admin/users/details", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  // Check if token is present
  if (!token) {
    return res.status(401).json({ error: "Admin not logged in" });
  }

  // Decode token to get admin username
  const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.error("Error decoding token:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const adminUsername = decoded.admin_username;

    // Query database to get user details for the specified admin
    connection.query(
      "SELECT user_id, user_name, user_division, user_designation, user_email, user_status FROM Users WHERE admin_username = ?",
      [adminUsername],
      (error, users) => {
        if (error) {
          console.error("Error fetching users:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Respond with user details
        res.json(users);
      }
    );
  });
});

// Delete User Record
app.delete("/admin/users/delete/:user_id", (req, res) => {
  const userId = req.params.user_id;

  // Extract the token from session
  const token = req.session.token;

  // Check if token is present
  if (!token) {
    return res.status(401).json({ error: "Admin not logged in" });
  }
  const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
  // Decode token to get admin username
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.error("Error decoding token:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const adminUsername = decoded.admin_username;

    // Query to delete user record based on admin_username and user_id
    const sql = "DELETE FROM Users WHERE admin_username = ? AND user_id = ?";

    // Execute the query with adminUsername and userId as parameters
    connection.query(sql, [adminUsername, userId], (error, results) => {
      if (error) {
        console.error("Error deleting User record:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "User record not found" });
      }

      // User record deleted successfully
      return res.status(200).json({ message: "User record deleted successfully" });
    });
  });
});


// Edit users details update the users
app.put("/admin/users/update/:user_id", async (req, res) => {
  const { user_name, user_division, user_designation, user_email, user_password } = req.body;

  // Extract the token from session
  const token = req.session.token;
  if (!token) {
    return res.status(401).json({ error: "Admin not logged in" });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;

    // Retrieve user ID from request parameters
    const user_id = req.params.user_id;

    // Build the fields to update
    let fieldsToUpdate = [];
    let valuesToUpdate = [];

    if (user_name) {
      fieldsToUpdate.push("user_name = ?");
      valuesToUpdate.push(user_name);
    }
    if (user_division) {
      fieldsToUpdate.push("user_division = ?");
      valuesToUpdate.push(user_division);
    }
    if (user_designation) {
      fieldsToUpdate.push("user_designation = ?");
      valuesToUpdate.push(user_designation);
    }
    if (user_email) {
      fieldsToUpdate.push("user_email = ?");
      valuesToUpdate.push(user_email);
    }
    if (user_password) {
      const hashedPassword = await bcrypt.hash(user_password, 10);
      fieldsToUpdate.push("user_password = ?");
      valuesToUpdate.push(hashedPassword);
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: "No fields to update." });
    }

    // Check if the email already exists
    if (user_email) {
      connection.query(
        "SELECT * FROM Users WHERE user_email = ? AND user_id != ?",
        [user_email, user_id],
        (error, results) => {
          if (error) {
            console.error("Error checking email:", error);
            return res.status(500).json({ error: "Internal server error" });
          }

          if (results.length > 0) {
            return res.status(409).json({ error: "Email already exists" });
          }

          // Proceed to update the user details
          updateUserDetails();
        }
      );
    } else {
      // Proceed to update the user details if user email is not provided
      updateUserDetails();
    }

    function updateUserDetails() {
      // Add adminUsername and user_id to the values
      valuesToUpdate.push(adminUsername, user_id);

      // Construct the SQL query
      const sql = `
        UPDATE Users
        SET ${fieldsToUpdate.join(", ")}
        WHERE admin_username = ? AND user_id = ?
      `;

      connection.query(sql, valuesToUpdate, (err, result) => {
        if (err) {
          console.error("Error updating user details:", err);
          return res.status(500).json({ error: "An error occurred while updating user details." });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        // User details updated successfully
        return res.status(200).json({ message: "User details updated successfully." });
      });
    }
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "An error occurred while updating user details." });
  }
});



//Disable
// Endpoint to change user_status to 0 based on user_id and admin_username
app.put("/admin/user/status/disable/:user_id", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;
    
    const { user_id } = req.params;

    // Update the User_status in the database based on the admin username and User  ID
    connection.query(
      "UPDATE Users SET user_status = 0 WHERE admin_username = ? AND user_id = ?",
      [adminUsername, user_id],
      (error, results) => {
        if (error) {
          console.error("Error updating User  status:", error);
          return res.status(500).json({ error: "Internal server error" }); // Internal server error
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "User  not found" }); // User  with the specified ID and admin username was not found
        }

        // User status successfully updated
        return res
          .status(200)
          .json({ message: "User status updated successfully" });
      }
    );
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});


//Enable
// Endpoint to change user_status to 1 based on user_id and admin_username
app.put("/admin/user/status/enable/:user_id", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {

    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;
    
    const { user_id } = req.params;

    // Update the User_status in the database based on the admin username and User ID
    connection.query(
      "UPDATE Users SET user_status = 1 WHERE admin_username = ? AND user_id = ?",
      [adminUsername, user_id],
      (error, results) => {
        if (error) {
          console.error("Error updating User status:", error);
          return res.status(500).json({ error: "Internal server error" }); // Internal server error
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "User not found" }); // User with the specified ID and admin username was not found
        }

        // User status successfully updated
        return res
          .status(200)
          .json({ message: "User status updated successfully" });
      }
    );
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});


//Filter users by email, name , division , designation
app.post("/admin/users/search", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  // Check if token is present
  if (!token) {
    return res.status(401).json({ error: "Admin not logged in" });
  }

  // Decode token to get admin username
  const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.error("Error decoding token:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const adminUsername = decoded.admin_username;
    const { text, category } = req.body;

    // Validate the text
    if (!text) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Build the query based on the selected category
    let query = "SELECT user_id, user_name, user_division, user_designation, user_email, user_status FROM Users WHERE admin_username = ? AND ";
    let queryParams = [adminUsername];

    switch (category) {
      case "name":
        query += "user_name LIKE ?";
        queryParams.push(`%${text}%`);
        break;
      case "division":
        query += "user_division LIKE ?";
        queryParams.push(`%${text}%`);
        break;
      case "designation":
        query += "user_designation LIKE ?";
        queryParams.push(`%${text}%`);
        break;
      default:
        query += "user_email LIKE ?";
        queryParams.push(`%${text}%`);
        break;
    }

    // Query the database with the constructed query and parameters
    connection.query(query, queryParams, (error, users) => {
      if (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Respond with user details
      res.json(users);
    });
  });
});



//Booking schedule update
app.get("/admin/meetings/username/bookingcheck", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const adminUsername = decoded.admin_username;

    // Query database to get meeting details for the specified admin
    connection.query(
      "SELECT meeting_username FROM Meetings WHERE admin_username = ? AND meeting_status = 1",
      [adminUsername],
      (error, meetings) => {
        if (error) {
          console.error("Error fetching meetings:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Respond with meeting details
        res.json(meetings);
      }
    );
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

//for checking booking requests information
app.get("/admin/booking/meeting/user/detail", (req, res) => {
  // Extract the meeting username from query params
  const meetingUsername = req.query.meetingUsername;

  // Check if the meeting username exists
  if (!meetingUsername) {
    return res.status(400).json({ error: "Meeting username is required" });
  }

  try {
    // Query to retrieve the meeting ID based on the provided meeting username
    const getMeetingIdQuery = `SELECT meeting_id FROM Meetings WHERE meeting_username = ?`;

    connection.query(getMeetingIdQuery, [meetingUsername], (error, results) => {
      if (error) {
        console.error("Error fetching meeting ID:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Check if a meeting ID was found
      if (results.length === 0) {
        return res.status(404).json({ error: "No meeting found for the provided username" });
      }

      const meetingId = results[0].meeting_id;

      // Query to fetch meeting details using the retrieved meeting ID
      const query = `
        SELECT 
          MeetingSchedule.schedule_id,
          Users.user_email,
          MeetingSchedule.meeting_title,
          MeetingSchedule.meeting_option,
          MeetingSchedule.request_status,
          Meetings.room_name,
          MeetingSchedule.meeting_link,
          MeetingSchedule.added_by,
          DATE_FORMAT(MeetingSchedule.Meeting_date, '%M %d, %Y') AS formatted_meeting_date,
          DATE_FORMAT(MeetingSchedule.start_time, '%H:%i') AS formatted_start_time,
          DATE_FORMAT(MeetingSchedule.end_time, '%H:%i') AS formatted_end_time
        FROM 
          MeetingSchedule 
        LEFT JOIN 
          Meetings ON MeetingSchedule.meeting_id = Meetings.meeting_id 
        LEFT JOIN 
          Users ON MeetingSchedule.user_id = Users.user_id
        WHERE 
          MeetingSchedule.meeting_id = ?
      `;

      connection.query(query, [meetingId], (error, results) => {
        if (error) {
          console.error("Error fetching meeting schedule:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Check if there are any meeting schedules found
        if (results.length === 0) {
          return res.status(404).json({ error: "No meeting schedules found for the meeting" });
        }

        // Return meeting schedule details as a response
        return res.status(200).json(results);
      });
    });
  } catch (error) {
    console.error("Error querying database:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//booking schedule filtering** by month, date , email , title
app.post("/admin/booking/meeting/filter", (req, res) => {
  // Retrieve token from session or request headers
  const token = req.session.token; // Adjust based on your session management

  // Decode token to get admin_username
  const decodedToken = jwt.decode(token);
  const adminUsername = decodedToken.admin_username;
  
  // Check if admin_username exists
  if (!adminUsername) {
    return res.status(404).json({ error: 'Admin username not found in token' });
  }

  // Extract filters from request body
  const { filterOption, searchTerm, meetingUsername } = req.body;

  try {
    if (!meetingUsername) {
      return res.status(400).json({ error: 'Meeting username is required' });
    }
    if (!filterOption) {
      return res.status(400).json({ error: 'Filter option is required' });
    }
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    // Query to retrieve the meeting ID based on the provided meeting username
    const getMeetingIdQuery = `SELECT meeting_id FROM Meetings WHERE meeting_username = ?`;

    connection.query(getMeetingIdQuery, [meetingUsername], (error, results) => {
      if (error) {
        console.error("Error fetching meeting ID:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Check if a meeting ID was found
      if (results.length === 0) {
        return res.status(404).json({ error: "No meeting found for the provided username" });
      }

      const meetingId = results[0].meeting_id;

      // Base query
      let query = `
        SELECT 
          MeetingSchedule.schedule_id,
          Users.user_email,
          MeetingSchedule.meeting_title,
          MeetingSchedule.meeting_option,
          MeetingSchedule.request_status,
          Meetings.room_name,
          MeetingSchedule.meeting_link,
          MeetingSchedule.added_by,
          DATE_FORMAT(MeetingSchedule.Meeting_date, '%M %d, %Y') AS formatted_meeting_date,
          DATE_FORMAT(MeetingSchedule.start_time, '%H:%i') AS formatted_start_time,
          DATE_FORMAT(MeetingSchedule.end_time, '%H:%i') AS formatted_end_time
        FROM 
          MeetingSchedule 
        LEFT JOIN 
          Meetings ON MeetingSchedule.meeting_id = Meetings.meeting_id 
        LEFT JOIN 
          Users ON MeetingSchedule.user_id = Users.user_id
        WHERE 
          MeetingSchedule.meeting_id = ?
      `;

      // Add filters to the query dynamically
      const params = [meetingId];
      switch (filterOption) {
        case 'Meeting Title':
          query += ` AND MeetingSchedule.meeting_title LIKE ?`;
          params.push(`%${searchTerm}%`);
          break;
          case 'Month':
            const validMonths = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December' , 'january', 'february', 'march', 'april', 'may', 'june',
              'july', 'august', 'september', 'october', 'november', 'december'
            ];
            if (!validMonths.includes(searchTerm)) {
              return res.status(400).json({ error: 'Invalid month name' });
            }
            query += ` AND MONTHNAME(MeetingSchedule.Meeting_date) = ?`;
            params.push(searchTerm);
            break;
          case 'Meeting Date':
            // Validate date format (e.g., 'YYYY-MM-DD')
            if (!/^(\d{4}-\d{2}-\d{2})$/.test(searchTerm)) {
              return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
            }
            query += ` AND DATE(MeetingSchedule.Meeting_date) = ?`;
            params.push(searchTerm);
            break;
          case 'User Email':
          query += ` AND Users.user_email LIKE ?`;
          params.push(`%${searchTerm}%`);
          break;
          default:
          return res.status(400).json({ error: 'Invalid filter option' });
      }

      // Execute the query
      connection.query(query, params, (error, results) => {
        if (error) {
          console.error("Error fetching meeting schedule:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Check if results are found
        if (results.length === 0) {
          return res.status(404).json({ error: "No matching records found" });
        }

        // Return results
        return res.status(200).json(results);
      });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});



// for vc details in results
app.post("/admin/vc/create", async (req, res) => {
  const {
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
    labOrInstitutionFarSight,
    manualInstitutionFarSight,
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
  } = req.body;

  // Retrieve and decode admin username from session token
  const token = req.session.token;
  if (!token) {
    return res.status(401).json({ error: "Admin not logged in" });
  }
  const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
  const decoded = jwt.verify(token, secretKey);
  const adminUsername = decoded.admin_username;

  // Array to store error messages for missing fields
  const errors = [];

  // Check for missing required fields
  if (!requestDate) {
    errors.push("Request Date is required");
  }
  if (!labOrInstitution) {
    errors.push("Lab/Institution is required");
  }
  if (!requesterName) {
    errors.push("Requester Name is required");
  }
  if (!designation) {
    errors.push("Designation is required");
  }
  if (!division) {
    errors.push("Division is required");
  }
  if (!contactDetails) {
    errors.push("Contact Details are required");
  }
  if (!vcVenueName) {
    errors.push("VC Venue Name is required");
  }
  if (!meetingDate) {
    errors.push("Meeting Date is required");
  }
  if (!startTime) {
    errors.push("Start Time is required");
  }
  if (!endTime) {
    errors.push("End Time is required");
  }
  if (!parties) {
    errors.push("Parties are required");
  }
  if (!labOrInstitutionFarSight) {
    errors.push("Far-Sight Lab/Institution is required");
  }
  if (!personName) {
    errors.push("Person Name is required");
  }
  if (!personContact) {
    errors.push("Person Contact is required");
  }
  if (!location) {
    errors.push("Location is required");
  }
  if (!subject) {
    errors.push("Subject is required");
  }
  if (!members) {
    errors.push("Members are required");
  }
  if (!agree) {
    errors.push("Agree checkbox must be checked");
  }

  // If there are any errors, return them
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }


  const formattedStartTime = formatTime(startTime);
  const formattedEndTime = formatTime(endTime);

  // Check if startTime is less than endTime
  if (formattedStartTime >= formattedEndTime) {
    return res.status(400).json({ error: "End time must be greater than start time" });
  }

  // Conditionally assign values based on presence of manualInstitutionFarSight and manualInstitution
  let finalLabOrInstitutionFarSight = labOrInstitutionFarSight;
  let finalLabOrInstitution = labOrInstitution;
  let finalVcVenueName = vcVenueName;
  let finalParties = parties;

  if (manualInstitutionFarSight) {
    finalLabOrInstitutionFarSight = manualInstitutionFarSight;
  }
  if (manualInstitution) {
    finalLabOrInstitution = manualInstitution;
  }
  if (vcVenueManualName) {
    finalVcVenueName = vcVenueManualName;
  }
  if (partiesManual) {
    finalParties = partiesManual;
  }
 
  try {
    // Insert VC information into the database
    const sql = `
      INSERT INTO VCinformation (
        requestDate,
        labOrInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        meetingDate,
        startTime,
        endTime,
        parties,
        labOrInstitutionFarSight,
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks,
        admin_username
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Execute the query with values from req.body and adminUsername
    const values = [
      requestDate,
      finalLabOrInstitution, // Use finalLabOrInstitution instead of labOrInstitution
      requesterName,
      designation,
      division,
      contactDetails,
      finalVcVenueName,
      meetingDate,
      formattedStartTime,
      formattedEndTime,
      finalParties, // Use finalParties instead of parties
      finalLabOrInstitutionFarSight, // Use finalLabOrInstitutionFarSight instead of labOrInstitutionFarSight
      personName,
      personContact,
      location,
      connectivityDetails,
      subject,
      members,
      presentationRequired,
      recordingRequired,
      remarks,
      adminUsername,
    ];

    connection.query(sql, values, (error, results) => {
      if (error) {
        console.error("Error inserting VC information:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // VC information successfully inserted
      return res.status(201).json({ message: "VC information inserted successfully" });
    });

  } catch (error) {
    console.error("Error inserting VC information:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//for lab filtering
app.get('/admin/laboratory/options', (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    // Query to fetch distinct labOrInstitution options based on admin_username
    const query = `
      SELECT DISTINCT labOrInstitution
      FROM VCinformation
      WHERE admin_username = ?;
    `;

    connection.query(query, [adminUsername], (error, results) => {
      if (error) {
        console.error('Error fetching laboratory options:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Extract labOrInstitution values from results
      const labOptions = results.map((result) => result.labOrInstitution);

      // Return labOptions as JSON response
      res.status(200).json(labOptions);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//to get all vc informtion
app.get('/admin/laboratory/All/meeting/detail', (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    // Query to fetch VC information based on admin_username
    const query = `
    SELECT
    id,
    DATE_FORMAT(requestDate, '%d-%M-%Y') AS requestDate,
    labOrInstitution,
    requesterName,
    designation,
    division,
    contactDetails,
    vcVenueName,
    DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
    TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
    TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
    parties,
    labOrInstitutionFarSight,
    personName,
    personContact,
    location,
    connectivityDetails,
    subject,
    members,
    presentationRequired,
    recordingRequired,
    remarks
    FROM VCinformation;
    `;

    connection.query(query, [adminUsername], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if there are any results
      if (results.length === 0) {
        return res.status(404).json({ error: 'No VC information found' });
      }

      // Return VC information as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//for summary view purposes only
app.get('/admin/laboratory/All/meeting/summary', (req, res) => {
  try {
    const token = req.session.token;

    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    const query = `
      SELECT
        id,
        labOrInstitution,
        DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
        TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
        TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
        vcVenueName,
        labOrInstitutionFarSight,
        subject,
        requesterName,
        remarks
      FROM VCinformation
      WHERE admin_username = ?;
    `;

    connection.query(query, [adminUsername], (error, results) => {
      if (error) {
        console.error('Error fetching summary information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Endpoint to fetch VC information based on selected laboratory
app.post('/admin/laboratory/lab-detail', async (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    const { labOrInstitution } = req.body;

    // Query to fetch VC information based on admin_username and selected laboratory
    const query = `
      SELECT id,
    DATE_FORMAT(requestDate, '%d-%M-%Y') AS requestDate,
    labOrInstitution,
    requesterName,
    designation,
    division,
    contactDetails,
    vcVenueName,
    DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
    TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
    TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
    parties,
    labOrInstitutionFarSight,
    personName,
    personContact,
    location,
    connectivityDetails,
    subject,
    members,
    presentationRequired,
    recordingRequired,
    remarks
      FROM VCinformation
      WHERE admin_username = ? AND labOrInstitution = ?;
    `;

    connection.query(query, [adminUsername, labOrInstitution], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Return results as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//filter by year
app.post('/admin/laboratory/year-detail', async (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    const { year } = req.body;

    const query = `
      SELECT id,
        DATE_FORMAT(requestDate, '%d-%M-%Y') AS requestDate,
        labOrInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
        TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
        TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
        parties,
        labOrInstitutionFarSight,
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks
      FROM VCinformation
      WHERE admin_username = ? AND YEAR(meetingDate) = ?;
    `;

    connection.query(query, [adminUsername, year], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Return results as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//filter by month
app.post('/admin/laboratory/month-detail', async (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    const { month } = req.body;

    // Validate month input (optional: ensure it's a valid month name or number)
    const validMonths = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    if (!validMonths.includes(month)) {
      return res.status(400).json({ error: 'Invalid month provided' });
    }

    const query = `
      SELECT id,
        DATE_FORMAT(requestDate, '%d-%M-%Y') AS requestDate,
        labOrInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
        TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
        TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
        parties,
        labOrInstitutionFarSight,
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks
      FROM VCinformation
      WHERE admin_username = ? AND MONTHNAME(meetingDate) = ?;
    `;

    connection.query(query, [adminUsername, month], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Return results as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//filter by date range
app.post('/admin/laboratory/date-range-detail', (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    // Retrieve date range from query parameters
    const { fromDate, toDate } = req.body;

    // Validate date range
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'Both fromDate and toDate are required' });
    }

    // Query to fetch VC information within the date range based on admin_username
    const query = `
      SELECT
        id,
        DATE_FORMAT(requestDate, '%d-%M-%Y') AS requestDate,
        labOrInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
        TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
        TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
        parties,
        labOrInstitutionFarSight,
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks
      FROM VCinformation
      WHERE admin_username = ?
        AND meetingDate BETWEEN ? AND ?;
    `;

    connection.query(query, [adminUsername, fromDate, toDate], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if there are any results
      if (results.length === 0) {
        return res.status(404).json({ error: 'No VC information found' });
      }

      // Return VC information as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//filter by month-year 
app.post('/admin/laboratory/year-month-detail', async (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    const { year, month } = req.body;

    // Validate month input
    const validMonths = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    if (!validMonths.includes(month)) {
      return res.status(400).json({ error: 'Invalid month provided' });
    }

    const query = `
      SELECT id,
        DATE_FORMAT(requestDate, '%d-%M-%Y') AS requestDate,
        labOrInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
        TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
        TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
        parties,
        labOrInstitutionFarSight,
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks
      FROM VCinformation
      WHERE admin_username = ? AND YEAR(meetingDate) = ? AND MONTHNAME(meetingDate) = ?;
    `;

    connection.query(query, [adminUsername, year, month], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Return results as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// filter by lab-month
app.post('/admin/laboratory/lab-month-detail', async (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    const { labOrInstitution, month } = req.body;

    // Validate month input
    const validMonths = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    if (!validMonths.includes(month)) {
      return res.status(400).json({ error: 'Invalid month provided' });
    }

    const query = `
      SELECT id,
        DATE_FORMAT(requestDate, '%d-%M-%Y') AS requestDate,
        labOrInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
        TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
        TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
        parties,
        labOrInstitutionFarSight,
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks
      FROM VCinformation
      WHERE admin_username = ? AND labOrInstitution = ? AND MONTHNAME(meetingDate) = ?;
    `;

    connection.query(query, [adminUsername, labOrInstitution, month], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Return results as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//filter by lab-year
app.post('/admin/laboratory/lab-year-detail', async (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    const { labOrInstitution, year } = req.body;

    const query = `
      SELECT id,
        DATE_FORMAT(requestDate, '%d-%M-%Y') AS requestDate,
        labOrInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
        TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
        TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
        parties,
        labOrInstitutionFarSight,
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks
      FROM VCinformation
      WHERE admin_username = ? AND labOrInstitution = ? AND YEAR(meetingDate) = ?;
    `;

    connection.query(query, [adminUsername, labOrInstitution, year], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Return results as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Filter by year, month, and laboratory
app.post('/admin/laboratory/year-month-lab-detail', async (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    const { year, month, labOrInstitution } = req.body;

    // Validate month input
    const validMonths = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    if (!validMonths.includes(month)) {
      return res.status(400).json({ error: 'Invalid month provided' });
    }

    const query = `
      SELECT id,
        DATE_FORMAT(requestDate, '%d-%M-%Y') AS requestDate,
        labOrInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
        TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
        TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
        parties,
        labOrInstitutionFarSight,
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks
      FROM VCinformation
      WHERE admin_username = ? AND YEAR(meetingDate) = ? AND MONTHNAME(meetingDate) = ? AND labOrInstitution = ?;
    `;

    connection.query(query, [adminUsername, year, month, labOrInstitution], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Return results as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Filter by lab and date range
app.post('/admin/laboratory/date-range-lab-detail', (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    // Retrieve parameters from request body
    const { labOrInstitution, fromDate, toDate } = req.body;

    // Validate parameters
    if (!labOrInstitution || !fromDate || !toDate) {
      return res.status(400).json({ error: 'labOrInstitution, fromDate, and toDate are required' });
    }

    // Query to fetch VC information based on lab/institution and date range
    const query = `
      SELECT
        id,
        DATE_FORMAT(requestDate, '%d-%M-%Y') AS requestDate,
        labOrInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
        TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
        TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
        parties,
        labOrInstitutionFarSight,
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks
      FROM VCinformation
      WHERE admin_username = ?
        AND labOrInstitution = ?
        AND meetingDate BETWEEN ? AND ?;
    `;

    connection.query(query, [adminUsername, labOrInstitution, fromDate, toDate], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if there are any results
      if (results.length === 0) {
        return res.status(404).json({ error: 'No VC information found' });
      }

      // Return results as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//To fetch the data of vc form by meeting date
app.get('/admin/vcdata', (req, res) => {
  try {
    // Retrieve token from session
    const token = req.session.token;
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken?.admin_username;

    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    // Retrieve meetingId from query parameters
    const meetingId = req.query.meetingId;

    if (!meetingId) {
      return res.status(400).json({ error: 'Meeting ID parameter is required' });
    }

    // Query to fetch data based on admin_username and meetingId
    const query = `
      SELECT 
        DATE_FORMAT(requestDate,'%Y-%m-%d') AS requestDate,
        labOrInstitution,
        requesterName,
        designation,
        division,
        contactDetails,
        vcVenueName,
        DATE_FORMAT(meetingDate, '%Y-%m-%d') AS meetingDate,
        startTime,
        endTime,
        parties,
        labOrInstitutionFarSight,
        personName,
        personContact,
        location,
        connectivityDetails,
        subject,
        members,
        presentationRequired,
        recordingRequired,
        remarks
      FROM VCinformation
      WHERE admin_username = ? AND id = ?;
    `;

    connection.query(query, [adminUsername, meetingId], (error, results) => {
      if (error) {
        console.error('Error fetching VC data:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if the result set is empty
      if (results.length === 0) {
        return res.status(404).json({ error: 'Meeting ID not found' });
      }

      // Return results as JSON response
      res.status(200).json(results[0]);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//for update Local/Vc Form by meeting id
app.post("/admin/vc/update", async (req, res) => {
  const {
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
    labOrInstitutionFarSight,
    manualInstitutionFarSight,
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
    meetingId, // Required for update
  } = req.body;

  // Retrieve and decode admin username from session token
  const token = req.session.token;
  if (!token) {
    return res.status(401).json({ error: "Admin not logged in" });
  }
  const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
  const decoded = jwt.verify(token, secretKey);
  const adminUsername = decoded.admin_username;

  // Array to store error messages for missing fields
  const errors = [];

  // Check for missing required fields
  if (!requestDate) errors.push("Request Date is required");
  if (!labOrInstitution) errors.push("Lab/Institution is required");
  if (!requesterName) errors.push("Requester Name is required");
  if (!designation) errors.push("Designation is required");
  if (!division) errors.push("Division is required");
  if (!contactDetails) errors.push("Contact Details are required");
  if (!vcVenueName) errors.push("VC Venue Name is required");
  if (!meetingDate) errors.push("Meeting Date is required");
  if (!startTime) errors.push("Start Time is required");
  if (!endTime) errors.push("End Time is required");
  if (!parties) errors.push("Parties are required");
  if (!labOrInstitutionFarSight) errors.push("Far-Sight Lab/Institution is required");
  if (!personName) errors.push("Person Name is required");
  if (!personContact) errors.push("Person Contact is required");
  if (!location) errors.push("Location is required");
  if (!subject) errors.push("Subject is required");
  if (!members) errors.push("Members are required");
  if (!agree) errors.push("Agree checkbox must be checked");
  if (!meetingId) errors.push("Meeting ID is required for updating");

  // If there are any errors, return them
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join("; ") });
  }

  const formattedStartTime = formatTime(startTime);
  const formattedEndTime = formatTime(endTime);

  // Check if startTime is less than endTime
  if (formattedStartTime >= formattedEndTime) {
    return res.status(400).json({ error: "End time must be greater than start time" });
  }

  // Conditionally assign values based on presence of manualInstitutionFarSight and manualInstitution
  let finalLabOrInstitutionFarSight = labOrInstitutionFarSight;
  let finalLabOrInstitution = labOrInstitution;
  let finalVcVenueName = vcVenueName;
  let finalParties = parties;

  if (manualInstitutionFarSight) {
    finalLabOrInstitutionFarSight = manualInstitutionFarSight;
  }
  if (manualInstitution) {
    finalLabOrInstitution = manualInstitution;
  }
  if (vcVenueManualName) {
    finalVcVenueName = vcVenueManualName;
  }
  if (partiesManual) {
    finalParties = partiesManual;
  }

  try {
    // Update existing record
    const sql = `
      UPDATE VCinformation SET
        requestDate = ?,
        labOrInstitution = ?,
        requesterName = ?,
        designation = ?,
        division = ?,
        contactDetails = ?,
        vcVenueName = ?,
        meetingDate = ?,
        startTime = ?,
        endTime = ?,
        parties = ?,
        labOrInstitutionFarSight = ?,
        personName = ?,
        personContact = ?,
        location = ?,
        connectivityDetails = ?,
        subject = ?,
        members = ?,
        presentationRequired = ?,
        recordingRequired = ?,
        remarks = ?
      WHERE id = ? AND admin_username = ?
    `;
    const values = [
      requestDate,
      finalLabOrInstitution,
      requesterName,
      designation,
      division,
      contactDetails,
      finalVcVenueName,
      meetingDate,
      formattedStartTime,
      formattedEndTime,
      finalParties,
      finalLabOrInstitutionFarSight,
      personName,
      personContact,
      location,
      connectivityDetails,
      subject,
      members,
      presentationRequired,
      recordingRequired,
      remarks,
      meetingId,// ID for the record to update
      adminUsername
    ];

    connection.query(sql, values, (error, results) => {
      if (error) {
        console.error("Error updating VC information:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // VC information successfully updated
      return res.status(200).json({ message: "VC information updated successfully" });
    });

  } catch (error) {
    console.error("Error updating VC information:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//get the data of meeting for the calendar
app.get('/admin/local/meeting/detail/calendar', (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    // Query to fetch limited VC information based on admin_username
    const query = `
    SELECT
      requesterName,
      DATE_FORMAT(meetingDate, '%d-%M-%Y') AS meetingDate,
      TIME_FORMAT(startTime, '%h:%i %p') AS startTime,
      TIME_FORMAT(endTime, '%h:%i %p') AS endTime,
      vcVenueName
    FROM VCinformation
    WHERE admin_username = ?;
    `;

    connection.query(query, [adminUsername], (error, results) => {
      if (error) {
        console.error('Error fetching VC information:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if there are any results
      if (results.length === 0) {
        return res.status(404).json({ error: 'No VC information found' });
      }

      // Return VC information as JSON response
      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//sum months of meeting total time calculate
app.get('/admin/local/meeting/total-time', (req, res) => {
  try {
    // Retrieve token from session or request headers
    const token = req.session.token; // Adjust this based on your session management

    // Decode token to get admin_username
    const decodedToken = jwt.decode(token);
    const adminUsername = decodedToken.admin_username;

    // Check if admin_username exists
    if (!adminUsername) {
      return res.status(400).json({ error: 'Admin username not found in token' });
    }

    // Retrieve month and year from query parameters
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required' });
    }

    // Validate year and month
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    // Query to calculate total meeting time for the given month and year
    const query = `
     SELECT
     TIME_FORMAT(SEC_TO_TIME(SUM(TIMESTAMPDIFF(SECOND, startTime, endTime))), '%H:%i') AS total_time
     FROM VCinformation
     WHERE admin_username = ?
     AND YEAR(meetingDate) = ?
     AND MONTH(meetingDate) = ?;
    `;

    connection.query(query, [adminUsername, year, month], (error, results) => {
      if (error) {
        console.error('Error calculating total meeting time:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if there are any results
      if (results.length === 0 || !results[0].total_time) {
        return res.status(404).json({ error: 'No meeting information found' });
      }

      // Return total meeting time as JSON response
      res.status(200).json({ total_time: results[0].total_time });
    });
  } catch (error) {
    console.error('Error querying database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




//All done for admin










//user Login Start
app.post("/login/user", (req, res) => {
  const { user_email, user_password } = req.body;

  // Query the database to check if the provided credentials match an active User
  connection.query(
    "SELECT * FROM Users WHERE user_email = ? AND user_status = 1",
    [user_email],
    (error, results) => {
      if (error) {
        console.error("Error querying the database:", error);
        return res.sendStatus(500); // Internal server error
      }

      if (results.length === 1) {
        const user = results[0];
        // Compare the provided password with the hashed password
        bcrypt.compare(
          user_password,
          user.user_password,
          (err, passwordMatch) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return res.sendStatus(500); // Internal server error
            }

            if (passwordMatch) {
              // User exists, password matches, and is active
              const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
              const token = jwt.sign({ user_email }, secretKey);
              // Store the token in the session
              req.session.token = token;
              return res
                .status(200)
                .json({ message: "Successful login", token });
            } else {
              // Password mismatch
              return res.status(401).json({ message: "Invalid credentials" });
            }
          }
        );
      } else {
        // User does not exist or is not active
        return res.status(401).json({ message: "Invalid credentials" });
      }
    }
  );
});

//validation
app.post("/user/validateToken", (req, res) => {
  const { token } = req.body;

  // Verify the token
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      // Token is invalid
      console.error("Invalid token:", err);
      return res.status(401).json({ valid: false });
    } else {
      // Token is valid
      console.log("Valid token for:", decoded.user_email);
      return res
        .status(200)
        .json({ valid: true, user_email: decoded.user_email }); // Include the username in the response
    }
  });
});

// RESET PASSWORD
// Endpoint to reset User password
app.put("/user/reset/password", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {

  const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
  const decoded = jwt.verify(token, secretKey);
    const userEmail = decoded.user_email;

    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });
    }

    // Fetch user details from the database
    connection.query(
      "SELECT user_password FROM Users WHERE user_email = ?",
      [userEmail],
      (error, results) => {
        if (error) {
          console.error("Error querying the database:", error);
          return res.sendStatus(500); // Internal server error
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        const hashedPassword = results[0].user_password;

        // Compare old password with stored hashed password
        bcrypt.compare(oldPassword, hashedPassword, (err, isMatch) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return res.sendStatus(500); // Internal server error
          }

          if (!isMatch) {
            return res.status(401).json({ error: "Incorrect old password" });
          }

          // Hash the new password
          bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
            if (err) {
              console.error("Error hashing new password:", err);
              return res.sendStatus(500); // Internal server error
            }

            // Update user's password in the database with hashed new password
            connection.query(
              "UPDATE Users SET user_password = ? WHERE user_email = ?",
              [hashedNewPassword, userEmail],
              (error) => {
                if (error) {
                  console.error("Error updating User password:", error);
                  return res.sendStatus(500); // Internal server error
                }

                // Password updated successfully
                return res
                  .status(200)
                  .json({ message: "Password updated successfully" });
              }
            );
          });
        });
      }
    );
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Endpoint to fetch user details based on user_email from token
app.get("/user/details", (req, res) => {
  // Extract the token from session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {

  const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
  const decoded = jwt.verify(token, secretKey);
    const userEmail = decoded.user_email;

    // Query to select user details by email
    const query = `SELECT user_id, user_name, user_division, user_designation, user_email FROM Users WHERE user_email = ?`;

    // Execute the query
    connection.query(query, [userEmail], (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      // Check if user exists
      if (results.length === 0) {
        res.status(404).json({ error: "Email not found" });
        return;
      }

      // User found, send user details
      res.status(200).json(results[0]);
    });
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Endpoint to fetch meetings created by the admin associated with the user 
app.get("/user/meetings/details", async (req, res) => {
  try {
  // Extract the token from session
  const token = req.session.token;

    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

  const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
  const decoded = jwt.verify(token, secretKey);
    const user_email = decoded.user_email;

    // Retrieve meetings created by the admin associated with the user
    connection.query(
      `
      SELECT Meetings.meeting_id , Meetings.room_name , Meetings.authority_name , Meetings.meeting_username , Meetings.meeting_days ,   DATE_FORMAT(Meetings.start_time, '%H:%i') AS formatted_start_time,
      DATE_FORMAT(Meetings.end_time, '%H:%i') AS formatted_end_time
      FROM Meetings
      INNER JOIN Users ON Meetings.admin_username = Users.admin_username
      WHERE Users.user_email = ? AND Meetings.meeting_status = 1 AND Meetings.meeting_days IS NOT NULL
    `,
      [user_email],
      (error, results) => {
        if (error) {
          console.error("Error fetching meetings:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Return the meetings in the response
        res.json(results);
      }
    );
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// For fetching current date and time information for websites: user side and meeting side fetching data for both sides *****
app.get("/currentDateTime", async (req, res) => {
  try {
    const response = await axios.get("http://worldtimeapi.org/api/timezone/Asia/Kolkata");
    const currentDateTime = response.data.datetime;
    res.status(200).json({ currentDateTime });
  } catch (error) {
    console.error("Error fetching current date and time:", error.message);
    res.status(500).json({ error: "Failed to fetch current date and time" });
  }
});

// API endpoint to handle booking requests user side and meeting side booking req for both sides *****
app.post("/user/booking/schedule/send/:meeting_id", (req, res) => {
  const { meeting_id } = req.params;
  const { meeting_title, meeting_date, meeting_day, start_time, end_time, meeting_option, meeting_link } = req.body;

  try {
    // Extract the token from session
    const token = req.session.token;

    if (!token) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const user_email = decoded.user_email;

    // Format the start time and end time to exclude seconds
    const formattedStartTime = start_time.split(':').slice(0, 2).join(':');
    const formattedEndTime = end_time.split(':').slice(0, 2).join(':');

    // Get user_id using user_email
    const getUserIdQuery = `
      SELECT user_id
      FROM Users
      WHERE user_email = ?`;

    connection.query(getUserIdQuery, [user_email], (getUserError, userResults) => {
      if (getUserError) {
        console.error("Error fetching user details:", getUserError);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user_id = userResults[0].user_id;

      // Check if the provided meeting day, start time, and end time exist in the Meetings table
      const query = `
        SELECT meeting_days, TIME_FORMAT(start_time, '%H:%i') as meetingStartTime, TIME_FORMAT(end_time, '%H:%i') as meetingEndTime
        FROM Meetings
        WHERE meeting_id = ?`;

      connection.query(query, [meeting_id], (error, results) => {
        if (error) {
          console.error("Error fetching meeting details:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Meeting not found" });
        }

        const {
          meeting_days,
          meetingStartTime,
          meetingEndTime,
        } = results[0];

        // Check if the provided meeting day is present in the meeting_days
        if (!meeting_days.includes(meeting_day)) {
          return res.status(400).json({ error: "Meeting day not available" });
        }

        // Check if the provided start time and end time are within the allowed time slot
        if (
          formattedStartTime < meetingStartTime ||
          formattedEndTime > meetingEndTime ||
          formattedStartTime >= formattedEndTime
        ) {
          return res.status(400).json({ error: "Time slot not available" });
        }

        // Check if the requested time slot is available on the selected date
        const timeSlotQuery = `
          SELECT *
          FROM MeetingSchedule
          WHERE meeting_id = ? AND meeting_date = STR_TO_DATE(?, '%M %d, %Y') AND meeting_day = ? AND (request_status = 1 OR request_status is NULL)
            AND (
              (start_time <= ? AND end_time > ?)
              OR (start_time < ? AND end_time >= ?)
              OR (start_time >= ? AND end_time <= ?)
            )`;

        connection.query(
          timeSlotQuery,
          [
            meeting_id,
            meeting_date,
            meeting_day,
            formattedStartTime,
            formattedStartTime,
            formattedEndTime,
            formattedEndTime,
            formattedStartTime,
            formattedEndTime,
          ],
          (timeSlotError, timeSlotResults) => {
            if (timeSlotError) {
              console.error("Error checking time slot:", timeSlotError);
              return res.status(500).json({ error: "Internal server error" });
            }

            if (timeSlotResults.length > 0) {
              return res.status(400).json({ error: "Slot not available on selected date" });
            }

            // If all validations pass, insert the values into the MeetingSchedule table
            const insertQuery = `
              INSERT INTO MeetingSchedule (added_by, user_id, meeting_id, meeting_title, meeting_date, meeting_day, start_time, end_time, meeting_option, request_status)
              VALUES (?, ?, ?, ?, STR_TO_DATE(?, '%M %d, %Y'), ?, ?, ?, ?, NULL)`;

            connection.query(
              insertQuery,
              [
                'USER',
                user_id,
                meeting_id,
                meeting_title,
                meeting_date,
                meeting_day,
                formattedStartTime,
                formattedEndTime,
                meeting_option,
              ],
              (insertError) => {
                if (insertError) {
                  console.error("Error inserting into MeetingSchedule:", insertError);
                  return res.status(500).json({ error: "Internal server error" });
                }

                if (meeting_link) {
                  // Update the meeting_link in the Meetings table only if meeting_link is provided
                  const updateQuery = `
                    UPDATE MeetingSchedule
                    SET meeting_link = ?
                    WHERE meeting_id = ?`;

                  connection.query(
                    updateQuery,
                    [meeting_link, meeting_id],
                    (updateError) => {
                      if (updateError) {
                        console.error("Error updating meeting link:", updateError);
                        return res.status(500).json({ error: "Internal server error" });
                      }

                      return res.status(200).json({ message: "Meeting schedule inserted and meeting link updated successfully" });
                    }
                  );
                } else {
                  return res.status(200).json({ message: "Meeting schedule inserted successfully" });
                }
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


//for booking form calendar fetching in booking form user side and meeting side fetching data for both sides ****
app.get("/user/calendar/meetings/:meeting_id", (req, res) => {
  const { meeting_id } = req.params;

  const query = `SELECT meeting_days, start_time, end_time FROM Meetings WHERE meeting_id = ?`;

  connection.query(query, [meeting_id], (error, results) => {
    if (error) {
      console.error("Error fetching meeting schedule:", error);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "No meeting schedules found for the meeting ID" });
    }

    return res.status(200).json(results);
  });
});

//fetch booking slots for availability
app.get("/user/booked/slot/:meeting_id", (req, res) => {
  const { meeting_id } = req.params;
  const { date, day } = req.query;

  const query = `
  SELECT DISTINCT 
  DATE_FORMAT(start_time, '%H:%i') AS start_time, 
  DATE_FORMAT(end_time, '%H:%i') AS end_time
  FROM MeetingSchedule 
  WHERE meeting_id = ? 
  AND meeting_date = DATE_FORMAT(STR_TO_DATE(?, '%M %d, %Y'), '%Y-%m-%d')
  AND meeting_day = ?
  AND (request_status IS NULL OR request_status = 1)
  `;

  connection.query(query, [meeting_id, date, day], (error, results) => {
    if (error) {
      console.error("Error fetching start_time and end_time:", error);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ error: "No meeting schedules found for the meeting ID" });
    }

    res.status(200).json(results);
  });
});


// show booking request for user for display request
// API endpoint to fetch meeting schedule details based on user_email
app.get("/user/booking/schedule", (req, res) => {
  try {
    // Extract the token from session
    const token = req.session.token;

    if (!token) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const user_email = decoded.user_email;

    // Query the Users table to get user_id based on user_email
    const getUserIdQuery = `SELECT user_id FROM Users WHERE user_email = ?`;

    connection.query(getUserIdQuery, [user_email], (getUserError, userResults) => {
      if (getUserError) {
        console.error("Error fetching user details:", getUserError);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user_id = userResults[0].user_id;

      // Query the MeetingSchedule table based on user_id
      const query = `SELECT 
        MeetingSchedule.schedule_id,
        MeetingSchedule.meeting_title,
        MeetingSchedule.meeting_option,
        MeetingSchedule.request_status,
        MeetingSchedule.reason_for_rejection,
        Meetings.meeting_username, 
        Meetings.room_name,
        Meetings.authority_name,
        MeetingSchedule.meeting_link,
        DATE_FORMAT(MeetingSchedule.meeting_date, '%M %d, %Y') AS formatted_meeting_date,
        DATE_FORMAT(MeetingSchedule.start_time, '%H:%i') AS formatted_start_time,
        DATE_FORMAT(MeetingSchedule.end_time, '%H:%i') AS formatted_end_time
      FROM 
        MeetingSchedule
      INNER JOIN 
        Meetings ON MeetingSchedule.meeting_id = Meetings.meeting_id
      WHERE 
        MeetingSchedule.user_id = ?
      `;

      connection.query(query, [user_id], (error, results) => {
        if (error) {
          console.error("Error fetching meeting schedule:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Check if there are any meeting schedules found
        if (results.length === 0) {
          return res.status(404).json({ error: "No meeting schedules found for the user" });
        }

        // Return meeting schedule details as a response
        return res.status(200).json(results);
      });
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//fetch already Booked slot by users user side and meeting side fetching data for both sides *****
app.put("/user/booking/cancel/:schedule_id", (req, res) => {
  try {
    // Extract the token from session
    const token = req.session.token;

    if (!token) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const user_email = decoded.user_email;

    // Query the Users table to get user_id based on user_email
    const getUserIdQuery = `SELECT user_id FROM Users WHERE user_email = ?`;

    connection.query(getUserIdQuery, [user_email], (getUserError, userResults) => {
      if (getUserError) {
        console.error("Error fetching user details:", getUserError);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user_id = userResults[0].user_id;
      const schedule_id = req.params.schedule_id;

      // Update the MeetingSchedule table to set request_status to 0 and reason_for_rejection
      const updateQuery = `
        UPDATE MeetingSchedule
        SET request_status = 0, reason_for_rejection = 'Cancelled by user'
        WHERE schedule_id = ? AND user_id = ?
      `;

      connection.query(updateQuery, [schedule_id, user_id], (updateError, updateResults) => {
        if (updateError) {
          console.error("Error updating meeting schedule:", updateError);
          return res.status(500).json({ error: "Internal server error" });
        }

        if (updateResults.affectedRows === 0) {
          return res.status(404).json({ error: "Meeting schedule not found or user not authorized" });
        }

        res.status(200).json({ message: "Meeting request canceled successfully" });
      });
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// API endpoint to fetch the count of pending Request
app.get("/user/pending/count", (req, res) => {
  // Extract the token from the request headers
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const user_email = decoded.user_email;

    // Query to get the user ID using the user email
    const getUserIdQuery = "SELECT user_id FROM Users WHERE user_email = ?";

    // Execute the query to get the user ID
    connection.query(getUserIdQuery, [user_email], (error, results) => {
      if (error) {
        console.error("Error fetching user ID:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user_id = results[0].user_id;

      // Query to count the number of Pending meeting requests for the user
      const countQuery = "SELECT COUNT(*) AS request_count FROM MeetingSchedule WHERE user_id = ? AND request_status is NULL";

      // Execute the query to count the number of pending meeting requests
      connection.query(countQuery, [user_id], (error, results) => {
        if (error) {
          console.error("Error fetching pending meeting request count:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Extract the count from the results
        const requestCount = results[0].request_count;

        // Return the count in the response
        res.status(200).json({ request_count: requestCount });
      });
    });
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});


//for users profile updating
// Endpoint to update user profile
app.put("/user/edit/profile", (req, res) => {
  // Extract the token from the request session
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  try {
    // Decode the token to get user_email
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const user_email = decoded.user_email;

    // Query to get the user ID using the user email
    const getUserIdQuery = "SELECT user_id FROM Users WHERE user_email = ?";

    // Execute the query to get the user ID
    connection.query(getUserIdQuery, [user_email], (error, results) => {
      if (error) {
        console.error("Error fetching user ID:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user_id = results[0].user_id;
      
      // Get user details from request body
      const { user_name, user_division, user_designation } = req.body;

      // Query to update user profile details
      const updateUserQuery = `
        UPDATE Users 
        SET 
          user_name = ?,
          user_division = ?,
          user_designation = ?
        WHERE 
          user_id = ?
      `;

      // Execute the update query
      connection.query(updateUserQuery, [user_name, user_division, user_designation, user_id], (error, results) => {
        if (error) {
          console.error("Error updating user profile:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Check if any rows were affected by the update operation
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        // User profile updated successfully
        res.status(200).json({ message: "User profile updated successfully" });
      });
    });
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});


// COMPLETED USERS



//meeting login start

app.post("/login/meeting", (req, res) => {
  const { meeting_username, meeting_password } = req.body;

  // Query the database to check if the provided credentials match an active User
  connection.query(
    "SELECT * FROM Meetings WHERE meeting_username = ? AND meeting_status = 1",
    [meeting_username],
    (error, results) => {
      if (error) {
        console.error("Error querying the database:", error);
        return res.sendStatus(500); // Internal server error
      }

      if (results.length === 1) {
        const meeting = results[0];
        // Compare the provided password with the hashed password
        bcrypt.compare(
          meeting_password,
          meeting.meeting_password,
          (err, passwordMatch) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return res.sendStatus(500); // Internal server error
            }

            if (passwordMatch) {
              // User exists, password matches, and is active
              const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
              const token = jwt.sign({ meeting_username }, secretKey);
              // Store the token in the session
              req.session.token = token;
              return res
                .status(200)
                .json({ message: "Successful login", token });
            } else {
              // Password mismatch
              return res.status(401).json({ message: "Invalid credentials" });
            }
          }
        );
      } else {
        // User does not exist or is not active
        return res.status(401).json({ message: "Invalid credentials" });
      }
    }
  );
});

//validate token for meeting
app.post("/meeting/validateToken", (req, res) => {
  const { token } = req.body;

  // Verify the token
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      // Token is invalid
      console.error("Invalid token:", err);
      return res.status(401).json({ valid: false });
    } else {
      // Token is valid 
      console.log("Valid token for:", decoded.meeting_username);
      return res
        .status(200)
        .json({ valid: true, meeting_username: decoded.meeting_username }); // Include the username in the response
    }
  });
});

//RESET PASSWORD
// Endpoint to reset meeting password
app.put("/meeting/reset/password", (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Validate if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ error: "New password and confirm password do not match" });
  }

  // Extract the token from cookies
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const meetingUsername = decoded.meeting_username;

    // Fetch Meetings details from the database
    connection.query(
      "SELECT meeting_password FROM Meetings WHERE meeting_username = ?",
      [meetingUsername],
      (error, results) => {
        if (error) {
          console.error("Error querying the database:", error);
          return res.sendStatus(500); // Internal server error
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Meeting not found" });
        }

        const hashedPassword = results[0].meeting_password;

        // Compare old password with stored hashed password
        bcrypt.compare(oldPassword, hashedPassword, (err, isMatch) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return res.sendStatus(500); // Internal server error
          }

          if (!isMatch) {
            return res.status(401).json({ error: "Incorrect old password" });
          }

          // Hash the new password
          bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
            if (err) {
              console.error("Error hashing new password:", err);
              return res.sendStatus(500); // Internal server error
            }

            // Update Meeting's password in the database with hashed new password
            connection.query(
              "UPDATE Meetings SET Meeting_password = ? WHERE meeting_username = ?",
              [hashedNewPassword, meetingUsername],
              (error) => {
                if (error) {
                  console.error("Error updating Meeting password:", error);
                  return res.sendStatus(500); // Internal server error
                }

                // Password updated successfully
                return res
                  .status(200)
                  .json({ message: "Password updated successfully" });
              }
            );
          });
        });
      }
    );
  } catch (error) {
    console.error("Error decoding token:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
});

//fetch details of Meeting for time and etc fetching
app.get("/meeting/details", (req, res) => {

  // Extract the token from cookies
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const meetingUsername = decoded.meeting_username;

    // Query to select meeting details by meeting username
    const query = `SELECT meeting_id, meeting_username, meeting_days, DATE_FORMAT(start_time, '%H:%i') AS formatted_start_time,
    DATE_FORMAT(end_time, '%H:%i') AS formatted_end_time FROM Meetings WHERE meeting_username = ?`;

    // Execute the query
    connection.query(query, [meetingUsername], (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      // Check if meeting exists
      if (results.length === 0) {
        res.status(404).json({ error: "Meeting not found" });
        return;
      }

      // Meeting found, send meeting details
      res.status(200).json(results[0]);
    });
  } catch (error) {
    console.error("Error decoding token:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
});


// Function to format time while adding in meeting and as well for sending booking request for meeting
const formatTime = (time) => {
  // Ensure time is in "HH:mm" format
  const [hours, minutes] = time.split(":");
  return `${hours}:${minutes}`;
};

// Endpoint to send days, start time, end time, and meeting username not usefull now.
// app.post("/meeting/add-schedule", (req, res) => {
//   const { meetingId, selectedDays, startTime, endTime } = req.body;

//   const formattedStartTime = formatTime(startTime);
//   const formattedEndTime = formatTime(endTime);

//   // Check if start_time is less than end_time
//   if (formattedStartTime >= formattedEndTime) {
//     res.status(400).json({ error: "End time must be greater than start time" });
//     return;
//   }

//   // Concatenate selected days into a single string separated by commas
//   const sortedMeetingDays = sortDays(selectedDays).join(",");

//   // Prepare the insert query
//   const query = `UPDATE Meetings SET meeting_days = ?, start_time = ?, end_time = ? WHERE meeting_id = ?`;

//   // Execute the insert query
//   connection.query(
//     query,
//     [sortedMeetingDays, formattedStartTime, formattedEndTime, meetingId],
//     (error) => {
//       if (error) {
//         console.error("Error adding meeting schedule:", error);
//         res.status(500).json({ error: "Internal server error" });
//         return;
//       }

//       // Success response
//       res.status(201).json({ message: "Meeting schedule added successfully" });
//     }
//   );
// });

//for sort the days into a single string separated by commas an in week
const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const sortDays = (days) => {
  return days.sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
};
// Endpoint to update a meeting schedule
//for updating a meeting schedule****
app.put("/meeting/update-schedule", (req, res) => {
  const { meetingId, selectedDays, startTime, endTime } = req.body;

  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const meetingUsername = decoded.meeting_username;

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    // Check if start_time is less than end_time
    if (formattedStartTime >= formattedEndTime) {
      return res.status(400).json({ error: "End time must be greater than start time" });
    }

    // Sort and concatenate selected days into a single string separated by commas
    const sortedMeetingDays = sortDays(selectedDays).join(",");

    // Prepare the update query
    const query = "UPDATE Meetings SET meeting_days = ?, start_time = ?, end_time = ? WHERE meeting_id = ?";

    // Execute the delete query to remove previous requests
    const deleteQuery = "DELETE FROM MeetingSchedule WHERE meeting_id = ?";

    connection.query(deleteQuery, [meetingId], (error) => {
      if (error) {
        console.error("Error deleting previous meeting requests:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Execute the update query
      connection.query(
        query,
        [sortedMeetingDays, formattedStartTime, formattedEndTime, meetingId],
        (error, results) => {
          if (error) {
            console.error("Error updating meeting schedule:", error);
            return res.status(500).json({ error: "Internal server error" });
          }

          // Check if any rows were affected by the update query
          if (results.affectedRows === 0) {
            // If no rows were affected, it means the meeting schedule for the provided meeting ID does not exist
            return res.status(404).json({ error: "Meeting schedule not found" });
          }

          // Success response
          return res.status(200).json({ message: "Meeting schedule updated successfully" });
        }
      );
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// fetch monday,tuesday etc days for meeting for meeting form days and time****
app.get("/meeting/selectedDays", (req, res) => {

  // Extract the token from the request headers
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const meetingUsername = decoded.meeting_username;

    // Execute the query to retrieve selected days based on the meeting username
    connection.query(
      "SELECT meeting_days, start_time, end_time FROM Meetings WHERE meeting_username = ?",
      [meetingUsername],
      (error, results) => {
        if (error) {
          console.error("Error fetching selected days:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Assuming the selectedDays variable contains the selected days data
        // You should modify this response according to your database schema
        res.status(200).json({ selectedDays: results });
      }
    );
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});


app.put("/meeting/decline/:schedule_id", async (req, res) => {
  try {
    const { schedule_id } = req.params;
    const { reason } = req.body;

    // Check if the schedule ID is provided
    if (!schedule_id) {
      return res.status(400).json({ error: "Schedule ID is required" });
    }

    // Prepare the SQL query to decline the meeting schedule and include reason for rejection
    const query = `UPDATE MeetingSchedule SET request_status = 0, reason_for_rejection = ? WHERE schedule_id = ?`;

    // Execute the SQL query
    connection.query(query, [reason, schedule_id], (error, results) => {
      if (error) {
        console.error("Error declining meeting schedule:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Check if any rows were affected by the update
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      // Return success response
      return res.status(200).json({ message: "Meeting schedule declined successfully" });
    });
  } catch (error) {
    console.error("Error declining meeting schedule:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


app.put("/meeting/accept/:schedule_id", async (req, res) => {
  try {
    const { schedule_id } = req.params;

    // Check if the schedule ID is provided
    if (!schedule_id) {
      return res.status(400).json({ error: "Schedule ID is required" });
    }

    // Prepare the SQL query to update the meeting schedule
    const query = `UPDATE MeetingSchedule SET request_status = 1, reason_for_rejection = NULL WHERE schedule_id = ?`;

    // Execute the SQL query
    connection.query(query, [schedule_id], (error, results) => {
      if (error) {
        console.error("Error updating meeting schedule:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Check if any rows were affected by the update
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      // Return success response
      return res
        .status(200)
        .json({ message: "Meeting schedule accepted successfully" });
    });
  } catch (error) {
    console.error("Error accepting meeting schedule:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


//Sending meeting req from meeting side *****
app.post("/meeting/booking/schedule/send", (req, res) => {
  const { meeting_title, meeting_date, meeting_day, start_time, end_time, meeting_option, meeting_link } = req.body;

  try {
    // Extract the token from session
    const token = req.session.token;

    if (!token) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const meeting_username = decoded.meeting_username;

    // Format the start time and end time to exclude seconds
    const formattedStartTime = start_time.split(':').slice(0, 2).join(':');
    const formattedEndTime = end_time.split(':').slice(0, 2).join(':');

    // Get meeting_id using meeting_username
    const getMeetingIdQuery = `
      SELECT meeting_id
      FROM Meetings
      WHERE meeting_username = ?`;

    connection.query(getMeetingIdQuery, [meeting_username], (getMeetingError, meetingResults) => {
      if (getMeetingError) {
        console.error("Error fetching meeting details:", getMeetingError);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (meetingResults.length === 0) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      const meeting_id = meetingResults[0].meeting_id;

      // Check if the provided meeting day, start time, and end time exist in the Meetings table
      const query = `
        SELECT meeting_days, TIME_FORMAT(start_time, '%H:%i') as meetingStartTime, TIME_FORMAT(end_time, '%H:%i') as meetingEndTime
        FROM Meetings
        WHERE meeting_id = ?`;

      connection.query(query, [meeting_id], (error, results) => {
        if (error) {
          console.error("Error fetching meeting details:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Meeting not found" });
        }

        const {
          meeting_days,
          meetingStartTime,
          meetingEndTime,
        } = results[0];

        // Check if the provided meeting day is present in the meeting_days
        if (!meeting_days.includes(meeting_day)) {
          return res.status(400).json({ error: "Meeting day not available" });
        }

        // Check if the provided start time and end time are within the allowed time slot
        if (
          formattedStartTime < meetingStartTime ||
          formattedEndTime > meetingEndTime ||
          formattedStartTime >= formattedEndTime
        ) {
          return res.status(400).json({ error: "Time slot not available" });
        }

        // Check if the requested time slot is available on the selected date
        const timeSlotQuery = `
          SELECT *
          FROM MeetingSchedule
          WHERE meeting_id = ? AND meeting_date = STR_TO_DATE(?, '%M %d, %Y') AND meeting_day = ? AND (request_status = 1 OR request_status is NULL)
            AND (
              (start_time <= ? AND end_time > ?)
              OR (start_time < ? AND end_time >= ?)
              OR (start_time >= ? AND end_time <= ?)
            )`;

        connection.query(
          timeSlotQuery,
          [
            meeting_id,
            meeting_date,
            meeting_day,
            formattedStartTime,
            formattedStartTime,
            formattedEndTime,
            formattedEndTime,
            formattedStartTime,
            formattedEndTime,
          ],
          (timeSlotError, timeSlotResults) => {
            if (timeSlotError) {
              console.error("Error checking time slot:", timeSlotError);
              return res.status(500).json({ error: "Internal server error" });
            }

            if (timeSlotResults.length > 0) {
              return res.status(400).json({ error: "Slot not available on selected date" });
            }

            // If all validations pass, insert the values into the MeetingSchedule table
            const insertQuery = `
              INSERT INTO MeetingSchedule (added_by, user_id, meeting_id, meeting_title, meeting_date, meeting_day, start_time, end_time, meeting_option, request_status)
              VALUES (?, ?, ?, ?, STR_TO_DATE(?, '%M %d, %Y'), ?, ?, ?, ?, NULL)`;

            connection.query(
              insertQuery,
              [
                'MEETING',
                null,
                meeting_id,
                meeting_title,
                meeting_date,
                meeting_day,
                formattedStartTime,
                formattedEndTime,
                meeting_option,
              ],
              (insertError) => {
                if (insertError) {
                  console.error("Error inserting into MeetingSchedule:", insertError);
                  return res.status(500).json({ error: "Internal server error" });
                }

                if (meeting_link) {
                  // Update the meeting_link in the Meetings table only if meeting_link is provided
                  const updateQuery = `
                    UPDATE MeetingSchedule
                    SET meeting_link = ?
                    WHERE meeting_id = ?`;

                  connection.query(
                    updateQuery,
                    [meeting_link, meeting_id],
                    (updateError) => {
                      if (updateError) {
                        console.error("Error updating meeting link:", updateError);
                        return res.status(500).json({ error: "Internal server error" });
                      }

                      return res.status(200).json({ message: "Meeting schedule inserted and meeting link updated successfully" });
                    }
                  );
                } else {
                  return res.status(200).json({ message: "Meeting schedule inserted successfully" });
                }
              }
            );
          }
        );
      });
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// show booking request
// API endpoint to fetch meeting schedule details based on meeting_username 
app.get("/meeting/details/schedule", (req, res) => {
  // Extract the token from cookies
  const token = req.session.token;

  // Check if the token exists
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    // Verify and decode the token to extract the username
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const meetingUsername = decoded.meeting_username;
    
    // First query to get meeting_id using meeting_username
    const query1 = `SELECT meeting_id FROM Meetings WHERE meeting_username = ?`;

    connection.query(query1, [meetingUsername], (error, results) => {
      if (error) {
        console.error("Error fetching meeting ID:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Check if a meeting_id was found
      if (results.length === 0) {
        return res.status(404).json({ error: "No meetings found for the given username" });
      }

      const meetingId = results[0].meeting_id;

      // Second query to get meeting details using meeting_id
      const query2 = `
        SELECT 
          MeetingSchedule.schedule_id,
          Users.user_email,
          MeetingSchedule.meeting_title,
          MeetingSchedule.meeting_option,
          MeetingSchedule.request_status,
          Meetings.room_name,
          MeetingSchedule.meeting_link,
          MeetingSchedule.added_by,
          DATE_FORMAT(MeetingSchedule.Meeting_date, '%M %d, %Y') AS formatted_meeting_date,
          DATE_FORMAT(MeetingSchedule.start_time, '%H:%i') AS formatted_start_time,
          DATE_FORMAT(MeetingSchedule.end_time, '%H:%i') AS formatted_end_time
        FROM 
          MeetingSchedule 
        LEFT JOIN 
          Meetings ON MeetingSchedule.meeting_id = Meetings.meeting_id 
        LEFT JOIN 
          Users ON MeetingSchedule.user_id = Users.user_id
        WHERE 
          MeetingSchedule.meeting_id = ?
      `;

      connection.query(query2, [meetingId], (error, results) => {
        if (error) {
          console.error("Error fetching meeting schedule:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Check if there are any meeting schedules found
        if (results.length === 0) {
          return res.status(404).json({ error: "No meeting schedules found for the meeting" });
        }

        // Return meeting schedule details as a response
        return res.status(200).json(results);
      });
    });
  } catch (error) {
    console.error("Error decoding token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}); 


// API endpoint to fetch the count of meeting schedule requests
app.get("/meeting/schedule/count", (req, res) => {
  // Extract the token from the request headers
  const token = req.session.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  try {
    const secretKey = process.env.SECRET_KEY; // Access secret key from environment variables
    const decoded = jwt.verify(token, secretKey);
    const meetingUsername = decoded.meeting_username;

    // Query to get the meeting ID using the meeting username
    const query1 = "SELECT meeting_id FROM Meetings WHERE meeting_username = ?";

    // Execute the query1 to get the meeting ID
    connection.query(query1, [meetingUsername], (error, results) => {
      if (error) {
        console.error("Error fetching meeting ID:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Check if a meeting ID was found
      if (results.length === 0) {
        return res.status(404).json({ error: "No meetings found for the given username" });
      }

      const meetingId = results[0].meeting_id;

      // Query to count the number of meeting schedule requests for the meeting ID
      const query2 = "SELECT COUNT(*) AS request_count FROM MeetingSchedule WHERE meeting_id = ? AND request_status IS NULL";

      // Execute the query2
      connection.query(query2, [meetingId], (error, results) => {
        if (error) {
          console.error("Error fetching meeting schedule count:", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        // Extract the count from the results
        const requestCount = results[0].request_count;

        // Return the count in the response
        res.status(200).json({ request_count: requestCount });
      });
    });
  } catch (err) {
    console.error("Error decoding token:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World server is Live')
})

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
