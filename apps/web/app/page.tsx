'use client'

import { useRef, useState, useEffect } from 'react'
import OmenCard, { OmenCardHandle } from "@/components/omen-card";
import CardPackage from "@/components/card-package";
import Header from "@/components/header";
import { useUser } from '@/providers/user-provider'

export default function Home() {
  const [isPackageOpen, setIsPackageOpen] = useState(false)
  const omenCardRef = useRef<OmenCardHandle>(null)
  const { user } = useUser()

  // Reset to card-packaging stage when user logs out
  useEffect(() => {
    if (!user) {
      setIsPackageOpen(false)
    }
  }, [user])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* Ambient background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(124,58,237,0.2)_0%,rgba(124,58,237,0)_70%)] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[radial-gradient(circle,rgba(79,70,229,0.2)_0%,rgba(79,70,229,0)_70%)] pointer-events-none" />

      <Header
        isPackageOpen={isPackageOpen}
        onShare={() => omenCardRef.current?.share()}
      />

      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 text-center z-10">
        <CardPackage onOpen={() => setIsPackageOpen(true)}>
          <OmenCard ref={omenCardRef} />
        </CardPackage>
      </main>
    </div>
  )
}
