import { io, type Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

// One shared connection for the whole page.
export function getSocket(): Socket {
  if (!socket) socket = io(API_URL);
  return socket;
}
