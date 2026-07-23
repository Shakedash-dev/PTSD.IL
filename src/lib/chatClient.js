export async function streamChat({ base, messages, lang, sessionId }, handlers = {}) {
  if (!base) { handlers.onError?.("no_backend"); return; }
  const res = await fetch(`${base}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, lang, sessionId }),
  });
  if (res.status === 429) { handlers.onError?.("rate_limited"); return; }
  if (!res.ok || !res.body) { handlers.onError?.(`http_${res.status}`); return; }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let sep;
    while ((sep = buf.indexOf("\n\n")) >= 0) {
      const raw = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      const ev = /^event:\s*(.+)$/m.exec(raw)?.[1]?.trim();
      const dataLine = /^data:\s*(.*)$/m.exec(raw)?.[1] ?? "";
      let data = {};
      try { data = JSON.parse(dataLine); } catch { /* skip */ }
      if (ev === "crisis") handlers.onCrisis?.(data.lang);
      else if (ev === "token") handlers.onToken?.(data.text ?? "");
      else if (ev === "sources") handlers.onSources?.(data);
      else if (ev === "error") handlers.onError?.(data.message ?? "error");
      else if (ev === "done") handlers.onDone?.();
    }
  }
}
