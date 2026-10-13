import http from "http";
import { app } from "./app";
import { initSocket } from "./lib/socket";
import { startLivePolling } from "./live/livePoller";

const server = http.createServer(app);
initSocket(server);

const port = Number(process.env.PORT) || 4000;
server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  startLivePolling();
});
