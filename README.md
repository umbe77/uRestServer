# uRestServer Yet Another Api Server

## What and Why
This service was designed for a specific use case. We needed to be able to build a mock server to which we could add and remove endpoints on the fly. Keeping this in mind, 'uRestServer' is not intended for high-performance work but rather for a flexible way to expose endpoints and manipulate HTTP requests and responses.

## Install

```bash
> npm install urestserver
```

## Example

```javascript
import uRestserver from "urestserver"

const app = uRestserver()

app.use((req, res) => {
    console.log(`[${req.httpRequest.method}] ${req.httpRequest.url}`)
    res.next();
})

app.get("/", (_req, res) => {
    res.json({
        message: "Hello!!!"
    })
})

app.addService("GET", "hello", (req, res) => {
    res.json({
        msg: "World"
    })
})

app.listen(8080)
```
