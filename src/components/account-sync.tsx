"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import {toast} from "sonner";

interface AccountSyncProps {
	onSyncComplete?: () => void
	lastSynced?: Date | null
}

export function AccountSync({ onSyncComplete, lastSynced }: AccountSyncProps) {
	const [isSyncing, setIsSyncing] = useState(false)

	const handleSync = async () => {
		setIsSyncing(true)

		try {
			const response = await fetch("/api/accounts/sync", {
				method: "POST",
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.message || "Failed to sync accounts")
			}

			const data = await response.json()

			toast.success("Accounts synced successfully",{
				description: `Created: ${data.stats.created}, Updated: ${data.stats.updated}, Unchanged: ${data.stats.unchanged}`,
			})

			if (onSyncComplete) {
				onSyncComplete()
			}
		} catch (error) {
			toast.error("Error syncing accounts",{
				description: error.message || "An error occurred while syncing accounts",
			})
		} finally {
			setIsSyncing(false)
		}
	}

	// Format the last synced time
	const formatLastSynced = () => {
		if (!lastSynced) return "Never"

		return new Date(lastSynced).toLocaleString()
	}

	return (
		<div className="flex items-center gap-2">
			<Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
				{isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
				Sync with AWS
			</Button>
			{lastSynced && <span className="text-xs text-muted-foreground">Last synced: {formatLastSynced()}</span>}
		</div>
	)
}

