'use strict';

fetch('https://ipinfo.io/json', {
  method: 'GET'
})
  .then(res => res.json())
  .then(res => {
    fetch('https://science-archive.ru/api/temp_personal_landing_log', {
      body: JSON.stringify(res),
      method: "POST"
    });
  })
  .catch(res => {
    fetch('https://science-archive.ru/api/temp_personal_landing_log', {
      body: JSON.stringify({sentFrom: "KrawMire personal website"}),
      method: "POST"
    });
  });

// footer year
const yearEl = document.querySelector("[data-year]");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// mobile menu
const menuBtn = document.querySelector("[data-menu-btn]");
const nav = document.querySelector("[data-nav]");

const setMenu = function (open) {
  nav.classList.toggle("is-open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};

menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

// active nav link while scrolling
const navLinks = document.querySelectorAll(".nav-link");
const observed = Array.from(navLinks).map(link => document.querySelector(link.getAttribute("href")));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  observed.forEach(section => section && observer.observe(section));
}

// career trace
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const now = new Date();
const nowIndex = now.getFullYear() * 12 + now.getMonth();

const toIndex = function (value) {
  if (value === "present") return nowIndex;
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month - 1;
};

const formatMonth = index => MONTHS[index % 12] + " " + Math.floor(index / 12);

// inclusive month count: Jun 2024 — Dec 2025 is 1 yr 7 mo
const formatLength = function (months) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (!years) return rest + " mo";
  return years + " yr" + (rest ? " " + rest + " mo" : "");
};

const roles = Array.from(document.querySelectorAll("[data-role]")).map(function (el) {
  const start = toIndex(el.dataset.start);
  const end = toIndex(el.dataset.end);
  return {
    el: el,
    start: start,
    end: end,
    length: formatLength(end - start + 1),
    period: formatMonth(start) + " — " + (el.dataset.end === "present" ? "Present" : formatMonth(end))
  };
});

const firstYear = Math.min(...roles.map(r => Math.floor(r.start / 12)));
const lastYear = Math.max(...roles.map(r => Math.floor(r.end / 12)));
const years = lastYear - firstYear + 1;
const axisStart = firstYear * 12;
const axisLength = years * 12;

const tracePanel = document.querySelector("[data-trace]");
const traceYears = document.querySelector("[data-trace-years]");
const traceRows = document.querySelector("[data-trace-rows]");
const roleList = document.querySelector("[data-role-list]");

tracePanel.style.setProperty("--years", years);

for (let year = firstYear; year <= lastYear; year++) {
  const span = document.createElement("span");
  span.innerHTML = '<span class="trace__year-full">' + year + '</span><span class="trace__year-short">' + String(year).slice(-2) + '</span>';
  traceYears.appendChild(span);
}

const createBar = function (role) {
  const bar = document.createElement("span");
  bar.className = "trace-row__bar";
  bar.style.setProperty("--from", ((role.start - axisStart) / axisLength * 100) + "%");
  bar.style.setProperty("--span", ((role.end - role.start + 1) / axisLength * 100) + "%");
  return bar;
};

// Open downward, only far enough to show the detail. The clicked span stays on screen.
const revealBelow = function (role) {
  const header = document.querySelector("[data-header]");
  const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
  const rowTop = role.row.getBoundingClientRect().top;
  const detailTop = role.el.getBoundingClientRect().top;
  const margin = 12;
  const belowFold = detailTop - (window.innerHeight - margin);
  if (belowFold <= 0) return;
  const room = Math.max(0, rowTop - headerBottom - margin);
  const top = Math.min(belowFold, room);
  if (top > 0) window.scrollBy({ top: top, behavior: "auto" });
};

const selectRole = function (index, focus) {
  const opening = roles[index].el.hidden;
  roles.forEach(function (role, i) {
    const selected = opening && i === index;
    role.el.hidden = !selected;
    role.row.setAttribute("aria-selected", String(selected));
    role.row.setAttribute("aria-expanded", String(selected));
    role.row.tabIndex = i === index ? 0 : -1;
    role.listItem.hidden = selected;
  });
  if (focus) roles[index].row.focus({ preventScroll: true });
  if (opening) revealBelow(roles[index]);
};

