import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { type NextFunction, type Request, type Response } from "express";
import { registerRoutes } from "../server/routes.js";

const app = express();
let appReady: Promise<void> | undefined;

function initApp() {
  if (!appReady) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    appReady = registerRoutes(app).then(() => {
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        if (!res.headersSent) {
          res.status(status).json({ message });
        }
      });
    });
  }

  return appReady;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initApp();

  return new Promise<void>((resolve) => {
    const finish = () => resolve();

    res.once("finish", finish);
    res.once("close", finish);

    app(req as any, res as any, (err: any) => {
      if (err) {
        console.error("Unhandled API error:", err);

        if (!res.headersSent) {
          res.status(500).json({ message: "Internal Server Error" });
        }

        return resolve();
      }

      if (!res.headersSent) {
        res.status(404).json({ message: "Not found" });
      }

      resolve();
    });
  });
}
