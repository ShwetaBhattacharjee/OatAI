"use client";

import Image from "next/image";
import Chat from "./components/Chat";

export default function Home() {
  return (
    <main className="flex flex-col h-screen bg-[#ffffff] text-white">
      <nav className="flex items-center p-4">
        <Image
          src="/logo.png"
          alt="OneOat Logo"
          width={50}
          height={30}
          className="mr-2"
        />
        <h1 className="text-xl font-semibold text-black">
          Talk to <span className="highlighted-text">Oat AI</span>
        </h1>
      </nav>
      <div className="flex-grow overflow-hidden">
        <Chat />
      </div>
    </main>
  );
}
