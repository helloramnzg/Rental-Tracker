// Plain HTML-string templates (no @react-email — not an installed
// dependency, per AGENTS.md "Do not introduce new dependencies without
// an ADR — and no react-dom/server, which Next.js's App Router bundler
// rejects when reachable from a Route Handler: "You're importing a
// component that imports react-dom/server."). All copy here is
// developer-authored, not user input, so no HTML-escaping is needed.

export function emailLayout({
  title,
  appUrl,
  bodyHtml,
}: {
  title: string;
  appUrl: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F7F9F7;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F9F7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;">
            <tr>
              <td style="background-color:#1E3D34;padding:20px 24px;">
                <span style="color:#FFFFFF;font-size:16px;font-weight:700;">Upa OS</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">${bodyHtml}</td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #E5E7EB;">
                <a href="${appUrl}" style="font-size:12px;color:#6B7280;text-decoration:underline;">Open Upa OS</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1F2937;">${text}</h1>`;
}

export function bodyText(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#1F2937;">${text}</p>`;
}

export function list(items: string[]): string {
  return `<ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:22px;color:#1F2937;">${items
    .map((item) => `<li>${item}</li>`)
    .join("")}</ul>`;
}

export function button(href: string, text: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:#1E3D34;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:500;padding:10px 20px;border-radius:10px;">${text}</a>`;
}
