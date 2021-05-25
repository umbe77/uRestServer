const http = require("http");
const { URL } = require("url");
const querystring = require("querystring");
const { register, deregister, resolvePath } = require("./router");

const middlewares = [];

const urest = () => {
  const httpServer = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      let uri = new URL(req.url, `http://${req.headers.host}`);
      let h = resolvePath(req.method, uri.pathname);
      let serviceBody = body;

      if (req.headers["content-type"]) {
        let contentType = req.headers["content-type"];

        switch (contentType.split(";")[0].toLowerCase()) {
          case "application/json":
            serviceBody = JSON.parse(body);
            break;
          case "application/x-www-form-urlencoded":
            serviceBody = querystring.parse(body);
            break;
        }
      }

      let status = 200;
      let headers = {};
      let responseBody = "";

      if (h && h.handler) {
        const request = {
          headers: req.headers,
          query: uri.query,
          params: h.paramObj,
          body: serviceBody,
          rawBody: body,
          httpRequest: req,
        };
        for (const midware of middlewares) {
          let _continue = false;
          await midware(request, {
            status,
            headers,
            next: () => {
              _continue = true;
            },
          });
          if (!_continue) {
            break;
          }
        }

        await h.handler(request, {
          status,
          headers,
          send: (message) => {
            responseBody = message;
          },
        });

        if (!headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }

        res.writeHead(status, {
          "Content-Length": Buffer.byteLength(responseBody),
          ...headers,
        });
        res.end(responseBody);
      } else {
        res.writeHead(404, "Service not found");
        res.end();
      }
    });
  });

  const application = {
    listen: (port, hostname) => {
      if (!port) {
        port = 18080;
      }
      httpServer.listen(port, hostname);
    },
    use: (middleware) => {
      middlewares.push(middleware);
    },
    addService: register,
    removeService: deregister,
  };

  ["get", "post", "put", "patch", "delete", "option", "head"].forEach(
    (method) => {
      application[method] = (path, handler) => {
        return register(method, path, handler);
      };
    }
  );

  return application;
};

module.exports = urest;
