"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session && pathname !== "/login") {
      router.push("/login");
    } else {
      setIsLoading(false);
    }
  }, [session, status, router, pathname]);

  if (isLoading && pathname !== "/login") {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-pulse text-muted-foreground">
              Loading...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
