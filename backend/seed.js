const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const db = new sqlite3.Database("quiz.db");

// اسم فایل‌های JSON مربوط به هر دسته‌بندی رو اینجا اضافه کن
// (مثلاً وقتی فایل‌های history.json و tech.json و sports.json رو هم ساختی)
const files = [
    "gen-es.json"
];

let allQuestions = [];

files.forEach(function (filename) {
    const data = fs.readFileSync(filename, "utf8");
    const questions = JSON.parse(data);
    allQuestions = allQuestions.concat(questions);
});

console.log(`در حال وارد کردن ${allQuestions.length} سوال...`);

let successCount = 0;
let errorCount = 0;

db.serialize(function () {
     db.run("DELETE FROM questions");

    allQuestions.forEach(function (q) {

        db.run(
            `INSERT INTO questions (category, question, answer1, answer2, answer3, answer4, correct, difficulty)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [q.category || "general", q.question, q.answers[0], q.answers[1], q.answers[2], q.answers[3], q.correct, q.difficulty || "easy"],
            function (err) {
                if (err) {
                    errorCount++;
                    console.error("خطا در وارد کردن سوال:", q.question, "-", err.message);
                } else {
                    successCount++;
                }
            }
        );

    });

    // این بخش بعد از تموم شدن همه‌ی INSERT ها اجرا می‌شه
    db.run("SELECT 1", [], function () {
        console.log(`نتیجه: ${successCount} سوال با موفقیت وارد شد، ${errorCount} خطا`);
        db.close();
    });

});