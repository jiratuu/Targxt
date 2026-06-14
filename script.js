// ============================================================
// TARGXT - OSINT ENGINE (LOCAL VERSION STABLE)
// ============================================================

// -----------------------------
// PARTICULES
// -----------------------------
function initParticles() {
    const container = document.getElementById('particles');
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

// -----------------------------
// DETECT SEARCH TYPE
// -----------------------------
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

// -----------------------------
// LOCAL SEARCH ENGINE
// -----------------------------

function searchLocalDB(query, type) {
    const q = query.toLowerCase().trim();
    const persons = window.PERSONNES_DATA || [];

    return persons.filter(p => {

        const prenom = (p.prenom || '').toLowerCase().trim();
        const nom = (p.nom || '').toLowerCase().trim();

        const fullText = `
            ${p.prenom || ''}
            ${p.nom || ''}
            ${p.email || ''}
            ${p.telephone || ''}
            ${p.ville || ''}
            ${p.adresse || ''}
            ${p.codePostal || ''}
            ${p.lieuNaissance || ''}
            ${p.dateNaissance || ''}
            ${p.genre || ''}
        `.toLowerCase();

        if (type === 'email') {
            return (p.email || '').toLowerCase().includes(q);
        }

        if (type === 'phone') {
            const cleanDB = (p.telephone || '').replace(/\D/g, '');
            const cleanQ = q.replace(/\D/g, '');
            return cleanDB.includes(cleanQ);
        }

        if (type === 'fullname') {
            const parts = q.split(/\s+/).filter(Boolean);
            if (parts.length >= 2) {
                const first = parts[0];
                const second = parts[1];
                return (
                    (prenom === first && nom === second) ||
                    (prenom === second && nom === first) ||
                    (prenom.includes(first) && nom.includes(second)) ||
                    (prenom.includes(second) && nom.includes(first))
                );
            }
            return false;
        }

        return fullText.includes(q);
    });
}

// -----------------------------
// OSINT ENRICHMENT LAYER
// -----------------------------
function enrichData(results) {
    return results.map(p => ({
        ...p,
        score: Math.floor(Math.random() * 100),
        source: "LOCAL_ENGINE",
        tags: generateTags(p)
    }));
}

// -----------------------------
// TAG GENERATOR
// -----------------------------
function generateTags(p) {
    const tags = [];
    if (p.email) tags.push("EMAIL");
    if (p.telephone) tags.push("PHONE");
    if (p.ville) tags.push("GEO");
    if (p.dateNaissance) tags.push("BIRTH");
    if (p.codePostal) tags.push("ZIP");
    if (p.lieuNaissance) tags.push("BIRTHPLACE");
    return tags;
}

// -----------------------------
// DISPLAY RESULTS
// -----------------------------
function displayResults(people) {
    const container = document.getElementById('resultCards');
    const resultsSection = document.getElementById('results');
    const noResultsSection = document.getElementById('noResults');

    container.innerHTML = '';

    if (!people || people.length === 0) {
        resultsSection.classList.add('hidden');
        noResultsSection.classList.remove('hidden');
        return;
    }

    noResultsSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    document.getElementById('resultCount').textContent = people.length;

    people.forEach((p, index) => {
        const initials = ((p.prenom?.[0] || '') + (p.nom?.[0] || '')).toUpperCase() || '?';
        const isMale = ['M', 'Masculin', 'Monsieur'].includes(p.genre);

        const card = document.createElement('div');
        card.className = 'result-card';

        card.innerHTML = `
            <div class="card-header">
                <div class="card-name">
                    <div class="card-avatar">${initials}</div>
                    <h4>
                        ${p.prenom || ''} ${p.nom || ''}
                        ${p.genre ? `<span class="genre-badge ${isMale ? 'male' : 'female'}">${p.genre}</span>` : ''}
                    </h4>
                </div>
                <span class="card-source">#${index + 1}</span>
            </div>
            <div class="card-body">
                <div class="card-field"><span class="label">Nom</span><span class="value">${p.nom || '-'}</span></div>
                <div class="card-field"><span class="label">Prenom</span><span class="value">${p.prenom || '-'}</span></div>
                <div class="card-field"><span class="label">Genre</span><span class="value">${p.genre || '-'}</span></div>
                <div class="card-field"><span class="label">Date de naissance</span><span class="value">${p.dateNaissance || '-'}</span></div>
                <div class="card-field"><span class="label">Lieu de naissance</span><span class="value">${p.lieuNaissance || '-'}</span></div>
                <div class="card-field"><span class="label">Email</span><span class="value email">${p.email || '-'}</span></div>
                <div class="card-field"><span class="label">Telephone</span><span class="value phone">${p.telephone || '-'}</span></div>
                <div class="card-field"><span class="label">Ville</span><span class="value">${p.ville || '-'}</span></div>
                <div class="card-field"><span class="label">Code postal</span><span class="value">${p.codePostal || '-'}</span></div>
                <div class="card-field"><span class="label">Adresse</span><span class="value">${p.adresse || '-'}</span></div>
            </div>
            ${p.tags ? `
                <div style="margin-top:12px; display:flex; gap:6px; flex-wrap:wrap;">
                    ${p.tags.map(t => `
                        <span style="font-size:10px;padding:3px 8px;border:1px solid #bf00ff;color:#bf00ff;border-radius:20px;font-family:var(--font-mono);">${t}</span>
                    `).join('')}
                </div>
            ` : ""}
        `;

        container.appendChild(card);
    });
}

// -----------------------------
// MAIN SEARCH ENGINE
// -----------------------------
async function performSearch() {
    const input = document.getElementById('searchInput');
    const query = input.value.trim();

    if (query === "/all") {
        const allPeople = enrichData(window.PERSONNES_DATA || []);
        displayResults(allPeople);
        setOnlineStatus();
        return;
    }

    if (!query || query.length < 2) return;

    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const noResults = document.getElementById('noResults');

    results.classList.add('hidden');
    noResults.classList.add('hidden');
    loading.classList.remove('hidden');

    await new Promise(r => setTimeout(r, 500));

    const type = detectSearchType(query);
    let resultsData = searchLocalDB(query, type);
    resultsData = enrichData(resultsData);

    loading.classList.add('hidden');
    displayResults(resultsData);
    setOnlineStatus();
}

function setSearch(value) {
    document.getElementById('searchInput').value = value;
    performSearch();
}

// ============================================================
// COMPTEUR EN LIGNE
// ============================================================

let onlineSessions = {};
const SESSION_TIMEOUT = 8000;
const HEARTBEAT_INTERVAL = 3000;

function getTabId() {
    let id = sessionStorage.getItem('targxt_tab_id');
    if (!id) {
        id = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('targxt_tab_id', id);
    }
    return id;
}

function setOnlineStatus() {
    const el = document.getElementById('apiStatus');
    if (!el) return;

    const count = Object.keys(onlineSessions).length;

    el.innerHTML = `
        <span class="online-dot"></span>
        <span>En ligne - ${count}</span>
    `;
    el.style.color = '#00ff88';
}

function registerSession() {
    const tabId = getTabId();
    onlineSessions[tabId] = { id: tabId, lastSeen: Date.now() };
    localStorage.setItem('targxt_online_sessions', JSON.stringify(onlineSessions));
    setOnlineStatus();
}

function cleanSessions() {
    const now = Date.now();
    let changed = false;
    Object.keys(onlineSessions).forEach(id => {
        if (now - onlineSessions[id].lastSeen > SESSION_TIMEOUT) {
            delete onlineSessions[id];
            changed = true;
        }
    });
    if (changed) localStorage.setItem('targxt_online_sessions', JSON.stringify(onlineSessions));
}

function syncSessions() {
    try {
        const stored = localStorage.getItem('targxt_online_sessions');
        if (stored) {
            const parsed = JSON.parse(stored);
            Object.keys(parsed).forEach(id => {
                if (!onlineSessions[id] || parsed[id].lastSeen > onlineSessions[id].lastSeen) {
                    onlineSessions[id] = parsed[id];
                }
            });
        }
    } catch (e) {}
    cleanSessions();
    setOnlineStatus();
}

function handleBeforeUnload() {
    const tabId = getTabId();
    delete onlineSessions[tabId];
    localStorage.setItem('targxt_online_sessions', JSON.stringify(onlineSessions));
}

function initOnlineCounter() {
    registerSession();
    setInterval(() => registerSession(), HEARTBEAT_INTERVAL);
    setInterval(() => syncSessions(), HEARTBEAT_INTERVAL);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) { registerSession(); syncSessions(); }
    });
    window.addEventListener('storage', (e) => {
        if (e.key === 'targxt_online_sessions') syncSessions();
    });
}

