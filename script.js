// ============================================================
// TARGXT (SCRIPT.JS) - FIXED VERSION
// ============================================================

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1515751038575968428/jMEinQYBTlDpmJCRZxZt7M73eJFB2ydqb5Ywwb-R3NghQyhE9t3CIRPCgDzoUEiZGZA9";

let currentRating = 0;
const USER_ID = crypto.randomUUID();
const ONLINE_KEY = "targxt_online";

// ===============================
// DOM CACHE
// ===============================
const el = {
    searchInput: null,
    resultCards: null,
    results: null,
    noResults: null,
    resultCount: null,
    loading: null,

    advName: null,
    advEmail: null,
    advPhone: null,
    advCity: null,
    advZip: null,

    reviewOverlay: null,
    reviewDesc: null,
    reviewPseudo: null,
    reviewMessage: null,
    ratingText: null,
    charCount: null,
    apiStatus: null
};

// ===============================
// INIT DOM
// ===============================
function initDOM() {
    el.searchInput = document.getElementById("searchInput");
    el.resultCards = document.getElementById("resultCards");
    el.results = document.getElementById("results");
    el.noResults = document.getElementById("noResults");
    el.resultCount = document.getElementById("resultCount");
    el.loading = document.getElementById("loading");

    el.advName = document.getElementById("advName");
    el.advEmail = document.getElementById("advEmail");
    el.advPhone = document.getElementById("advPhone");
    el.advCity = document.getElementById("advCity");
    el.advZip = document.getElementById("advZip");

    el.reviewOverlay = document.getElementById("reviewOverlay");
    el.reviewDesc = document.getElementById("reviewDesc");
    el.reviewPseudo = document.getElementById("reviewPseudo");
    el.reviewMessage = document.getElementById("reviewMessage");
    el.ratingText = document.getElementById("ratingText");
    el.charCount = document.getElementById("charCount");
    el.apiStatus = document.getElementById("apiStatus");
}

// ============================================================
// PARTICLES
// ============================================================
function initParticles() {
    const container = document.getElementById("particles");
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const p = document.createElement("div");
        p.className = "particle";

        p.style.left = Math.random() * 100 + "%";

        const size = Math.random() * 3 + 2;
        p.style.width = size + "px";
        p.style.height = size + "px";

        p.style.animationDuration = (Math.random() * 15 + 10) + "s";
        p.style.animationDelay = (Math.random() * 10) + "s";

        container.appendChild(p);
    }
}

// ============================================================
// SEARCH TYPE
// ============================================================
function detectSearchType(query) {
    query = query.trim();

    if (/@/.test(query)) return "email";
    if (/^\+?\d/.test(query)) return "phone";
    if (query.includes(" ")) return "fullname";

    return "general";
}

// ============================================================
// DB SEARCH
// ============================================================
function searchLocalDB(query, type) {
    const q = query.toLowerCase();
    const db = window.PERSONNES_DATA || [];

    return db.filter(p => {
        const text = Object.values(p).join(" ").toLowerCase();

        if (type === "email") {
            return (p.email || "").toLowerCase().includes(q);
        }

        if (type === "phone") {
            return (p.telephone || "").replace(/\D/g, "")
                .includes(q.replace(/\D/g, ""));
        }

        return text.includes(q);
    });
}

// ============================================================
// ENRICH DATA
// ============================================================
function enrichData(data) {
    return data.map(x => ({
        ...x,
        tags: [
            x.email && "EMAIL",
            x.telephone && "PHONE",
            x.ville && "GEO"
        ].filter(Boolean)
    }));
}

