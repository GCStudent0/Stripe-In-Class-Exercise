const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Course = require("../Models/Course");

//Use this function to protect all POST requests
function IsLoggedIn(req, res, next) {
    if (req.session.email) { // Check if user is logged in
        return next();
    }
    res.redirect("/users/login"); // Redirect to login page if not logged in
}

// Set up storage for course images
const uploadDir = path.join(__dirname, "../public/images/Course-Img");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Show all courses
router.get("/", async (req, res) => {
    let courses = await Course.find().sort({ price: 1 });
    res.render("Courses/index", { title: "Manage Courses Portal", dataset: courses });
});

// Show add course form
router.get("/add", (req, res) => {
    res.render("Courses/add", { title: "Add New Course" });
});

// Add a new course
router.post("/add", IsLoggedIn, upload.single("image"), async (req, res) => {
    let newCourse = new Course({
        title: req.body.courseTitle,
        price: req.body.coursePrice,
        image: `/images/Course-Img/${req.file.filename}`,
        description: req.body.courseDesc
    });

    await newCourse.save();
    res.redirect("/courses");
});

// Delete a course
router.get("/delete/:id", async (req, res) => {
    let course = await Course.findById(req.params.id);
    if (course) {
        // Delete old image file
        fs.unlinkSync(path.join(__dirname, "../public", course.image));
        await Course.findByIdAndDelete(req.params.id);
    }
    res.redirect("/courses");
});


// Show edit course form
router.get("/edit/:id", async (req, res) => {
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).send("Course not found");

    res.render("Courses/edit", { title: "Edit Course Content", course });
});

// Update course details
router.post("/edit/:id", IsLoggedIn, upload.single("image"), async (req, res) => {
    let course = await Course.findById(req.params.id);
    if (!course) return res.status(404).send("Course not found");

    let updatedData = {
        title: req.body.courseTitle,
        price: req.body.coursePrice,
        description: req.body.courseDesc
    };

    if (req.file) {
        // Delete old image before updating
        fs.unlinkSync(path.join(__dirname, "../public", course.image));
        updatedData.image = `/images/Course-Img/${req.file.filename}`;
    }

    await Course.findByIdAndUpdate(req.params.id, updatedData);
    res.redirect("/courses");
});

module.exports = router;







