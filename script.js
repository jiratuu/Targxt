// ============================================================
// TARGXT (SCRIPT.JS) - Version fetch JSON Lines
// ============================================================

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1515751038575968428/jMEinQYBTlDpmJCRZxZt7M73eJFB2ydqb5Ywwb-R3NghQyhE9t3CIRPCgDzoUEiZGZA9";

let currentRating = 0;
const USER_ID = crypto.randomUUID();
const ONLINE_KEY = "targxt_online";

// Stockage global des données fusionnées
let ALL_DATA = [];

// ===============================
// DOM CACHE
// ===============================
const el = {};

function cacheDOM() {
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

// ===============================
// PARTICLES
// ===============================
function initParticles() {
    const c = document.getElementById("particles");
    if (!c) return;
    for (let i = 0; i < 30; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.left = Math.random() * 100 + "%";
        const s = Math.random() * 3 + 2;
        p.style.width = s + "px";
        p.style.height = s + "px";
        p.style.animationDuration = (Math.random() * 15 + 10) + "s";
        p.style.animationDelay = (Math.random() * 10) + "s";
        c.appendChild(p);
    }
}

// ===============================
// PARSE Python Dict
// ===============================
function parsePy(s) {
    if (!s || typeof s !== 'string') return {};
    try { return JSON.parse(s); } catch(e) {
        try { return JSON.parse(s.replace(/'/g,'"').replace(/True/g,'true').replace(/False/g,'false').replace(/None/g,'null').replace(/\\u202f/g,' ').replace(/\\(?!["\\\/bfnrt])/g,'')); } catch(e2) { return {}; }
    }
}

function parsePyArr(s) {
    if (!s || typeof s !== 'string') return [];
    try { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch(e) {
        try { const p = JSON.parse(s.replace(/'/g,'"').replace(/True/g,'true').replace(/False/g,'false').replace(/None/g,'null').replace(/\\u202f/g,' ').replace(/\\(?!["\\\/bfnrt])/g,'')); return Array.isArray(p) ? p : []; } catch(e2) { return []; }
    }
}

// ===============================
// CHARGER JSON LINES VIA FETCH
// ===============================
async function loadJSONLinesFile(url, sourceName, typeLabel) {
    try {
        const resp = await fetch(url + '?t=' + Date.now());
        const text = await resp.text();
        const lines = text.trim().split('\n');
        const results = [];

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const record = JSON.parse(line);
                if (!record || !record.user_info) continue;

                const info = record.user_info;
                const client = parsePy(info.client);
                const addr = client.adresse || {};

                let infos = "";
                if (sourceName === "edf") {
                    const doss = parsePyArr(info.dossiers);
                    infos = doss.map(d => (d.numero_dossier||"")+" - "+(d.type_travaux||"")+" ["+(d.statut||"")+"] "+(d.prime_attribuee||"")).join(" | ");
                } else if (sourceName === "ldlc") {
                    const cmds = parsePyArr(info.commandes);
                    infos = cmds.map(c => (c.numero_commande||"")+" - "+(c.montant||"")+": "+((c.articles||[]).join(", "))).join(" | ");
                } else if (sourceName === "sfr") {
                    const abo = parsePy(info.abonnement);
                    if (abo && abo.forfait) infos = (abo.forfait||"")+" - "+(abo.mensualite||"")+"/mois - "+(abo.engagement||"")+" - "+(abo.statut||"");
                }

                results.push({
                    prenom: client.prenom ? client.prenom.charAt(0).toUpperCase() + client.prenom.slice(1).toLowerCase() : "",
                    nom: client.nom ? client.nom.toUpperCase() : "",
                    genre: client.sexe === "Homme" ? "M" : client.sexe === "Femme" ? "F" : "",
                    email: client.email ? client.email.toLowerCase() : "",
                    telephone: (client.contacts && client.contacts.telephone_portable) || "",
                    ville: (addr.ville||"").toUpperCase(),
                    codePostal: addr.code_postal || "",
                    adresse: addr.ligne1 || "",
                    referenceClient: client.reference_client || "",
                    _source: sourceName,
                    _typeSource: typeLabel,
                    _infos: infos
                });
            } catch(e) {}
        }
        return results;
    } catch(e) {
        console.warn("[Targxt] Impossible de charger " + url);
        return [];
    }
}

