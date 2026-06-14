// ============================================================
// TARGXT - FULL SCRIPT (FIX + REVIEWS + ONLINE USERS)
// ============================================================

// =============================
// CONFIG
// =============================
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1515751038575968428/jMEinQYBTlDpmJCRZxZt7M73eJFB2ydqb5Ywwb-R3NghQyhE9t3CIRPCgDzoUEiZGZA9";

const USER_ID = crypto.randomUUID();
const ONLINE_KEY = "targxt_online_users";

// =============================
// INIT GLOBAL STATE
// =============================
let currentRating = 0;

// =============================
// PARTICLES
// =============================
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const count = 30;

    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';

        p.style.left = Math.random() * 100 + '%';
        p.style.width = (Math.random() * 3 + 2) + 'px';
        p.style.height = p.style.width;
        p.style.animationDuration = (Math.random() * 15 + 10) + 's';
        p.style.animationDelay = (Math.random() * 15) + 's';

        const hue = Math.random() > 0.5 ? 280 : 330;
        p.style.background = `hsl(${hue}, 100%, 60%)`;
        p.style.boxShadow = `0 0 10px hsl(${hue}, 100%, 60%)`;

        container.appendChild(p);
    }
}

// =============================
// TABS SYSTEM
// =============================
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    if (tab === 'simple') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('simpleSearch').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('advancedSearch').classList.add('active');
    }
}

// =============================
// DETECT SEARCH TYPE
// =============================
function detectSearchType(query) {
    query = query.trim();

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query)) return 'email';

    const phone = query.replace(/[\s\.\-\/\(\)]/g, '');
    if (/^0[1-9]\d{8}$/.test(phone) || /^\+33\d{9}$/.test(phone)) {
        return 'phone';
    }

    if (query.includes(' ')) return 'fullname';

    return 'general';
}

// =============================
// SEARCH DB
// =============================
function searchLocalDB(query, type) {
    const q = query.toLowerCase().trim();
    const persons = window.PERSONNES_DATA || [];

    return persons.filter(p => {

        const prenom = (p.prenom || '').toLowerCase();
        const nom = (p.nom || '').toLowerCase();

        const fullText = Object.values(p).join(" ").toLowerCase();

        if (type === 'email') {
            return (p.email || '').toLowerCase().includes(q);
        }

        if (type === 'phone') {
            const cleanDB = (p.telephone || '').replace(/\D/g, '');
            const cleanQ = q.replace(/\D/g, '');
            return cleanDB.includes(cleanQ);
        }

        if (type === 'fullname') {
            const parts = q.split(/\s+/);
            if (parts.length >= 2) {
                return (
                    prenom.includes(parts[0]) && nom.includes(parts[1]) ||
                    prenom.includes(parts[1]) && nom.includes(parts[0])
                );
            }
        }

        return fullText.includes(q);
    });
}

