const express = require('express');
const router = express.Router();
const Course = require('../Models/Course'); // Importing Course model

router.get('/', async (req, res, next) => {
    try {
        // Retrieve all courses from the database
        const allCourses = await Course.find({});
        res.render('index', { title: 'E-Book Learning', allCourses }); 
    } catch (err) {
        console.error("Error retrieving courses:", err);
        res.status(500).send('Error fetching courses');
    }
});

module.exports = router;

