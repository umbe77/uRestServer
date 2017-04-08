const path = require('path')

const privateMembers = new WeakMap()

class Router {
    constructor() {
        privateMembers.set(this, {
            routesCache: {},
            routes: {},
            addInCache: function(method, path, routePath, h) {
                if (!this.routesCache[method]) {
                    this.routesCache[method] = {}
                }

                if (!this.routesCache[method][path]) {
                    this.routesCache[method][path] = { "routePath": routePath, "h": h }
                }
            },
            getFromCache: function(method, path) {
                if (this.routesCache[method] && this.routesCache[method][path]) {
                    return this.routesCache[method][path].h
                }
            },
            compilePath: function(path) {
                path = path.replace(/^\/+|\/+$/g, '')

                if (path.indexOf(":") > -1) {
                    var pattern = "^"

                    path.split("/").forEach(function(fragment) {
                        pattern += "\\/+"
                        if (fragment.charAt(0) === ":") {
                            //Impostazioni per parametro
                            pattern += "([^\\/]*)"
                        } else {
                            pattern += fragment
                        }
                    })

                    pattern += "?"

                    return new RegExp(pattern)
                }

                return `/${path}`
            }
        })
    }

    resolvePath(method, path) {
        let cached = privateMembers.get(this).getFromCache(method, path)

        if (cached) return cached

        let routes = privateMembers.get(this).routes

        if (routes[method]) {
            let h = null,
                routePath = ''
            routes[method].every(function(r) {
                if (r.route instanceof RegExp) {
                    let m = r.route.exec(path)
                    let mOrig = r.route.exec(r.origPath)

                    if (m !== null) {
                        let params = []
                        for (let i = 1; i < m.length; ++i) {
                            params.push(m[i])
                        }

                        let paramNames = []
                        for (let i = 1; i < mOrig.length; ++i) {
                            paramNames.push(mOrig[i].replace(/^:/, ''))
                        }

                        let objParams = {}
                        paramNames.forEach(function(name, index) {
                            objParams[name] = (index < params.length) ? params[index] : null
                        })

                        h = {
                            handler: r.handler,
                            params: params,
                            paramObj: objParams
                        }
                        routePath = r.origPath
                        return false
                    }

                } else {
                    if (r.route === path) {
                        h = {
                            handler: r.handler
                        }
                        routePath = path
                        return false
                    }
                }
                return true
            })

            privateMembers.get(this).addInCache(method, path, routePath, h)
            return h
        }
    }

    register(method, path, handler, callback) {
        let routes = privateMembers.get(this).routes

        let m = method.toUpperCase()
        if (!routes[m]) {
            routes[m] = []
        }

        if (path.indexOf("/") !== 0) {
            path = `/${path}`
        }

        let justRegistered = false
        routes[m].forEach(function(route) {
            if (route.origPath === path) {
                justRegistered = true
            }
        })

        if (!justRegistered) {
            routes[m].push({
                route: privateMembers.get(this).compilePath(path),
                handler: handler,
                origPath: path
            })

            if (callback) {
                callback()
            }
        }
    }

    deregister(method, path, callback) {
        let routes = privateMembers.get(this).routes
        let routesCache = privateMembers.get(this).routesCache
        let m = method.toUpperCase()
        if (routes[m]) {
            for (let i = routes[m].length - 1; i >= 0; --i) {
                if (routes[m][i].origPath === path) {
                    routes[m].splice(i, 1)
                    break
                }
            }
        }
        if (routesCache[m]) {
            var props = Object.getOwnPropertyNames(routesCache[m])
            for (let i = props.length - 1; i >= 0; --i) {
                let prop = props[i]
                if (routesCache[m][prop].routePath === path) {
                    delete routesCache[m][prop]
                }
            }
        }
        if (callback) {
            callback()
        }
    }
}

const router = new Router()

let methods = ["get", "post", "put", "patch", "delete", "option", "head"]
methods.forEach(function(method) {
    router[method] = function(path, handler) {
        return router.register(method, path, handler)
    }
})

module.exports = router