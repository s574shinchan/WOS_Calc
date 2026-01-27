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

// common.js

// Home 메뉴 (전역 함수로 등록되어야 onclick에서 호출 가능)
window.ReturnHome = function () {
  // 1) 공통: 메뉴 닫기
  document.querySelectorAll('.dd.open').forEach(dd => dd.classList.remove('open'));
  document.querySelectorAll('.dd-item.active').forEach(x => x.classList.remove('active'));

  // 2) (구 프레임 UI 흔적이 있어도 에러 없이)
  document.getElementById("guideDetails")?.classList.remove('hidden');
  document.getElementById('frameWrapper')?.classList.add('hidden');

  // 3) 홈으로 이동
  // 캐시 때문에 새로고침 느낌 필요하면 v 붙여라
  location.href = 'index.html';
  // location.replace('index.html'); // 뒤로가기 기록 남기기 싫으면 이걸로
  // location.href = 'index.html?v=' + Date.now(); // 강제 갱신 필요하면 이걸로
};