// ===============================
// CHARGER TOUTES LES SOURCES
// ===============================
async function loadAllData() {
    const allData = [];

    // 1. DB locale (déjà chargée en script)
    try {
        if (typeof PERSONNES_DATA !== 'undefined' && Array.isArray(PERSONNES_DATA)) {
            PERSONNES_DATA.forEach(p => {
                allData.push({
                    ...p,
                    _source: "locale",
                    _typeSource: "Base locale"
                });
            });
        }
    } catch(e) {}

    // 2. EDF via fetch
    const edf = await loadJSONLinesFile("DB-EDF.js", "edf", "Électricité / Prime Energie");
    allData.push(...edf);

    // 3. LDLC via fetch
    const ldlc = await loadJSONLinesFile("DB-LDLC.js", "ldlc", "E-commerce / Informatique");
    allData.push(...ldlc);

    // 4. SFR via fetch
    const sfr = await loadJSONLinesFile("DB-SFR.js", "sfr", "Télécom / Mobile");
    allData.push(...sfr);

    ALL_DATA = allData;
    console.log("[Targxt] " + allData.length + " entrées chargées");
}

// ===============================
// SEARCH
// ===============================
function searchDB(query) {
    const q = query.toLowerCase().trim();
    if (q === "/all") return ALL_DATA;

    const type = /@/.test(q) ? "email" : /^\+?\d/.test(q) ? "phone" : "general";

    return ALL_DATA.filter(p => {
        if (!p) return false;
        const text = Object.keys(p).filter(k => typeof p[k] === 'string' && !k.startsWith('_')).map(k => p[k]).join(" ").toLowerCase();
        const phoneClean = (p.telephone || "").replace(/\D/g, "");
        const qClean = q.replace(/\D/g, "");
        if (type === "email") return (p.email || "").toLowerCase().includes(q);
        if (type === "phone") return qClean.length >= 4 ? phoneClean.includes(qClean) : text.includes(q);
        return text.includes(q);
    });
}

// ===============================
// RENDER
// ===============================
function renderCards(list) {
    if (!el.resultCards) return;
    el.resultCards.innerHTML = "";
    const colors = { locale: "var(--accent)", edf: "#FF6600", ldlc: "#0099FF", sfr: "#CC0000" };

    let idx = 0;
    function nextBatch() {
        const batch = list.slice(idx, idx + 20);
        if (!batch.length) return;
        batch.forEach(p => {
            const initials = ((p.prenom?.[0]||"")+(p.nom?.[0]||"")).toUpperCase()||"?";
            const color = colors[p._source]||"#888";
            const fields = [["Prénom",p.prenom],["Nom",p.nom],["Genre",p.genre],["Email",p.email],["Téléphone",p.telephone],["Ville",p.ville],["Code Postal",p.codePostal],["Adresse",p.adresse],["Date Naissance",p.dateNaissance],["Organisme",p.organisme],["Réf. Client",p.referenceClient]];
            let body = ``;
            fields.forEach(([l,v]) => { if (v && v!=="null" && v!=="undefined") body += `<div class="card-field"><span class="label">${l}</span><span class="value">${v}</span></div>`; });
            if (p._infos) body += `<div class="card-field" style="background:rgba(255,255,255,0.03);border-radius:6px;padding:8px 10px;margin-top:6px;"><span class="label">${p._typeSource||"Détails"}</span><span class="value" style="font-size:12px;line-height:1.5;">${p._infos}</span></div>`;
            const card = document.createElement("div");
            card.className = "result-card";
            card.style.borderLeft = `3px solid ${color}`;
            card.innerHTML = `<div class="card-header"><div class="card-name"><div class="card-avatar">${initials}</div><h4>${p.prenom||""} ${p.nom||""}</h4></div><span class="card-source" style="color:${color};">${(p._source||"?").toUpperCase()} #${idx+1}</span></div><div class="card-body">${body}</div>`;
            el.resultCards.appendChild(card);
            idx++;
        });
        if (idx < list.length) requestAnimationFrame(nextBatch);
    }
    nextBatch();
}

function displayResults(list) {
    if (!list||!list.length) { el.results.classList.add("hidden"); el.noResults.classList.remove("hidden"); return; }
    el.noResults.classList.add("hidden");
    el.results.classList.remove("hidden");
    el.resultCount.textContent = list.length;
    renderCards(list);
}

