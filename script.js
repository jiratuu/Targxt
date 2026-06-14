// ============================================================
// TARGXT - FULL SCRIPT CLEAN VERSION
// ============================================================

// =========================
// CONFIG (DISCORD WEBHOOK)
// =========================
// ⚠️ Mets ton webhook ici si tu veux envoyer les avis sur Discord
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1515751038575968428/jMEinQYBTlDpmJCRZxZt7M73eJFB2ydqb5Ywwb-R3NghQyhE9t3CIRPCgDzoUEiZGZA9";

// ============================================================
// PARTICLES
// ============================================================
function initParticles() {
    const container = document.getElementById("particles");
    if (!container) return;

    const count = 30;

    for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "particle";

        p.style.left = Math.random() * 100 + "%";
        p.style.width = (Math.random() * 3 + 2) + "px";
        p.style.height = p.style.width;
        p.style.animationDuration = (Math.random() * 15 + 10) + "s";
        p.style.animationDelay = (Math.random() * 15) + "s";

        const hue = Math.random() > 0.5 ? 280 : 330;
        p.style.background = `hsl(${hue}, 100%, 60%)`;

        container.appendChild(p);
    }
}

// ============================================================
// SEARCH TYPE
// ============================================================
function detectSearchType(query) {
    query = query.trim();

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) return "email";

    const phone = query.replace(/\D/g, "");
    if (/^0[1-9]\d{8}$/.test(phone) || /^\+33\d{9}$/.test(phone)) {
        return "phone";
    }

    if (query.includes(" ")) return "fullname";

    return "general";
}

// ============================================================
// SEARCH DB
// ============================================================
function searchLocalDB(query, type) {
    const q = query.toLowerCase().trim();
    const db = window.PERSONNES_DATA || [];

    return db.filter(p => {
        const prenom = (p.prenom || "").toLowerCase();
        const nom = (p.nom || "").toLowerCase();

        const fullText = `
            ${p.prenom || ""}
            ${p.nom || ""}
            ${p.email || ""}
            ${p.telephone || ""}
            ${p.ville || ""}
            ${p.adresse || ""}
            ${p.codePostal || ""}
            ${p.dateNaissance || ""}
            ${p.lieuNaissance || ""}
            ${p.genre || ""}
        `.toLowerCase();

        if (type === "email") {
            return (p.email || "").toLowerCase().includes(q);
        }

        if (type === "phone") {
            return (p.telephone || "").replace(/\D/g, "").includes(q.replace(/\D/g, ""));
        }

        if (type === "fullname") {
            const parts = q.split(" ");
            if (parts.length >= 2) {
                return (
                    (prenom.includes(parts[0]) && nom.includes(parts[1])) ||
                    (prenom.includes(parts[1]) && nom.includes(parts[0]))
                );
            }
            return false;
        }

        return fullText.includes(q);
    });
}

// ============================================================
// ENRICH DATA
// ============================================================
function enrichData(results) {
    return results.map(p => ({
        ...p,
        score: Math.floor(Math.random() * 100),
        tags: generateTags(p),
        source: "LOCAL_ENGINE"
    }));
}

function generateTags(p) {
    const tags = [];
    if (p.email) tags.push("EMAIL");
    if (p.telephone) tags.push("PHONE");
    if (p.ville) tags.push("GEO");
    if (p.dateNaissance) tags.push("BIRTH");
    return tags;
}

// ============================================================
// DISPLAY RESULTS
// ============================================================
function displayResults(results) {
    const container = document.getElementById("resultCards");
    const resultsSection = document.getElementById("results");
    const noResults = document.getElementById("noResults");

    container.innerHTML = "";

    if (!results || results.length === 0) {
        resultsSection.classList.add("hidden");
        noResults.classList.remove("hidden");
        return;
    }

    noResults.classList.add("hidden");
    resultsSection.classList.remove("hidden");

    document.getElementById("resultCount").textContent = results.length;

    const fields = [
        "nom", "prenom", "email", "telephone",
        "ville", "adresse", "codePostal",
        "dateNaissance", "lieuNaissance", "genre"
    ];

    results.forEach((p, i) => {

        const initials = ((p.prenom?.[0] || "") + (p.nom?.[0] || "")).toUpperCase();

        const body = fields.map(f => {
            const v = p[f];
            if (!v) return "";
            return `
                <div class="card-field">
                    <span class="label">${f}</span>
                    <span class="value">${v}</span>
                </div>
            `;
        }).join("");

        const card = document.createElement("div");
        card.className = "result-card";

        card.innerHTML = `
            <div class="card-header">
                <div class="card-name">
                    <div class="card-avatar">${initials || "?"}</div>
                    <h4>${p.prenom || ""} ${p.nom || ""}</h4>
                </div>
                <span class="card-source">#${i + 1}</span>
            </div>

            <div class="card-body">
                ${body}
            </div>

            ${p.tags?.length ? `
                <div style="margin-top:10px; display:flex; gap:6px; flex-wrap:wrap;">
                    ${p.tags.map(t => `
                        <span style="font-size:10px;padding:3px 8px;border:1px solid #bf00ff;color:#bf00ff;border-radius:20px;">
                            ${t}
                        </span>
                    `).join("")}
                </div>
            ` : ""}
        `;

        container.appendChild(card);
    });
}

