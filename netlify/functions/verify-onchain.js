// netlify/functions/verify-onchain.js
//
// Server-side proxy for Base Verify's onchain_verifications endpoint.
//
// Why this exists: verify.base.dev doesn't send an Access-Control-Allow-Origin header,
// so a browser calling it directly always fails the CORS preflight — no matter how the
// frontend fetch call is written. Server-to-server calls aren't subject to CORS at all,
// so this function makes the real request on Netlify's side and just relays the result
// back to the browser with our own (permissive) CORS headers attached.

const BASE_VERIFY_API = "https://verify.base.dev/v1/onchain_verifications";
const UPSTREAM_TIMEOUT_MS = 8000;

export const handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  console.log("[verify-onchain] invoked", { method: event.httpMethod, path: event.path });

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "method_not_allowed" }),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(BASE_VERIFY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: event.body ?? "{}",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await upstream.text();
    console.log("[verify-onchain] upstream responded", { status: upstream.status });

    // Relay the exact status + body Base Verify returned (including its documented
    // 400/404 error shapes) so the frontend's error handling keeps working unchanged.
    return {
      statusCode: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: text,
    };
  } catch (err) {
    clearTimeout(timeout);
    const isTimeout = err && err.name === "AbortError";
    console.error("[verify-onchain] proxy failed", {
      isTimeout,
      name: err && err.name,
      message: err instanceof Error ? err.message : String(err),
    });
    return {
      statusCode: isTimeout ? 504 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: isTimeout ? "upstream_timeout" : "proxy_failed",
        message: isTimeout
          ? "Base Verify did not respond in time."
          : err instanceof Error
            ? err.message
            : "Unknown error contacting Base Verify",
      }),
    };
  }
};
