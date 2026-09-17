const STORAGE_KEY = "comfortLukicUpiti";
const form = document.querySelector("#inquiry-form");
const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector("#main-nav");
const success = document.querySelector("#success");
const customColorField = document.querySelector("#custom-color-field");
const customColorInput = document.querySelector("#custom-color");
let quantity = 1;

menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") === "true";
  menu.setAttribute("aria-expanded", String(!open));
  nav.classList.toggle("open", !open);
});
nav.addEventListener("click", () => {
  nav.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
});
addEventListener(
  "scroll",
  () =>
    document
      .querySelector(".site-header")
      .classList.toggle("scrolled", scrollY > 10),
  { passive: true },
);

document.querySelectorAll(".product-inquiry").forEach((button) =>
  button.addEventListener("click", () => {
    const input = [...form.elements.proizvod].find(
      (item) => item.value === button.dataset.product,
    );
    if (input) input.checked = true;
    document.querySelector("#product-error").classList.remove("show");
    document.querySelector("#upit").scrollIntoView({ behavior: "smooth" });
  }),
);

document.querySelectorAll('[name="dimenzije"]').forEach((radio) =>
  radio.addEventListener("change", () => {
    document.querySelector(".dimensions").hidden =
      form.elements.dimenzije.value !== "Da";
  }),
);

function updateCustomColor() {
  const isCustom = form.elements.boja.value === "Druga boja / po dogovoru";
  customColorField.classList.toggle("visible", isCustom);
  customColorField.setAttribute("aria-hidden", String(!isCustom));
  if (!isCustom) {
    customColorInput.value = "";
    customColorField.classList.remove("invalid");
  }
}
document
  .querySelectorAll('[name="boja"]')
  .forEach((radio) => radio.addEventListener("change", updateCustomColor));
updateCustomColor();

const quantityOutput = document.querySelector("#quantity");
function setQuantity(value) {
  quantity = Math.max(1, Math.min(20, value));
  quantityOutput.textContent = quantity;
}
document
  .querySelector("#minus")
  .addEventListener("click", () => setQuantity(quantity - 1));
document
  .querySelector("#plus")
  .addEventListener("click", () => setQuantity(quantity + 1));

const fileInput = form.elements.fotografija;
fileInput.addEventListener("change", () => {
  document.querySelector("#file-name").textContent =
    fileInput.files[0]?.name || "JPG, PNG ili WEBP";
  fileInput
    .closest(".file-picker")
    .classList.toggle("has-file", Boolean(fileInput.files[0]));
});

const lightbox = document.querySelector(".lightbox");
document.querySelectorAll(".gallery-item").forEach((item) =>
  item.addEventListener("click", () => {
    const image = item.querySelector("img");
    lightbox.querySelector("img").src = image.src;
    lightbox.querySelector("img").alt = image.alt;
    lightbox.querySelector("p").textContent = item.dataset.caption;
    lightbox.showModal();
  }),
);
lightbox
  .querySelector("button")
  .addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});

const selected = (name) =>
  [...form.querySelectorAll(`[name="${name}"]:checked`)].map(
    (item) => item.value,
  );
function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}
function validate() {
  let valid = true;
  const products = selected("proizvod");
  document
    .querySelector("#product-error")
    .classList.toggle("show", !products.length);
  if (!products.length) valid = false;
  ["ime", "telefon"].forEach((name) => {
    const input = form.elements[name];
    const invalid = !input.value.trim();
    input.closest("label").classList.toggle("invalid", invalid);
    if (invalid) valid = false;
  });
  const email = form.elements.email;
  const badEmail = email.value && !email.validity.valid;
  email.closest("label").classList.toggle("invalid", badEmail);
  if (badEmail) valid = false;
  const customColorMissing =
    form.elements.boja.value === "Druga boja / po dogovoru" &&
    !customColorInput.value.trim();
  customColorField.classList.toggle("invalid", customColorMissing);
  if (customColorMissing) valid = false;
  return valid;
}
form.addEventListener("input", (event) =>
  event.target
    .closest("label, .custom-color-field")
    ?.classList.remove("invalid"),
);

