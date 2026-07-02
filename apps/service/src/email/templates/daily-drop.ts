export function dailyDropEmail({
  title,
  slug,
  url,
}: {
  title: string;
  slug: string;
  url: string;
}) {
  return `
  <div style="background:#16130E;color:#E8DFC8;font-family:'Work Sans',sans-serif;padding:36px 34px;">
    <div style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#ECE0C8;margin-bottom:32px;">Trice</div>
    <p style="font-family:monospace;font-size:10px;letter-spacing:0.05em;color:#B98A46;margin:0 0 8px;">today's card</p>
    <p style="font-family:Georgia,serif;font-size:22px;line-height:1.35;color:#F1E9D6;margin:0 0 18px;">${title}</p>
    <p style="font-size:13px;line-height:1.7;color:#8C816A;margin:0 0 26px;">
      Ten minutes to watch, five to prove you did. This link works until midnight
      tonight &mdash; after that it's filed away.
    </p>
    <a href="${url}" style="display:inline-block;border:1px solid #B98A46;color:#ECE0C8;font-family:monospace;font-size:12px;padding:11px 22px;border-radius:2px;text-decoration:none;">
      Open today's card &rarr;
    </a>
    <div style="border-top:1px solid rgba(236,227,208,0.1);margin-top:32px;padding-top:18px;font-family:monospace;font-size:10px;color:#6E6552;">
      day ${slug} &middot; <a href="{{unsubscribeUrl}}" style="color:#B98A46;">unsubscribe</a>
    </div>
  </div>`;
}
