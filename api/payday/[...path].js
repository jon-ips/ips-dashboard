// Vercel serverless proxy for Payday.is API
// Catches /api/payday/* and forwards to https://api.payday.is/*
// This avoids CORS issues since the request comes from the server, not the browser.

export default async function handler(req, res) {
  // req.query.path is an array from the catch-all route, e.g. ["auth", "token"]
  const pathSegments = req.query.path || [];
  const paydayPath = "/" + pathSegments.join("/");

  // Preserve original query params (exclude the path segments)
  const url = new URL(req.url, `https://${req.headers.host}`);
  url.searchParams.delete("path");
  const queryString = url.searchParams.toString();

  const targetUrl = `https://api.payday.is${paydayPath}${queryString ? "?" + queryString : ""}`;

  // Forward relevant headers
  const headers = {};
  if (req.headers["content-type"]) headers["Content-Type"] = req.headers["content-type"];
  if (req.headers["authorization"]) headers["Authorization"] = req.headers["authorization"];
  if (req.headers["api-version"]) headers["Api-Version"] = req.headers["api-version"];

  try {
    const fetchOptions = {
      method: req.method,
      headers,
    };

    // Forward body for POST/PATCH/PUT
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Forward response status and content-type
    res.status(response.status);
    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    // Forward response body
    if (response.status === 204) {
      res.end();
    } else {
      const data = await response.text();
      res.send(data);
    }
  } catch (err) {
    console.error("Payday proxy error:", err);
    res.status(502).json({ error: "Proxy error", message: err.message });
  }
}