function performSearch() {
    const q = el.searchInput.value.trim();
    if (!q) return;
    el.loading.classList.remove("hidden");
    el.results.classList.add("hidden");
    setTimeout(() => { el.loading.classList.add("hidden"); displayResults(searchDB(q)); }, 300);
}

function performAdvancedSearch() {
    const vals = [el.advName.value,el.advEmail.value,el.advPhone.value,el.advCity.value,el.advZip.value].join(" ").trim();
    if (!vals) return;
    el.loading.classList.remove("hidden");
    el.results.classList.add("hidden");
    setTimeout(() => { el.loading.classList.add("hidden"); displayResults(searchDB(vals)); }, 300);
}

function setSearch(v) { el.searchInput.value = v; performSearch(); }

function switchTab(tab) {
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(t=>t.classList.remove("active"));
    if (tab==="simple") { const t=document.querySelectorAll(".tab"); if(t[0])t[0].classList.add("active"); document.getElementById("simpleSearch").classList.add("active"); }
    else { const t=document.querySelectorAll(".tab"); if(t[1])t[1].classList.add("active"); document.getElementById("advancedSearch").classList.add("active"); }
}

function openReviewPanel() { el.reviewOverlay.classList.remove("hidden"); }
function closeReviewPanel(e) { if(!e||e.target===el.reviewOverlay||e.target.closest('.review-close')) el.reviewOverlay.classList.add("hidden"); }

function setRating(v) {
    currentRating = v;
    document.querySelectorAll(".star").forEach((s,i)=>{s.innerHTML=i<v?"★":"☆";if(i<v)s.classList.add("active");else s.classList.remove("active");});
    el.ratingText.textContent = ["","Très mauvais","Mauvais","Correct","Bien","Excellent"][v]||"Cliquez pour noter";
}

function submitReview() {
    if(!currentRating) return alert("Choisis une note");
    fetch(DISCORD_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({embeds:[{title:"⭐ Nouvel avis",color:16753920,fields:[{name:"Pseudo",value:el.reviewPseudo.value||"Anonyme",inline:true},{name:"Note",value:"⭐".repeat(currentRating)+" ("+currentRating+"/5)",inline:true},{name:"Commentaire",value:el.reviewDesc.value||"Aucun"}],timestamp:new Date().toISOString()}]})})
    .then(()=>{el.reviewMessage.className="review-message success";el.reviewMessage.textContent="Envoyé ✔";el.reviewMessage.classList.remove("hidden");resetReview();})
    .catch(()=>{el.reviewMessage.className="review-message error";el.reviewMessage.textContent="Erreur webhook";el.reviewMessage.classList.remove("hidden");});
}

function resetReview() {
    el.reviewDesc.value="";el.reviewPseudo.value="";el.charCount.textContent="0/500";currentRating=0;
    document.querySelectorAll(".star").forEach(s=>{s.innerHTML="☆";s.classList.remove("active");});
    el.ratingText.textContent="Cliquez pour noter";
}

function updateOnline() {
    if(!el.apiStatus) return;
    let users={};try{users=JSON.parse(localStorage.getItem(ONLINE_KEY)||"{}");}catch(e){users={};}
    const now=Date.now();
    Object.keys(users).forEach(id=>{if(now-users[id]>15000)delete users[id];});
    users[USER_ID]=now;
    try{localStorage.setItem(ONLINE_KEY,JSON.stringify(users));}catch(e){}
    el.apiStatus.innerHTML=`<span class="online-dot"></span>${Object.keys(users).length} EN LIGNE`;
}

// ===============================
// BOOT
// ===============================
async function boot() {
    cacheDOM();
    if (!el.searchInput) { setTimeout(boot, 100); return; }

    initParticles();

    el.searchInput.addEventListener("keydown", e => { if (e.key === "Enter") performSearch(); });
    if (el.reviewDesc && el.charCount) {
        el.reviewDesc.addEventListener("input", function() { el.charCount.textContent = this.value.length + "/500"; });
    }

    updateOnline();
    setInterval(updateOnline, 3000);

    // Charger les données
    el.apiStatus.innerHTML = "⏳ CHARGEMENT...";
    await loadAllData();
    el.apiStatus.innerHTML = `<span class="online-dot"></span>${Object.keys(JSON.parse(localStorage.getItem(ONLINE_KEY)||"{}")).length} EN LIGNE`;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}