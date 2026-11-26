(function () {
  const R = window.RIFA, D = window.Dados, A = D.admin, $ = (s) => document.querySelector(s);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const toast = (t) => { const e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 3000); };
  if (D.modoLocal) { $("#faixa-teste").hidden = false; $("#campo-email").hidden = true; }
  let mapa = {}, vence = {}, busca = "", girando = false, importado = true;

  async function start() {
    let logado = false;
    try { logado = await A.isLogged(); } catch (e) { console.error(e); }
    $("#login").hidden = logado; $("#painel").hidden = !logado;
    if (logado) abrir();
  }
  $("#f-login").onsubmit = async (e) => {
    e.preventDefault(); $("#erro-login").textContent = "";
    try { await A.login($("#email").value.trim(), $("#senha").value); $("#senha").value = ""; start(); }
    catch (x) { $("#erro-login").textContent = x.code && x.code.startsWith("auth/") ? "E-mail ou senha incorretos." : x.message; }
  };
  $("#sair").onclick = async () => { await A.logout(); location.reload(); };

  async function abrir() {
    await D.init(true);
    D.watchNumbers((m) => { mapa = m; render(); });
    A.watchDraw((v) => { vence = v; render(); });
    if (!D.modoLocal) window.firebase.firestore().doc("meta/importado").onSnapshot((d) => { importado = d.exists; $("#aviso-import").hidden = importado; });
  }
  $("#importar").onclick = async () => { try { const n = await A.importSeeds(); toast(n + " números importados."); } catch (e) { toast("Erro ao importar: " + e.message); } };

  const ganhadores = () => { const o = {}; Object.values(vence).forEach((v) => (o[v.numero] = v.premio)); return o; };

  function render() {
    const nums = Object.keys(mapa).map(Number).sort((a, b) => a - b), g = ganhadores();
    $("#c-ocup").textContent = nums.length + " preenchidos"; $("#c-livres").textContent = (R.total - nums.length) + " livres";
    const pagos = nums.filter((n) => mapa[n].pago).length;
    $("#c-pagos").textContent = pagos + " pagos"; $("#c-total").textContent = "Arrecadação prevista: R$ " + (nums.length * R.preco).toLocaleString("pt-BR") + ",00";

    const mini = $("#mini"); mini.textContent = "";
    for (let n = 1; n <= R.total; n++) { const b = el("button", "mini" + (g[n] ? " ven" : mapa[n] ? " ocup" : ""), n); b.type = "button"; b.title = mapa[n] ? mapa[n].nome : "Livre"; if (mapa[n]) b.title += g[n] ? " — " + g[n] + "º prêmio" : ""; mini.append(b); }

    const tb = $("#tbody"); tb.textContent = ""; const q = busca.toLowerCase();
    for (let n = 1; n <= R.total; n++) {
      const p = mapa[n]; if (q && !(String(n).startsWith(q) && /^\d+$/.test(q) || (p && p.nome.toLowerCase().includes(q)))) continue;
      const tr = el("tr", p ? "" : "livre"); tr.append(el("td", null, n), el("td", null, p ? p.nome + (g[n] ? "  🏆 " + g[n] + "º prêmio" : "") : "— livre —"));
      const tdp = el("td"), tda = el("td");
      if (p) {
        const cb = document.createElement("input"); cb.type = "checkbox"; cb.checked = !!p.pago; cb.setAttribute("aria-label", "Pago"); cb.style.cssText = "width:24px;height:24px";
        cb.onchange = () => A.setPaid(n, p.nome, cb.checked).catch((e) => toast("Erro: " + e.message)); tdp.append(cb);
        const x = el("button", "btn btn-perigo btn-sm", "Liberar"); x.type = "button";
        x.onclick = () => { if (g[n]) return toast("Este número já foi sorteado."); if (confirm("Liberar o número " + n + " (" + p.nome + ")?")) A.release(n).catch((e) => toast("Erro: " + e.message)); };
        tda.append(x);
      }
      tr.append(tdp, tda); tb.append(tr);
    }
    renderPremios();
  }
  $("#busca").oninput = (e) => { busca = e.target.value.trim(); render(); };
  $("#csv").onclick = () => {
    const l = ["Numero;Participante;Pago"]; for (let n = 1; n <= R.total; n++) { const p = mapa[n]; l.push(n + ";" + (p ? '"' + p.nome.replace(/"/g, '""') + '"' : "") + ";" + (p ? (p.pago ? "sim" : "nao") : "")); }
    const a = el("a"); a.href = URL.createObjectURL(new Blob(["﻿" + l.join("\n")], { type: "text/csv" })); a.download = "participantes-sorteio.csv"; a.click();
  };

  function renderPremios() {
    const ul = $("#res"); ul.textContent = "";
    R.premios.forEach((p) => {
      const w = vence["premio" + p.n], li = el("li", w ? "feito" : ""); li.append(el("div", "pn", p.n + "º"));
      const info = el("div", "info"); info.append(el("strong", null, p.titulo), el("small", null, w ? "Nº " + w.numero + " — " + w.nome : "Aguardando sorteio")); li.append(info);
      const b = el("button", w ? "btn btn-ghost btn-sm" : "btn btn-sol btn-sm", w ? "Refazer" : "Sortear"); b.type = "button"; b.disabled = girando;
      b.onclick = () => (w ? refazer(p) : sortear(p)); li.append(b); ul.append(li);
    });
  }
  async function refazer(p) { if (!confirm("Desfazer o resultado do " + p.n + "º prêmio?")) return; await A.clearWinner(p.n); }

  const rnd = (n) => { const a = new Uint32Array(1), lim = Math.floor(4294967296 / n) * n; do crypto.getRandomValues(a); while (a[0] >= lim); return a[0] % n; };

  async function sortear(p) {
    if (girando) return;
    const usados = new Set(Object.values(vence).map((v) => v.numero));
    const pool = Object.keys(mapa).map(Number).filter((n) => !usados.has(n));
    if (!pool.length) return toast("Não há números disponíveis para sortear.");
    girando = true; renderPremios();
    const visor = $("#visor"); visor.className = "visor gira"; $("#v-premio").textContent = p.n + "º prêmio — " + p.titulo; $("#v-nome").textContent = "Sorteando…";
    const vencedor = pool[rnd(pool.length)];
    const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const passos = reduz ? 1 : 42;
    for (let i = 0; i < passos; i++) {
      const n = pool[rnd(pool.length)]; $("#v-num").textContent = n; $("#v-nome").textContent = mapa[n].nome;
      await new Promise((r) => setTimeout(r, 55 + i * i * 0.14));
    }
    $("#v-num").textContent = vencedor; $("#v-nome").textContent = mapa[vencedor].nome;
    visor.className = "visor fim";
    try { await A.saveWinner(p.n, vencedor, mapa[vencedor].nome); toast("Resultado do " + p.n + "º prêmio registrado!"); }
    catch (e) { toast("Erro ao registrar: " + e.message); }
    girando = false; renderPremios();
  }
  start();
})();
