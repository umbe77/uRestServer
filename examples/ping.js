import { uRestserver } from "../index.js";

const app = uRestserver();

app.use((req, res) => {
    console.log(req.body);
    res.next();
});

app.get("/ping", (_, res) => {
    res.send(
        JSON.stringify({
            message: "Pong",
        })
    );
});

app.post("/customer", (req, res) => {
    const { companyName } = req.body;
    res.send(
        JSON.stringify({
            c: companyName,
        })
    );
});

app.get("/timeout", async (_, res) => {
    return await new Promise((resolve, reject) => {
        setTimeout(() => {
            res.send(
                JSON.stringify({
                    message: "After timeout",
                })
            );
            resolve();
        }, 2000);
    });
});

app.listen(8180);
