(() => {
  "use strict";

  const MAP_URL = "https://cdn.jsdelivr.net/gh/tonybalony76/fnf-cdn-test@4032b717818258fea893316c68b363f6ac462102/fnf-file-map.json";
  const REPO_BASES = {
    "eme-hbnf-01": "https://cdn.jsdelivr.net/gh/tonybalony76/eme-hbnf-01@848faf40bb4492334f54d4cec5223719c29d2977/",
    "eme-hbnf-02": "https://cdn.jsdelivr.net/gh/tonybalony76/eme-hbnf-02@2994749075a761709a18fbe1635dd900e1be621f/",
    "eme-hbnf-03": "https://cdn.jsdelivr.net/gh/tonybalony76/eme-hbnf-03@9419d27baf519acac72d2287f4eee384025664d6/",
    "eme-hbnf-04": "https://cdn.jsdelivr.net/gh/tonybalony76/eme-hbnf-04@aec467a0e6193b8e03312119398286a267b258da/",
    "eme-hbnf-05": "https://cdn.jsdelivr.net/gh/tonybalony76/eme-hbnf-05@eb7673e7af32b20d50f95c11bced2dd1e39158af/",
    "eme-hbnf-06": "https://cdn.jsdelivr.net/gh/tonybalony76/eme-hbnf-06@9b96d1309f9dafc0f5c7096e15e83070129f0577/",
    "eme-hbnf-07": "https://cdn.jsdelivr.net/gh/tonybalony76/eme-hbnf-07@ccf6cfdb9aec2ab9d5489e2bf4411847f2fcf6fd/",
    "eme-hbnf-08": "https://cdn.jsdelivr.net/gh/tonybalony76/eme-hbnf-08@0b4959dd664204500607abc40af569c01ac56f26/"
  };

  const style = document.createElement("style");
  style.textContent = "html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}#openfl-content{width:100%;height:100%;background:#000}body{touch-action:none}";
  document.head.appendChild(style);
  document.body.innerHTML = '<div id="openfl-content"></div><div id="fnf-loading" style="position:fixed;inset:0;display:grid;place-items:center;background:#000;color:#fff;font:16px Arial;z-index:99999">Loading Friday Night Funkin’…</div>';

  window.addEventListener("touchmove", e => e.preventDefault(), { passive:false });

  function fail(message) {
    let el = document.getElementById("fnf-loading");
    if (!el) {
      el = document.createElement("div");
      el.id = "fnf-loading";
      el.style.cssText = "position:fixed;inset:0;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:#000;color:#fff;font:16px Arial;z-index:999999;text-align:center;white-space:pre-wrap";
      document.body.appendChild(el);
    }
    el.textContent = "FNF could not start: " + message;
    console.error("[FNF CDN loader]", message);
  }

  // Keep runtime failures visible even after Lime has created its canvas and
  // the initial loading message has been removed.
  window.addEventListener("error", event => {
    const message = event && (event.message || (event.error && event.error.message));
    const location = event && event.filename
      ? " (" + event.filename + (event.lineno ? ":" + event.lineno : "") + (event.colno ? ":" + event.colno : "") + ")"
      : "";
    if (message) {
      const source = window.__fnfPatchedSource;
      let sourceLine = "";
      if (source && event && event.lineno > 0) {
        let offset = 0;
        for (let line = 1; line < event.lineno; line++) {
          offset = source.indexOf("\\n", offset);
          if (offset < 0) break;
          offset++;
        }
        if (offset >= 0) {
          const lineEnd = source.indexOf("\\n", offset);
          sourceLine = source.slice(offset, lineEnd < 0 ? undefined : lineEnd).slice(0, 700);
        }
      }
      if (sourceLine) console.error("[FNF generated source line " + event.lineno + "]", sourceLine);
      if (event && event.error && event.error.stack) console.error("[FNF full error stack]", event.error.stack);
      fail("Runtime JavaScript error: " + message + location + (sourceLine ? "\\nGenerated code: " + sourceLine : ""));
    }
    else if (event && event.target && event.target !== window) {
      const resource = event.target.src || event.target.href || event.target.tagName || "unknown resource";
      fail("Could not load resource: " + resource);
    }
  }, true);
  window.addEventListener("unhandledrejection", event => {
    const reason = event && event.reason;
    const message = reason && reason.message ? reason.message : String(reason);
    fail("Unhandled promise rejection: " + message);
  });

  function pathKey(input) {
    if (typeof input !== "string") return null;
    if (/^(data:|blob:|javascript:)/i.test(input)) return null;

    // Google Sites may run custom embeds in a sandboxed iframe whose origin is
    // opaque ("null"). document.baseURI can still point to the Sites page, so
    // comparing URL.origin with location.origin incorrectly rejects relative
    // game assets. Resolve when possible, and fall back to the raw path when
    // the iframe uses an about:srcdoc base URL.
    let p;
    try {
      const base = document.baseURI || window.location.href || "https://example.invalid/";
      p = new URL(input, base).pathname;
    } catch (_) {
      p = input.split(/[?#]/, 1)[0];
    }

    try { p = decodeURIComponent(p); } catch (_) {}
    while (p.startsWith("/")) p = p.slice(1);
    const candidates = [p];
    for (const marker of ["assets/", "flixel/"]) {
      const at = p.lastIndexOf(marker);
      if (at >= 0) candidates.push(p.slice(at));
    }

    // Only use a basename fallback for relative requests. This avoids
    // rewriting unrelated third-party URLs that merely share a filename.
    const isRelative = !/^[a-z][a-z0-9+.-]*:/i.test(input) && !input.startsWith("//");
    if (isRelative) {
      const tail = p.split("/").pop();
      if (tail === "Funkin.js" || tail === "favicon.png") candidates.push(tail);
    }

    for (const c of candidates) {
      if (window.__fnfMap && window.__fnfMap.files[c]) return c;
    }
    return null;
  }

  function cdnUrl(input) {
    const key = pathKey(input);
    if (!key) return input;
    const item = window.__fnfMap.files[key];
    const base = REPO_BASES[item.repo];
    return base ? base + key.split("/").map(encodeURIComponent).join("/") : input;
  }

  function patchProperty(proto, property) {
    if (!proto) return;
    const d = Object.getOwnPropertyDescriptor(proto, property);
    if (!d || !d.set || !d.get || !d.configurable) return;
    Object.defineProperty(proto, property, {
      configurable: true,
      enumerable: d.enumerable,
      get() { return d.get.call(this); },
      set(value) { return d.set.call(this, cdnUrl(String(value))); }
    });
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    return originalOpen.call(this, method, cdnUrl(String(url)), ...rest);
  };

  if (window.fetch) {
    const originalFetch = window.fetch.bind(window);
    window.fetch = function(input, init) {
      if (input instanceof Request) {
        const rewritten = cdnUrl(input.url);
        if (rewritten !== input.url) input = new Request(rewritten, input);
      } else {
        input = cdnUrl(String(input));
      }
      return originalFetch(input, init);
    };
  }

  patchProperty(HTMLImageElement.prototype, "src");
  patchProperty(HTMLMediaElement.prototype, "src");
  patchProperty(HTMLSourceElement.prototype, "src");
  patchProperty(HTMLScriptElement.prototype, "src");
  patchProperty(HTMLLinkElement.prototype, "href");
  patchProperty(HTMLVideoElement.prototype, "poster");

  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    const n = String(name).toLowerCase();
    if (["src","href","poster"].includes(n)) value = cdnUrl(String(value));
    return originalSetAttribute.call(this, name, value);
  };

  const fonts = [
    ["Quantico-Bold","assets/fonts/Quantico-Bold.ttf"],["DS-Digital Bold","assets/fonts/DS-DIGIB.TTF"],
    ["DS-Digital Bold Italic","assets/fonts/DS-DIGIT.TTF"],["VCR OSD Mono Bold Italic","assets/fonts/vcr-bolditalic.ttf"],
    ["5by7 Bold","assets/fonts/5by7_b.ttf"],["Share Tech Mono","assets/fonts/ShareTechMono-Regular.ttf"],
    ["Inconsolata ExtraLight","assets/fonts/Inconsolata-ExtraLight.ttf"],["VCR OSD Mono","assets/fonts/vcr.ttf"],
    ["DS-Digital Italic","assets/fonts/DS-DIGII.TTF"],["Pixel Arial 11 Bold","assets/fonts/pixel.otf"],
    ["Quantico","assets/fonts/Quantico-Regular.ttf"],["Inconsolata Medium","assets/fonts/Inconsolata-Medium.ttf"],
    ["VCR OSD Mono Italic","assets/fonts/vcr-italic.ttf"],["DS-Digital","assets/fonts/DS-DIGI.TTF"],
    ["Inconsolata SemiBold","assets/fonts/Inconsolata-SemiBold.ttf"],["YoureGone-Regular","assets/fonts/YoureGone-Regular.otf"],
    ["Quantico-Italic","assets/fonts/Quantico-Italic.ttf"],["VCR OSD Mono Bold","assets/fonts/vcr-bold.ttf"],
    ["Consolas Italic","assets/fonts/Consolas.ttf"],["Inconsolata Regular","assets/fonts/Inconsolata-Regular.ttf"],
    ["Inconsolata ExtraBold","assets/fonts/Inconsolata-ExtraBold.ttf"],["Quantico-BoldItalic","assets/fonts/Quantico-BoldItalic.ttf"],
    ["Inconsolata Bold","assets/fonts/Inconsolata-Bold.ttf"],["5by7","assets/fonts/5by7.ttf"],
    ["Inconsolata Black","assets/fonts/Inconsolata-Black.ttf"],["Nokia Cellphone FC Small","flixel/fonts/nokiafc22.ttf"],
    ["Monsterrat","flixel/fonts/monsterrat.ttf"]
  ];

  fetch(MAP_URL).then(r => {
    if (!r.ok) throw new Error("Could not download the file map (" + r.status + ")");
    return r.json();
  }).then(map => {
    window.__fnfMap = map;
    const fontCss = fonts.map(([name,path]) =>
      "@font-face{font-family:'" + name + "';src:url('" + cdnUrl(path) + "') format('" + (path.endsWith(".otf") ? "opentype" : "truetype") + "')}"
    ).join("\n");
    const fontStyle = document.createElement("style");
    fontStyle.textContent = fontCss;
    document.head.appendChild(fontStyle);

    // Download the compiled bundle as text and patch the failing Haxe event-class
    // dereference before executing it. The previous resolver hook ran too late
    // / against a symbol that is not exposed outside the compiled bundle.
    fetch(cdnUrl("Funkin.js"), { mode: "cors" }).then(response => {
      if (!response.ok) throw new Error("Could not download Funkin.js (" + response.status + ")");
      return response.text();
    }).then(source => {
      const baseExpr = '$hxClasses["funkin.play.event.SongEvent"]';
      let patched = 0;

      // Haxe may inline Type.getClassName(eventCls) into eventCls.__name__.
      // If a generated built-in event entry is null, substitute the base class
      // name at the exact dereference; registerBaseEvents skips that base class.
      source = source.replace(/\bType\.getClassName\s*\(\s*eventCls\s*\)/g, match => {
        patched++;
        return "Type.getClassName(eventCls || " + baseExpr + ")";
      });
      source = source.replace(/eventCls\.__name__/g, match => {
        patched++;
        return "(eventCls || " + baseExpr + ").__name__";
      });

      if (!patched) throw new Error("The expected SongEventRegistry class-name expression was not found in Funkin.js; no patch was applied");

      console.info("[FNF patch] Applied", patched, "SongEventRegistry null-class guard(s)");
      window.__fnfPatchedSource = source;
      const script = document.createElement("script");
      const bundleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
      script.onload = () => {
        URL.revokeObjectURL(bundleUrl);
        try {
          if (!window.lime || typeof window.lime.embed !== "function") throw new Error("Funkin.js loaded, but the Lime game engine did not initialize");
          window.lime.embed("Funkin", "openfl-content", 1280, 720, { parameters:{} });
          const loading = document.getElementById("fnf-loading");
          if (loading) loading.remove();
        } catch (e) { fail(e.message || String(e)); }
      };
      script.onerror = () => {
        URL.revokeObjectURL(bundleUrl);
        fail("The patched Funkin.js bundle could not be executed");
      };
      script.src = bundleUrl;
      document.head.appendChild(script);
    }).catch(e => fail(e.message || String(e)));
  }).catch(e => fail(e.message || String(e)));
})();