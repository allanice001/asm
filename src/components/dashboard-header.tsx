"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Shield, LogOut, Menu, X, User, Home, Key, History, Users, FileText } from "lucide-react"
import { UserRole } from "@prisma/client"
import {ModeToggle} from "@/components/mode-toggle";

// Navigation items array
const navigationItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Roles", href: "/roles", icon: Shield },
  { name: "Permission Sets", href: "/permission-sets", icon: Key },
  { name: "Policies", href: "/policies", icon: FileText },
  { name: "Account Policies", href: "/account-policies", icon: FileText },
  { name: "Deployments", href: "/deployments", icon: History },
  { name: "Users", href: "/users", icon: Users, adminOnly: true },
]

export function DashboardHeader() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter((item) => !item.adminOnly || session?.user.role === UserRole.ADMIN)

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">AWS SSO Manager</span>
        </div>

        {session ? (
          <>
            <nav className="hidden md:flex items-center gap-6">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href || "#"} // Add a fallback value
                  className="text-sm font-medium hover:text-primary flex items-center gap-1"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <ModeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>{session.user.name || session.user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push("/login")}>
              Sign In
            </Button>
          </div>
        )}

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">Toggle menu</span>
        </Button>

        {isMenuOpen && session && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b p-4 md:hidden">
            <nav className="flex flex-col space-y-4">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href || "#"} // Add a fallback value
                  className="text-sm font-medium hover:text-primary flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <Button variant="ghost" className="justify-start px-2" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

