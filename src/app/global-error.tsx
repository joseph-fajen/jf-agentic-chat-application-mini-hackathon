"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <p className="text-destructive text-7xl font-bold">Error</p>
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground text-center text-sm">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="bg-primary text-primary-foreground mt-2 rounded-md px-6 py-2 text-sm font-medium transition-colors hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
