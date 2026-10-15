import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { allowedOrigins } from "./origins";

export interface MatchUpdate {
  id: number;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
}

let io: Server | null = null;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, { cors: { origin: allowedOrigins() } });

  io.on("connection", (socket) => {
    // Clients join "live" (all matches) or "match:<id>" (one match).
    socket.on("subscribe", (room: unknown) => {
      if (room === "live" || (typeof room === "string" && /^match:\d+$/.test(room))) {
        void socket.join(room);
      }
    });
    socket.on("unsubscribe", (room: unknown) => {
      if (typeof room === "string") void socket.leave(room);
    });
  });

  return io;
}

export function broadcastMatchUpdate(update: MatchUpdate) {
  if (!io) return;
  io.to("live").to(`match:${update.id}`).emit("match:update", update);
}
