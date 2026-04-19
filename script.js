// ── Persistência ──────────────────────────────────────────────

function getLista() {
  return JSON.parse(localStorage.getItem("clientes") || "[]");
}

function salvarLista(lista) {
  localStorage.setItem("clientes", JSON.stringify(lista));
}

// ── Telefone: formatação e validação ─────────────────────────

function formatarTelefone(valor) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <=  2) return d;
  if (d.length <=  6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return                      `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function validarTelefone(valor) {
  const d = valor.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

function marcarInvalido(input, invalido) {
  input.classList.toggle("input-invalido", invalido);
}

// ── Cadastro ──────────────────────────────────────────────────

function adicionarCliente() {
  const nome     = document.getElementById("nome").value.trim();
  const telInput = document.getElementById("telefone");
  const telefone = telInput.value.trim();
  const obs      = document.getElementById("obs").value.trim();

  if (!nome || !telefone) {
    mostrarErro("Preencha nome e telefone.");
    return;
  }

  if (!validarTelefone(telefone)) {
    mostrarErro("Telefone inválido. Ex: (11) 99999-9999");
    marcarInvalido(telInput, true);
    telInput.focus();
    return;
  }

  const lista = getLista();
  const duplicado = lista.findIndex(c => c.telefone === telefone);

  if (duplicado !== -1) {
    mostrarErro("Este telefone já está cadastrado.");
    destacarItem(duplicado);
    return;
  }

  lista.push({ nome, telefone, obs, atendido: false });
  salvarLista(lista);

  document.getElementById("nome").value     = "";
  document.getElementById("telefone").value = "";
  document.getElementById("obs").value      = "";
  marcarInvalido(telInput, false);
  limparErro();
  renderLista();
}

// ── Status de atendimento ─────────────────────────────────────

function marcarAtendido(index) {
  const lista = getLista();
  lista[index].atendido = true;
  salvarLista(lista);
  renderLista();
}

function reabrirCliente(index) {
  const lista = getLista();
  lista[index].atendido = false;
  salvarLista(lista);
  renderLista();
}

// ── Remoção ───────────────────────────────────────────────────

function removerCliente(index) {
  const lista = getLista();
  lista.splice(index, 1);
  salvarLista(lista);
  renderLista();
}

function limparLista() {
  if (!confirm("Remover todos os clientes?")) return;
  salvarLista([]);
  renderLista();
}

// ── WhatsApp ──────────────────────────────────────────────────

function abrirWhatsApp(index) {
  const c      = getLista()[index];
  const numero = c.telefone.replace(/\D/g, "");
  const obs    = c.obs ? ` Observação: ${c.obs}.` : "";
  const msg    = `Olá, ${c.nome}! Aqui é a LavaFácil. Passando para confirmar seu atendimento.${obs}`;
  window.open(`https://wa.me/55${numero}?text=${encodeURIComponent(msg)}`, "_blank");
}

// ── Copiar e Exportar ─────────────────────────────────────────

function copiarContatos(btn) {
  const lista = getLista();
  if (lista.length === 0) return;

  const texto = lista.map(c => {
    const obs    = c.obs      ? ` (${c.obs})`     : "";
    const status = c.atendido ? " [Atendido]" : "";
    return `${c.nome}: ${c.telefone}${obs}${status}`;
  }).join("\n");

  navigator.clipboard.writeText(texto).then(() => {
    btn.textContent = "✓ Copiado!";
    setTimeout(() => { btn.textContent = "📋 Copiar"; }, 2000);
  });
}

