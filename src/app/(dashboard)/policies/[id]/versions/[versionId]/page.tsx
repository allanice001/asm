import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, Check } from "lucide-react"
import { format } from "date-fns"
import { ActivateVersionButton } from "@/components/activate-version-button"

export default async function PolicyVersionPage({
	                                                params,
                                                }: {
	params: { id: string; versionId: string }
}) {
	const policyId = params.id
	const versionId = params.versionId

	const version = await prisma.policyVersion.findUnique({
		where: { id: versionId },
		include: {
			policy: true,
			createdBy: true,
		},
	})

	if (!version || version.policyId !== policyId) {
		notFound()
	}

	return (
		<div className="container mx-auto">
			<div className="flex items-center gap-2 mb-6">
				<Link href={`/policies/${policyId}/versions`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Versions
					</Button>
				</Link>
			</div>

			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold">
						{version.policy.name} - Version {version.versionNumber}
					</h1>
					<p className="text-muted-foreground">
						Created by {version.createdBy.name} on {format(new Date(version.createdAt), "PPp")}
					</p>
				</div>
				{!version.isActive && <ActivateVersionButton policyId={policyId} versionId={versionId} />}
			</div>

			<div className="flex items-center gap-2 mb-6">
				<Badge variant={version.isActive ? "success" : "outline"}>
					{version.isActive ? (
						<>
							<Check className="mr-1 h-3 w-3" />
							Active Version
						</>
					) : (
						"Inactive Version"
					)}
				</Badge>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Policy Document</CardTitle>
				</CardHeader>
				<CardContent>
          <pre className="p-4 bg-muted rounded-md overflow-auto max-h-[600px] text-sm">
            {JSON.stringify(version.policyDocument, null, 2)}
          </pre>
				</CardContent>
			</Card>
		</div>
	)
}

