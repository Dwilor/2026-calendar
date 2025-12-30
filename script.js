const YEAR = 2026;
const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const KEY = "universe-glow-v28"; 
const MOODS_CFG = [{c:'transparent'},{c:'#800020'},{c:'#F21B6A'},{c:'#9D50BB'},{c:'#007AFF'},{c:'#00D2FF'}];
const LABEL_COLORS = [
    "#007AFF", // bleu
    "#00D2FF", // cyan
    "#34C759", // vert menthe (Apple-like)
    "#9D50BB", // violet
    "#F21B6A", // rose
    "#FF9F0A", // orange chaud
    "#800020"  // bordeaux
];


let TASKS, MOODS, CATS, selectedCat = 0, stack = ["year"], curM, curD, starPos = {};

try {
    TASKS = JSON.parse(localStorage.getItem(KEY+"-t")||"{}");
    MOODS = JSON.parse(localStorage.getItem(KEY+"-m")||"{}");
    CATS = JSON.parse(localStorage.getItem(KEY+"-c")||JSON.stringify([
        {c:"#00D2FF", n:"Projet"}, {c:"#9D50BB", n:"Perso"}, {c:"#F21B6A", n:"Urgent"}
    ]));
} catch(e) { 
    TASKS={}; MOODS={}; CATS=[{c:"#00D2FF", n:"Projet"},{c:"#9D50BB", n:"Perso"},{c:"#F21B6A", n:"Urgent"}]; 
}

const STAR_SAFE_ZONE = {
    top: 35,
    bottom: 65,
    left: 30,
    right: 70
};

function generateStarPosition(existing) {
    let attempts = 0;

    while (attempts < 40) {
        const t = Math.random() * 80 + 10;
        const l = Math.random() * 80 + 10;

        const inCenter =
            t > STAR_SAFE_ZONE.top &&
            t < STAR_SAFE_ZONE.bottom &&
            l > STAR_SAFE_ZONE.left &&
            l < STAR_SAFE_ZONE.right;

        if (inCenter) {
            attempts++;
            continue;
        }

        const tooClose = Object.values(existing).some(p => {
            const dx = p.l - l;
            const dy = p.t - t;
            return Math.sqrt(dx * dx + dy * dy) < 22;
        });

        if (!tooClose) return { t, l };

        attempts++;
    }

    return { t: Math.random()*80+10, l: Math.random()*80+10 };
}

MOODS_CFG.forEach(m => {
    if (m.c !== 'transparent') {
        starPos[m.c] = generateStarPosition(starPos);
    }
});

function updateStars() {
    const cont = document.getElementById("star-container");
    const view = stack[stack.length - 1]; // Récupère la vue actuelle (ex: 'year', 'months', 'month', 'day')
    const counts = {};
    
    // 1. CONDITION HOME-PAGE : Si on est sur l'écran du titre "2026", on cache tout
    if (view === 'year') {
        cont.querySelectorAll('.mood-star').forEach(s => {
            s.style.opacity = "0";
            s.style.visibility = "hidden";
        });
        return;
    }

    // 2. CALCUL DES DONNÉES SELON LA VUE
    Object.keys(MOODS).forEach(key => {
        const color = MOODS[key];
        if (!color || color === 'transparent') return;

        let shouldCount = false;
        if (view === 'months') {
            // C'est votre page "Année" (Grille des 12 mois) -> On compte tout
            shouldCount = key.startsWith(`${YEAR}-`);
        } else if (view === 'month') {
            // Page d'un mois précis -> On compte le mois curM
            shouldCount = key.startsWith(`${YEAR}-${curM}-`);
        } else if (view === 'day') {
            // Page d'un jour précis
            shouldCount = (key === `${YEAR}-${curM}-${curD}`);
        }

        if (shouldCount) counts[color] = (counts[color] || 0) + 1;
    });

    // 3. APPLICATION DES RÈGLES D'INTENSITÉ
    MOODS_CFG.forEach(cfg => {
        if (cfg.c === 'transparent') return;
        let s = cont.querySelector(`[data-col="${cfg.c}"]`);
        
        if (!s) {
            s = document.createElement("div"); 
            s.className = "mood-star"; 
            s.dataset.col = cfg.c; 
            s.style.backgroundColor = cfg.c; 
            s.style.top = starPos[cfg.c].t + "%"; 
            s.style.left = starPos[cfg.c].l + "%";
            cont.appendChild(s);
        }
        
        const n = counts[cfg.c] || 0;
        
        if (n > 0) {
            let intensity = 0;
            let scale = 1;

            if (view === 'day') {
                intensity = 1; 
                scale = 1.4;
            } else if (view === 'month') {
                intensity = n * 0.1; // 10 jours = 1
                scale = 1 + (n * 0.04); 
            } else if (view === 'months') {
                intensity = n * 0.01; // 100 jours = 1
                scale = 1 + (n * 0.008);
            }

            const finalOpacity = Math.min(0.7, intensity * 0.6);
            const baseSize = 250;
            
            s.style.visibility = "visible";
            s.style.width = (baseSize * scale) + "px"; 
            s.style.height = (baseSize * scale) + "px";
            s.style.opacity = finalOpacity;
            s.style.boxShadow = `0 0 ${40 + (intensity * 40)}px ${cfg.c}`;
        } else { 
            s.style.opacity = "0"; 
            s.style.visibility = "hidden"; 
        }
    });
}

