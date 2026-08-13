const express = require("express");
const app = express();
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = new sqlite3.Database("quiz.db");

db.run(`
    CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        question TEXT NOT NULL,
        answer1 TEXT NOT NULL,
        answer2 TEXT NOT NULL,
        answer3 TEXT NOT NULL,
        answer4 TEXT NOT NULL,
        correct TEXT NOT NULL,
        difficulty TEXT NOT NULL
    )
`, seedIfEmpty);

// جدول کاربران — فعلاً فقط برای ادمین استفاده می‌شه
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    )
`, seedAdminIfEmpty);

// اگه جدول users خالی بود، یه کاربر ادمین باهاش می‌سازیم.
// پسورد رو هرگز plain text ذخیره نمی‌کنیم — همیشه هش‌شده (bcrypt).
// روی Render، ADMIN_PASSWORD رو از Environment Variables ست کن؛
// اگه ست نشده باشه، یه پسورد پیش‌فرض برای تست محلی استفاده می‌شه.
function seedAdminIfEmpty() {
    db.get("SELECT COUNT(*) AS count FROM users", [], function (err, row) {
        if (err) {
            console.error("خطا در بررسی کاربران:", err.message);
            return;
        }

        if (row.count > 0) {
            console.log("کاربر ادمین از قبل وجود داره — seed انجام نشد.");
            return;
        }

        const adminUsername = "admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";

        bcrypt.hash(adminPassword, 10, function (err, hash) {
            if (err) {
                console.error("خطا در هش کردن پسورد:", err.message);
                return;
            }

            db.run(
                "INSERT INTO users (username, password_hash) VALUES (?, ?)",
                [adminUsername, hash],
                function (err) {
                    if (err) {
                        console.error("خطا در ساخت کاربر ادمین:", err.message);
                        return;
                    }
                    console.log(`کاربر ادمین ساخته شد (username: ${adminUsername})`);
                }
            );
        });
    });
}

// روی Render (بدون Persistent Disk) هر بار سرویس ری‌استارت بشه، quiz.db خالی می‌شه.
// این تابع فقط وقتی جدول خالیه، سوالات رو از gen-es.json می‌خونه و پرش می‌کنه.
// این‌طوری دیگه لازم نیست quiz.db رو دستی push کنی؛ فقط کافیه gen-es.json توی گیت باشه.
function seedIfEmpty() {
    db.get("SELECT COUNT(*) AS count FROM questions", [], function (err, row) {
        if (err) {
            console.error("خطا در بررسی تعداد سوالات:", err.message);
            return;
        }

        if (row.count > 0) {
            console.log(`دیتابیس از قبل پر بود (${row.count} سوال) — seed انجام نشد.`);
            return;
        }

        console.log("دیتابیس خالیه، در حال seed کردن از gen-es.json ...");

        let allQuestions;
        try {
            const data = fs.readFileSync("gen-es.json", "utf8");
            allQuestions = JSON.parse(data);
        } catch (e) {
            console.error("خطا در خواندن gen-es.json:", e.message);
            return;
        }

        const stmt = db.prepare(
            `INSERT INTO questions (category, question, answer1, answer2, answer3, answer4, correct, difficulty)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );

        allQuestions.forEach(function (q) {
            stmt.run(
                q.category || "general",
                q.question,
                q.answers[0], q.answers[1], q.answers[2], q.answers[3],
                q.correct,
                q.difficulty || "easy"
            );
        });

        stmt.finalize(function () {
            console.log(`seed کامل شد: ${allQuestions.length} سوال اضافه شد.`);
        });
    });
}

const ALLOWED_CATEGORIES = ["general", "computer", "history", "sport"];
const ALLOWED_DIFFICULTIES = ["easy", "medium", "hard"];

// بررسی می‌کنه که سوالی که از فرانت‌اند اومده، کامل و درست باشه.
// اگه مشکلی باشه، متن خطا رو برمی‌گردونه؛ اگه همه‌چیز اوکی بود، null برمی‌گردونه.
function validateQuestion(q) {
    if (!q || typeof q !== "object") {
        return "داده‌ی سوال ارسال نشده";
    }

    if (typeof q.question !== "string" || q.question.trim() === "") {
        return "متن سوال نمی‌تونه خالی باشه";
    }

    if (!Array.isArray(q.answers) || q.answers.length !== 4) {
        return "باید دقیقاً ۴ گزینه ارسال بشه";
    }

    const hasEmptyAnswer = q.answers.some(function (a) {
        return typeof a !== "string" || a.trim() === "";
    });
    if (hasEmptyAnswer) {
        return "هیچ‌کدوم از گزینه‌ها نمی‌تونن خالی باشن";
    }

    if (typeof q.correct !== "string" || !q.answers.includes(q.correct)) {
        return "جواب درست باید دقیقاً متن یکی از ۴ گزینه باشه";
    }

    if (!ALLOWED_CATEGORIES.includes(q.category)) {
        return "دسته‌بندی نامعتبره";
    }

    if (!ALLOWED_DIFFICULTIES.includes(q.difficulty)) {
        return "سطح سختی نامعتبره";
    }

    return null;
}

