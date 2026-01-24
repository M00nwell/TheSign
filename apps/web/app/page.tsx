import OmenCard from "@/components/omen-card";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[#0a0a0a] text-white">
      {/* Ambient background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />

      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 text-center z-10">
        <OmenCard />
      </main>
    </div>
  )
}
