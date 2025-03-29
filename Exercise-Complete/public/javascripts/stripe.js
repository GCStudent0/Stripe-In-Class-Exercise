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

// event listener for order
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