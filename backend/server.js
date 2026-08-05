const express = require("express");
const app = express();
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
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

// اجازه‌ی دسترسی فرانت‌اند به این سرور (CORS)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    next();
});

// اجازه‌ی خواندن بدنه‌ی JSON درخواست‌ها (لازم برای POST)
app.use(express.json());

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
app.post("/api/questions", (req, res) => {

    const q = req.body;

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
