import http from "http";
import { app } from "./app";
import { initSocket } from "./lib/socket";
import { startLivePolling } from "./live/livePoller";
import { startScheduledSync } from "./sync/schedule";

const server = http.createServer(app);
initSocket(server);

const port = Number(process.env.PORT) || 4000;
server.listen(port, () => {
  console.log(`API listening on port ${port}`);
  startLivePolling();
  if (process.env.ENABLE_SYNC === "true") startScheduledSync();
});
