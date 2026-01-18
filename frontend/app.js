(function () {
  const API = "http://localhost:3001";
  window.API = API;

  const originalFetch = window.fetch.bind(window);

  function shouldProxy(urlStr) {
    if (typeof urlStr === "string" && urlStr.startsWith("/") && !urlStr.startsWith("//")) {
      return true;
    }
    return false;
  }

  window.fetch = (input, init) => {
    try {
      if (typeof input === "string") {
        if (shouldProxy(input)) return originalFetch(API + input, init);
        return originalFetch(input, init);
      }

      if (input instanceof Request) {
        const url = input.url;

        const u = new URL(url, window.location.origin);

        const isSameOrigin = u.origin === window.location.origin;
        if (isSameOrigin && u.pathname.startsWith("/")) {
          const newUrl = API + u.pathname + u.search;

          const newReq = new Request(newUrl, input);
          return originalFetch(newReq);
        }

        return originalFetch(input, init);
      }
    } catch (e) {
      return originalFetch(input, init);
    }

    return originalFetch(input, init);
  };

  document.addEventListener("DOMContentLoaded", () => {
    const isLoginPage =
      !!document.getElementById("loginForm") ||
      (location.pathname || "").toLowerCase().endsWith("login.html");

    const userStr = localStorage.getItem("user");
    const user = userStr ? safeJsonParse(userStr) : null;

    if (!isLoginPage && !user) {
      location.href = "login.html";
      return;
    }

    const elUser = document.getElementById("prijavljeniKorisnik");
    if (elUser && user) {
      elUser.textContent =
        `Prijavljen: ${user.korisnicko_ime} (${user.uloga_id === 2 ? "moderator" : "korisnik"})`;
    }

    if (isLoginPage) initLogin();
  });

  window.odjava = function () {
    localStorage.removeItem("user");
    location.href = "login.html";
  };

  function initLogin() {
    const form = document.getElementById("loginForm");
    const input = document.getElementById("korisnickoIme");
    const status = document.getElementById("status");
    if (!form || !input || !status) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const korisnicko_ime = input.value.trim();
      if (!korisnicko_ime) {
        status.textContent = "Upiši korisničko ime.";
        return;
      }

      status.textContent = "Prijava...";

      try {
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ korisnicko_ime }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          status.textContent = data.error || "Greška na prijavi.";
          return;
        }

        localStorage.setItem("user", JSON.stringify(data.user));
        location.href = data.user.uloga_id === 2 ? "moderator.html" : "index.html";
      } catch (err) {
        status.textContent = "Greška: " + err.message;
      }
    });
  }

  function safeJsonParse(s) {
    try { return JSON.parse(s); } catch { return null; }
  }
})();
