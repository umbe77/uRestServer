const EventEmitter = require("events")
const privateMembers = new WeakMap()

const defaultConf = {
    req: null,
    res: null,
    headers: null,
    query: null,
    params: null,
    body: ""
}

class ServiceHandler extends EventEmitter {
    constructor(conf) {
        super()
        privateMembers.set(this, Object.assign({}, defaultConf, conf))
    }

    get req() {
        return privateMembers.get(this).req
    }

    get res() {
        return privateMembers.get(this).res
    }

    get headers() {
        return privateMembers.get(this).headers
    }

    get query() {
        return privateMembers.get(this).query
    }

    get params() {
        return privateMembers.get(this).params
    }

    get body() {
        return privateMembers.get(this).body
    }

    done(result) {
        this.emit("done", result)
    }
}

module.exports = ServiceHandler