import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 font-serif text-3xl text-foreground">Card filed away</h1>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Whatever was here has passed its midnight deadline — or was never published at all.
      </p>
      <Link
        href="/"
        className="inline-block border border-primary px-5 py-2.5 font-mono text-xs text-foreground hover:bg-primary/10"
      >
        Back to the roll
      </Link>
    </main>
  );
}
