"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";

export function AuthButton() {
  const { data: session, isPending } = useSession();
  if (isPending) return null;
  if (!session) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-foreground/70 hidden sm:inline">
        {session.user.email}
      </span>
      <LogoutButton />
    </div>
  );
}