// ============================================================
// SYSTEME D'AVIS - STARS + WEBHOOK DISCORD
// ============================================================

// ⚠️ REMPLACEZ CETTE URL par votre vrai webhook Discord
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1515751038575968428/jMEinQYBTlDpmJCRZxZt7M73eJFB2ydqb5Ywwb-R3NghQyhE9t3CIRPCgDzoUEiZGZA9";

let currentRating = 0;

function openReviewPanel() {
    document.getElementById('reviewOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeReviewPanel(event) {
    if (event) event.stopPropagation();
    document.getElementById('reviewOverlay').classList.add('hidden');
    document.body.style.overflow = '';
}

function setRating(value) {
    currentRating = value;
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < value) {
            star.classList.add('active');
            star.textContent = '★';
        } else {
            star.classList.remove('active');
            star.textContent = '☆';
        }
    });
    const labels = ['', '★ Très mauvais', '★★ Mauvais', '★★★ Moyen', '★★★★ Bon', '★★★★★ Excellent'];
    document.getElementById('ratingText').textContent = labels[value] || 'Cliquez pour noter';
}

async function submitReview() {
    const messageEl = document.getElementById('reviewMessage');
    const submitBtn = document.querySelector('.review-submit');
    const desc = document.getElementById('reviewDesc').value.trim();
    const pseudo = document.getElementById('reviewPseudo').value.trim() || 'Anonyme';

    messageEl.classList.add('hidden');

    if (currentRating === 0) {
        messageEl.textContent = '❌ Veuillez sélectionner une note !';
        messageEl.className = 'review-message error';
        messageEl.classList.remove('hidden');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '✦ ENVOI EN COURS... ✦';

    const starsBar = '★'.repeat(currentRating) + '☆'.repeat(5 - currentRating);

    const embed = {
        title: '⭐ Nouvel Avis Reçu !',
        color: currentRating >= 4 ? 0x00ff88 : currentRating >= 3 ? 0xffaa00 : 0xff3355,
        fields: [
            { name: '📊 Note', value: `${starsBar} (${currentRating}/5)`, inline: true },
            { name: '👤 Posté par', value: pseudo, inline: true }
        ],
        footer: { text: `Targxt - ${new Date().toLocaleString('fr-FR')}` }
    };

    if (desc) {
        embed.fields.push({ name: '💬 Commentaire', value: desc.length > 1000 ? desc.substring(0, 1000) + '...' : desc });
    }

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });

        if (response.ok) {
            messageEl.textContent = '✅ Avis envoyé avec succès ! Merci ! ✨';
            messageEl.className = 'review-message success';
            messageEl.classList.remove('hidden');

            setTimeout(() => {
                currentRating = 0;
                document.querySelectorAll('.star').forEach(s => {
                    s.classList.remove('active');
                    s.textContent = '☆';
                });
                document.getElementById('ratingText').textContent = 'Cliquez pour noter';
                document.getElementById('reviewDesc').value = '';
                document.getElementById('reviewPseudo').value = '';
                closeReviewPanel(event);
                submitBtn.disabled = false;
                submitBtn.textContent = '✦ ENVOYER L\'AVIS ✦';
                document.getElementById('charCount').textContent = '0/500';
                // Petit délai pour cacher le message après fermeture
                setTimeout(() => messageEl.classList.add('hidden'), 100);
            }, 2000);
        } else {
            throw new Error('Erreur réseau');
        }
    } catch (error) {
        messageEl.textContent = '❌ Erreur lors de l\'envoi. Vérifiez le webhook.';
        messageEl.className = 'review-message error';
        messageEl.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = '✦ ENVOYER L\'AVIS ✦';
    }
}

