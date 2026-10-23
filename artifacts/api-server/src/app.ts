import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { getDynamicSitemapXml } from "./lib/sitemap";

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

const sitemapHandler = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const xml = await getDynamicSitemapXml();
    res
      .setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600")
      .type("application/xml")
      .send(xml);
  } catch (error) {
    req.log.error({ err: error }, "Failed to generate the Firestore sitemap");
    res.status(503).type("text/plain").send("Sitemap is temporarily unavailable.");
  }
};

// Render serves the site at root. The /api alias also makes this endpoint testable
// through the Replit API artifact's path-based development proxy.
app.get("/sitemap.xml", sitemapHandler);
app.get("/api/sitemap.xml", sitemapHandler);

// ✅ SERVE YOUR WEBSITE FILES
const websitePath = path.join(__dirname, "../../client-portal/dist");
console.log("Serving website from:", websitePath);
app.use(express.static(websitePath));

// ✅ API ROUTES
app.use("/api", router);

// Return the SPA shell for direct links such as /about and /members.
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(websitePath, "index.html"));
});

export default app;
