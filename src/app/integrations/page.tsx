import { IntegrationsSection } from "./integrations-section"
import { MastraChat } from "@/components/mastra-chat"

export default function Page() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <IntegrationsSection />
      </div>
      <div className="border-t border-border bg-background p-6">
        <div className="mx-auto w-full max-w-3xl">
          <MastraChat />
        </div>
      </div>
    </div>
  )
}
