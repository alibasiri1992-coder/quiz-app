const express = require("express");
const app = express();
const fs = require("fs");

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
    fs.readFile("questions.json", "utf8", (err, data) => {
        if (err) {
            res.status(500).json({ error: "خطا در خواندن سوالات" });
            return;
        }
        res.json(JSON.parse(data));
    });
});

// این مسیر، یک سوال جدید رو به فایل JSON اضافه می‌کنه
app.post("/api/questions", (req, res) => {

    const newQuestion = req.body;

    fs.readFile("questions.json", "utf8", (err, data) => {
        if (err) {
            res.status(500).json({ error: "خطا در خواندن سوالات" });
            return;
        }

        const questions = JSON.parse(data);
        questions.push(newQuestion);

        fs.writeFile("questions.json", JSON.stringify(questions, null, 2), (err) => {
            if (err) {
                res.status(500).json({ error: "خطا در ذخیره‌ی سوال" });
                return;
            }
            res.json({ message: "سوال با موفقیت اضافه شد" });
        });
    });

});

app.listen(3000, () => {
    console.log("سرور روی پورت 3000 در حال اجراست");
});