// ============================================================
// SEARCH
// ============================================================
async function performSearch() {
    const input = document.getElementById("searchInput");
    const query = input.value.trim();

    if (!query || query.length < 2) return;

    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("results").classList.add("hidden");
    document.getElementById("noResults").classList.add("hidden");

    await new Promise(r => setTimeout(r, 400));

    const type = detectSearchType(query);
    let results = searchLocalDB(query, type);

    results = enrichData(results);

    document.getElementById("loading").classList.add("hidden");

    displayResults(results);
}

function setSearch(v) {
    document.getElementById("searchInput").value = v;
    performSearch();
}

// ============================================================
// ADVANCED SEARCH
// ============================================================
function performAdvancedSearch() {
    const name = document.getElementById("advName").value.toLowerCase();
    const email = document.getElementById("advEmail").value.toLowerCase();
    const phone = document.getElementById("advPhone").value.replace(/\D/g, "");
    const city = document.getElementById("advCity").value.toLowerCase();
    const zip = document.getElementById("advZip").value.toLowerCase();

    const db = window.PERSONNES_DATA || [];

    const results = db.filter(p => {
        return (
            (!name || (`${p.prenom} ${p.nom}`.toLowerCase().includes(name))) &&
            (!email || (p.email || "").toLowerCase().includes(email)) &&
            (!phone || (p.telephone || "").replace(/\D/g, "").includes(phone)) &&
            (!city || (p.ville || "").toLowerCase().includes(city)) &&
            (!zip || (p.codePostal || "").toLowerCase().includes(zip))
        );
    });

    displayResults(enrichData(results));
}

// ============================================================
// TABS
// ============================================================
function switchTab(tab) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

    if (tab === "simple") {
        document.getElementById("simpleSearch").classList.add("active");
        document.querySelectorAll(".tab")[0].classList.add("active");
    } else {
        document.getElementById("advancedSearch").classList.add("active");
        document.querySelectorAll(".tab")[1].classList.add("active");
    }
}

// ============================================================
// REVIEWS SYSTEM
// ============================================================
let rating = 0;

function openReviewPanel() {
    document.getElementById("reviewOverlay").classList.remove("hidden");
}

function closeReviewPanel(e) {
    if (e) e.stopPropagation();
    document.getElementById("reviewOverlay").classList.add("hidden");
    resetReview();
}

function setRating(v) {
    rating = v;

    document.querySelectorAll(".star").forEach((s, i) => {
        s.classList.toggle("active", i < v);
    });

    const texts = ["", "Très mauvais", "Mauvais", "Correct", "Bon", "Excellent"];
    document.getElementById("ratingText").textContent = texts[v];
}

function submitReview() {
    const pseudo = document.getElementById("reviewPseudo").value || "Anonyme";
    const desc = document.getElementById("reviewDesc").value;

    if (!rating) return showMsg("Note requise", "error");

    const review = {
        pseudo,
        rating,
        description: desc,
        date: new Date().toISOString()
    };

    // local save
    const list = JSON.parse(localStorage.getItem("targxt_reviews")) || [];
    list.push(review);
    localStorage.setItem("targxt_reviews", JSON.stringify(list));

    // discord webhook
    if (DISCORD_WEBHOOK_URL) {
        fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: "⭐ Nouvel avis",
                embeds: [{
                    title: "Avis utilisateur",
                    color: 0xffaa00,
                    fields: [
                        { name: "Pseudo", value: pseudo },
                        { name: "Note", value: "⭐".repeat(rating) },
                        { name: "Commentaire", value: desc || "Aucun" }
                    ]
                }]
            })
        });
    }

    showMsg("Avis envoyé ✔", "success");

    setTimeout(() => closeReviewPanel(), 1000);
}

function showMsg(t, type) {
    const m = document.getElementById("reviewMessage");
    m.textContent = t;
    m.className = `review-message ${type}`;
    m.classList.remove("hidden");

    setTimeout(() => m.classList.add("hidden"), 2500);
}

function resetReview() {
    rating = 0;
    document.querySelectorAll(".star").forEach(s => s.classList.remove("active"));
    document.getElementById("reviewPseudo").value = "";
    document.getElementById("reviewDesc").value = "";
    document.getElementById("ratingText").textContent = "Cliquez pour noter";
}

// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
    initParticles();

    document.getElementById("searchInput")?.addEventListener("keydown", e => {
        if (e.key === "Enter") performSearch();
    });

    const hero = document.querySelector(".hero");
    if (hero) {
        hero.style.opacity = "0";
        hero.style.transform = "translateY(30px)";

        setTimeout(() => {
            hero.style.transition = "0.8s ease";
            hero.style.opacity = "1";
            hero.style.transform = "translateY(0)";
        }, 200);
    }
});