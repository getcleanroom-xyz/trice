"use client";

interface DayLayoutProps {
  panels: {
    video: React.ReactNode;
    notes: React.ReactNode;
    tabs: React.ReactNode;
    quiz: React.ReactNode;
  };
}

export function DayLayout({ panels }: DayLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-auto">
      <div className="lg:col-span-7 min-h-0">{panels.video}</div>
      <div className="lg:col-span-5 min-h-0">{panels.notes}</div>
      <div className="lg:col-span-12">{panels.tabs}</div>
      <div className="lg:col-span-12">{panels.quiz}</div>
    </div>
  );
}
