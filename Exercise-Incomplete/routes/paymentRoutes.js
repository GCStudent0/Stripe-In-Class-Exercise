const express = require("express");
const router = express.Router();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); 
const Course = require("../Models/Course"); 

// Handle Stripe checkout
router.post("/checkout", async (req, res) => {
    const { courseId } = req.body;  // Get the courseId from the request body
    try {
        // Fetch the course details from the database
        const course = await Course.findById(courseId);  

        // If the course is not found, return an error
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }

        // Create a Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],  
            line_items: [{
                price_data: {
                    currency: "usd",  // USD as current currency
                    product_data: {
                        name: course.title,  // Use course title as the product name
                    },
                    unit_amount: Math.round((course.price) * 100),  // Converting the price to cents
                },
                quantity: 1,  // Single course purchase
            }],
            mode: "payment",  // Payment mode
            shipping_address_collection: {
                allowed_countries: ['US', 'CA', 'AZ', 'GR'] 
            },
            success_url: `${process.env.BASE_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,  // Success redirect URL
            cancel_url: `${process.env.BASE_URL}/payments/cancel`,  // Cancel redirect URL
        });

        // Return the checkout session URL
        res.json({ url: session.url });
    } catch (error) {
        console.error("Error creating Stripe session:", error.message);  // Log the error message
        res.status(500).send("Internal Server Error");  // Return 500 if an error occurs
    }
});

// Payment success route
router.get('/success', (req, res) => {
    res.render("Payments/success", {title: "Payment Successfull"});
});

// Payment cancel route
router.get("/cancel", (req, res) => {
    res.send("Payment canceled. Try again.");
});

module.exports = router;


