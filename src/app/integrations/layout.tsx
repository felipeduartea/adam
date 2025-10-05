import Sidebar from "@/components/sidebar"
import { Suspense } from "react"

export default function IntegrationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Suspense fallback={<div>Loading...</div>}>
        <Sidebar/>
        <main className="flex-1 overflow-hidden">{children}</main>
      </Suspense>
    </div>
  )
}

