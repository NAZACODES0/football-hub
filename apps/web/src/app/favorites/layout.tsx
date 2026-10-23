import type { Metadata } from "next";
import { SyncNotice } from "@/components/SyncNotice";

export const metadata: Metadata = {
  title: "Favorites",
  robots: { index: false, follow: false },
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SyncNotice />
      {children}
    </>
  );
}
