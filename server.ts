import { createServer } from "http";
import { parse } from "url";
import next from "next";
import os from "os";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // Listen on all interfaces (LAN accessible)
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || "", true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  server.listen(port, hostname, () => {
    const localIP = getLocalIP();
    console.log(`> Server ready on http://localhost:${port}`);
    console.log(`> LAN access:    http://${localIP}:${port}`);
    console.log(`> Environment:   ${dev ? "development" : "production"}`);
  });
});

export { port, getLocalIP };
