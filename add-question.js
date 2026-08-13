// همون منطق تشخیص لوکال/Render که تو script.js هست، اینجا هم می‌ذاریم
// تا وقتی رو لوکال تست می‌کنی، فرم به سرور لوکالت وصل بشه نه به Render
const isLocal = location.hostname === "localhost"
    || location.hostname === "127.0.0.1"
    || location.protocol === "file:";

const API_BASE = isLocal
    ? "http://localhost:3000"
    : "https://quiz-app-sim9.onrender.com";

const API_URL = API_BASE + "/api/questions";

// --- چک می‌کنیم توکن لاگین تو localStorage هست یا نه؛ اگه نه، برمی‌گردونیمش به صفحه‌ی لاگین ---
const logoutBtn = document.getElementById("logout-btn");
const pageContainer = document.getElementById("add-question-page");
const adminToken = localStorage.getItem("adminToken");

if (!adminToken) {
    window.location.href = "login.html";
} else {
    // توکن هست: صفحه رو نشون بده. اگه توکن جعلی یا منقضی باشه،
    // سرور موقع ارسال سوال با 401 ردش می‌کنه و بهمون خبر می‌ده.
    pageContainer.style.display = "";
    logoutBtn.style.display = "inline-block";
}

logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("adminToken");
    window.location.href = "login.html";
});

// --- تم تاریک/روشن (همون رفتار index.html) ---
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    themeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});

// --- عناصر فرم ---
const form = document.getElementById("add-question-form");
const messageElement = document.getElementById("form-message");
const questionInput = document.getElementById("new-question");
const answerCards = Array.from(document.querySelectorAll(".answer-input-card"));
const categoryPills = Array.from(document.querySelectorAll("#category-pills .pill-btn"));
const difficultyPills = Array.from(document.querySelectorAll("#difficulty-pills .pill-btn"));

let correctIndex = null;
let selectedCategory = null;
let selectedDifficulty = null;

// --- انتخاب گزینه‌ی درست: با زدن تیک کنار هر گزینه ---
answerCards.forEach(function (card) {
    const checkBtn = card.querySelector(".answer-check");
    checkBtn.addEventListener("click", function () {
        correctIndex = Number(card.dataset.index);
        answerCards.forEach(function (c) {
            c.classList.toggle("is-correct", Number(c.dataset.index) === correctIndex);
        });
    });
});

// --- انتخاب دسته‌بندی (فقط یکی فعال) ---
categoryPills.forEach(function (pill) {
    pill.addEventListener("click", function () {
        selectedCategory = pill.dataset.category;
        categoryPills.forEach(function (p) { p.classList.toggle("active", p === pill); });
    });
});

// --- انتخاب سطح سختی (فقط یکی فعال) ---
difficultyPills.forEach(function (pill) {
    pill.addEventListener("click", function () {
        selectedDifficulty = pill.dataset.level;
        difficultyPills.forEach(function (p) { p.classList.toggle("active", p === pill); });
    });
});

function showMessage(text, type) {
    messageElement.textContent = text;
    messageElement.className = "form-message fade-in " + (type === "error" ? "is-error" : "is-success");
}

function resetForm() {
    form.reset();
    correctIndex = null;
    selectedCategory = null;
    selectedDifficulty = null;
    answerCards.forEach(function (c) { c.classList.remove("is-correct"); });
    categoryPills.forEach(function (p) { p.classList.remove("active"); });
    difficultyPills.forEach(function (p) { p.classList.remove("active"); });
}

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const answerValues = answerCards.map(function (card) {
        return card.querySelector(".answer-input").value.trim();
    });

    // اعتبارسنجی سمت فرانت، قبل از اینکه چیزی به سرور بفرستیم
    if (!questionInput.value.trim()) {
        showMessage("متن سوال رو وارد کن", "error");
        return;
    }
    if (answerValues.some(function (a) { return !a; })) {
        showMessage("هر ۴ گزینه باید پر باشن", "error");
        return;
    }
    if (correctIndex === null) {
        showMessage("یکی از گزینه‌ها رو به‌عنوان جواب درست تیک بزن", "error");
        return;
    }
    if (!selectedCategory) {
        showMessage("یه دسته‌بندی انتخاب کن", "error");
        return;
    }
    if (!selectedDifficulty) {
        showMessage("یه سطح سختی انتخاب کن", "error");
        return;
    }

    const newQuestion = {
        question: questionInput.value.trim(),
        answers: answerValues,
        correct: answerValues[correctIndex],
        category: selectedCategory,
        difficulty: selectedDifficulty
    };

    fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("adminToken")
        },
        body: JSON.stringify(newQuestion)
    })
        .then(function (response) {
            if (response.status === 401) {
                // توکن منقضی یا نامعتبره؛ برگردون به لاگین
                localStorage.removeItem("adminToken");
                window.location.href = "login.html";
                return Promise.reject("unauthorized");
            }
            return response.json().then(function (data) {
                return { ok: response.ok, data: data };
            });
        })
        .then(function (result) {
            if (!result.ok) {
                showMessage(result.data.error || "سرور این سوال رو قبول نکرد", "error");
                return;
            }
            showMessage(result.data.message || "سوال با موفقیت اضافه شد ✅", "success");
            resetForm();
        })
        .catch(function (err) {
            if (err === "unauthorized") return;
            showMessage("خطا در ارسال سوال، دوباره امتحان کن", "error");
        });
});
