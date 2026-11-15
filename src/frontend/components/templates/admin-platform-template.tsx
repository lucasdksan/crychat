"use client";

import { Suspense } from "react";

import { AdminPlatformShell } from "@/frontend/components/organisms/admin-dashboard/admin-platform-shell";

function AdminShellFallback() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden w-64 border-r border-border bg-sidebar lg:block" />
      <div className="flex-1 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-28 animate-pulse rounded-md border border-border bg-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminPlatformTemplate() {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <AdminPlatformShell />
    </Suspense>
  );
}