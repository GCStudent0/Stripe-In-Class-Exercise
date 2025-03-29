// const express = require("express");
// const bcrypt = require("bcryptjs");
// const User = require("../Models/User");

// const router = express.Router();

// // Show Register Page (render from Users folder)
// router.get("/register", (req, res) => {
//     res.render("Users/register"); // Render from the Users folder
// });

// // Register User
// router.post("/register", async (req, res) => {
//     const { userName, email, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);

//     try {
//         const user = new User({ userName, email, password: hashedPassword });
//         await user.save();
//         res.redirect("/login"); // Redirect to login page after successful registration
//     } catch (err) {
//         res.status(400).send("Error registration of user");
//     }
// });

// // Show Login Page (render from Users folder)
// router.get("/login", (req, res) => {
//     res.render("Users/login"); // Render from the Users folder
// });

// // Login User
// router.post("/login", async (req, res) => {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//         return res.status(400).send("Invalid credentials! Please type correct username and password.");
//     }

//     req.session.userId = user._id;
//     res.redirect("/courses"); // Redirect to courses page after successful login
// });

// module.exports = router; 

const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../Models/User");

const router = express.Router();

// Show Register Page
router.get("/register", (req, res) => {
    res.render("Users/register");
});

// Register User
router.post("/register", async (req, res) => {
    const { userName, email, password } = req.body;

    // Validation: Ensure all fields are filled
    if (!userName || !email || !password) {
        return res.status(400).send("All fields are required.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = new User({ userName, email, password: hashedPassword });
        await user.save();
        res.redirect("/users/login"); // Redirect to login page after successful registration
    } catch (err) {
        console.error(err);  // Log the actual error for debugging
        res.status(400).send("Error registering user: " + err.message);
    }
});

// Show Login Page
router.get("/login", (req, res) => {
    res.render("Users/login");
});

// Login User
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).send("Invalid credentials! Please type correct email and password.");
    }

    req.session.userId = user._id;
    req.session.email = user.email;  // Store "email" in session
    req.user = user
    console.log("Session after login:", req.session);

    res.redirect("/courses"); // Redirect after successful login
});



// GET /logout
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
        }
        res.redirect("/users/login"); // Redirect to login page after logout
    });
});

module.exports = router;
