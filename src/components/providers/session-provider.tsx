"use client";

import { ReactNode } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