function exportarDados() {
  const lista = getLista();
  if (lista.length === 0) return;

  const data   = new Date().toLocaleDateString("pt-BR");
  const linhas = lista.map((c, i) => {
    const obs    = c.obs      ? ` | Obs: ${c.obs}`    : "";
    const status = c.atendido ? " | ✓ Atendido" : " | Pendente";
    return `${i + 1}. ${c.nome} — ${c.telefone}${obs}${status}`;
  }).join("\n");

  const conteudo = `Clientes — LavaFácil\nExportado em: ${data}\n${"─".repeat(35)}\n${linhas}`;
  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `clientes-lavafacil-${data.replace(/\//g, "-")}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Renderização ──────────────────────────────────────────────

function renderItem(c, i) {
  const obsTag = c.obs ? `<span class="cliente-obs">⚠ ${c.obs}</span>` : "";

  if (c.atendido) {
    return `
      <li class="cliente-item atendido" data-idx="${i}">
        <div class="cliente-info">
          <span class="cliente-nome">${c.nome}</span>
          <span class="cliente-tel">${c.telefone}</span>
          ${obsTag}
        </div>
        <div class="cliente-acoes">
          <button class="btn-reabrir" onclick="reabrirCliente(${i})">↩ Reabrir</button>
          <button class="btn-remover" onclick="removerCliente(${i})">✕</button>
        </div>
      </li>`;
  }

  return `
    <li class="cliente-item" data-idx="${i}">
      <div class="cliente-info">
        <span class="cliente-nome">${c.nome}</span>
        <span class="cliente-tel">${c.telefone}</span>
        ${obsTag}
      </div>
      <div class="cliente-acoes">
        <button class="btn-atender"   onclick="marcarAtendido(${i})">✓ Atendido</button>
        <button class="btn-whatsapp"  onclick="abrirWhatsApp(${i})">💬</button>
        <button class="btn-remover"   onclick="removerCliente(${i})">✕</button>
      </div>
    </li>`;
}

function renderLista() {
  const lista     = getLista();
  const pendentes = lista.map((c, i) => ({...c, _i: i})).filter(c => !c.atendido);
  const atendidos = lista.map((c, i) => ({...c, _i: i})).filter(c =>  c.atendido);

  const section         = document.getElementById("lista-section");
  const ulPendentes     = document.getElementById("lista-pendentes");
  const ulAtendidos     = document.getElementById("lista-atendidos");
  const subAtendidos    = document.getElementById("sublista-atendidos");
  const badgePendentes  = document.getElementById("badge-pendentes");
  const badgeAtendidos  = document.getElementById("badge-atendidos");

  section.style.display      = lista.length > 0  ? "block" : "none";
  subAtendidos.style.display = atendidos.length > 0 ? "block" : "none";

  badgePendentes.textContent = `${pendentes.length} pendente${pendentes.length !== 1 ? "s" : ""}`;
  badgeAtendidos.textContent = `${atendidos.length} atendido${atendidos.length !== 1 ? "s" : ""}`;

  ulPendentes.innerHTML = pendentes.length === 0
    ? `<li class="lista-vazia">Nenhum cliente pendente.</li>`
    : pendentes.map(c => renderItem(c, c._i)).join("");

  ulAtendidos.innerHTML = atendidos.map(c => renderItem(c, c._i)).join("");
}

// ── Feedback visual ───────────────────────────────────────────

function mostrarErro(msg) {
  const el = document.getElementById("input-erro");
  el.textContent = msg;
  el.classList.add("visivel");
}

function limparErro() {
  const el = document.getElementById("input-erro");
  el.textContent = "";
  el.classList.remove("visivel");
}

function destacarItem(index) {
  renderLista();
  const el = document.querySelector(`.cliente-item[data-idx="${index}"]`);
  if (el) {
    el.classList.add("destaque");
    setTimeout(() => el.classList.remove("destaque"), 1500);
  }
}

// ── Inicialização ─────────────────────────────────────────────

window.onload = function () {
  renderLista();

  const telInput = document.getElementById("telefone");

  telInput.addEventListener("input", function () {
    this.value = formatarTelefone(this.value);
    marcarInvalido(this, false);
    limparErro();
  });

  telInput.addEventListener("blur", function () {
    const val = this.value.trim();
    if (val && !validarTelefone(val)) {
      marcarInvalido(this, true);
      mostrarErro("Telefone inválido. Ex: (11) 99999-9999");
    }
  });
};
