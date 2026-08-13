let questions=[];

// تعداد سوالاتی که در هر آزمون به کاربر نشون داده می‌شه
const QUESTIONS_PER_QUIZ = 10;

//تشخیص خودکار: اگه رو لوکال هستیم (localhost یا فایل مستقیم) به سرور لوکال وصل شو، وگرنه به Render
const isLocal = location.hostname === "localhost"
    || location.hostname === "127.0.0.1"
    || location.protocol === "file:";

const API_URL = isLocal
    ? "http://localhost:3000/api/questions"
    : "https://quiz-app-sim9.onrender.com/api/questions";

// ==========================
// متغیرها
// ==========================

let currentQuestion = 0;
let score = 0;
let questionsLoaded = false; // تا وقتی fetch تموم نشده، false می‌مونه

const questionElement = document.getElementById("question");
const answersElement = document.getElementById("answers");
const nextButton = document.getElementById("next-btn");
const restartbutton=document.getElementById("restart-btn");
const skipButton = document.getElementById("skip-btn");
const progressBar=document.getElementById("progress-bar");
const questionCounter = document.getElementById("question-counter");
const themeToggle = document.getElementById("theme-toggle");
const welcomeScreen = document.getElementById("welcome-screen");
const quizScreen = document.getElementById("quiz-screen");
const startButton = document.getElementById("start-btn");
const timerElement = document.getElementById("timer-container");
const timerRing = document.getElementById("timer-ring");
const timerText = document.getElementById("timer-text");
let selectedDifficulty = "easy";
let selectedCategory = "general";
let allQuestions = [];
let timeLeft;
let timerInterval;

// تا وقتی سوالات از سرور نرسیدن، دکمه‌ی شروع غیرفعاله
// (این خط جلوی مشکلی رو می‌گیره که رو نت کند - مثلاً موبایل - کاربر زودتر از رسیدن جواب سرور کلیک می‌کنه)
const originalStartText = startButton.textContent;
startButton.disabled = true;
startButton.textContent = "در حال بارگذاری سوالات...";

//گرفتن سوالات از سرور
fetch(API_URL)
.then(function(response){
    return response.json();
})
.then(function(data){
    allQuestions=data;
    questionsLoaded = true;
    startButton.disabled = false;
    startButton.textContent = originalStartText;
})
.catch(function(error){
    startButton.textContent = "خطا در بارگذاری - صفحه رو تازه کن";
    alert("خطا در گرفتن سولات");
});


// به‌هم‌ریختن تصادفی یک آرایه (الگوریتم Fisher-Yates) و برگرداندن یک آرایه‌ی جدید
function shuffleArray(array) {
    const result = array.slice(); // کپی می‌گیریم تا آرایه‌ی اصلی دست‌نخورده بمونه
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

const difficultyButtons = document.querySelectorAll(".difficulty-btn");

difficultyButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        selectedDifficulty = btn.dataset.level;

        difficultyButtons.forEach(function (b) {
            b.classList.remove("active");
        });
        btn.classList.add("active");
    });
});

const categoryButtons = document.querySelectorAll(".category-btn");

categoryButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        selectedCategory = btn.dataset.category;

        categoryButtons.forEach(function (b) {
            b.classList.remove("active");
        });
        btn.classList.add("active");
    });
});





themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    // بررسی اینکه الان توی کدوم حالت هستیم
    if (document.body.classList.contains("dark-mode")) {
        themeToggle.textContent = "☀️";
    } else {
        themeToggle.textContent = "🌙";
    }
});
startButton.addEventListener("click", function () {

    // ایمنی اضافه: حتی اگه به هر دلیلی دکمه فعال بود ولی دیتا نرسیده، اجازه‌ی ادامه نده
    if (!questionsLoaded) {
        return;
    }

    const filtered = allQuestions.filter(function (q) {
        return q.difficulty === selectedDifficulty && q.category === selectedCategory;
    });

    questions = shuffleArray(filtered).slice(0, QUESTIONS_PER_QUIZ);

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
    skipButton.style.display = "none";
    restartbutton.style.display = "inline-block";
    questionCounter.style.display = "none";

    questionElement.innerHTML = "<center> آزمون تمام شد!! </center><br><br>";

    const percent = Math.round((score / questions.length) * 100);
    const circumference = 408;
    const offset = circumference - (percent / 100) * circumference;

    // خواندن بهترین امتیاز قبلی برای همین ترکیب دسته‌بندی + دشواری
    const highScoreKey = "highscore_" + selectedCategory + "_" + selectedDifficulty;
    const previousBest = parseInt(localStorage.getItem(highScoreKey)) || 0;

    let isNewRecord = false;
    if (score > previousBest) {
        localStorage.setItem(highScoreKey, score);
        isNewRecord = true;
    }

    const bestScore = isNewRecord ? score : previousBest;
    const recordBadge = isNewRecord ? '<p style="color:#4caf50;">🏆 رکورد جدید!</p>' : '';

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
        '<p>بهترین امتیاز شما در این بخش: ' + bestScore + ' از ' + questions.length + '</p>' +
        recordBadge +
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
        button.classList.add("answer-btn");

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

// مدت زمان هر سوال (ثانیه) و محیط دایره‌ی تایمر (2 × π × شعاع=38)
const TIMER_DURATION = 15;
const TIMER_CIRCUMFERENCE = 238.76;

function startTimer() {

    timeLeft = TIMER_DURATION;
    timerText.classList.remove("timer-message");
    timerText.textContent = timeLeft;
    timerRing.style.strokeDashoffset = 0;
    timerElement.classList.remove("timer-warning");

    clearInterval(timerInterval);

    timerInterval = setInterval(function () {

        timeLeft--;
        timerText.textContent = timeLeft;

        const offset = TIMER_CIRCUMFERENCE * (1 - timeLeft / TIMER_DURATION);
        timerRing.style.strokeDashoffset = offset;

        if (timeLeft <= 5) {
            timerElement.classList.add("timer-warning");
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeUp();
        }

    }, 1000);
}

function revealAndAdvance(message) {

    const allButtons = answersElement.children;

    for (let j = 0; j < allButtons.length; j++) {
        allButtons[j].disabled = true;
        allButtons[j].style.backgroundColor = "gray";

        if (allButtons[j].dataset.correct === "true") {
            allButtons[j].style.backgroundColor = "green";
        }
    }

    timerElement.classList.remove("timer-warning");
    timerText.classList.add("timer-message");
    timerText.textContent = message;

    setTimeout(function () {

        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            goToNextQuestion();
        } else {
            showResult();
        }

    }, 1500);
}

function timeUp() {
    clearInterval(timerInterval);
    revealAndAdvance("⏰ وقت تمام شد!");
}

skipButton.addEventListener("click", function () {
    clearInterval(timerInterval);
    revealAndAdvance("⏭ این سوال رد شد");
});


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
    skipButton.style.display = "inline-block";
    restartbutton.style.display = "none";
    questionCounter.style.display = "block";

    quizScreen.style.display = "none";
    welcomeScreen.style.display = "block";
});
