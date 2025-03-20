import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, History } from "lucide-react"
import { format } from "date-fns"

export default async function PolicyVersionsPage({
	                                                 params,
                                                 }: {
	params: { id: string }
}) {
	const policyId = params.id


	const policy = await prisma.policy.findUnique({
		where: { id: policyId },
	})

	if (!policy) {
		notFound()
	}

	const versions = await prisma.policyVersion.findMany({
		where: { policyId },
		orderBy: { versionNumber: "desc" },
		include: {
			createdBy: true,
		},
	})

	return (
		<div className="container mx-auto">
			<div className="flex items-center gap-2 mb-6">
				<Link href={`/policies/${policyId}`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Policy
					</Button>
				</Link>
			</div>

			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold">{policy.name} - Version History</h1>
					<p className="text-muted-foreground">View and manage policy versions</p>
				</div>
				<Link href={`/policies/${policyId}/versions/new`}>
					<Button>
						<History className="mr-2 h-4 w-4" />
						Create New Version
					</Button>
				</Link>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Policy Versions</CardTitle>
				</CardHeader>
				<CardContent>
					{versions.length === 0 ? (
						<div className="text-center py-6">
							<p className="text-muted-foreground">No versions found for this policy.</p>
							{!policy.isAwsManaged && (
								<Link href={`/policies/${policyId}/versions/new`} className="mt-4 inline-block">
									<Button>Create First Version</Button>
								</Link>
							)}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Version</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created By</TableHead>
									<TableHead>Created At</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{versions.map((version) => (
									<TableRow key={version.id}>
										<TableCell>v{version.versionNumber}</TableCell>
										<TableCell>
											{version.isActive ? (
												<Badge variant="success">Active</Badge>
											) : (
												<Badge variant="outline">Inactive</Badge>
											)}
										</TableCell>
										<TableCell>{version.createdBy.name}</TableCell>
										<TableCell>{format(new Date(version.createdAt), "PPp")}</TableCell>
										<TableCell className="text-right space-x-2">
											<Link href={`/policies/${policyId}/versions/${version.id}`}>
												<Button variant="outline" size="sm">
													View
												</Button>
											</Link>
											{!version.isActive && (
												<Link href={`/policies/${policyId}/versions/${version.id}/activate`}>
													<Button size="sm">Activate</Button>
												</Link>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

