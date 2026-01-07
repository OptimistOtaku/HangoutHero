import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// #region agent log
fetch('http://127.0.0.1:7242/ingest/dfd5675f-a018-4716-8a82-9adb4960b78e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:5',message:'Server startup - checking NODE_ENV',data:{nodeEnv:process.env.NODE_ENV,allEnvKeys:Object.keys(process.env).filter(k=>k.includes('NODE')||k.includes('ENV')).slice(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
// #endregion

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // #region agent log
  const appEnv = app.get("env");
  fetch('http://127.0.0.1:7242/ingest/dfd5675f-a018-4716-8a82-9adb4960b78e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:53',message:'Environment check before Vite/static decision',data:{appEnv,nodeEnv:process.env.NODE_ENV,willUseVite:appEnv==='development'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  if (appEnv === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  // Use standard listen format for cross-platform compatibility
  // Windows doesn't support reusePort option
  server.listen(port, () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dfd5675f-a018-4716-8a82-9adb4960b78e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/index.ts:68',message:'Server started successfully',data:{port,nodeEnv:process.env.NODE_ENV,appEnv:app.get('env')},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    log(`serving on port ${port}`);
  });
})();
