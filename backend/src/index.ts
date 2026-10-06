import { env } from "./config/env.js";
import { initSchema } from "./config/db.js";
import { createApp } from "./app.js";
import { seedIfEmpty } from "./seed/run.js";

initSchema();
await seedIfEmpty();
const app = createApp();
app.listen(env.port, () => {
  console.log(`CyberCode Lab API listening on http://localhost:${env.port}`);
});
