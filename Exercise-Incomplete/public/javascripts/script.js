// Javascript for showing less or more contents if user wants to read more/less
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".readMoreBtn").forEach(button => {
        button.addEventListener("click", function () {
            let cardBody = this.closest(".card-body");
            let shortText = cardBody.querySelector(".short-content");
            let fullText = cardBody.querySelector(".full-text");

            if (fullText.classList.contains("collapse")) {
                fullText.classList.remove("collapse");
                shortText.style.display = "none";
                this.textContent = "Read Less";
            } else {
                fullText.classList.add("collapse");
                shortText.style.display = "block";
                this.textContent = "Read More";
            }
        });
    });
});


