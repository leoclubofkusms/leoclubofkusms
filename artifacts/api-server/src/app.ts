import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SERVE YOUR WEBSITE FILES
const websitePath = path.join(__dirname, "../client-portal/dist");
console.log("Serving website from:", websitePath); // Debug log
app.use(express.static(websitePath));

// ✅ API ROUTES
app.use("/api", router);

// ✅ IF NO API ROUTE, SERVE WEBSITE
app.get("*", (_req, res) => {
  res.sendFile(path.join(websitePath, "index.html"));
});

export default app;