function updateUI() {
    const cur = stack[stack.length-1];
    const bBtn = document.getElementById("backBtn");
    const addBtn = document.getElementById("addTaskBtn");
    const setBtn = document.getElementById("settingsBtn");
    bBtn.classList.toggle("visible", cur !== "year");
    addBtn.classList.toggle("visible", cur === "day");
    setBtn.classList.toggle("visible", cur === "months" || cur === "month");
    if(cur==="months") bBtn.textContent="‹ " + YEAR;
    else if(cur==="month") bBtn.textContent="‹ Mois";
    else if(cur==="day") bBtn.textContent="‹ " + monthNames[curM];
    updateStars();
}

function nav(to, build) {
    if(build) build();
    document.getElementById("view-"+stack[stack.length-1]).classList.remove("active");
    document.getElementById("view-"+to).classList.add("active");
    stack.push(to); updateUI();
}

function back() {
    if (stack.length <= 1) return;
    const from = stack.pop();
    document.getElementById("view-"+from).classList.remove("active");
    document.getElementById("view-"+stack[stack.length-1]).classList.add("active");
    updateUI();
}

function buildMonths() {
    const g = document.getElementById("monthsGrid"); g.innerHTML = "";
    monthNames.forEach((m,i) => {
        const d = document.createElement("div"); d.className="month-item"; d.textContent=m;
        d.onclick=()=>{curM=i; nav("month", buildMonth);}; g.appendChild(d);
    });
}

function buildMonth() {
    const w = document.getElementById("monthViewWrapper");
    w.innerHTML = `<div class="header-main">${monthNames[curM]}</div><div class="month-view-grid" id="mGrid"></div>`;
    const g = document.getElementById("mGrid");
    ["L","M","M","J","V","S","D"].forEach(l=>{ const v=document.createElement("div"); v.className="weekday"; v.textContent=l; g.appendChild(v); });
    const days = new Date(YEAR, curM+1, 0).getDate();
    const start = new Date(YEAR, curM, 1).getDay() || 7;
    for(let i=1; i<start; i++) g.appendChild(document.createElement("div"));
    for(let d=1; d<=days; d++) {
        const c = document.createElement("div"); c.className="day-cell"; c.textContent=d;
        const cols = getDayCols(curM, d);
        if(cols.length) {
            c.classList.add("has-tasks");
            const dotCont = document.createElement("div"); dotCont.className="dots";
            cols.forEach(col=>{ const dt=document.createElement("div"); dt.className="dot"; dt.style.background=col; dotCont.appendChild(dt); });
            c.appendChild(dotCont);
        }
        c.onclick=()=>{curD=d; nav("day", buildDay);}; g.appendChild(c);
    }
}

