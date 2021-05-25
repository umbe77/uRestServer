const routesCache = {};
const routes = {};

const addToCache = (method, path, routePath, h) => {
  if (!routesCache[method]) {
    routesCache[method] = {};
  }

  if (!routesCache[method][path]) {
    routesCache[method][path] = {
      routePath,
      h,
    };
  }
};

const getFromCache = (method, path) => {
  if (routesCache[method] && routesCache[method][path]) {
    return routesCache[method][path].h;
  }
};

const compilePath = (path) => {
  path = path.replace(/^\/+|\/+$/g, "");

  if (path.indexOf(":") > -1) {
    var pattern = "^";

    path.split("/").forEach((fragment) => {
      pattern += "\\/+";
      if (fragment.charAt(0) === ":") {
        //Impostazioni per parametro
        pattern += "([^\\/]*)";
      } else {
        pattern += fragment;
      }
    });

    pattern += "?";

    return new RegExp(pattern);
  }

  return `/${path}`;
};

module.exports.resolvePath = (method, path) => {
  let cached = getFromCache(method, path);

  if (cached) return cached;

  if (routes[method]) {
    let h = null,
      routePath = "";
    routes[method].every((r) => {
      if (r.route instanceof RegExp) {
        let m = r.route.exec(path);
        let mOrig = r.route.exec(r.origPath);

        if (m !== null) {
          let params = [];
          for (let i = 1; i < m.length; ++i) {
            params.push(m[i]);
          }

          let paramNames = [];
          for (let i = 1; i < mOrig.length; ++i) {
            paramNames.push(mOrig[i].replace(/^:/, ""));
          }

          let objParams = {};
          paramNames.forEach(function (name, index) {
            objParams[name] = index < params.length ? params[index] : null;
          });

          h = {
            handler: r.handler,
            paramObj: objParams,
          };
          routePath = r.origPath;
          return false;
        }
      } else {
        if (r.route === path) {
          h = {
            handler: r.handler,
          };
          routePath = path;
          return false;
        }
      }
      return true;
    });

    addToCache(method, path, routePath, h);
    return h;
  }
};

module.exports.register = (method, path, handler) => {
  const m = method.toUpperCase();
  if (!routes[m]) {
    routes[m] = [];
  }

  if (path.indexOf("/") === 0) {
    path = `/${path}`;
  }

  let isRegistered = false;
  routes[m].forEach((route) => {
    if (route.origPath === path) {
      isRegistered = true;
    }
  });

  if (!isRegistered) {
    routes[m].push({
      route: compilePath(path),
      handler,
      origPath: path,
    });
  }
};
module.exports.deregister = (method, path) => {
  let m = method.toUpperCase();
  if (routes[m]) {
    for (let i = routes[m].length - 1; i >= 0; --i) {
      if (routes[m][i].origPath === path) {
        routes[m].splice(i, 1);
        break;
      }
    }
  }
  if (routesCache[m]) {
    var props = Object.getOwnPropertyNames(routesCache[m]);
    for (let i = props.length - 1; i >= 0; --i) {
      let prop = props[i];
      if (routesCache[m][prop].routePath === path) {
        delete routesCache[m][prop];
      }
    }
  }
};
