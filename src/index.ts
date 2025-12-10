import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import api from "./routes/api";
import auth from "./routes/auth";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.send(
    `<h1>VibeRate API</h1><p>Service is running. Try <code>/api/health</code> or see endpoints in README.</p>`,
  );
});

app.use("/api/auth", auth);
app.use("/api", api);

app.use(errorHandler);

if (require.main === module) {
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`VibeRate API ready on http://localhost:${env.port}`);
  });
}

export default app;