function buildDay() {
    document.getElementById("day-header").textContent = curD + " " + monthNames[curM];
    const ms = document.getElementById("moodSelector");

    // ⛔ Ne plus recréer si déjà présent
    if (ms.children.length === 0) {
        MOODS_CFG.forEach(m => {
            const b = document.createElement("span");
            b.className = `mood-btn ${m.c === 'transparent' ? 'off' : ''}`;
            b.style.backgroundColor = m.c;
			b.dataset.color = m.c; // ✅ source de vérité
            if (m.c === 'transparent') b.textContent = "×";

            b.onclick = () => {
                MOODS[`${YEAR}-${curM}-${curD}`] = m.c;
                localStorage.setItem(KEY + "-m", JSON.stringify(MOODS));
                updateMoodButtons();   // ✅ transition fluide
                updateStars();
            };

            ms.appendChild(b);
        });
    }

    updateMoodButtons();
    renderTasks();
}

function updateMoodButtons() {
    const current = MOODS[`${YEAR}-${curM}-${curD}`];
    document.querySelectorAll(".mood-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.color === current);
    });
}

function renderTasks() {
    const c = document.getElementById("taskContainer");
    c.innerHTML = "";
    const pre = `${YEAR}-${curM}-${curD}-`;

    Object.keys(TASKS)
        .filter(k => k.startsWith(pre))
        .sort()
        .forEach(k => {
            const t = TASKS[k];
            const p = k.split('-');

            const r = document.createElement("div");
            r.className = "task-row";
            if (t.done) r.classList.add("done");

            r.style.setProperty("--task-glow", CATS[t.c].c + "88");

            r.onclick = () => {
                if (t.done || r.classList.contains("validating")) return;

                r.classList.add("validating");
                pulseStar(CATS[t.c].c);

                setTimeout(() => {
                    toggleTaskDone(k);
                }, 2200);
            };

            r.innerHTML = `
                <div class="task-info">
                    <div class="task-time">${p[3]}:${p[4]}</div>
                    <div class="task-label-tag">${CATS[t.c].n}</div>
                </div>
                <div style="display:flex;align-items:center;overflow:hidden">
                    <div class="task-cat-dot" style="background:${CATS[t.c].c}"></div>
                    <div style="font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${t.t}
                    </div>
                </div>
                <div class="task-del" onclick="event.stopPropagation(); delTask('${k}')">×</div>
            `;

            c.appendChild(r);
        });
}

function openModal(isNew = false) {
    if(isNew) { document.getElementById("modalTaskInput").value = ""; document.getElementById("modalTimeInput").value = "12:00"; }
    document.getElementById("taskModal").classList.add("active");
    const cc = document.getElementById("catChoice"); cc.innerHTML = "";
    CATS.forEach((cat,i)=>{
        const w = document.createElement("div"); w.style.cssText="display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer";
        w.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:${cat.c};border:2px solid ${selectedCat===i?'white':'transparent'}"></div><span style="font-size:10px;opacity:0.6">${cat.n}</span>`;
        w.onclick=()=>{ selectedCat=i; openModal(false); };
        cc.appendChild(w);
    });
}
function closeModal(){ document.getElementById("taskModal").classList.remove("active"); }

function saveNewTask() {
    const txt = document.getElementById("modalTaskInput").value;
    const time = document.getElementById("modalTimeInput").value;
    if (!txt.trim()) return;

    const key = `${YEAR}-${curM}-${curD}-${time.replace(":", "-")}-${Date.now()}`;

    TASKS[key] = {
        t: txt,
        c: selectedCat,
        h: time,
        done: false
    };

    localStorage.setItem(KEY + "-t", JSON.stringify(TASKS));
    renderTasks();
    buildMonth();
    closeModal();
}

function delTask(k){ delete TASKS[k]; localStorage.setItem(KEY+"-t", JSON.stringify(TASKS)); renderTasks(); buildMonth(); }

function openSettings() {
    document.getElementById("settingsModal").classList.add("active");
    renderCatSettings();
}

function getAvailableLabelColors(exceptIndex = null) {
    const used = CATS
        .filter((_, i) => i !== exceptIndex)
        .map(c => c.c);

    return LABEL_COLORS.filter(c => !used.includes(c));
}



