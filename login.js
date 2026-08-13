// همون منطق تشخیص لوکال/Render که تو بقیه‌ی فایل‌های JS پروژه هست
const isLocal = location.hostname === "localhost"
    || location.hostname === "127.0.0.1"
    || location.protocol === "file:";

const API_BASE = isLocal
    ? "http://localhost:3000"
    : "https://quiz-app-sim9.onrender.com";

// --- تم تاریک/روشن ---
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    themeToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});

// --- فرم لاگین ---
const form = document.getElementById("login-form");
const messageElement = document.getElementById("form-message");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

function showMessage(text, type) {
    messageElement.textContent = text;
    messageElement.className = "form-message fade-in " + (type === "error" ? "is-error" : "is-success");
}

form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!usernameInput.value.trim() || !passwordInput.value.trim()) {
        showMessage("نام کاربری و رمز عبور رو وارد کن", "error");
        return;
    }

    fetch(API_BASE + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: usernameInput.value.trim(),
            password: passwordInput.value
        })
    })
        .then(function (response) {
            return response.json().then(function (data) {
                return { ok: response.ok, data: data };
            });
        })
        .then(function (result) {
            if (!result.ok) {
                showMessage(result.data.error || "ورود ناموفق بود", "error");
                return;
            }
            // توکن رو تو localStorage ذخیره می‌کنیم تا دفعه بعد هم لاگین بمونیم
            localStorage.setItem("adminToken", result.data.token);
            showMessage("ورود موفق ✅ در حال انتقال...", "success");
            setTimeout(function () {
                window.location.href = "add-question.html";
            }, 600);
        })
        .catch(function () {
            showMessage("خطا در ارتباط با سرور، دوباره امتحان کن", "error");
        });
});
