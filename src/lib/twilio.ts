import Twilio from 'twilio'

export function getTwilioConfig(): {
  accountSid: string
  authToken: string
  fromNumber: string
} | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim()

  if (!accountSid || !authToken || !fromNumber) {
    return null
  }

  return { accountSid, authToken, fromNumber }
}

export async function sendSms(to: string, body: string): Promise<void> {
  const config = getTwilioConfig()
  if (!config) {
    return
  }

  const client = Twilio(config.accountSid, config.authToken)
  await client.messages.create({
    to,
    from: config.fromNumber,
    body,
  })
}
