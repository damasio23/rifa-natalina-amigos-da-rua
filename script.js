(function () {
  const R = window.RIFA, D = window.Dados, $ = (s) => document.querySelector(s);
  const brl = (n) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 0 }) + ",00";
  const page = document.body.dataset.page;
  const toast = (t) => { const e = $("#toast"); if (!e) return; e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 3200); };
  window.rifaToast = toast;
  if (D.modoLocal && $("#faixa-teste")) $("#faixa-teste").hidden = false;
  window.addEventListener("rifa:erro", () => toast("Não foi possível conectar ao servidor. Tente de novo em instantes."));
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  let mapa = {};
  const contar = () => { const o = Object.keys(mapa).length; return { o, l: R.total - o }; };
  function chips() { const { o, l } = contar(); if ($("#c-ocup")) $("#c-ocup").textContent = o + " preenchidos"; if ($("#c-livres")) $("#c-livres").textContent = l + " disponíveis"; }

  // ---------- início ----------
  if (page === "home") {
    const box = $("#premios");
    R.premios.forEach((p) => {
      const c = el("div", "premio");
      const fig = el("div", "foto"); const im = el("img"); im.src = p.img; im.alt = p.titulo; im.loading = "lazy"; im.width = 640; im.height = 640; fig.append(im);
      if (p.ilustrativo) fig.append(el("span", "ilus", "Imagem ilustrativa"));
      const d = el("div", "txt"); d.append(el("small", null, p.n + "º prêmio"), el("strong", null, p.titulo)); c.append(fig, d); box.append(c);
    });
    D.watchNumbers((m) => { mapa = m; const { o } = contar(); const p = $("#progresso"); p.hidden = false; p.textContent = o + " de " + R.total + " números já escolhidos"; });
  }

  // ---------- escolha dos números ----------
  if (page === "sorteio") {
    const grade = $("#grade"), sel = new Set(); let nome = "", carregado = false;
    const botoes = {};
    for (let n = 1; n <= R.total; n++) {
      const b = el("button", "num", String(n)); b.type = "button"; b.dataset.n = n; b.setAttribute("aria-pressed", "false"); botoes[n] = b; grade.append(b);
    }
    const ord = () => [...sel].sort((a, b) => a - b);
    function pintar() {
      for (let n = 1; n <= R.total; n++) {
        const b = botoes[n], oc = !!mapa[n], s = sel.has(n);
        b.classList.toggle("ocup", oc); b.classList.toggle("sel", s && !oc); b.disabled = oc;
        b.setAttribute("aria-pressed", s ? "true" : "false");
        b.setAttribute("aria-label", "Número " + n + (oc ? ", já preenchido por " + mapa[n].nome : s ? ", selecionado" : ", disponível"));
        if (oc) b.title = "Preenchido";
      }
      chips(); barra();
    }
    function barra() {
      const q = sel.size, b = $("#barra");
      b.classList.toggle("on", q > 0 && !$("#passo1").hidden); document.body.classList.toggle("tem-barra", q > 0 && !$("#passo1").hidden);
      $("#b-qtd").textContent = q + (q === 1 ? " número" : " números"); $("#b-total").textContent = brl(q * R.preco);
      $("#b-nums").textContent = "Nº " + ord().join(", ");
    }
    grade.addEventListener("click", (e) => { const b = e.target.closest(".num"); if (!b || b.disabled) return; const n = +b.dataset.n; sel.has(n) ? sel.delete(n) : sel.add(n); $("#erro1").textContent = ""; pintar(); });
    D.watchNumbers((m) => {
      mapa = m;
      const perdidos = [...sel].filter((n) => m[n]);
      if (carregado && perdidos.length && !$("#passo1").hidden) { perdidos.forEach((n) => sel.delete(n)); toast("Número " + perdidos.join(", ") + " acabou de ser escolhido por outra pessoa."); }
      carregado = true; pintar();
    });
    const passo = (n) => { [1, 2, 3].forEach((i) => { $("#passo" + i).hidden = i !== n; $("#et" + i).classList.toggle("on", i <= n); }); barra(); window.scrollTo({ top: 0, behavior: "smooth" }); };
    $("#continuar").onclick = () => {
      nome = $("#nome").value.trim().replace(/\s+/g, " ");
      if (!sel.size) return ($("#erro1").textContent = "Escolha pelo menos um número.");
      if (nome.length < 2) { $("#erro1").textContent = "Informe o nome de quem está comprando."; $("#nome").focus(); return; }
      const t = brl(sel.size * R.preco);
      $("#r-nome").textContent = nome; $("#r-nums").textContent = ord().join(", "); $("#r-qtd").textContent = sel.size + (sel.size === 1 ? " número" : " números");
      $("#r-total").textContent = t; $("#r-total2").textContent = t; $("#erro1").textContent = ""; passo(2);
    };
    $("#voltar").onclick = () => passo(1);
    $("#copiar").onclick = async () => { try { await navigator.clipboard.writeText(R.chavePix); toast("Chave PIX copiada!"); } catch (e) { toast("Copie manualmente: " + R.chavePix); } };
    $("#confirmar").onclick = async () => {
      const btn = $("#confirmar"), nums = ord(); btn.disabled = true; btn.textContent = "Registrando…"; $("#erro2").textContent = "";
      try {
        await D.reserve(nums, nome);
        $("#s-nome").textContent = nome; $("#s-total").textContent = brl(nums.length * R.preco);
        const t = $("#s-nums"); t.textContent = ""; nums.forEach((n) => t.append(el("span", "tag", n)));
        sel.clear(); passo(3);
      } catch (e) {
        if (e.message === "ocupado") { const x = nums.filter((n) => !e.numeros || e.numeros.includes(n)); x.forEach((n) => sel.delete(n)); $("#erro2").textContent = "Algum número acabou de ser escolhido por outra pessoa. Volte e escolha outros."; pintar(); }
        else { console.error(e); $("#erro2").textContent = "Não foi possível registrar agora. Verifique sua conexão e tente novamente."; }
      } finally { btn.disabled = false; btn.textContent = "Confirmar minha participação"; }
    };
  }

  // ---------- participantes ----------
  if (page === "part") {
    let filtro = "todos", busca = "";
    const tb = $("#tbody");
    function desenhar() {
      tb.textContent = ""; let k = 0; const q = busca.toLowerCase();
      for (let n = 1; n <= R.total; n++) {
        const p = mapa[n]; if (filtro === "ocup" && !p) continue; if (filtro === "livre" && p) continue;
        if (q && !(String(n) === q || String(n).startsWith(q) && /^\d+$/.test(q) || (p && p.nome.toLowerCase().includes(q)))) continue;
        const tr = el("tr", p ? "" : "livre"); tr.append(el("td", null, n), el("td", null, p ? p.nome : "— disponível —")); tb.append(tr); k++;
      }
      if (!k) { const tr = el("tr"), td = el("td", "vazio", "Nada encontrado."); td.colSpan = 2; tr.append(td); tb.append(tr); }
      chips();
    }
    $("#busca").oninput = (e) => { busca = e.target.value.trim(); desenhar(); };
    document.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => { document.querySelectorAll(".seg button").forEach((x) => x.classList.remove("on")); b.classList.add("on"); filtro = b.dataset.f; desenhar(); }));
    D.watchNumbers((m) => { mapa = m; desenhar(); });
  }
})();
