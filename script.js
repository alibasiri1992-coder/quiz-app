let questions=[];
//گرفتن سوالات از سرور
fetch("http://localhost:3000/api/questions")
.then(function(response){
    return response.json();
})
.then(function(data){
    allQuestions=data;
    //showQuestion();
})
.catch(function(error){
alert("خطا در گرفتن سولات")
});

// ==========================
// متغیرها
// ==========================

let currentQuestion = 0;
let score = 0;

const questionElement = document.getElementById("question");
const answersElement = document.getElementById("answers");
const nextButton = document.getElementById("next-btn");
const restartbutton=document.getElementById("restart-btn");
const progressBar=document.getElementById("progress-bar");
const questionCounter = document.getElementById("question-counter");
const themeToggle = document.getElementById("theme-toggle");
const welcomeScreen = document.getElementById("welcome-screen");
const quizScreen = document.getElementById("quiz-screen");
const startButton = document.getElementById("start-btn");
const timerElement = document.getElementById("timer");
let selectedDifficulty = "easy";
let allQuestions = [];
let timeLeft;
let timerInterval;


const difficultyButtons = document.querySelectorAll(".difficulty-btn");

difficultyButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        selectedDifficulty = btn.dataset.level;
    });
});





themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    // بررسی اینکه الان توی کدوم حالت هستیم
    if (document.body.classList.contains("dark-mode")) {
        themeToggle.textContent = " حالت روشن☀️";
    } else {
        themeToggle.textContent = " حالت تاریک🌙";
    }
});
startButton.addEventListener("click", function () {

    questions = allQuestions.filter(function (q) {
        return q.difficulty === selectedDifficulty;
    });

    currentQuestion = 0;

    welcomeScreen.style.display = "none";
    quizScreen.style.display = "block";
    showQuestion();
});


function showResult(){
    clearInterval(timerInterval);
    timerElement.style.display = "none";

    progressBar.style.width = "100%";
    nextButton.style.display = "none";
    restartbutton.style.display = "inline-block";
    questionCounter.style.display = "none";

    questionElement.innerHTML = "<center> آزمون تمام شد!! </center><br><br>";

    const percent = Math.round((score / questions.length) * 100);
    const circumference = 408;
    const offset = circumference - (percent / 100) * circumference;

    answersElement.innerHTML =
        '<center>' +
        '<svg width="150" height="150" viewBox="0 0 150 150">' +
        '<circle cx="75" cy="75" r="65" stroke="#ddd" stroke-width="12" fill="none" />' +
        '<circle cx="75" cy="75" r="65" stroke="#4caf50" stroke-width="12" fill="none" ' +
        'stroke-dasharray="' + circumference + '" stroke-dashoffset="' + circumference + '" ' +
        'transform="rotate(-90 75 75)" id="score-circle" />' +
        '<text x="75" y="82" text-anchor="middle" font-size="24">' + percent + '%</text>' +
        '</svg>' +
        '<p>امتیاز شما: ' + score + ' از ' + questions.length + '</p>' +
        '</center>';

    // انیمیشن پر شدن دایره بعد از یه لحظه (تا مرورگر اول حالت خالی رو رندر کنه)
    setTimeout(function () {
        document.getElementById("score-circle").style.strokeDashoffset = offset;
    }, 100);
}


// ==========================
// نمایش سوال
// ==========================

function showQuestion() {

    // انیمیشن محو‌شدن (fade-in) - فقط یک‌بار برای کل سوال
    quizScreen.classList.remove("fade-out");
    void quizScreen.offsetWidth;
    quizScreen.classList.add("fade-in");

    const progressPercent = (currentQuestion / questions.length) * 100;
    progressBar.style.width = progressPercent + "%";
    questionCounter.textContent = " سوال " + (currentQuestion + 1) + " از " + questions.length;

    questionElement.textContent = questions[currentQuestion].question;

    answersElement.innerHTML = "";

    const answers = questions[currentQuestion].answers;

    for (let i = 0; i < answers.length; i++) {

        const button = document.createElement("button");
        button.textContent = answers[i];

        if (button.textContent == questions[currentQuestion].correct) {
            button.dataset.correct = "true";
        }

        button.addEventListener("click", function () {
            clearInterval(timerInterval);

            const allButtons = answersElement.children;

            for (let j = 0; j < allButtons.length; j++) {
                allButtons[j].disabled = true;
                allButtons[j].style.backgroundColor = "gray";

                if (allButtons[j].dataset.correct === "true") {
                    allButtons[j].style.backgroundColor = "green";
                }
            }

            if (button.dataset.correct === "true") {
                score++;
            } else {
                button.style.backgroundColor = "red";
            }
        });

        answersElement.appendChild(button);
    }

    startTimer();
}


// ==========================
// تایمر
// ==========================

function startTimer() {

    timeLeft = 15;
    timerElement.textContent = "⏱ " + timeLeft + " ثانیه";

    clearInterval(timerInterval);

    timerInterval = setInterval(function () {

        timeLeft--;
        timerElement.textContent = "⏱ " + timeLeft + " ثانیه";

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeUp();
        }

    }, 1000);
}

function timeUp() {

    const allButtons = answersElement.children;

    for (let j = 0; j < allButtons.length; j++) {
        allButtons[j].disabled = true;
        allButtons[j].style.backgroundColor = "gray";

        if (allButtons[j].dataset.correct === "true") {
            allButtons[j].style.backgroundColor = "green";
        }
    }

    timerElement.textContent = "⏰ وقت تمام شد!";

    setTimeout(function () {

        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            goToNextQuestion();
        } else {
            showResult();
        }

    }, 1500);
}


// ==========================
// انتقال بین سوالات (انیمیشن)
// ==========================

function goToNextQuestion() {

    quizScreen.classList.remove("fade-in");
    quizScreen.classList.add("fade-out");

    setTimeout(function () {
        showQuestion();
    }, 300);
}


// ==========================
// دکمه سوال بعدی
// ==========================

nextButton.addEventListener("click", function () {

    clearInterval(timerInterval);

    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        goToNextQuestion();
    } else {
        showResult();
    }
});


restartbutton.addEventListener("click", function () {
    currentQuestion = 0;
    score = 0;
    timerElement.style.display = "block";
    nextButton.style.display = "inline-block";
    restartbutton.style.display = "none";
    questionCounter.style.display = "block";
    showQuestion();
});