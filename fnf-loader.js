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
    const el = document.getElementById("fnf-loading");
    if (el) el.textContent = "FNF could not start: " + message;
    console.error("[FNF CDN loader]", message);
  }

  function pathKey(input) {
    if (typeof input !== "string") return null;
    if (/^(data:|blob:|javascript:)/i.test(input)) return null;
    let u;
    try { u = new URL(input, document.baseURI); } catch (_) { return null; }
    if (u.origin !== location.origin) return null;
    let p;
    try { p = decodeURIComponent(u.pathname); } catch (_) { p = u.pathname; }
    p = p.replace(/^\/+/, "");
    const candidates = [p];
    for (const marker of ["assets/", "flixel/"]) {
      const at = p.lastIndexOf(marker);
      if (at >= 0) candidates.push(p.slice(at));
    }
    const tail = p.split("/").pop();
    if (tail === "Funkin.js" || tail === "favicon.png") candidates.push(tail);
    for (const c of candidates) if (window.__fnfMap && window.__fnfMap.files[c]) return c;
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

    const script = document.createElement("script");
    script.src = cdnUrl("Funkin.js");
    script.onload = () => {
      try {
        // Guard the compiled SongEvent registry against unresolved class names.
        // Haxe currently stores those failed lookups as undefined list items;
        // SongEventRegistry dereferences each item before checking it.
        const registry = window.funkin_data_event_SongEventRegistry;
        if (registry && registry.BUILTIN_EVENTS) {
          const original = registry.BUILTIN_EVENTS;
          let head = null;
          let tail = null;
          let kept = 0;
          let skipped = 0;
          for (let node = original.h; node; node = node.next) {
            if (node.item == null) {
              skipped++;
              continue;
            }
            const entry = { item: node.item, next: null };
            if (tail) tail.next = entry;
            else head = entry;
            tail = entry;
            kept++;
          }
          if (skipped > 0) {
            registry.BUILTIN_EVENTS = { h: head, q: tail, length: kept };
            console.warn("[FNF registry guard] Skipped " + skipped + " unresolved built-in event class(es); kept " + kept + ".");
          } else {
            console.info("[FNF registry guard] No unresolved built-in event classes found.");
          }
        } else {
          console.warn("[FNF registry guard] SongEvent registry was not exposed before Lime startup.");
        }

        if (!window.lime || typeof window.lime.embed !== "function") throw new Error("Funkin.js loaded, but the Lime game engine did not initialize");
        window.lime.embed("Funkin", "openfl-content", 1280, 720, { parameters:{} });
        const loading = document.getElementById("fnf-loading");
        if (loading) loading.remove();
      } catch (e) { fail(e.message || String(e)); }
    };
    script.onerror = () => fail("Funkin.js failed to download");
    document.head.appendChild(script);
  }).catch(e => fail(e.message || String(e)));
})();