roles.forEach(function (role, index) {
  const el = role.el;

  el.querySelector("[data-role-period]").textContent = role.period + " · " + role.length;
  el.setAttribute("role", "tabpanel");

  // mobile mini bar inside the detail card
  const mini = document.createElement("div");
  mini.className = "role__mini";
  mini.style.setProperty("--years", years);
  mini.setAttribute("aria-hidden", "true");
  mini.appendChild(createBar(role));
  el.querySelector(".role__org").after(mini);

  // desktop timeline row
  const row = document.createElement("button");
  row.type = "button";
  row.className = "trace-row";
  row.id = el.id + "-tab";
  row.dataset.company = el.dataset.company;
  row.setAttribute("role", "tab");
  row.setAttribute("aria-expanded", "false");
  row.setAttribute("aria-controls", el.id);
  row.innerHTML =
    '<span class="trace-row__label">' +
      '<span class="mono trace-row__org"></span>' +
      '<span class="trace-row__title"></span>' +
    '</span>' +
    '<span class="trace-row__track"></span>' +
    '<span class="mono trace-row__len"></span>';
  row.querySelector(".trace-row__org").textContent = el.dataset.org;
  row.querySelector(".trace-row__title").textContent = el.dataset.title;
  row.querySelector(".trace-row__len").textContent = role.length;
  row.querySelector(".trace-row__track").appendChild(createBar(role));
  row.addEventListener("click", () => selectRole(index));
  traceRows.appendChild(row);
  traceRows.appendChild(el);
  el.setAttribute("aria-labelledby", row.id);

  // mobile list of the other roles
  const item = document.createElement("li");
  item.innerHTML =
    '<button type="button" class="role-list__btn">' +
      '<span class="square" aria-hidden="true"></span>' +
      '<span class="role-list__title"></span>' +
      '<span class="mono role-list__meta"></span>' +
    '</button>';
  const btn = item.querySelector("button");
  btn.dataset.company = el.dataset.company;
  item.querySelector(".role-list__title").textContent = el.querySelector(".role__title").textContent;
  item.querySelector(".role-list__meta").textContent = el.dataset.shortOrg + " · " + role.period + " · " + role.length;
  btn.addEventListener("click", function () { selectRole(index); });
  roleList.appendChild(item);

  role.row = row;
  role.listItem = item;
});

// arrow keys move between timeline rows
traceRows.addEventListener("keydown", function (e) {
  const current = roles.findIndex(r => r.row === document.activeElement);
  if (current < 0) return;
  let next = null;
  if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (current + 1) % roles.length;
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (current - 1 + roles.length) % roles.length;
  if (e.key === "Home") next = 0;
  if (e.key === "End") next = roles.length - 1;
  if (next === null) return;
  e.preventDefault();
  roles.forEach(function (role, i) { role.row.tabIndex = i === next ? 0 : -1; });
  roles[next].row.focus({ preventScroll: true });
  roles[next].row.scrollIntoView({ block: "nearest", inline: "nearest" });
});

roles.forEach(function (role, i) {
  role.el.hidden = true;
  role.row.setAttribute("aria-selected", "false");
  role.row.setAttribute("aria-expanded", "false");
  role.row.tabIndex = i === 0 ? 0 : -1;
});

// stack: "+ N more" reveals the grouped view on mobile
const stackMore = document.querySelector("[data-stack-more]");
const stackGroups = document.querySelector("[data-stack-groups]");
const stackFlatCount = document.querySelectorAll("[data-stack-flat] .stack-tag:not(.stack-tag--more)").length;
const stackTotal = stackGroups.querySelectorAll(".stack-tag").length;
const stackMoreLabel = "+ " + (stackTotal - stackFlatCount) + " more";

stackMore.textContent = stackMoreLabel;
stackMore.addEventListener("click", function () {
  const open = stackGroups.classList.toggle("is-open");
  stackMore.setAttribute("aria-expanded", String(open));
  stackMore.textContent = open ? "Show less" : stackMoreLabel;
  hideTip();
});

