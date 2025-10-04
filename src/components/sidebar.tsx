"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Workflow, Plug } from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Workflows",
      href: "/adam",
      icon: Workflow,
    },
    {
      name: "Integrations",
      href: "/integrations",
      icon: Plug,
    },
  ]

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">ADAM</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-secondary border border-4-primary text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
