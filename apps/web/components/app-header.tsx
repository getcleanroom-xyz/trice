import Link from "next/link";

type Crumb = { href?: string; label: string };

export function AppHeader({
  breadcrumbs,
  children,
  className = "",
}: {
  breadcrumbs?: Crumb[];
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-8 flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <span className="font-serif text-lg italic">
        <Link href="/" className="hover:text-primary">Trice</Link>
        {breadcrumbs?.map((cr, i) => (
          <span key={i}>
            <span className="text-muted-foreground"> / </span>
            {cr.href ? (
              <Link href={cr.href as never} className="hover:text-primary">{cr.label}</Link>
            ) : (
              <span className="text-muted-foreground">{cr.label}</span>
            )}
          </span>
        ))}
      </span>
      {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
    </div>
  );
}
