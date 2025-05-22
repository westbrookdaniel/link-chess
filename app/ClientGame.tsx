"use client";

import dynamic from "next/dynamic";

// no ssr because it makes the sync slightly easier
const Game = dynamic(() => import("@/app/Game"), { ssr: false });

export function ClientGame({ id }: { id: number }) {
  return <Game id={id} />;
}