// =============================
// ENRICH DATA
// =============================
function enrichData(results) {
    return results.map(p => ({
        ...p,
        score: Math.floor(Math.random() * 100),
        tags: generateTags(p)
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

// =============================
// DISPLAY RESULTS
// =============================
function displayResults(people) {
    const container = document.getElementById('resultCards');
    const resultsSection = document.getElementById('results');
    const noResultsSection = document.getElementById('noResults');

    container.innerHTML = '';

    if (!people.length) {
        resultsSection.classList.add('hidden');
        noResultsSection.classList.remove('hidden');
        return;
    }

    noResultsSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    document.getElementById('resultCount').textContent = people.length;

    const fields = [
        "nom", "prenom", "email", "telephone",
        "ville", "adresse", "codePostal"
    ];

    people.forEach((p, i) => {

        const initials = ((p.prenom?.[0] || '') + (p.nom?.[0] || '')).toUpperCase();

        const body = fields.map(f => {
            if (!p[f]) return "";
            return `
                <div class="card-field">
                    <span class="label">${f}</span>
                    <span class="value">${p[f]}</span>
                </div>
            `;
        }).join("");

        const card = document.createElement('div');
        card.className = 'result-card';

        card.innerHTML = `
            <div class="card-header">
                <div class="card-name">
                    <div class="card-avatar">${initials || "?"}</div>
                    <h4>${p.prenom || ""} ${p.nom || ""}</h4>
                </div>
                <span class="card-source">#${i + 1}</span>
            </div>
            <div class="card-body">${body}</div>
        `;

        container.appendChild(card);
    });
}

// =============================
// SEARCH
// =============================
async function performSearch() {
    const input = document.getElementById('searchInput');
    const query = input.value.trim();

    if (!query) return;

    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('noResults').classList.add('hidden');

    await new Promise(r => setTimeout(r, 400));

    const type = detectSearchType(query);
    const results = searchLocalDB(query, type);

    document.getElementById('loading').classList.add('hidden');

    displayResults(enrichData(results));
}

function setSearch(v) {
    document.getElementById('searchInput').value = v;
    performSearch();
}

// =============================
// ADVANCED SEARCH
// =============================
function performAdvancedSearch() {
    const name = document.getElementById('advName').value.toLowerCase();
    const email = document.getElementById('advEmail').value.toLowerCase();
    const phone = document.getElementById('advPhone').value.replace(/\D/g, '');

    const persons = window.PERSONNES_DATA || [];

    const results = persons.filter(p => {
        const pPhone = (p.telephone || '').replace(/\D/g, '');
        return (
            (!name || `${p.prenom} ${p.nom}`.toLowerCase().includes(name)) &&
            (!email || (p.email || '').toLowerCase().includes(email)) &&
            (!phone || pPhone.includes(phone))
        );
    });

    displayResults(enrichData(results));
}

// =============================
// REVIEW PANEL
// =============================
function openReviewPanel() {
    document.getElementById('reviewOverlay').classList.remove('hidden');
}

function closeReviewPanel(e) {
    if (e) e.stopPropagation();
    document.getElementById('reviewOverlay').classList.add('hidden');
}

function setRating(value) {
    currentRating = value;

    document.querySelectorAll('.star').forEach((s, i) => {
        s.classList.toggle('active', i < value);
        s.textContent = i < value ? "★" : "☆";
    });

    document.getElementById('ratingText').textContent =
        `Note : ${value}/5`;
}

// char counter
document.addEventListener("input", (e) => {
    if (e.target.id === "reviewDesc") {
        document.getElementById("charCount").textContent =
            `${e.target.value.length}/500`;
    }
});

// =============================
// SEND REVIEW
// =============================
async function submitReview() {
    const desc = document.getElementById("reviewDesc").value;
    const pseudo = document.getElementById("reviewPseudo").value || "Anonyme";

    if (!currentRating) {
        alert("Choisis une note !");
        return;
    }

    const payload = {
        content:
`⭐ NOUVEL AVIS TARGXT ⭐
Note: ${currentRating}/5
Pseudo: ${pseudo}
Message: ${desc || "Aucun message"}`
    };

    const msg = document.getElementById("reviewMessage");

    try {
        if (DISCORD_WEBHOOK) {
            await fetch(DISCORD_WEBHOOK, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        msg.className = "review-message success";
        msg.textContent = "Avis envoyé !";
        msg.classList.remove("hidden");

    } catch (err) {
        msg.className = "review-message error";
        msg.textContent = "Erreur envoi.";
        msg.classList.remove("hidden");
    }
}

// =============================
// ONLINE USERS SYSTEM
// =============================
function getUsers() {
    return JSON.parse(localStorage.getItem(ONLINE_KEY) || "{}");
}

function saveUsers(users) {
    localStorage.setItem(ONLINE_KEY, JSON.stringify(users));
}

function updateUser() {
    const users = getUsers();
    users[USER_ID] = Date.now();
    saveUsers(users);
}

function cleanupUsers() {
    const users = getUsers();
    const now = Date.now();

    for (const id in users) {
        if (now - users[id] > 15000) {
            delete users[id];
        }
    }

    saveUsers(users);
}

function updateOnlineUI() {
    const users = getUsers();
    const count = Object.keys(users).length;

    const el = document.getElementById("apiStatus");
    if (el) {
        el.textContent = `👥 ${count} EN LIGNE | MODE: LOCAL ENGINE`;
    }
}

// heartbeat
setInterval(() => {
    updateUser();
    cleanupUsers();
    updateOnlineUI();
}, 3000);

// remove on exit
window.addEventListener("beforeunload", () => {
    const users = getUsers();
    delete users[USER_ID];
    saveUsers(users);
});

// =============================
// INIT
// =============================
document.addEventListener("DOMContentLoaded", () => {
    initParticles();

    updateUser();
    updateOnlineUI();

    document.getElementById("searchInput")?.addEventListener("keydown", e => {
        if (e.key === "Enter") performSearch();
    });
});