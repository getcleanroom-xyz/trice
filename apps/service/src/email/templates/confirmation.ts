export function confirmationEmail({ unsubscribeUrl }: { unsubscribeUrl: string }) {
  return `
  <div style="background:#16130E;color:#E8DFC8;font-family:'Work Sans',sans-serif;padding:36px 34px;">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#ECE0C8;margin-bottom:32px;">Trice</div>
    <p style="font-family:Georgia,serif;font-size:21px;line-height:1.4;color:#F1E9D6;margin:0 0 18px;">You're on the roll.</p>
    <p style="font-size:14px;line-height:1.75;color:#B4A98D;margin:0 0 20px;">
      One email a day, one idea, fifteen minutes. That's the whole arrangement.
      Nothing to install, nothing to remember &mdash; just a link that shows up
      each morning and works for that day only.
    </p>
    <div style="border:1px solid rgba(236,227,208,0.14);border-radius:3px;padding:16px 18px;margin-bottom:24px;">
      <div style="font-family:monospace;font-size:10px;letter-spacing:0.05em;color:#B98A46;margin-bottom:6px;">first card arrives</div>
      <div style="font-family:Georgia,serif;font-size:16px;color:#F1E9D6;">Tomorrow morning</div>
    </div>
    <p style="font-size:13px;line-height:1.7;color:#8C816A;margin:0 0 28px;">
      Miss a day and that day's card is filed away for good &mdash; but the next
      one still comes right on schedule. No catching up, no guilt, just tomorrow.
    </p>
    <div style="border-top:1px solid rgba(236,227,208,0.1);padding-top:18px;font-family:monospace;font-size:10px;color:#6E6552;">
      <a href="${unsubscribeUrl}" style="color:#B98A46;">unsubscribe</a>
    </div>
  </div>`;
}