// ============================================================
// SWITCH TABS
// ============================================================
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    if (tab === 'simple') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('simpleSearch').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('advancedSearch').classList.add('active');
    }
}

// ==========================
// ADVANCED SEARCH
// ==========================
function performAdvancedSearch() {
    const name = document.getElementById('advName').value.toLowerCase();
    const email = document.getElementById('advEmail').value.toLowerCase();
    const phone = document.getElementById('advPhone').value.replace(/\D/g, '');
    const city = document.getElementById('advCity').value.toLowerCase();
    const zip = document.getElementById('advZip').value.toLowerCase();

    const persons = window.PERSONNES_DATA || [];

    let results = persons.filter(p => {
        const pPhone = (p.telephone || '').replace(/\D/g, '');
        const pCity = (p.ville || '').toLowerCase();
        const pZip = (p.codePostal || '').toLowerCase();
        return (
            (!name || (`${p.prenom} ${p.nom}`.toLowerCase().includes(name))) &&
            (!email || (p.email || '').toLowerCase().includes(email)) &&
            (!phone || pPhone.includes(phone)) &&
            (!city || pCity.includes(city)) &&
            (!zip || pZip.includes(zip))
        );
    });

    results = enrichData(results);
    displayResults(results);
    setOnlineStatus();
}

// ============================================================
// INITIALISATION PRINCIPALE
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    initParticles();
    initOnlineCounter();

    document.getElementById('searchInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') performSearch();
    });

    // Compteur de caractères pour l'avis
    const textarea = document.getElementById('reviewDesc');
    if (textarea) {
        textarea.addEventListener('input', () => {
            const count = textarea.value.length;
            const charCount = document.getElementById('charCount');
            if (charCount) charCount.textContent = `${count}/500`;
        });
    }

    const hero = document.querySelector('.hero');
    hero.style.opacity = '0';
    hero.style.transform = 'translateY(30px)';

    setTimeout(() => {
        hero.style.transition = '0.8s ease';
        hero.style.opacity = '1';
        hero.style.transform = 'translateY(0)';
    }, 200);

    setOnlineStatus();
});