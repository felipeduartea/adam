"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { IntegrationCard } from "./integration-card"
import { siLinear, siGithub, siZendesk } from "simple-icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type IntegrationKey = "linear" | "github" | "zendesk"

type Integration = {
  key: IntegrationKey
  name: string
  description: string
  icon: {
    path: string
    hex: string
  }
}

type LinearStatusResponse = {
  connected: boolean
  organizationId: string | null
  linearOrgId: string | null
  linearOrgName: string | null
  installerUserId: string | null
  updatedAt: string | null
}

type ZendeskStatusResponse = {
  connected: boolean
  integration: {
    id: string
    zendeskSubdomain: string
    status: string
    webhook: {
      endpointPath: string
      webhookUrl: string
      isActive: boolean
      createdAt: string
    } | null
  } | null
}

type IntegrationStateMap = {
  linear: {
    connected: boolean
    loading: boolean
    enabling: boolean
    details: LinearStatusResponse | null
  }
  github: {
    connected: boolean
  }
  zendesk: {
    connected: boolean
    loading: boolean
    enabling: boolean
    details: ZendeskStatusResponse | null
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

export function IntegrationsSection() {
  const [integrationState, setIntegrationState] = useState<IntegrationStateMap>({
    linear: { connected: false, loading: true, enabling: false, details: null },
    github: { connected: true },
    zendesk: { connected: false, loading: true, enabling: false, details: null },
  })
  const [zendeskModalOpen, setZendeskModalOpen] = useState(false)
  const [zendeskSubdomainInput, setZendeskSubdomainInput] = useState("")
  const [zendeskFormError, setZendeskFormError] = useState<string | null>(null)

  const fetchLinearStatus = useCallback(async () => {
    setIntegrationState((prev) => ({
      ...prev,
      linear: { ...prev.linear, loading: true },
    }))

    try {
      const response = await fetch("/api/linear/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Linear status request failed with ${response.status}`)
      }

      const data = (await response.json()) as LinearStatusResponse

      setIntegrationState((prev) => ({
        ...prev,
        linear: {
          ...prev.linear,
          loading: false,
          connected: data.connected,
          details: data,
        },
      }))
    } catch (error) {
      console.error("Failed to fetch Linear status", error)
      setIntegrationState((prev) => ({
        ...prev,
        linear: { ...prev.linear, loading: false },
      }))
    }
  }, [])

  const fetchZendeskStatus = useCallback(async () => {
    setIntegrationState((prev) => ({
      ...prev,
      zendesk: { ...prev.zendesk, loading: true },
    }))

    try {
      const response = await fetch("/api/zendesk/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Zendesk status request failed with ${response.status}`)
      }

      const data = (await response.json()) as ZendeskStatusResponse

      setIntegrationState((prev) => ({
        ...prev,
        zendesk: {
          ...prev.zendesk,
          loading: false,
          connected: data.connected,
          details: data,
        },
      }))
    } catch (error) {
      console.error("Failed to fetch Zendesk status", error)
      setIntegrationState((prev) => ({
        ...prev,
        zendesk: { ...prev.zendesk, loading: false },
      }))
    }
  }, [])

  useEffect(() => {
    void fetchLinearStatus()
    void fetchZendeskStatus()
  }, [fetchLinearStatus, fetchZendeskStatus])

  const zendeskDefaultSubdomain = integrationState.zendesk.details?.integration?.zendeskSubdomain

  const handleEnableLinear = useCallback(async () => {
    setIntegrationState((prev) => ({
      ...prev,
      linear: { ...prev.linear, enabling: true },
    }))

    try {
      const response = await fetch("/api/linear/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        authorizationUrl?: string
        state?: string
        error?: string
      }

      if (!response.ok || !payload.authorizationUrl) {
        throw new Error(payload.error ?? "Failed to start Linear authorization")
      }

      window.location.href = payload.authorizationUrl
    } catch (error) {
      console.error("Failed to start Linear authorization", error)
      window.alert(error instanceof Error ? error.message : "Unable to start Linear authorization")
      setIntegrationState((prev) => ({
        ...prev,
        linear: { ...prev.linear, enabling: false },
      }))
    }
  }, [])

  const handleEnableZendesk = useCallback(() => {
    setZendeskSubdomainInput(zendeskDefaultSubdomain ?? "")
    setZendeskFormError(null)
    setZendeskModalOpen(true)
  }, [zendeskDefaultSubdomain])

  const handleZendeskModalChange = useCallback(
    (open: boolean) => {
      if (integrationState.zendesk.enabling) {
        return
      }
      setZendeskModalOpen(open)
      if (!open) {
        setZendeskFormError(null)
      }
    },
    [integrationState.zendesk.enabling],
  )

  const handleSubmitZendesk = useCallback(async () => {
    const zendeskSubdomain = zendeskSubdomainInput.trim()
    if (!zendeskSubdomain) {
      setZendeskFormError("Zendesk subdomain is required")
      return
    }

    setZendeskFormError(null)
    setIntegrationState((prev) => ({
      ...prev,
      zendesk: { ...prev.zendesk, enabling: true },
    }))

    try {
      const response = await fetch("/api/zendesk/webhook/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ zendeskSubdomain, name: null }),
      })

      const payload = (await response.json().catch(() => ({}))) as {
        webhookUrl?: string
        endpointPath?: string
        error?: string
      }

      if (!response.ok || !payload.webhookUrl) {
        throw new Error(payload.error ?? "Failed to configure Zendesk webhook")
      }

      const message = `Zendesk webhook URL generated:\n${payload.webhookUrl}\n\nPaste this into your Zendesk webhook configuration.`

      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(payload.webhookUrl)
          window.alert(`${message}\n\nThe URL has also been copied to your clipboard.`)
        } else {
          window.alert(message)
        }
      } catch {
        window.alert(message)
      }

      await fetchZendeskStatus()
      setZendeskModalOpen(false)
      setZendeskSubdomainInput("")
    } catch (error) {
      console.error("Failed to configure Zendesk webhook", error)
      setZendeskFormError(error instanceof Error ? error.message : "Unable to configure Zendesk webhook")
    } finally {
      setIntegrationState((prev) => ({
        ...prev,
        zendesk: { ...prev.zendesk, enabling: false },
      }))
    }
  }, [fetchZendeskStatus, zendeskSubdomainInput])

  const linearHelperText = useMemo(() => {
    const updatedAt = integrationState.linear.details?.updatedAt
    if (!updatedAt) {
      return null
    }
    const date = new Date(updatedAt)
    if (Number.isNaN(date.getTime())) {
      return null
    }
    return `Last updated ${date.toLocaleString()}`
  }, [integrationState.linear.details?.updatedAt])

  const zendeskHelperText = useMemo(() => {
    const webhookUrl = integrationState.zendesk.details?.integration?.webhook?.webhookUrl
    if (!webhookUrl) {
      return null
    }
    return `Webhook: ${webhookUrl}`
  }, [integrationState.zendesk.details?.integration?.webhook?.webhookUrl])

  return (
    <section className="relative h-full w-full overflow-auto bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-white to-gray-50" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-full max-w-7xl flex-col justify-center px-6 py-12 sm:py-16 lg:px-8">
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
          {integrations.map((integration) => {
            if (integration.key === "linear") {
              const details = integrationState.linear.details
              const connectedLabel = details?.linearOrgName
                ? `Connected to ${details.linearOrgName}`
                : undefined

              return (
                <IntegrationCard
                  key={integration.key}
                  integration={integration}
                  connected={integrationState.linear.connected}
                  loading={integrationState.linear.loading || integrationState.linear.enabling}
                  connectedLabel={connectedLabel}
                  helperText={linearHelperText}
                  onEnable={handleEnableLinear}
                />
              )
            }

            if (integration.key === "zendesk") {
              const details = integrationState.zendesk.details?.integration
              const connectedLabel = details?.zendeskSubdomain
                ? `Configured for ${details.zendeskSubdomain}.zendesk.com`
                : undefined

              return (
                <IntegrationCard
                  key={integration.key}
                  integration={integration}
                  connected={integrationState.zendesk.connected}
                  loading={integrationState.zendesk.loading || integrationState.zendesk.enabling}
                  connectedLabel={connectedLabel}
                  helperText={zendeskHelperText}
                  onEnable={handleEnableZendesk}
                />
              )
            }

            return (
              <IntegrationCard
                key={integration.key}
                integration={integration}
                connected={integrationState.github.connected}
                loading={false}
                helperText={null}
              />
            )
          })}
        </div>
      </div>

      <Dialog open={zendeskModalOpen} onOpenChange={handleZendeskModalChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Zendesk</DialogTitle>
            <DialogDescription>
              Enter your Zendesk subdomain so we can generate the webhook endpoint for your workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="zendesk-subdomain">
                Zendesk subdomain
              </label>
              <Input
                id="zendesk-subdomain"
                placeholder="acme"
                autoFocus
                value={zendeskSubdomainInput}
                disabled={integrationState.zendesk.enabling}
                onChange={(event) => setZendeskSubdomainInput(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">We will generate a webhook for https://&lt;subdomain&gt;.zendesk.com.</p>
              {zendeskFormError ? <p className="text-xs text-destructive">{zendeskFormError}</p> : null}
            </div>
          </div>

          <DialogFooter className="flex w-full flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleZendeskModalChange(false)}
              disabled={integrationState.zendesk.enabling}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmitZendesk} disabled={integrationState.zendesk.enabling}>
              {integrationState.zendesk.enabling ? "Generating..." : "Generate webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
