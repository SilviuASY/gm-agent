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

exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

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

  try {
    const upstream = await fetch(BASE_VERIFY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: event.body ?? "{}",
    });

    const text = await upstream.text();

    // Relay the exact status + body Base Verify returned (including its documented
    // 400/404 error shapes) so the frontend's error handling keeps working unchanged.
    return {
      statusCode: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "proxy_failed",
        message: err instanceof Error ? err.message : "Unknown error contacting Base Verify",
      }),
    };
  }
};
