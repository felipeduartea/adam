"use client"

import { IntegrationCard } from "./integration-card"
import { siLinear, siGithub, siZendesk } from "simple-icons"

type IntegrationKey = "linear" | "github" | "zendesk"

type IntegrationState = {
  key: IntegrationKey
  connected: boolean
}

type Integration = {
  key: IntegrationKey
  name: string
  description: string
  icon: {
    path: string
    hex: string
  }
}

const integrations: Integration[] = [
  {
    key: "linear",
    name: "Linear",
    description:
      "Streamline issue tracking and project management with automated sync between your development workflow and Linear.",
    icon: {
      path: siLinear.path,
      hex: siLinear.hex,
    },
  },
  {
    key: "github",
    name: "GitHub",
    description:
      "Connect your repositories to enable automated deployments, pull request previews, and seamless CI/CD workflows.",
    icon: {
      path: siGithub.path,
      hex: siGithub.hex,
    },
  },
  {
    key: "zendesk",
    name: "Zendesk",
    description:
      "Integrate customer support tickets with your development process to track and resolve issues more efficiently.",
    icon: {
      path: siZendesk.path,
      hex: siZendesk.hex,
    },
  },
]

const integrationStates: IntegrationState[] = [
  { key: "linear", connected: false },
  { key: "github", connected: true },
  { key: "zendesk", connected: false },
]

export function IntegrationsSection() {
  const getConnectionState = (key: IntegrationKey) => {
    return integrationStates.find((state) => state.key === key)?.connected ?? false
  }

  return (
    <section className="relative h-screen w-full overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-white to-gray-50" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 py-12 sm:py-16 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Integrate now.
          </h1>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Enable powerful integrations to unlock automated workflows and streamline your development process.
          </p>
        </div>

        {/* Integration cards grid */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-3 gap-6 sm:mt-20">
          {integrations.map((integration, index) => (
            <IntegrationCard
              key={integration.key}
              integration={integration}
              connected={getConnectionState(integration.key)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
