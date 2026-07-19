// BulkSMSBD's tested gateway format is an HTTP GET request with query parameters.
const DEFAULT_BULKSMSBD_URL = "http://bulksmsbd.net/api/smsapi";

function requireConfig(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export async function sendBulkSmsBd({ mobile, message }) {
  const url = new URL(process.env.BULKSMSBD_API_URL?.trim() || DEFAULT_BULKSMSBD_URL);
  const recipient = mobile.startsWith("8801") ? `0${mobile.slice(3)}` : mobile;
  url.search = new URLSearchParams({
    api_key: requireConfig("BULKSMSBD_API_KEY"),
    type: "text",
    number: recipient,
    senderid: requireConfig("BULKSMSBD_SENDER_ID"),
    message,
  }).toString();

  const response = await fetch(url, { headers: { accept: "application/json" } });
  const rawBody = await response.text();
  let payload = null;
  try { payload = JSON.parse(rawBody); } catch { /* provider returned non-JSON */ }

  if (!response.ok || String(payload?.response_code) !== "202") {
    throw new Error(`BulkSMSBD rejected the SMS request (${response.status}): ${payload?.error_message || rawBody.slice(0, 500) || "unknown error"}`);
  }
}
