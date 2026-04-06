async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.status === 429) throw new Error(data.error || "Too many requests. Please wait a moment and try again.");
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function generateRoute(answers, onProgress) {
  if (onProgress) onProgress(30);
  const data = await postJSON("/api/generate-route", { answers });
  if (onProgress) onProgress(200);
  return data;
}

export async function refineRoute(answers, previewRoute, followUpAnswers, onProgress) {
  if (onProgress) onProgress(30);
  const data = await postJSON("/api/refine-route", { answers, previewRoute, followUpAnswers });
  if (onProgress) onProgress(200);
  return data;
}
