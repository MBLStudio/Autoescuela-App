// ── Helper compartido para todos los emails de Auto-Escuela Bahillo ────────────

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autoescuela-app.vercel.app'
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'notificaciones@autoescuela-bahillo.es'

// Logo SVG inline (camión con ruedas, fondo azul redondeado)
const LOGO = `
<table cellpadding="0" cellspacing="0">
  <tr>
    <td style="background:rgba(255,255,255,0.18);border-radius:14px;padding:11px 13px;vertical-align:middle">
      <svg width="34" height="34" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M96 280l52-156a24 24 0 0122.8-16.5h170.4A24 24 0 01463 280" stroke="white" stroke-width="28" stroke-linecap="round"/>
        <path d="M72 280h368v80a16 16 0 01-16 16H88a16 16 0 01-16-16v-80z" fill="white"/>
        <circle cx="168" cy="392" r="44" fill="#0057B8" stroke="white" stroke-width="20"/>
        <circle cx="344" cy="392" r="44" fill="#0057B8" stroke="white" stroke-width="20"/>
        <path d="M212 392h88" stroke="white" stroke-width="20" stroke-linecap="round"/>
      </svg>
    </td>
    <td style="padding-left:14px">
      <p style="margin:0;color:#ffffff;font-size:17px;font-weight:900;letter-spacing:0.3px">AUTO-ESCUELA BAHILLO</p>
      <p style="margin:3px 0 0;color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:0.5px">Palencia · Prácticas de conducción</p>
    </td>
  </tr>
</table>`

// Envuelve el contenido en la estructura HTML del email
export function emailWrapper(content: string, footerLink?: { url: string; label: string }, headerColor = '#0057B8'): string {
  const footer = footerLink
    ? `<a href="${footerLink.url}" style="color:#0057B8;text-decoration:none">${footerLink.label}</a>`
    : 'Auto-Escuela Bahillo · Palencia'

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header con logo -->
        <tr>
          <td style="background:${headerColor};padding:24px 36px">
            ${LOGO}
          </td>
        </tr>

        <!-- Contenido -->
        <tr>
          <td style="padding:32px 36px">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f7fafd;padding:16px 36px;border-top:1px solid #e8f0f8;text-align:center">
            <p style="margin:0;color:#9ab0c8;font-size:11px;line-height:1.8">
              ${footer}<br>
              <span style="color:#c5d5e8">Notificación automática · No respondas a este mensaje</span>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// Bloque de detalle (fila de info dentro de una tarjeta)
export function infoRow(label: string, value: string, borderColor: string, last = false): string {
  return `
  <tr><td style="padding:12px 0${last ? '' : `;border-bottom:1px solid ${borderColor}`}">
    <p style="margin:0;color:#6b8ab0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">${label}</p>
    <p style="margin:5px 0 0;color:#0a0f1a;font-size:15px;font-weight:800">${value}</p>
  </td></tr>`
}

// Tarjeta de info con filas
export function infoCard(rows: string, bg: string, border: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border:1.5px solid ${border};border-radius:12px;margin-bottom:24px">
    <tr><td style="padding:20px 22px">
      <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    </td></tr>
  </table>`
}

// Botón CTA
export function ctaButton(url: string, label: string, color = '#0057B8'): string {
  return `
  <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px">
    <tr><td align="center">
      <a href="${url}" style="display:inline-block;background:${color};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.2px">
        ${label}
      </a>
    </td></tr>
  </table>`
}

// Helpers de fecha
export function formatDateEs(dateStr: string): string {
  const [y, m, day] = dateStr.split('-')
  return `${day}/${m}/${y}`
}

export function getDayNameEs(dateStr: string): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return days[new Date(dateStr + 'T00:00:00').getDay()]
}

export function getPracticeLabel(type: string, subtype: string | null): string {
  if (type === 'car') return 'Coche'
  if (type === 'moto' && subtype === 'pista') return 'Moto Pista'
  if (type === 'moto' && subtype === 'circulacion') return 'Moto Circulación'
  if (type === 'moto') return 'Moto'
  if (subtype === 'pista') return 'Camión Pista'
  if (subtype === 'circulacion') return 'Camión Circulación'
  return 'Camión'
}
