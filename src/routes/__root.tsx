import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">This page isn't in the record.</p>
        <Link to="/" className="mt-6 inline-block bg-primary px-4 py-2 text-sm text-primary-foreground">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Trump Record" },
      { name: "description", content: "A source-cited record of both Trump terms." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const nav = [
  { to: "/timeline", label: "Timeline" },
  { to: "/record", label: "Wins & Setbacks" },
  { to: "/fact-checks", label: "Fact-checks" },
  { to: "/compare", label: "Term 1 vs 2" },
  { to: "/saved", label: "Saved" },
] as const;

function Header() {
  const { user } = useAuth();
  return (
    <header className="border-b-4 border-double border-foreground">
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-3">
        <div className="flex items-end justify-between gap-4">
          <Link to="/" className="font-display text-3xl font-black tracking-tight sm:text-4xl">
            The Trump Record
          </Link>
          {user ? (
            <button onClick={() => supabase.auth.signOut()} className="font-mono text-xs uppercase underline">
              Sign out
            </button>
          ) : (
            <Link to="/auth" className="font-mono text-xs uppercase underline">
              Sign in
            </Link>
          )}
        </div>
        <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs uppercase tracking-wider">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "!text-foreground underline underline-offset-4" }}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Outlet />
        </main>
        <footer className="mx-auto max-w-5xl border-t px-4 py-6 font-mono text-xs text-muted-foreground">
          Every entry links to its sources. Entries marked "Auto" are drafted daily from news reports and may contain errors — check the sources.
        </footer>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
