type BookingNotification = {
  id?: string
  bookingId?: string
  salonId: string
  salonName?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  appointmentDate: string
  appointmentTime: string
  notes?: string
}

type ChannelStatus = 'sent' | 'skipped' | 'failed'

export type BookingNotificationResult = {
  email: ChannelStatus
  sms: ChannelStatus
  errors: string[]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getBookingReference(booking: BookingNotification) {
  return booking.bookingId || booking.id || 'confirmed'
}

function getSalonName(booking: BookingNotification) {
  return booking.salonName || 'your salon'
}

function buildPlainTextMessage(booking: BookingNotification) {
  return [
    `Hi ${booking.customerName || 'there'}, your HGM booking is confirmed.`,
    `Salon: ${getSalonName(booking)}`,
    `Date: ${booking.appointmentDate}`,
    `Time: ${booking.appointmentTime}`,
    `Booking ID: ${getBookingReference(booking)}`,
  ].join('\n')
}

function buildEmailHtml(booking: BookingNotification) {
  const rows = [
    ['Salon', getSalonName(booking)],
    ['Date', booking.appointmentDate],
    ['Time', booking.appointmentTime],
    ['Booking ID', getBookingReference(booking)],
  ]

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
      <h2 style="margin:0 0 16px">Your HGM booking is confirmed</h2>
      <p>Hi ${escapeHtml(booking.customerName || 'there')},</p>
      <p>Your appointment has been booked successfully.</p>
      <table style="border-collapse:collapse;margin-top:16px">
        ${rows.map(([label, value]) => `
          <tr>
            <td style="padding:6px 16px 6px 0;color:#6b7280">${escapeHtml(label)}</td>
            <td style="padding:6px 0;font-weight:600">${escapeHtml(value)}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `
}

async function sendBookingEmail(booking: BookingNotification) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.BOOKING_FROM_EMAIL || process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from || !booking.customerEmail) {
    return 'skipped' as ChannelStatus
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: booking.customerEmail,
      subject: `HGM booking confirmed at ${getSalonName(booking)}`,
      text: buildPlainTextMessage(booking),
      html: buildEmailHtml(booking),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Email provider failed with ${response.status}: ${errorText}`)
  }

  return 'sent' as ChannelStatus
}

async function sendBookingSms(booking: BookingNotification) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_PHONE
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  if (!accountSid || !authToken || !booking.customerPhone || (!from && !messagingServiceSid)) {
    return 'skipped' as ChannelStatus
  }

  const body = new URLSearchParams({
    To: booking.customerPhone,
    Body: buildPlainTextMessage(booking),
  })

  if (messagingServiceSid) {
    body.set('MessagingServiceSid', messagingServiceSid)
  } else if (from) {
    body.set('From', from)
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`SMS provider failed with ${response.status}: ${errorText}`)
  }

  return 'sent' as ChannelStatus
}

export async function sendBookingNotifications(booking: BookingNotification): Promise<BookingNotificationResult> {
  const result: BookingNotificationResult = {
    email: 'skipped',
    sms: 'skipped',
    errors: [],
  }

  const [emailResult, smsResult] = await Promise.allSettled([
    sendBookingEmail(booking),
    sendBookingSms(booking),
  ])

  if (emailResult.status === 'fulfilled') {
    result.email = emailResult.value
  } else {
    result.email = 'failed'
    result.errors.push(emailResult.reason instanceof Error ? emailResult.reason.message : 'Email failed')
  }

  if (smsResult.status === 'fulfilled') {
    result.sms = smsResult.value
  } else {
    result.sms = 'failed'
    result.errors.push(smsResult.reason instanceof Error ? smsResult.reason.message : 'SMS failed')
  }

  return result
}