function readInquiries() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function nextId(inquiries) {
  const highest = inquiries.reduce(
    (max, inquiry) =>
      Math.max(max, Number(String(inquiry.id || "").match(/\d+/)?.[0]) || 0),
    0,
  );
  return `UPIT-${String(highest + 1).padStart(3, "0")}`;
}
function buildInquiry() {
  const inquiries = readInquiries();
  const dimensionsKnown = form.elements.dimenzije.value === "Da";
  const color =
    form.elements.boja.value === "Druga boja / po dogovoru"
      ? customColorInput.value.trim()
      : form.elements.boja.value;
  return {
    id: nextId(inquiries),
    createdAt: new Date().toISOString(),
    status: "Novi",
    customer: {
      name: form.elements.ime.value.trim(),
      phone: form.elements.telefon.value.trim(),
      email: form.elements.email.value.trim(),
      city: form.elements.grad.value.trim(),
    },
    products: selected("proizvod"),
    dimensionsKnown,
    dimensions: {
      width: dimensionsKnown ? form.elements.sirina.value : "",
      length: dimensionsKnown ? form.elements.duzina.value : "",
      depth: dimensionsKnown ? form.elements.dubina.value : "",
    },
    material: form.elements.materijal.value,
    color,
    quantity,
    attachmentName: fileInput.files[0]?.name || "",
    notes: form.elements.napomene.value.trim(),
  };
}
function dimensionsSummary(inquiry) {
  if (!inquiry.dimensionsKnown)
    return "Potrebna pomoć pri određivanju dimenzija";
  return (
    [
      inquiry.dimensions.width && `širina ${inquiry.dimensions.width} cm`,
      inquiry.dimensions.length && `dužina ${inquiry.dimensions.length} cm`,
      inquiry.dimensions.depth && `dubina ${inquiry.dimensions.depth} cm`,
    ]
      .filter(Boolean)
      .join(", ") || "Dimenzije će biti naknadno potvrđene"
  );
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate()) {
    form
      .querySelector(".show, .invalid")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const inquiry = buildInquiry();
  const inquiries = readInquiries();
  inquiries.push(inquiry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inquiries));
  const rows = [
    ["Proizvod", inquiry.products.join(", ")],
    ["Dimenzije", dimensionsSummary(inquiry)],
    ["Materijal", inquiry.material],
    ["Boja", inquiry.color],
    ["Količina", inquiry.quantity],
    ["Fotografija", inquiry.attachmentName || "Nije dodata"],
    ["Napomena", inquiry.notes || "Nema dodatnih napomena"],
    ["Kontakt", `${inquiry.customer.name} · ${inquiry.customer.phone}`],
    ["Email", inquiry.customer.email || "Nije naveden"],
    ["Grad / mjesto", inquiry.customer.city || "Nije navedeno"],
  ];
  document.querySelector("#inquiry-number").textContent =
    `Broj upita: ${inquiry.id}`;
  document.querySelector("#summary").innerHTML =
    `<div class="summary-card"><h4>Sažetak vašeg upita</h4><dl>${rows.map(([term, value]) => `<dt>${term}</dt><dd>${escapeHtml(String(value))}</dd>`).join("")}</dl></div>`;
  form.hidden = true;
  document.querySelector(".inquiry-intro").hidden = true;
  success.hidden = false;
  success.focus();
});

document.querySelector("#new-inquiry").addEventListener("click", () => {
  form.reset();
  setQuantity(1);
  document.querySelector(".dimensions").hidden = true;
  document.querySelector("#file-name").textContent = "JPG, PNG ili WEBP";
  fileInput.closest(".file-picker").classList.remove("has-file");
  updateCustomColor();
  success.hidden = true;
  form.hidden = false;
  document.querySelector(".inquiry-intro").hidden = false;
  document.querySelector("#upit").scrollIntoView({ behavior: "smooth" });
});
document.querySelector("#year").textContent = new Date().getFullYear();

const observer = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }),
  { threshold: 0.12 },
);
document
  .querySelectorAll(".reveal")
  .forEach((element) => observer.observe(element));

function applyOptions(options = {}) {
  if (Array.isArray(options.proizvodi))
    [...form.elements.proizvod].forEach((input) => {
      input.checked = options.proizvodi.includes(input.value);
    });
  if (options.materijal) {
    const input = [...form.elements.materijal].find(
      (item) => item.value === options.materijal,
    );
    if (input) input.checked = true;
  }
  if (options.boja) {
    const input = [...form.elements.boja].find(
      (item) => item.value === options.boja,
    );
    if (input) input.checked = true;
  }
  if (Number.isInteger(options.kolicina)) setQuantity(options.kolicina);
  updateCustomColor();
  document.querySelector("#upit").scrollIntoView({ behavior: "smooth" });
  return {
    proizvodi: selected("proizvod"),
    materijal: form.elements.materijal.value,
    boja: form.elements.boja.value,
    kolicina: quantity,
  };
}
if (document.modelContext?.registerTool)
  document.modelContext.registerTool({
    name: "pripremi_upit_za_namjestaj",
    title: "Pripremi upit za namještaj",
    description:
      "Bira proizvode i opcije u vidljivom formularu i otvara sekciju za upit.",
    inputSchema: {
      type: "object",
      properties: {
        proizvodi: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "Ugaona garnitura",
              "Trosjed / dvosjed",
              "Krevet",
              "Fotelja",
              "Namještaj po mjeri",
              "Nešto drugo",
            ],
          },
        },
        materijal: {
          type: "string",
          enum: [
            "Štof",
            "Velur",
            "Eko koža",
            "Nisam siguran – želim preporuku",
          ],
        },
        boja: {
          type: "string",
          enum: [
            "Krem",
            "Siva",
            "Smeđa",
            "Maslinasta",
            "Druga boja / po dogovoru",
          ],
        },
        kolicina: { type: "integer", minimum: 1, maximum: 20 },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: applyOptions,
  });
