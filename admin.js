const STORAGE_KEY = "comfortLukicUpiti";
const list = document.querySelector("#inquiry-list");
const emptyState = document.querySelector("#empty-state");
const filter = document.querySelector("#status-filter");
const dialog = document.querySelector("#detail-dialog");
let activeId = null;

function readInquiries() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function saveInquiries(inquiries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inquiries));
}
function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value ?? "";
  return element.innerHTML;
}
function formatDate(value) {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
function isToday(value) {
  const date = new Date(value),
    today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function render() {
  const inquiries = readInquiries().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  document.querySelector("#new-count").textContent = inquiries.filter(
    (item) => item.status === "Novi",
  ).length;
  document.querySelector("#total-count").textContent = inquiries.length;
  document.querySelector("#today-count").textContent = inquiries.filter(
    (item) => isToday(item.createdAt),
  ).length;
  const filtered =
    filter.value === "Svi"
      ? inquiries
      : inquiries.filter((item) => item.status === filter.value);
  emptyState.hidden = filtered.length > 0;
  document.querySelector(".inquiry-table-wrap").hidden = filtered.length === 0;
  list.innerHTML = filtered
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.id)}</td><td class="customer-cell"><strong>${escapeHtml(item.customer.name)}</strong><small>${escapeHtml(item.customer.city || "Mjesto nije navedeno")}</small></td><td>${escapeHtml(item.customer.phone)}</td><td>${escapeHtml(item.products.join(", "))}</td><td>${escapeHtml(formatDate(item.createdAt))}</td><td><span class="status-badge ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td><td><button class="view-button" type="button" data-id="${escapeHtml(item.id)}">Pogledaj</button></td></tr>`,
    )
    .join("");
}

function detailItem(label, value, extra = "") {
  return `<div class="detail-item ${extra}"><span>${label}</span><strong>${escapeHtml(value || "Nije navedeno")}</strong></div>`;
}
function openDetail(id) {
  const inquiry = readInquiries().find((item) => item.id === id);
  if (!inquiry) return;
  activeId = id;
  const dimensions = inquiry.dimensionsKnown
    ? `<div class="detail-grid">${detailItem("Širina", inquiry.dimensions.width ? `${inquiry.dimensions.width} cm` : "Nije navedeno")}${detailItem("Dužina", inquiry.dimensions.length ? `${inquiry.dimensions.length} cm` : "Nije navedeno")}${detailItem("Dubina", inquiry.dimensions.depth ? `${inquiry.dimensions.depth} cm` : "Nije navedeno")}</div>`
    : "<p>Kupac je označio da mu je potrebna pomoć oko dimenzija.</p>";
  const attachment = inquiry.attachmentName
    ? `<button class="file-chip" type="button" aria-expanded="false">${escapeHtml(inquiry.attachmentName)}<span>Pogledaj</span></button><p class="file-note" hidden>U ovoj demo verziji sačuvan je samo naziv datoteke. Sama fotografija nije prenesena, pa se ne može otvoriti.</p>`
    : "<p>Fotografija nije dodata.</p>";
  dialog.querySelector("#detail-content").innerHTML =
    `<div class="detail-inner"><div class="detail-top"><p class="eyebrow">Detalji upita</p><h2>${escapeHtml(inquiry.id)}</h2><span class="status-badge ${escapeHtml(inquiry.status)}">${escapeHtml(inquiry.status)}</span><p class="detail-date">Poslato ${escapeHtml(formatDate(inquiry.createdAt))}</p></div><section class="detail-section"><h3>Kupac</h3><div class="detail-grid">${detailItem("Ime i prezime", inquiry.customer.name)}${detailItem("Telefon", inquiry.customer.phone, "phone")}${detailItem("Email", inquiry.customer.email)}${detailItem("Grad / mjesto", inquiry.customer.city)}</div></section><section class="detail-section"><h3>Zahtjev</h3><div class="detail-grid">${detailItem("Šta kupac želi", inquiry.products.join(", "))}${detailItem("Količina", `${inquiry.quantity} kom.`)}${detailItem("Materijal", inquiry.material)}${detailItem("Boja", inquiry.color)}</div></section><section class="detail-section"><h3>Dimenzije</h3>${dimensions}</section><section class="detail-section"><h3>Fotografija / primjer</h3>${attachment}</section><section class="detail-section"><h3>Napomena kupca</h3><div class="notes-block">${escapeHtml(inquiry.notes || "Kupac nije ostavio dodatnu napomenu.")}</div></section><div class="detail-actions"><button class="primary" type="button" data-status="Kontaktiran">Kontaktiran</button><button type="button" data-status="Arhiviran">Arhiviraj</button></div></div>`;
  if (!dialog.open) dialog.showModal();
}

list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-id]");
  if (button) openDetail(button.dataset.id);
});
filter.addEventListener("change", render);
dialog
  .querySelector(".detail-close")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("click", (event) => {
  const fileButton = event.target.closest(".file-chip");
  if (fileButton) {
    const note = fileButton.nextElementSibling;
    const isOpen = fileButton.getAttribute("aria-expanded") === "true";
    fileButton.setAttribute("aria-expanded", String(!isOpen));
    fileButton.querySelector("span").textContent = isOpen
      ? "Pogledaj"
      : "Razumijem";
    note.hidden = isOpen;
    return;
  }
  const button = event.target.closest("[data-status]");
  if (!button || !activeId) return;
  const inquiries = readInquiries();
  const inquiry = inquiries.find((item) => item.id === activeId);
  if (!inquiry) return;
  inquiry.status = button.dataset.status;
  saveInquiries(inquiries);
  render();
  openDetail(activeId);
});
render();
