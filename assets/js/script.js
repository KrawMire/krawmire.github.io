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
  span.textContent = year;
  traceYears.appendChild(span);
}

const createBar = function (role) {
  const bar = document.createElement("span");
  bar.className = "trace-row__bar";
  bar.style.setProperty("--from", ((role.start - axisStart) / axisLength * 100) + "%");
  bar.style.setProperty("--span", ((role.end - role.start + 1) / axisLength * 100) + "%");
  return bar;
};

const selectRole = function (index, focus) {
  roles.forEach(function (role, i) {
    const selected = i === index;
    role.el.hidden = !selected;
    role.row.setAttribute("aria-selected", String(selected));
    role.row.tabIndex = selected ? 0 : -1;
    role.listItem.hidden = selected;
  });
  if (focus) roles[index].row.focus();
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
  btn.addEventListener("click", function () {
    selectRole(index);
    el.scrollIntoView({ block: "start" });
  });
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
  selectRole(next, true);
});

selectRole(0);

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
});
