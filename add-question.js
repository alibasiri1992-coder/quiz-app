const form = document.getElementById("add-question-form");
const messageElement = document.getElementById("form-message");

// همون منطق تشخیص لوکال/Render که تو script.js هست، اینجا هم می‌ذاریم
// تا وقتی رو لوکال تست می‌کنی، فرم به سرور لوکالت وصل بشه نه به Render
const isLocal = location.hostname === "localhost"
    || location.hostname === "127.0.0.1"
    || location.protocol === "file:";

const API_URL = isLocal
    ? "http://localhost:3000/api/questions"
    : "https://quiz-app-sim9.onrender.com/api/questions";

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const newQuestion = {
        question: document.getElementById("new-question").value,
        answers: [
            document.getElementById("answer1").value,
            document.getElementById("answer2").value,
            document.getElementById("answer3").value,
            document.getElementById("answer4").value
        ],
        correct: document.getElementById("correct-answer").value,
        category: document.getElementById("new-category").value,
        difficulty: document.getElementById("new-difficulty").value
    };

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuestion)
    })
        .then(response => response.json())
        .then(data => {
            messageElement.textContent = data.message;
            form.reset();
        })
        .catch(error => {
            messageElement.textContent = "خطا در ارسال سوال";
        });
});