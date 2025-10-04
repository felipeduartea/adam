"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

type Integration = {
  key: string
  name: string
  description: string
  icon: {
    path: string
    hex: string
  }
}

type IntegrationCardProps = {
  integration: Integration
  connected: boolean
  index: number
}

export function IntegrationCard({ integration, connected, index }: IntegrationCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="group relative flex h-full flex-col overflow-hidden border-border bg-white p-6 shadow-sm transition-all duration-300 hover:border-muted-foreground/30 hover:shadow-lg">
        {/* Icon badge with subtle brand-colored glow */}
        <div className="mb-6 flex items-center justify-center">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full opacity-20 blur-lg transition-opacity duration-300 group-hover:opacity-30"
              style={{
                backgroundColor: `#${integration.icon.hex}`,
              }}
            />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-white transition-all duration-300 group-hover:scale-105"
              style={{
                background: `radial-gradient(circle at center, rgba(${Number.parseInt(integration.icon.hex.slice(0, 2), 16)}, ${Number.parseInt(integration.icon.hex.slice(2, 4), 16)}, ${Number.parseInt(integration.icon.hex.slice(4, 6), 16)}, 0.08) 0%, white 60%)`,
              }}
            >
              <svg role="img" viewBox="0 0 24 24" className="h-8 w-8" xmlns="http://www.w3.org/2000/svg">
                <path d={integration.icon.path} fill={`#${integration.icon.hex}`} />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col">
          <h3 className="mb-3 text-xl font-semibold text-card-foreground">{integration.name}</h3>
          <p className="mb-6 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
            {integration.description}
          </p>

          <Button
            disabled={connected}
            className="w-full transition-all duration-200"
            variant={connected ? "secondary" : "default"}
          >
            {connected ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Integration enabled
              </span>
            ) : (
              "Enable integration"
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
