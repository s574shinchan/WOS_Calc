/* /js/common.js
   - nav.html fetch 주입 후 initNav() 호출 필수
   - footer 이벤트(initFooter), adsense(initAdsense)도 필요하면 호출
*/
(function () {
  // ====== 공통: 1회만 바인딩 가드 ======
  let outsideBound = false;
  let frameMsgBound = false;
  let darkMsgBound = false;

  // =========================================================
  //  NAV
  // =========================================================
  window.initNav = function initNav(options = {}) {
    const mode = options.mode || "iframe"; // "iframe" | "navigate"
    const navRoot = options.root ? document.querySelector(options.root) : document;

    const dropdowns = [...navRoot.querySelectorAll("[data-dd]")];
    
    function setOpen(dd, open) {
      const btn = dd.querySelector(".dd-btn");
      dd.classList.toggle("open", open);
      if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function closeAll(except = null) {
      dropdowns.forEach((d) => {
        if (d === except) return;
        setOpen(d, false);
      });
    }

    // 드롭다운 바인딩
    dropdowns.forEach((dd) => {
      const btn = dd.querySelector(".dd-btn");
      if (!btn) return;

      if (dd.dataset.bound === "1") return;
      dd.dataset.bound = "1";

      dd.addEventListener("mouseenter", () => {
        closeAll(dd);
        setOpen(dd, true);
      });

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = dd.classList.contains("open");
        if (isOpen) setOpen(dd, false);
        else {
          closeAll(dd);
          setOpen(dd, true);
        }
      });

      dd.querySelector(".dd-menu")?.addEventListener("click", (e) => e.stopPropagation());
    });

    // 바깥 클릭 / ESC 닫기 (1회만)
    if (!outsideBound) {
      outsideBound = true;
      document.addEventListener("click", () => closeAll());
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAll();
      });
    }

    // 메뉴 클릭 동작
    const guideDetails = document.getElementById("guideDetails");
    const frameWrapper = document.getElementById("frameWrapper");
    const mainFrame = document.getElementById("mainFrame");

    function closeAllMenus() {
      document.querySelectorAll(".dd.open").forEach((x) => x.classList.remove("open"));
    }

    // data-frame 처리
    [...navRoot.querySelectorAll(".dd-item[data-frame]")].forEach((item) => {
      if (item.dataset.boundClick === "1") return;
      item.dataset.boundClick = "1";

      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const url = item.dataset.frame;
        if (!url) return;

        if (mode === "navigate") {
          location.href = url;
          return;
        }

        // iframe 모드
        guideDetails?.classList.add("hidden");
        frameWrapper?.classList.remove("hidden");
        if (mainFrame) mainFrame.src = url;

        document.querySelectorAll(".dd-item.active").forEach((x) => x.classList.remove("active"));
        item.classList.add("active");

        closeAllMenus();
      });
    });

    // navigate 모드에서 href 클릭 시 메뉴만 닫기
    if (mode === "navigate") {
      [...navRoot.querySelectorAll(".dd-item[href]")].forEach((a) => {
        if (a.dataset.boundNavClose === "1") return;
        a.dataset.boundNavClose = "1";
        a.addEventListener("click", () => closeAllMenus());
      });
    }

    // iframe 높이 메시지 처리 (1회만)
    if (!frameMsgBound) {
      frameMsgBound = true;
      window.addEventListener("message", function (event) {
        if (event.data?.type === "FRAME_CHANGE") {
          const frame = document.getElementById("mainFrame");
          if (frame) frame.style.height = `${(event.data.height || 0) + 10}px`;
        }
      });
    }
  };

  // =========================================================
  //  Dark Mode (iframe 브로드캐스트 포함)
  // =========================================================
  function broadcastDarkMode(isDark) {
    document.querySelectorAll("iframe").forEach((frame) => {
      try {
        frame.contentWindow?.postMessage({ type: "DARK_MODE", value: isDark }, "*");
      } catch (e) {}
    });
  }

  function applySavedDarkMode() {
    // 기본값: 다크모드(true)
    const saved = localStorage.getItem("darkMode");
    const isDark = (saved === null) ? true : (saved === "true");

    document.body.classList.toggle("dark-mode", isDark);

    // 버튼 아이콘(이모지 → 유니코드 이스케이프로 저장 경고 방지)
    const btn = document.getElementById("DarkMode");
    if (btn) btn.textContent = isDark ? "\uD83C\uDF19" : "\u2600\uFE0F"; // 달 / 해

    if (saved === null) localStorage.setItem("darkMode", "true");
    broadcastDarkMode(isDark);
  }

  window.ActiveDarkMode = function ActiveDarkMode() {
    const isDark = document.body.classList.toggle("dark-mode");
    const btn = document.getElementById("DarkMode");
    if (btn) btn.textContent = isDark ? "\uD83C\uDF19" : "\u2600\uFE0F"; // 달 / 해
    localStorage.setItem("darkMode", isDark ? "true" : "false");
    broadcastDarkMode(isDark);
  };

  // DOM 로드 시 적용(1회)
  if (!darkMsgBound) {
    darkMsgBound = true;
    document.addEventListener("DOMContentLoaded", applySavedDarkMode);

    // mainFrame이 있는 페이지에서만 load 이벤트 연결
    const mf = document.getElementById("mainFrame");
    if (mf) {
      mf.addEventListener("load", () => {
        const isDark = localStorage.getItem("darkMode") === "true";
        const btn = document.getElementById("DarkMode");
        if (btn) btn.textContent = isDark ? "\uD83C\uDF19" : "\u2600\uFE0F";
        broadcastDarkMode(isDark);
      });
    }
  }

  // =========================================================
  //  Footer 이벤트 (업데이트 링크 등)
  // =========================================================
  window.initFooter = function initFooter(opts = {}) {
    const UPDATE_URL  = opts.UPDATE_URL  || "https://s574shinchan.github.io/WOS_Calc/data/update/history.html";
    const FAQ_URL     = opts.FAQ_URL     || "/FAQ.html";
    const PRIVACY_URL = opts.PRIVACY_URL || "/privacy.html";

    const updateLink = document.getElementById("updateLink");
    if (updateLink && updateLink.dataset.bound !== "1") {
      updateLink.dataset.bound = "1";
      updateLink.addEventListener("click", (e) => {
        e.preventDefault();

        // iframe 있으면 iframe, 없으면 페이지 이동
        const frame = document.getElementById("mainFrame");
        const wrapper = document.getElementById("frameWrapper");
        const guide = document.getElementById("guideDetails");

        if (frame && wrapper) {
          if (guide) guide.style.display = "none";
          wrapper.style.display = "block";
          frame.style.height = "300px";
          frame.src = UPDATE_URL + "?v=" + Date.now();
        } else {
          location.href = UPDATE_URL;
        }
      });
    }

    const faqLink = document.getElementById("faqLink");
    if (faqLink && faqLink.dataset.bound !== "1") {
      faqLink.dataset.bound = "1";
      faqLink.addEventListener("click", (e) => {
        e.preventDefault();
        location.href = FAQ_URL;
      });
    }

    const privacyLink = document.getElementById("privacyLink");
    if (privacyLink && privacyLink.dataset.bound !== "1") {
      privacyLink.dataset.bound = "1";
      privacyLink.addEventListener("click", (e) => {
        e.preventDefault();
        const win = window.open(PRIVACY_URL, "_blank", "noopener");
        if (win) win.opener = null;
        else location.href = PRIVACY_URL;
      });
    }
  };

  // =========================================================
  //  Adsense (함수화)
  // =========================================================
  window.initAdsense = function initAdsense(opts = {}) {
    const CLIENT = opts.client || "ca-pub-8205102847358210";
    const ids = opts.ids || ["ad1", "ad2"];

    // DISABLE_ADS 판별(1회)
    if (typeof window.DISABLE_ADS === "undefined") {
      const MIN_INTERVAL = 10000;
      const now = Date.now();
      const last = Number(sessionStorage.getItem("lastLoad") || 0);

      window.DISABLE_ADS = false;

      if (last && now - last < MIN_INTERVAL) window.DISABLE_ADS = true;
      sessionStorage.setItem("lastLoad", now);

      // iframe 안이면 차단
      if (window.top !== window.self) window.DISABLE_ADS = true;

      // file:// 차단
      if (location.protocol === "file:") window.DISABLE_ADS = true;

      if (location.search.length > 200) window.DISABLE_ADS = true;
      if (location.hash.length > 200) window.DISABLE_ADS = true;

      document.addEventListener("visibilitychange", () => {
        if (document.hidden && !window.__ADS_LOADED) window.DISABLE_ADS = true;
      });
    }

    if (window.DISABLE_ADS) return;

    // 사용자 액션 후 adsense.js 로드
    let active = false;
    const activate = () => { active = true; };
    ["scroll","click","touchstart","keydown"].forEach(ev =>
      window.addEventListener(ev, activate, { once:true, passive:true })
    );

    function ensureAdsenseLoaded(){
      if (window.__ADS_LOADED) return;
      window.__ADS_LOADED = true;

      const s = document.createElement("script");
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT)}`;
      s.async = true;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }

    setTimeout(() => {
      if (!active) return;
      ensureAdsenseLoaded();
    }, 5000);

    // 슬롯 보이면 push
    const filled = new Set();

    function safePush(){
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
    }

    function pushWhenReady(){
      if (!window.adsbygoogle) {
        const t = setInterval(() => {
          if (window.adsbygoogle) {
            clearInterval(t);
            safePush();
          }
        }, 200);
        setTimeout(() => clearInterval(t), 8000);
        return;
      }
      safePush();
    }

    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (!e.isIntersecting) return;
        const el = e.target;
        if (filled.has(el)) return;
        filled.add(el);
        pushWhenReady();
        obs.unobserve(el);
      });
    }, { threshold: 0.25 });

    ids.forEach(id=>{
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  };
    
})();
  
  // =========================================================
  //  Page CSS Controller (SPA 전용 CSS 교체)
  // =========================================================
  window.setPageStyle = function setPageStyle(href){
    let link = document.getElementById("page-style");

    if (!link) {
      link = document.createElement("link");
      link.id = "page-style";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    if (!href) {
      link.removeAttribute("href");
      return;
    }

    // 같은 CSS면 재설정 안 함 (깜빡임 방지)
    const cur = (link.getAttribute("href") || "").split("?")[0];
    if (cur === href) return;

    link.setAttribute("href", href + "?v=" + Date.now());
  };
  
  // Home 메뉴 (전역 함수로 등록되어야 onclick에서 호출 가능)
  window.ReturnHome = function () {
    // 1) 공통: 메뉴 닫기
    document.querySelectorAll('.dd.open').forEach(dd => dd.classList.remove('open'));
    document.querySelectorAll('.dd-item.active').forEach(x => x.classList.remove('active'));

    // 2) (구 프레임 UI 흔적이 있어도 에러 없이)
    document.getElementById("mainMount")?.classList.add("hidden");
    document.getElementById("mainMount") && (document.getElementById("mainMount").innerHTML = "");
    document.getElementById("guideDetails")?.classList.remove("hidden");

    // 3) 홈으로 이동
    // 캐시 때문에 새로고침 느낌 필요하면 v 붙여라
    //location.href = 'index.html';
    // location.replace('index.html'); // 뒤로가기 기록 남기기 싫으면 이걸로
    // location.href = 'index.html?v=' + Date.now(); // 강제 갱신 필요하면 이걸로
    // SPA 방식: 주소만 폴더로 정리
    const dir = location.pathname.replace(/[^\/]*$/, "");
    history.replaceState({}, "", dir);

    // 메인 영역 비우기(선택)
    document.getElementById("mainMount") && (document.getElementById("mainMount").innerHTML = "");
  };

  // =========================================================
  //  SPA Partial Loader (data-page + 주소창 "/" 고정)
  //  - index.html에 <div id="mainMount"></div> 필요
  // =========================================================
  (function () {
    async function loadPartial(url) {
      const mount = document.getElementById("mainMount");
      if (!mount) return;

      // 홈 가이드/iframe 숨김
      document.getElementById("guideDetails")?.classList.add("hidden");
      document.getElementById("frameWrapper")?.classList.add("hidden");
      mount.classList.remove("hidden");

      // 주소창 파일명 제거(폴더 경로만 유지)
      const dir = location.pathname.replace(/[^\/]*$/, "");
      history.replaceState({}, "", dir);

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        mount.innerHTML = `<div style="padding:16px">로드 실패: ${url} (${res.status})</div>`;
        return;
      }

      // 이전에 append 했던 SPA 스크립트 제거(누적 방지)
      document.querySelectorAll("script[data-spa-script='1']").forEach(s => s.remove());

      // HTML 주입
      mount.innerHTML = await res.text();

      // 다크모드 다시 적용(새로 들어온 DOM에 class가 적용되어야 함)
      document.body.classList.toggle("dark-mode", localStorage.getItem("darkMode") === "true");

      // 이미 로드된 src인지(상대/절대 모두) 정확히 판별
      const isLoaded = (abs) => {
        return Array.from(document.scripts).some(sc => {
          if (!sc.src) return false;
          try { return new URL(sc.src, location.href).href === abs; }
          catch { return sc.src === abs; }
        });
      };

      // mount 내부 script 실행 (외부는 로드 완료까지 대기)
      const scripts = Array.from(mount.querySelectorAll("script"));
      for (const old of scripts) {
        const src = old.getAttribute("src");

        if (src) {
          const abs = new URL(src, location.href).href;

          // 이미 로드된 외부 스크립트면 재실행 금지
          if (isLoaded(abs)) { old.remove(); continue; }

          await new Promise((resolve, reject) => {
            const s = document.createElement("script");
            s.setAttribute("data-spa-script", "1");
            s.src = abs;
            s.onload = resolve;
            s.onerror = reject;
            console.log("[SPA append]", s.src || "(inline)", "from", url);
            document.body.appendChild(s);          
          });

          old.remove();
          continue;
        }

        // 인라인 스크립트 실행
        const s = document.createElement("script");
        s.setAttribute("data-spa-script", "1");
        s.textContent = old.textContent || "";
        console.log("[SPA append]", s.src || "(inline)", "from", url);
        document.body.appendChild(s);
        old.remove();
      }
    }

    // 외부에서도 쓸 수 있게
    window.loadPartial = loadPartial;

    // nav.html의 data-page 클릭 처리 (캡처로 잡아서 stopPropagation에 안 죽게)
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      // 언어/외부이동 등 "SPA 제외"는 그냥 href로 이동
      if (a.hasAttribute("data-no-spa")) {
        const lang = (a.getAttribute("data-lang") || "").toUpperCase();
        if (lang) localStorage.setItem("lang", lang);
        return; // preventDefault 하지 않음
      }

      // SPA 대상만 처리
      const spa = a.closest("a[data-page]");
      if (!spa) return;

      if (spa.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();

      // 드랍다운 닫기(고정 방지)
      document.querySelectorAll(".dd.open").forEach(dd => {
        dd.classList.remove("open");
        const btn = dd.querySelector(".dd-btn");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });

      if (spa.dataset.css !== undefined) {
        setPageStyle(spa.dataset.css);
      }

      loadPartial(spa.dataset.page);
    }, true);

    // partial 내부 openPage()가 요청하는 이동 처리
    document.addEventListener("SPA_NAVIGATE", (e) => {
      const url = e.detail?.url;
      const css = e.detail?.css;
      if (css !== undefined) { setPageStyle(css); }
      if (url) loadPartial(url);    
    });
  })();

  (function () {
    if (window.__LANG_SELECT_BOUND__) return;
    window.__LANG_SELECT_BOUND__ = true;

    document.addEventListener("change", (e) => {
      const t = e.target;
      if (!t) return;
      if (t.id !== "langSelectMobile" && t.id !== "langSelectPC") return;

      const langCode = t.value; // 예: index_EN.html
      const lang = (langCode.split('_')[1]?.split('.')[0] || 'ko').toUpperCase();
      localStorage.setItem('lang', lang);
      location.href = langCode;
    });
  })();

  // =========================
  // Nav Support Copy (data-attr 기반, SPA-safe)
  // =========================
  (function () {
    if (window.bindNavSupportCopy) return;

    window.bindNavSupportCopy = function bindNavSupportCopy(root) {
      root = root || document;

      // nav 안에 support 블록이 여러 개일 수도 있으니 모두 처리
      const blocks = root.querySelectorAll('[data-support]');
      if (!blocks.length) return;

      blocks.forEach(block => {
        const btn   = block.querySelector('[data-support-copy]');
        const toast = block.querySelector('[data-support-toast]');
        const numEl = block.querySelector('[data-support-number]');
        const iconBook  = block.querySelector('[data-icon-book]');
        const iconCheck = block.querySelector('[data-icon-check]');

        if (!btn || !toast || !numEl) return;

        // 중복 바인딩 방지
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';

        let timer = null;
        const defaultMsg = (toast.textContent || '').trim() || 'Copied';

        function showToast(msg) {
          toast.textContent = msg || defaultMsg;
          toast.classList.remove('opacity-0');
          toast.classList.add('opacity-100');

          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            toast.classList.add('opacity-0');
            toast.classList.remove('opacity-100');
            toast.textContent = defaultMsg;

            if (iconBook && iconCheck) {
              iconCheck.classList.add('hidden');
              iconBook.classList.remove('hidden');
            }
          }, 1200);
        }

        async function copyText(text) {
          // HTTPS면 Clipboard API
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
          }
          // fallback
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          const ok = document.execCommand('copy');
          document.body.removeChild(ta);
          if (!ok) throw new Error('execCommand copy failed');
          return true;
        }

        btn.addEventListener('click', async (e) => {
          e.preventDefault();

          const text = (numEl.textContent || '').trim();
          if (!text) return;

          try {
            await copyText(text);

            if (iconBook && iconCheck) {
              iconBook.classList.add('hidden');
              iconCheck.classList.remove('hidden');
            }
            showToast();
          } catch (err) {
            showToast('copy failed');
          }
        });
      });
    };
  })();

