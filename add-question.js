const form = document.getElementById("add-question-form");
const messageElement = document.getElementById("form-message");

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
        correct: document.getElementById("correct-answer").value
    };

    fetch("http://localhost:3000/api/questions", {
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