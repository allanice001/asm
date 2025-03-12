import { DashboardHeader } from "@/components/dashboard-header";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </main>
    </div>
  );
}
