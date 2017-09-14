const fs = require('fs')
const path = require('path')

const http = require('http')
const url = require('url')
const querystring = require('querystring')

const router = require('./router.js')
require('buffer')

const ServiceHandler = require('./servicehandler.js')

const privateMembers = new WeakMap()

class Rest {

    constructor() {
        privateMembers.set(this, { rest: null, controllerPath: path.resolve('./controllers'), created: false, middlewares: [] })
    }

    createRest(options) {
        const conf = {
            port: 18080
        }
        if (options) {
            Object.assign(conf, options)
        }

        const rest = http.createServer((req, res) => {

            let body = ''
            req.on('data', (chunk) => {
                body += chunk
            })

            req.on('end', () => {
                let uri = url.parse(req.url, true)
                let h = router.resolvePath(req.method, uri.pathname)
                let serviceBody = body

                if (req.headers["content-type"]) {
                    let contentType = req.headers["content-type"]

                    switch (contentType.split(';')[0].toLowerCase()) {
                        case "application/json":
                            serviceBody = JSON.parse(body)
                            break
                        case "application/x-www-form-urlencoded":
                            serviceBody = querystring.parse(body)
                            break
                    }
                }

                if (h && h.handler) {
                    let svc = new ServiceHandler({
                        req,
                        res,
                        headers: req.headers,
                        query: uri.query,
                        params: h.paramObj,
                        body: serviceBody
                    })

                    svc.on('done', (content) => {
                        try {
                            let resultString = ''
                            if (content.body) {
                                resultString = content.body
                            }

                            let status = 200
                            if (content.status) {
                                status = content.status
                            }

                            let headers = { 'Content-Length': Buffer.byteLength(resultString) }
                            if (content.headers) {
                                Object.assign(headers, content.headers)
                            }

                            if (!headers["Content-Type"]) {
                                headers["Content-Type"] = "application/json"
                            }

                            res.writeHead(status, headers)

                            res.end(resultString)

                        } catch (e) {
                            console.log(`${e.name}\n${e.message}`)
                            res.end()
                        }
                    })

                    privateMembers.get(this).middlewares.forEach((middleware) => {
                        middleware(svc)
                    })

                    h.handler.apply(h.handler, [svc]
                        .concat((h.params) ? h.params : [])
                        .concat(serviceBody)
                    )
                } else {
                    res.writeHead(404, "Service Not Found")
                    res.end()
                }

            })

        })

        privateMembers.set(this, Object.assign({}, privateMembers.get(this), { rest, created: true, conf }))
        return this
    }

    loadControllers(controllerPath) {

        let initDir = privateMembers.get(this).controllerPath
        if (controllerPath) {
            initDir = controllerPath
        }

        let stack = []

        stack.push(initDir)

        while (stack.length > 0) {
            let dir = stack.pop()

            fs.readdirSync(dir).forEach((file) => {
                file = `${dir}${path.sep}${file}`
                let f = fs.statSync(file)
                if (f.isDirectory()) {
                    stack.push(file)
                } else if (f.isFile()) {
                    require(file)
                }
            })
        }

        return this
    }

    addMiddleware(middleware) {
        let mds = privateMembers.get(this).middlewares
        mds.push(middleware)
        return this
    }

    registerDefaultController() {
        router.get("/ping", (svc) => {
            svc.done({ body: "pong", headers: { 'Content-Type': 'text/plain' } })
        })
        return this
    }

    run() {
        if (!privateMembers.get(this).created) {
            throw new Error("Rest Server has not initialized yet")
        }
        privateMembers.get(this).rest.listen(privateMembers.get(this).conf.port)
        console.log(`Server running on port: ${privateMembers.get(this).conf.port}`)
    }
}

module.exports = new Rest()