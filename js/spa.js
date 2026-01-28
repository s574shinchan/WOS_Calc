// JavaScript Document
async function loadPage(file){
  const mount = document.getElementById("mainMount");

  // 주소창 파일명 제거
  history.replaceState({}, "", "/");

  const res = await fetch(file);
  const html = await res.text();

  mount.innerHTML = html;

  // script 재실행
  mount.querySelectorAll("script").forEach(old => {
    const s = document.createElement("script");
    s.textContent = old.textContent;
    document.body.appendChild(s);
    old.remove();
  });

  // init 함수 있으면 호출
  if (typeof pageInit === "function") pageInit();
}

function setPageStyle(href){
  const link = document.getElementById("page-style");
  if (!href) {
    link.removeAttribute("href");
    return;
  }
  link.setAttribute("href", href + "?v=" + Date.now()); // 캐시방지
}

// 메뉴 클릭 가로채기
document.addEventListener("click", e => {
  const a = e.target.closest("a[data-page]");
  if (!a) return;

  e.preventDefault();
  loadPage(a.dataset.page);
});
