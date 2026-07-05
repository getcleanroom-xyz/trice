export function weeklyInsightsEmail({
  weekLabel,
  daysAvailable,
  daysShownUp,
  totalCorrect,
  totalQuestions,
  url,
}: {
  weekLabel: string;
  daysAvailable: number;
  daysShownUp: number;
  totalCorrect: number;
  totalQuestions: number;
  url: string;
}) {
  const scoreLine =
    totalQuestions > 0
      ? `<p style="font-size:13px;line-height:1.7;color:#8C816A;margin:0 0 6px;">
       Quiz score: <span style="color:#ECE0C8;">${totalCorrect} / ${totalQuestions}</span>
     </p>`
      : "";

  const attendanceLine =
    daysAvailable > 0
      ? `<p style="font-size:13px;line-height:1.7;color:#8C816A;margin:0 0 18px;">
       You showed up <span style="color:#ECE0C8;">${daysShownUp} out of ${daysAvailable}</span> day${daysAvailable !== 1 ? "s" : ""} this week.
     </p>`
      : `<p style="font-size:13px;line-height:1.7;color:#8C816A;margin:0 0 18px;">
       No cards were published this week.
     </p>`;

  return `
  <div style="background:#16130E;color:#E8DFC8;font-family:'Work Sans',sans-serif;padding:36px 34px;">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#ECE0C8;margin-bottom:32px;">Trice</div>
    <p style="font-family:monospace;font-size:10px;letter-spacing:0.05em;color:#B98A46;margin:0 0 8px;">week in review</p>
    <p style="font-family:Georgia,serif;font-size:22px;line-height:1.35;color:#F1E9D6;margin:0 0 18px;">${weekLabel}</p>
    ${attendanceLine}
    ${scoreLine}
    <p style="font-size:13px;line-height:1.7;color:#8C816A;margin:0 0 26px;">
      Every week has its own shape. Some you show up for, some you don&rsquo;t.
      Here&rsquo;s what yours looked like.
    </p>
    <a href="${url}" style="display:inline-block;border:1px solid #B98A46;color:#ECE0C8;font-family:monospace;font-size:12px;padding:11px 22px;border-radius:2px;text-decoration:none;">
      See the full review &rarr;
    </a>
    <div style="border-top:1px solid rgba(236,227,208,0.1);margin-top:32px;padding-top:18px;font-family:monospace;font-size:10px;color:#6E6552;">
      sent every sunday &middot; <a href="{{unsubscribeUrl}}" style="color:#B98A46;">unsubscribe</a>
    </div>
  </div>`;
}
