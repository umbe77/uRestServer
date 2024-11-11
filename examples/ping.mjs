import uRestserver from "../index.js";

const app = uRestserver();

app.use((req, res) => {
    console.log(`[${req.httpRequest.method}] ${req.httpRequest.url}`)
    console.dir(req.body);
    res.next();
});

app.get("/ping", (_req, res) => {
    res.send(
        JSON.stringify({
            message: "Pong",
        })
    );
});

app.get("/jsonres", (_req, res) => {
    res.headers["X-Custom"] = "TEST"
    res.json({
        hello: "MONDO!!!"
    });
});

app.get("/bad", (_req, res) => {
    res.status = 500
    res.headers["text-plain"]
    res.send('')
});

app.post("/customer", (req, res) => {
    const { companyName } = req.body;
    res.send(
        JSON.stringify({
            c: companyName,
        })
    );
});

app.get("/timeout", async (_req, res) => {
    return await new Promise((resolve, _reject) => {
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

app.post("/add", (req, res) => {
    const { method, endPoint } = req.body

    app.addService(method, endPoint, (req, res) => {
        res.send(JSON.stringify(req.body))
    })
    res.send(JSON.stringify({message: "OK"}))
})

app.listen(8180);