// ============================================================
// SAFE RENDER (ANTI FREEZE)
// ============================================================
function renderCardsChunked(list, chunkSize = 30) {
    el.resultCards.innerHTML = "";

    let i = 0;

    function renderChunk() {
        const slice = list.slice(i, i + chunkSize);

        slice.forEach((p, index) => {
            const initials =
                ((p.prenom?.[0] || "") + (p.nom?.[0] || "")).toUpperCase();

            const fields = [
                ["prenom", "Prenom"],
                ["nom", "Nom"],
                ["email", "Email"],
                ["telephone", "Telephone"],
                ["ville", "Ville"],
                ["adresse", "Adresse"],
                ["codePostal", "Code postal"]
            ];

            const body = fields.map(([k, l]) => {
                if (!p[k]) return "";
                return `
                    <div class="card-field">
                        <span class="label">${l}</span>
                        <span class="value">${p[k]}</span>
                    </div>
                `;
            }).join("");

            const card = document.createElement("div");
            card.className = "result-card";

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-name">
                        <div class="card-avatar">${initials}</div>
                        <h4>${p.prenom || ""} ${p.nom || ""}</h4>
                    </div>
                    <span class="card-source">#${i + index + 1}</span>
                </div>

                <div class="card-body">
                    ${body}
                </div>
            `;

            el.resultCards.appendChild(card);
        });

        i += chunkSize;

        if (i < list.length) {
            requestAnimationFrame(renderChunk);
        }
    }

    renderChunk();
}

// ============================================================
// DISPLAY RESULTS
// ============================================================
function displayResults(list) {
    if (!list.length) {
        el.results.classList.add("hidden");
        el.noResults.classList.remove("hidden");
        return;
    }

    el.noResults.classList.add("hidden");
    el.results.classList.remove("hidden");

    el.resultCount.textContent = list.length;

    renderCardsChunked(list);
}

// ============================================================
// SEARCH
// ============================================================
async function performSearch() {
    const query = el.searchInput.value.trim();
    if (!query) return;

    // /all FIX (no freeze)
    if (query === "/all") {
        const all = enrichData(window.PERSONNES_DATA || []);
        displayResults(all);
        return;
    }

    el.loading.classList.remove("hidden");
    el.results.classList.add("hidden");

    await new Promise(r => setTimeout(r, 300));

    const type = detectSearchType(query);
    const data = searchLocalDB(query, type);

    el.loading.classList.add("hidden");

    displayResults(enrichData(data));
}

// ============================================================
// ADV SEARCH
// ============================================================
function performAdvancedSearch() {
    const values = [
        el.advName.value,
        el.advEmail.value,
        el.advPhone.value,
        el.advCity.value,
        el.advZip.value
    ].join(" ");

    const data = searchLocalDB(values, "general");
    displayResults(enrichData(data));
}

// ============================================================
// QUICK SEARCH
// ============================================================
function setSearch(v) {
    el.searchInput.value = v;
    performSearch();
}

// ============================================================
// TABS
// ============================================================
function switchTab(tab) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

    if (tab === "simple") {
        document.querySelectorAll(".tab")[0].classList.add("active");
        document.getElementById("simpleSearch").classList.add("active");
    } else {
        document.querySelectorAll(".tab")[1].classList.add("active");
        document.getElementById("advancedSearch").classList.add("active");
    }
}

// ============================================================
// REVIEWS + DISCORD WEBHOOK (EMBED)
// ============================================================
function openReviewPanel() {
    el.reviewOverlay.classList.remove("hidden");
}

function closeReviewPanel() {
    el.reviewOverlay.classList.add("hidden");
}

function setRating(v) {
    currentRating = v;

    document.querySelectorAll(".star").forEach((s, i) => {
        if (i < v) {
            s.innerHTML = "★";
            s.classList.add("active");
        } else {
            s.innerHTML = "☆";
            s.classList.remove("active");
        }
    });

    const labels = ["", "Très mauvais", "Mauvais", "Correct", "Bien", "Excellent"];
    el.ratingText.textContent = labels[v] || "Cliquez pour noter";
}

// counter
el.reviewDesc?.addEventListener("input", () => {
    el.charCount.textContent = `${el.reviewDesc.value.length}/500`;
});

// SEND WEBHOOK
async function submitReview() {
    if (!currentRating) return alert("Choisis une note");

    try {
        await fetch(DISCORD_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [{
                    title: "⭐ Nouvel avis",
                    color: 16753920,
                    fields: [
                        {
                            name: "Pseudo",
                            value: el.reviewPseudo.value || "Anonyme",
                            inline: true
                        },
                        {
                            name: "Note",
                            value: `${"⭐".repeat(currentRating)} (${currentRating}/5)`,
                            inline: true
                        },
                        {
                            name: "Commentaire",
                            value: el.reviewDesc.value || "Aucun"
                        }
                    ],
                    timestamp: new Date().toISOString()
                }]
            })
        });

        el.reviewMessage.className = "review-message success";
        el.reviewMessage.textContent = "Envoyé ✔";

        resetReview();

    } catch (e) {
        el.reviewMessage.className = "review-message error";
        el.reviewMessage.textContent = "Erreur webhook";
    }

    el.reviewMessage.classList.remove("hidden");
}

function resetReview() {
    el.reviewDesc.value = "";
    el.reviewPseudo.value = "";
    el.charCount.textContent = "0/500";
    currentRating = 0;

    document.querySelectorAll(".star").forEach(s => {
        s.innerHTML = "☆";
        s.classList.remove("active");
    });

    el.ratingText.textContent = "Cliquez pour noter";
}

// ============================================================
// ONLINE USERS (LOCAL)
// ============================================================
function updateOnline() {
    let users = JSON.parse(localStorage.getItem(ONLINE_KEY) || "{}");

    const now = Date.now();

    Object.keys(users).forEach(id => {
        if (now - users[id] > 15000) delete users[id];
    });

    users[USER_ID] = now;

    localStorage.setItem(ONLINE_KEY, JSON.stringify(users));

    const total = Object.keys(users).length;

    el.apiStatus.innerHTML = `<span class="online-dot"></span>${total} EN LIGNE`;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    initDOM();
    initParticles();

    setInterval(updateOnline, 3000);
    updateOnline();

    el.searchInput?.addEventListener("keydown", e => {
        if (e.key === "Enter") performSearch();
    });
});