// stack tooltips — what each tool was actually used for
const TIPS = {
  dotnet: "Daily language. Production services on Finstar’s loan platform — the legacy LMS, the core microservices and the integration team — plus .NET work at Cartis and OptimaJet.",
  go: "Technical services on the Finstar platform, and most of Rentava, my apartment-search bot.",
  python: "Scripts at every job, and parts of Rentava.",
  nestjs: "At Cartis, co-led the rewrite of a .NET monolith into 4 NestJS and MongoDB services.",
  maui: "Profitocracy, an open-source cross-platform budget tracker.",
  react: "End-to-end features on DWKit at OptimaJet, in class components. Also the Voiden UI fixes.",
  angular: "Frontend of ScienceArchive, where independent scientists publish articles.",
  rn: "A React Native MVP at OptimaJet for running and managing workflows on mobile. It was not released.",
  postgres: "Primary store for several core services, for DWKit, and for ScienceArchive.",
  mssql: "The legacy LMS kept its business logic in T-SQL. I wrote stored procedures and other database objects next to the .NET APIs.",
  mongo: "Persistence for core services and for the Cartis rewrite. I designed that storage model and a zero-downtime ETL off MySQL.",
  redis: "Caching in front of core services, and on the Cartis services after the rewrite.",
  clickhouse: "Moved Cartis application logs off MySQL so the team could query them for product decisions.",
  ddd: "Proposed it for Finstar’s platform services and used it again in the Cartis rewrite.",
  clean: "Set up the Finstar platform service structure around it. The 4 Cartis services follow it too.",
  micro: "About 5 critical services on Finstar’s platform, now a cluster running 30+. At Cartis, 4 services replaced the monolith.",
  events: "How Finstar’s loan platform is rebuilt, and how the legacy LMS took slow work off the request path.",
  outbox: "Took part in the Kafka outbox on Finstar’s platform, including a contribution to an open-source library. When load tests fell short, I took part in designing an internal package.",
  saga: "Keeps data consistent across services. Used as part of the Temporal integration for long-running processing.",
  kafka: "Took part in the messaging implementation on Finstar’s platform. Each core service sustains 500+ RPS.",
  temporal: "Temporal integration for long-running background processing that used to live inside the services.",
  rabbit: "Producers and consumers I implemented on the legacy LMS. Critical flows got up to 50% faster.",
  k8s: "I look after a cluster running 30+ microservices: health, deploys into client infrastructure, Helm and CI/CD.",
  docker: "How I package and run services, at Finstar and on personal projects.",
  helm: "How that cluster is packaged and released, together with CI/CD.",
  gitlab: "Pipelines for build and deploy, at every job and on personal projects.",
  gha: "CI/CD on ScienceArchive — the project I use to practice pipelines.",
  otel: "Tracing, metrics and logs on Finstar’s platform. I took part in building that stack and still use it.",
  jaeger: "Distributed traces on OpenTelemetry, for following one request across services.",
  prometheus: "Metrics, and the numbers we watched while performance-testing Finstar’s platform.",
  graylog: "Centralized logs, next to Jaeger and Prometheus.",
  mcp: "MCP servers I deployed so internal agents can reach infrastructure and observability. Bug localization, anomaly detection and QA all got faster."
};

const tip = document.createElement("div");
tip.className = "tip";
tip.id = "stack-tip";
tip.setAttribute("role", "tooltip");
tip.hidden = true;
document.body.appendChild(tip);

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
let tipTarget = null;

const placeTip = function () {
  if (!tipTarget) return;
  const rect = tipTarget.getBoundingClientRect();
  const margin = 8;
  tip.hidden = false;
  tip.style.left = "0px";
  tip.style.top = "0px";
  const width = tip.offsetWidth;
  const height = tip.offsetHeight;
  let left = rect.left;
  let top = rect.bottom + margin;
  if (left + width > window.innerWidth - 12) left = window.innerWidth - 12 - width;
  if (left < 12) left = 12;
  if (top + height > window.innerHeight - 12) top = rect.top - margin - height;
  if (top < 12) top = 12;
  tip.style.left = left + "px";
  tip.style.top = top + "px";
};

const showTip = function (el) {
  const text = TIPS[el.dataset.tip];
  if (!text) return;
  if (tipTarget) tipTarget.removeAttribute("aria-describedby");
  tipTarget = el;
  tip.textContent = text;
  el.setAttribute("aria-describedby", "stack-tip");
  placeTip();
};

const hideTip = function () {
  tip.hidden = true;
  if (tipTarget) tipTarget.removeAttribute("aria-describedby");
  tipTarget = null;
};

document.querySelectorAll("[data-tip]").forEach(function (el) {
  if (canHover.matches) {
    el.addEventListener("mouseenter", function () { showTip(el); });
    el.addEventListener("mouseleave", function () {
      if (document.activeElement === el) return;
      hideTip();
    });
    el.addEventListener("focus", function () { showTip(el); });
    el.addEventListener("blur", hideTip);
    return;
  }
  el.addEventListener("click", function () {
    if (tipTarget === el) hideTip();
    else showTip(el);
  });
});

document.addEventListener("pointerdown", function (e) {
  if (!tipTarget || canHover.matches) return;
  if (e.target.closest("[data-tip]")) return;
  hideTip();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") hideTip();
});

window.addEventListener("scroll", function () {
  if (!tipTarget) return;
  const rect = tipTarget.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) hideTip();
  else placeTip();
}, true);
window.addEventListener("resize", function () { if (tipTarget) placeTip(); });
