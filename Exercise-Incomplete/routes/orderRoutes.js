const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Course = require("../Models/Course");

//Use this function to protect all POST requests
function IsLoggedIn(req, res, next) {
    if (req.session.email) { // Check if user is logged in
        return next();
    }
    res.redirect("/users/login"); // Redirect to login page if not logged in
}

// GET /orders - Display the bulk order page with all courses listed in order of price
router.get('/', async (req, res, next) => {
    try {
        const courses = await Course.find().sort({ price: 1 }); //sort courses by price
        res.render("Orders/index", { title: "Orders Portal", courses });
    } catch (err) {
        next(err);
    }
});

// POST /orders/checkout - Process the bulk order and create a Stripe checkout session
router.post('/checkout', IsLoggedIn, async (req, res) => {
    try {
        const quantities = req.body.quantities; // Expects an object mapping course IDs to quantities
        const selected_courses = [];
        
        // Loop through each course in the quantities object
        for (const courseId in quantities) {
            const qty = parseInt(quantities[courseId], 10);
           // console.log(`Course ${courseId} quantity:`, qty); // debug to check course quantity
            if (qty > 0) {
                // Fetch each course by its ID
                const course = await Course.findById(courseId);
                if (course) {
                    selected_courses.push({
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: course.title,
                            },
                            unit_amount: Math.round(course.price * 100), 
                        },
                        quantity: qty,
                    });
                }
            }
        }
        
        // Display this if no courses are selected
        if (selected_courses.length === 0) {
            return res.status(400).send("No courses selected for purchase.");
        }
  
        // Create a Stripe checkout session with the selected courses
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: selected_courses,
            mode: "payment",
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'AZ', 'GR']
            },
            success_url: `${process.env.BASE_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/payments/cancel`,
        });
  
        // Redirect the user to Stripe's checkout page with created session
        res.redirect(session.url);
    } catch (error) {
        console.error("Error creating Stripe session:", error.message);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;