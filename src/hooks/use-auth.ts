"use client";

import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

interface UseAuthReturn {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string | undefined;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isAdmin = session?.user?.role === "admin";
  const userId = session?.user?.id;

  return {
    session,
    isLoading,
    isAuthenticated,
    isAdmin,
    userId,
  };
}
