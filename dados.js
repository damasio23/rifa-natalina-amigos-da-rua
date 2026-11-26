// Camada de dados: Firebase (compartilhado, em tempo real) ou modo local de teste.
(function () {
  const R = window.RIFA, cfg = window.FIREBASE_CONFIG;
  const SEEDS = window.PARTICIPANTES_INICIAIS || {};
  const seedMap = () => { const m = {}; for (const k in SEEDS) m[k] = { nome: SEEDS[k], pago: true, inicial: true }; return m; };
  const V = "10.12.2", CDN = "https://www.gstatic.com/firebasejs/" + V + "/";
  const load = (src) => new Promise((ok, err) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => err(new Error("Falha ao carregar " + src)); document.head.appendChild(s); });
  const j = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };

  let fs = null, auth = null, ready = null;
  const firebase_ = !!cfg;

  async function init(needAuth) {
    if (!firebase_) return;
    if (!ready) ready = (async () => {
      await load(CDN + "firebase-app-compat.js");
      await load(CDN + "firebase-firestore-compat.js");
      firebase.initializeApp(cfg); fs = firebase.firestore();
    })();
    await ready;
    if (needAuth && !auth) { await load(CDN + "firebase-auth-compat.js"); auth = firebase.auth(); }
  }

  // ---------- números ----------
  function watchNumbers(cb) {
    if (!firebase_) {
      const emit = () => cb({ ...seedMap(), ...j("rifa:numeros", {}) });
      emit(); window.addEventListener("storage", emit); return;
    }
    let docs = {}, imported = false, got1 = false, got2 = false;
    const emit = () => { if (!(got1 && got2)) return; cb({ ...(imported ? {} : seedMap()), ...docs }); };
    init().then(() => {
      fs.collection("numeros").onSnapshot((snap) => {
        docs = {}; snap.forEach((d) => { const v = d.data(); docs[d.id] = { nome: v.nome, pago: !!v.pago }; });
        got1 = true; emit();
      }, (e) => console.error("numeros:", e));
      fs.doc("meta/importado").onSnapshot((d) => { imported = d.exists; got2 = true; emit(); }, () => { got2 = true; emit(); });
    }).catch((e) => { console.error(e); window.dispatchEvent(new CustomEvent("rifa:erro", { detail: e })); });
  }

  async function reserve(nums, nome) {
    nome = nome.trim().replace(/\s+/g, " ");
    if (!firebase_) {
      const cur = { ...seedMap(), ...j("rifa:numeros", {}) };
      const clash = nums.filter((n) => cur[n]);
      if (clash.length) { const e = new Error("ocupado"); e.numeros = clash; throw e; }
      const mine = j("rifa:numeros", {}); nums.forEach((n) => (mine[n] = { nome, pago: false }));
      localStorage.setItem("rifa:numeros", JSON.stringify(mine)); return;
    }
    await init();
    const b = fs.batch();
    nums.forEach((n) => b.set(fs.collection("numeros").doc(String(n)), { nome, pago: false, criado: firebase.firestore.FieldValue.serverTimestamp() }));
    try { await b.commit(); } catch (e) { if (e.code === "permission-denied") { const x = new Error("ocupado"); x.numeros = nums; throw x; } throw e; }
  }

  // ---------- admin ----------
  const LOCAL_PW = "admin";
  const A = {
    async login(email, senha) {
      if (!firebase_) { if (senha !== LOCAL_PW) throw new Error("Senha incorreta."); sessionStorage.setItem("rifa:admin", "1"); return; }
      await init(true);
      const cred = await auth.signInWithEmailAndPassword(email, senha);
      const d = await fs.doc("admins/" + cred.user.uid).get();
      if (!d.exists) { await auth.signOut(); throw new Error("Este usuário não é administrador."); }
    },
    async logout() { sessionStorage.removeItem("rifa:admin"); if (auth) await auth.signOut(); },
    async isLogged() {
      if (!firebase_) return sessionStorage.getItem("rifa:admin") === "1";
      await init(true);
      return new Promise((ok) => { const u = auth.onAuthStateChanged(async (usr) => { u(); if (!usr) return ok(false); try { ok((await fs.doc("admins/" + usr.uid).get()).exists); } catch (e) { ok(false); } }); });
    },
    async release(n) {
      if (!firebase_) { const m = j("rifa:numeros", {}); delete m[n]; localStorage.setItem("rifa:numeros", JSON.stringify(m)); window.dispatchEvent(new Event("storage")); return; }
      await fs.collection("numeros").doc(String(n)).delete();
    },
    async setPaid(n, nome, pago) {
      if (!firebase_) { const m = j("rifa:numeros", {}); m[n] = { nome, pago }; localStorage.setItem("rifa:numeros", JSON.stringify(m)); window.dispatchEvent(new Event("storage")); return; }
      await fs.collection("numeros").doc(String(n)).set({ nome, pago }, { merge: true });
    },
    async importSeeds() {
      if (!firebase_) return 0;
      const b = fs.batch(); let c = 0;
      for (const k in SEEDS) { b.set(fs.collection("numeros").doc(k), { nome: SEEDS[k], pago: true }, { merge: true }); c++; }
      b.set(fs.doc("meta/importado"), { em: new Date().toISOString() }); await b.commit(); return c;
    },
    watchDraw(cb) {
      if (!firebase_) { const e = () => cb(j("rifa:sorteio", {})); e(); window.addEventListener("storage", e); return; }
      fs.collection("sorteio").onSnapshot((s) => { const o = {}; s.forEach((d) => (o[d.id] = d.data())); cb(o); });
    },
    async saveWinner(premio, numero, nome) {
      const v = { premio, numero, nome, data: new Date().toISOString() };
      if (!firebase_) { const m = j("rifa:sorteio", {}); m["premio" + premio] = v; localStorage.setItem("rifa:sorteio", JSON.stringify(m)); window.dispatchEvent(new Event("storage")); return; }
      await fs.doc("sorteio/premio" + premio).set(v);
    },
    async clearWinner(premio) {
      if (!firebase_) { const m = j("rifa:sorteio", {}); delete m["premio" + premio]; localStorage.setItem("rifa:sorteio", JSON.stringify(m)); window.dispatchEvent(new Event("storage")); return; }
      await fs.doc("sorteio/premio" + premio).delete();
    },
  };
  window.Dados = { modoLocal: !firebase_, init, watchNumbers, reserve, admin: A, R };
})();
