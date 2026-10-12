"use client";

import { useEffect, useState } from "react";
import { getSocket } from "./socket";
import type { Match, MatchUpdate } from "./types";

// Keeps a match in state and patches its status and score when the API pushes an update.
export function useLiveMatch<T extends Match>(initial: T, room: string = "live"): T {
  const [match, setMatch] = useState<T>(initial);

  useEffect(() => {
    const socket = getSocket();
    const join = () => {
      socket.emit("subscribe", room);
    };
    const onUpdate = (u: MatchUpdate) => {
      if (u.id !== initial.id) return;
      setMatch((prev) => ({
        ...prev,
        status: u.status,
        homeScore: u.homeScore,
        awayScore: u.awayScore,
        minute: u.minute,
      }));
    };

    if (socket.connected) join();
    socket.on("connect", join); // also re-joins after a reconnect
    socket.on("match:update", onUpdate);

    return () => {
      socket.off("connect", join);
      socket.off("match:update", onUpdate);
    };
  }, [initial.id, room]);

  return match;
}
