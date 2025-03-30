Step by Step Instructions of Exercise:

1.  In the terminal run npm install to ensure you have all required dependencies.

2.  Create a Stripe account to get a secret key and publish key. Do not need to verify your business only need test keys.

3.  Create a .env file in root of directory and add the test keys, a database connection string, and our base url:

    CONNECTION*STRING_MONGODB = mongodb+srv://yourdbstring
    STRIPE_PUBLISHABLE_KEY = pk_test*yourpublishkey
    STRIPE*SECRET_KEY = sk_test*yoursecretkey
    BASE_URL=http://localhost:3000

4.  At the top of app.js add the routes we will be using for payment:

    var paymentsRouter = require('./routes/paymentRoutes');
    var ordersRouter = require('./routes/orderRoutes');

5.  Around line 55 of app.js add the route handlers as well:
    app.use('/payments', paymentsRouter);
    app.use('/orders', ordersRouter);

6.  Next we will add a price to our Course model in Models/Course so we can let Stripe know what to charge based on the Course.
    price: { type: Number, required: true },

7.  Going to public/javascripts/stripe lets add the script we will use to grab the selected course for a single transaction:

        document.querySelectorAll(".buyCourseBtn").forEach(button => {
        button.addEventListener("click", async function () {
        const courseId = this.getAttribute("data-course-id");

                  if (!courseId) {
                      alert("Invalid Course ID. Please refresh the page.");
                      return;
                  }

                  try {
                      const response = await fetch("/payments/checkout", {
                          method: "POST",
                          headers: {
                              "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ courseId }),
                      });

                      const data = await response.json();

                      if (data.url) {
                          window.location.href = data.url;
                      } else {
                          alert("Payment failed. Please try again.");
                      }
                  } catch (error) {
                      alert("An error occurred. Please try again.");
                  }
              });

        });

8. Still in public/javascripts/stripe lets add the second script we will use to initiate orders in stripe checkout:

        document.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch('/orders/checkout', {
        method: "POST",
        body: new URLSearchParams(formData)
        });

        const result = await response.json();
        if(result.url){
        window.location = result.url;
        }
        });

9.  Next lets add the routes we will use for single purchases under routes/paymentRoutes

        const express = require("express");

        const router = express.Router();
        require("dotenv").config();
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        const Course = require("../Models/Course");

        // Handle Stripe checkout
        router.post("/checkout", async (req, res) => {
        const { courseId } = req.body; // Get the courseId from the request body
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
        }   catch (error) {
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

10.  Next lets add the routes we will use for order purchases under routes/orderRoutes

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

11. Lastly lets add a success page under Payments/success.hbs so the customer knows payment was successful
        
        <div class="container vh-100 d-flex align-items-center justify-content-center">
        <div class="card text-center shadow p-4">
            <div class="card-body">
                <i class="fas fa-check-circle text-success display-3"></i>
                <h2 class="mt-3 text-success">Payment Successful!</h2>
                <p class="text-muted">Thanks for your purchase. You will receive a confirmation email shortly.</p>
                <a href="/" class="btn btn-success">Go to Explore Courses</a>
            </div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/js/all.min.js"></script>
