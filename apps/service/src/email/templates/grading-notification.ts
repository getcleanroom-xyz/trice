export function gradingNotificationEmail({
  dayTitle,
  dayNumber,
  grade,
}: {
  dayTitle: string;
  dayNumber: number;
  grade: string;
}) {
  return `
  <div style="background:#16130E;color:#E8DFC8;font-family:'Work Sans',sans-serif;padding:36px 34px;">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#ECE0C8;margin-bottom:32px;">Trice</div>
    <p style="font-family:monospace;font-size:10px;letter-spacing:0.05em;color:#B98A46;margin:0 0 8px;">day ${dayNumber} · task graded</p>
    <p style="font-family:Georgia,serif;font-size:21px;line-height:1.4;color:#F1E9D6;margin:0 0 18px;">Your task for ${dayTitle} has been reviewed.</p>
    <div style="border:1px solid rgba(236,227,208,0.14);border-radius:3px;padding:16px 18px;margin-bottom:24px;">
      <div style="font-family:monospace;font-size:10px;letter-spacing:0.05em;color:#B98A46;margin-bottom:6px;">feedback</div>
      <div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#F1E9D6;">${grade}</div>
    </div>
    <p style="font-size:13px;line-height:1.7;color:#8C816A;margin:0 0 28px;">
      Keep going — the next card is on its way.
    </p>
    <div style="border-top:1px solid rgba(236,227,208,0.1);padding-top:18px;font-family:monospace;font-size:10px;color:#6E6552;">
      day ${dayNumber} &middot; <a href="{{unsubscribeUrl}}" style="color:#B98A46;">unsubscribe</a>
    </div>
  </div>`;
}
