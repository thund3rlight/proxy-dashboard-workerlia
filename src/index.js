export default {
  async fetch(request) {
    const url = new URL(request.url);

    const token = url.searchParams.get("t");

    // ---------------- Base64URL helpers ----------------
    const decodeToken = (str) => {
      const padded = str
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(str.length + (4 - (str.length % 4)) % 4, "=");

      return JSON.parse(atob(padded));
    };

    let decoded = null;

    if (token) {
      try {
        decoded = decodeToken(token);
      } catch {
        decoded = null;
      }
    }

    const target = decoded?.url || null;
    const expires = decoded?.exp || null;

    // ---------------- expiry check ----------------
    if (expires && Date.now() > expires) {
      return new Response("Link expired", { status: 403 });
    }

    // ---------------- UI ----------------
    const homePage = (message = "") => `
<html>
<head>
  <title>Proxy Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
body {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
  background: #f8f3e7;
  color: #3b2f2f;
  margin: 0;
  padding: 40px 16px;
}

.container {
  max-width: 900px;
  margin: auto;
}

h1 {
  font-size: 28px;
  margin-bottom: 20px;
  color: #3b2f2f;
}

.card {
  background: #fffaf0;
  border: 1px solid #eadfcd;
  border-radius: 14px;
  padding: 18px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  margin-top: 8px;
  margin-bottom: 10px;
  border-radius: 10px;
  border: 1px solid #e6d7c3;
  background: #fffdf7;
  color: #3b2f2f;
}

input::placeholder {
  color: #a08f7a;
}

button {
  padding: 12px;
  width: 100%;
  border: none;
  border-radius: 10px;
  background: #c9a46a;
  color: white;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 10px;
  transition: 0.2s;
}

button:hover {
  background: #b88f55;
}

.msg {
  padding: 10px;
  border-radius: 10px;
  margin-bottom: 15px;
  background: #fff3d6;
  border-left: 4px solid #c9a46a;
  color: #5a4632;
}

.toast {
  position: fixed;
  bottom: 25px;
  left: 50%;
  transform: translateX(-50%);
  background: #fffaf0;
  color: #3b2f2f;
  padding: 12px 18px;
  border-radius: 10px;
  border: 1px solid #e6d7c3;
  opacity: 0;
  transition: 0.25s;
}

.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(-5px);
}
  </style>
</head>
<body>

<div class="container">
  <h1>Proxy Dashboard</h1>

  ${message ? `<div class="msg">${message}</div>` : ""}

  <div class="card">
    <input id="urlInput" placeholder="Stream URL (.m3u / .m3u8)" />
    <input id="expiryInput" placeholder="Expiry in minutes (0 = never)" />

    <button onclick="generate()">Generate URL</button>

    <input id="output" readonly placeholder="Generated URL" />

    <button onclick="copyUrl()">Copy URL</button>
  </div>
</div>

<div id="toast" class="toast">Copied!</div>

<script>
function ensureM3U(url) {
  try {
    const u = new URL(url);
    if (!u.pathname.endsWith(".m3u") && !u.pathname.endsWith(".m3u8")) {
      u.pathname += ".m3u8";
    }
    return u.toString();
  } catch {
    return url;
  }
}

function generate() {
  try {
    let url = document.getElementById("urlInput").value;
    const expiryMinutes = parseInt(document.getElementById("expiryInput").value || "0");

    if (!url) {
      alert("Please enter a URL");
      return;
    }

    url = ensureM3U(url);

    const exp =
      expiryMinutes > 0 ? Date.now() + expiryMinutes * 60 * 1000 : null;

    const token = btoa(JSON.stringify({ url, exp }))
      .replace(/\\+/g, "-")
      .replace(/\\//g, "_")
      .replace(/=+$/, "");

    const proxy = window.location.origin + "/?t=" + token;

    document.getElementById("output").value = proxy;
  } catch (e) {
    console.error("Generate error:", e);
    alert("Failed to generate URL");
  }
}

async function copyUrl() {
  const out = document.getElementById("output").value;
  if (!out) return;

  try {
    await navigator.clipboard.writeText(out);
    showToast("Copied!");
  } catch {
    alert("Copy failed");
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");

  setTimeout(() => toast.classList.remove("show"), 2000);
}
</script>

</body>
</html>
`;

    // ---------------- HOME ----------------
    if (!target) {
      return new Response(homePage(), {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    // ---------------- decode stream ----------------
    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return new Response("Invalid token", { status: 400 });
    }

    if (
      !parsed.pathname.endsWith(".m3u") &&
      !parsed.pathname.endsWith(".m3u8")
    ) {
      parsed.pathname += ".m3u8";
    }

    // ---------------- FETCH STREAM ----------------
    const res = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const headers = new Headers(res.headers);
    headers.set("access-control-allow-origin", "*");

    return new Response(res.body, {
      status: res.status,
      headers,
    });
  },
};