// اجازه‌ی دسترسی فرانت‌اند به این سرور (CORS)
// دقت کن: چون فرانت‌اند (GitHub Pages) و بک‌اند (Render) دو تا دامنه‌ی جدا هستن،
// دیگه نمی‌تونیم از "*" استفاده کنیم — باید دقیقاً آدرس فرانت‌اند رو بدیم،
// وگرنه کوکی session بین این دو origin منتقل نمی‌شه.
// چون هم پروداکشن (GitHub Pages) و هم تست لوکال رو پشتیبانی می‌کنیم، یه لیست می‌سازیم.
const ALLOWED_ORIGINS = [
    "https://alibasiri1992-coder.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    next();
});

// رمز امضای توکن‌ها — از همون SESSION_SECRET که رو Render گذاشتی استفاده می‌کنیم
const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-change-this";

// اجازه‌ی خواندن بدنه‌ی JSON درخواست‌ها (لازم برای POST)
app.use(express.json());

// مسیر لاگین: username و password می‌گیره، چک می‌کنه، و اگه درست بود یه توکن JWT می‌سازه
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ error: "نام کاربری و رمز عبور الزامیه" });
        return;
    }

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) {
            res.status(500).json({ error: "خطا در بررسی کاربر" });
            return;
        }

        if (!user) {
            res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباهه" });
            return;
        }

        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) {
                res.status(500).json({ error: "خطا در بررسی رمز عبور" });
                return;
            }

            if (!isMatch) {
                res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباهه" });
                return;
            }

            // لاگین موفق: یه توکن می‌سازیم که هویت کاربر توشه و امضا شده،
            // و مستقیم تو بدنه‌ی جواب (نه کوکی) برمی‌گردونیمش.
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                JWT_SECRET,
                { expiresIn: "1d" }
            );

            res.json({ message: "ورود موفق", token: token });
        });
    });
});

// middleware: قبل از اجرای route، هدر Authorization رو چک می‌کنه.
// انتظار داره چیزی شبیه: "Authorization: Bearer <token>"
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "برای این عملیات باید لاگین کنی" });
        return;
    }

    const token = authHeader.slice("Bearer ".length);

    jwt.verify(token, JWT_SECRET, function (err, decoded) {
        if (err) {
            // یا امضاش جعلیه، یا منقضی شده
            res.status(401).json({ error: "ورودت منقضی شده، دوباره لاگین کن" });
            return;
        }
        req.user = decoded; // اگه بعداً لازم شد بدونیم کی درخواست داده
        next(); // توکن معتبره، پس اجازه بده ادامه بده
    });
}

// این مسیر، سوالات رو از فایل JSON می‌خونه و برمی‌گردونه
app.get("/api/questions", (req, res) => {
    db.all("SELECT * FROM questions", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: "خطا در خواندن سوالات" });
            return;
        }

        // تبدیل ساختار دیتابیس به همون فرمتی که فرانت‌اند قبلاً استفاده می‌کرد
        const questions = rows.map(function (row) {
            return {
                category: row.category,
                question: row.question,
                answers: [row.answer1, row.answer2, row.answer3, row.answer4],
                correct: row.correct,
                difficulty: row.difficulty
            };
        });

        res.json(questions);
    });
});

// این مسیر، یک سوال جدید رو به فایل JSON اضافه می‌کنه
app.post("/api/questions", requireAuth, (req, res) => {

    const q = req.body;

    const errorMessage = validateQuestion(q);
    if (errorMessage) {
        res.status(400).json({ error: errorMessage });
        return;
    }

    db.run(
        `INSERT INTO questions (category, question, answer1, answer2, answer3, answer4, correct, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.category || "general", q.question, q.answers[0], q.answers[1], q.answers[2], q.answers[3], q.correct, q.difficulty || "easy"],
        function (err) {
            if (err) {
                res.status(500).json({ error: "خطا در ذخیره‌ی سوال" });
                return;
            }
            res.json({ message: "سوال با موفقیت اضافه شد" });
        }
    );

});

app.listen(process.env.PORT || 3000, () => {
    console.log("سرور در حال اجراست");
});