function renderCatSettings() {
    const l = document.getElementById("catSettingsList");
    l.innerHTML = "";

    CATS.forEach((cat, i) => {
        const r = document.createElement("div");
        r.className = "cat-row";

        // pastille couleur
        const col = document.createElement("div");
        col.className = "cat-color";
        col.style.background = cat.c;
        col.onclick = () => cycleCatColor(i);

        // input texte
        const input = document.createElement("input");
        input.className = "custom-input";
        input.style.marginBottom = "0";
        input.value = cat.n;
        input.oninput = e => {
            CATS[i].n = e.target.value;
            saveCats();
            renderTasks();
        };

        // supprimer
        const del = document.createElement("div");
        del.className = "cat-remove";
        del.textContent = "×";
        del.onclick = () => removeCat(i);

        r.append(col, input, del);
        l.appendChild(r);
    });

    // bouton ajouter
const available = getAvailableLabelColors();

if (available.length > 0) {
    const add = document.createElement("div");
    add.className = "add-cat";
    add.textContent = "+ Ajouter un libellé";
    add.onclick = addCat;
    l.appendChild(add);
}

}

function cycleCatColor(i) {
    const colors = getAvailableLabelColors(i);
    const cur = CATS[i].c;
    const idx = colors.indexOf(cur);
    CATS[i].c = colors[(idx + 1) % colors.length];
    saveCats();
    renderCatSettings();
    renderTasks();
}


function addCat() {
    const colors = getAvailableLabelColors();
    if (!colors.length) return;

    CATS.push({
        n: "Nouveau",
        c: colors[0]
    });
    saveCats();
    renderCatSettings();
}

function removeCat(i) {
    const used = Object.keys(TASKS).some(k => TASKS[k].c === i);

    if (used) {
        const ok = confirm(
            "Attention : supprimer ce libellé supprimera aussi toutes les tâches associées. Continuer ?"
        );
        if (!ok) return;
    }

    Object.keys(TASKS).forEach(k => {
        if (TASKS[k].c === i) delete TASKS[k];
        else if (TASKS[k].c > i) TASKS[k].c--;
    });

    CATS.splice(i, 1);
    saveCats();
    localStorage.setItem(KEY+"-t", JSON.stringify(TASKS));
    renderCatSettings();
    renderTasks();
    buildMonth();
}

function closeSettings(){ document.getElementById("settingsModal").classList.remove("active"); }
function saveCats(){ localStorage.setItem(KEY+"-c", JSON.stringify(CATS)); renderTasks(); }
function getDayCols(m,d) {
    const s = new Set(), p = `${YEAR}-${m}-${d}-`;
for (let k in TASKS) {
    if (!k.startsWith(p)) continue;
    if (TASKS[k].done) continue;
    s.add(CATS[TASKS[k].c].c);
}
    return Array.from(s);
}
function exportData() {
    const data = { tasks: TASKS, moods: MOODS, cats: CATS };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `universe_glow_backup.json`; a.click();
}
function importData() {
    const input = document.createElement("input"); input.type = "file"; input.accept = "application/json";
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const d = JSON.parse(ev.target.result);
                if(d.tasks) localStorage.setItem(KEY+"-t", JSON.stringify(d.tasks));
                if(d.moods) localStorage.setItem(KEY+"-m", JSON.stringify(d.moods));
                if(d.cats) localStorage.setItem(KEY+"-c", JSON.stringify(d.cats));
                location.reload();
            } catch(err) { alert("Erreur."); }
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
}

// Gestion du Swipe vers la droite pour retour
let touchStartX = 0;
document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    // Si glissement de plus de 100px vers la droite
    if (touchEndX - touchStartX > 100) {
        if (stack.length > 1 && !document.querySelector('.modal.active')) {
            back();
        }
    }
}, {passive: true});

const THEME_KEY = KEY + "-theme";

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
    const current = document.documentElement.dataset.theme || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
}

// Init theme
applyTheme(localStorage.getItem(THEME_KEY) || "dark");

document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);

function resetAll() {
    if (!confirm("Tout réinitialiser ?")) return;
    localStorage.clear();
    location.reload();
}

updateUI();

function toggleTaskDone(key) {
    TASKS[key].done = true;
    if (navigator.vibrate) navigator.vibrate(15);
    localStorage.setItem(KEY + "-t", JSON.stringify(TASKS));
    renderTasks();
    buildMonth();
}

function pulseStar(color) {
    const stars = document.querySelectorAll(".mood-star");
    const s = [...stars].find(st => st.dataset.col === color);
    if (!s) return;

    s.classList.add("pulse");
    setTimeout(() => s.classList.remove("pulse"), 900);
}