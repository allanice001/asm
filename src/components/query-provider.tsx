"use client"

import {ReactNode, useState} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";

interface ProvidersProps {
	children: ReactNode
}

export function QueryProvider({ children }: ProvidersProps) {
	// Create a client
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000, // 1 minute
						refetchOnWindowFocus: false,
					},
				},
			}),
	)

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
