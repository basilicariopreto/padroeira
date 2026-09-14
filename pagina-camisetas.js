// ===== PÁGINA VENDA DE CAMISETAS =====
let edicaoCamisaId = null;
let filtroCamisa = 'todos';

function precoPorTipo(tipo) {
    const cfg = dados.configCamisetas || { precoTrabalhador: 0, precoPublico: 0 };
    return tipo === 'trabalhador' ? (cfg.precoTrabalhador || 0) : (cfg.precoPublico || 0);
}

// Por enquanto NÃO bloqueia ao esgotar (só mostra negativo). Trocar para true para bloquear.
const BLOQUEAR_ESTOQUE_CAMISETA = false;

function contarVendidas(tipo, tamanho) {
    return (dados.camisetas || []).filter(c => c.tipo === tipo && c.tamanho === tamanho).length;
}
function estoqueDe(tipo, tamanho) {
    const est = (dados.configCamisetas && dados.configCamisetas.estoque) || {};
    return (est[tipo] && est[tipo][tamanho]) || 0;
}

function atualizarTamanhosCamiseta() {
    const sel = document.getElementById('camisaTamanho');
    if (!sel) return;
    const tipo = document.getElementById('camisaTipo') ? document.getElementById('camisaTipo').value : '';
    const est = (dados.configCamisetas && dados.configCamisetas.estoque) || {};
    const estTipo = (tipo && est[tipo]) ? est[tipo] : {};
    const temEstoque = Object.values(estTipo).some(v => (v || 0) > 0);
    sel.innerHTML = '<option value="">Tamanho...</option>' + (TAMANHOS_CAMISETA['Casual'] || []).map(x => {
        const disp = estTipo[x.t] || 0;
        const vend = tipo ? contarVendidas(tipo, x.t) : 0;
        const restante = disp - vend;
        let sufixo = ` (${x.ref})`;
        let disabled = '';
        if (temEstoque && disp > 0) {
            sufixo = ` — ${restante} disp.`;
            if (BLOQUEAR_ESTOQUE_CAMISETA && restante <= 0) disabled = ' disabled';
        }
        return `<option value="${x.t}"${disabled}>${x.t}${sufixo}</option>`;
    }).join('');
}

function atualizarPrecoCamiseta() {
    const tipo = document.getElementById('camisaTipo').value;
    const info = document.getElementById('camisaPrecoInfo');
    atualizarTamanhosCamiseta();
    const rowQtd = document.getElementById('rowQtdCamisa');
    if (rowQtd) rowQtd.style.display = tipo === 'trabalhador' ? '' : 'none';
    if (!info) return;
    if (!tipo) { info.textContent = ''; return; }
    const preco = precoPorTipo(tipo);
    info.textContent = preco > 0 ? `Valor: ${R$(preco)}` : 'Valor: a definir (configure na página principal)';
}

function registrarCamiseta() {
    const nome = document.getElementById('camisaNome').value.trim();
    const telefone = document.getElementById('camisaTelefone').value.trim();
    const tipo = document.getElementById('camisaTipo').value;
    const modelagem = document.getElementById('camisaModelagem').value;
    const tamanho = document.getElementById('camisaTamanho').value;
    const pago = document.getElementById('camisaPago').checked;
    const qtdInput = document.getElementById('camisaQtd');
    let qtd = (tipo === 'trabalhador' && qtdInput) ? (parseInt(qtdInput.value) || 1) : 1;
    if (qtd < 1) qtd = 1;

    if (!nome) { alert('Preencha o nome da pessoa'); return; }
    if (!tipo) { alert('Selecione o tipo de comprador'); return; }
    if (!tamanho) { alert('Selecione o tamanho'); return; }

    // Estoque por tipo + tamanho (avisa se passar; só bloqueia se BLOQUEAR_ESTOQUE_CAMISETA=true)
    const disp = estoqueDe(tipo, tamanho);
    if (disp > 0) {
        const vend = contarVendidas(tipo, tamanho);
        const restante = disp - vend;
        if (qtd > restante) {
            if (BLOQUEAR_ESTOQUE_CAMISETA) {
                alert(`Estoque insuficiente para ${tamanho} (${tipo}).\nDisponível: ${restante} | Solicitado: ${qtd}`);
                return;
            } else {
                const excedente = qtd - Math.max(0, restante);
                if (!confirm(`Atenção: isso passa do estoque de ${tamanho} (${tipo}).\nDisponível: ${restante} | Solicitado: ${qtd}\n\nO estoque ficará negativo em ${excedente}. Registrar mesmo assim?`)) return;
            }
        }
    }

    const valor = precoPorTipo(tipo);
    for (let i = 0; i < qtd; i++) {
        const nomeItem = qtd > 1 ? `${nome} (${i + 1}/${qtd})` : nome;
        adicionarItem('camisetas', { id: Date.now() + i, nome: nomeItem, telefone, tipo, modelagem: modelagem || 'Casual', tamanho, valor, pago });
    }

    document.getElementById('camisaNome').value = '';
    document.getElementById('camisaTelefone').value = '';
    document.getElementById('camisaTipo').value = '';
    document.getElementById('camisaTamanho').value = '';
    if (qtdInput) qtdInput.value = '1';
    const rowQtd = document.getElementById('rowQtdCamisa');
    if (rowQtd) rowQtd.style.display = 'none';
    document.getElementById('camisaPago').checked = true;
    document.getElementById('camisaPrecoInfo').textContent = '';

    renderizarPagina();
    mostrarToast(qtd > 1 ? `✅ ${qtd} camisetas de ${nome} registradas!` : `✅ Camiseta de ${nome} registrada!`);
}

function togglePagoCamiseta(id) {
    const item = (dados.camisetas || []).find(c => String(c.id) === String(id));
    if (item) { atualizarItem('camisetas', id, { pago: !item.pago }); renderizarPagina(); }
}

function filtrarCamisetas(f) {
    filtroCamisa = f;
    document.querySelectorAll('[data-filtrocamisa]').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-filtrocamisa="${f}"]`);
    if (btn) btn.classList.add('active');
    renderizarPagina();
}

function editarCamiseta(id) {
    const item = (dados.camisetas || []).find(c => String(c.id) === String(id));
    if (!item) return;
    edicaoCamisaId = id;
    const tamOpts = (sel) => (TAMANHOS_CAMISETA['Casual'] || []).map(x =>
        `<option value="${x.t}" ${x.t === sel ? 'selected' : ''}>${x.t} (${x.ref})</option>`).join('');
    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Nome</label><input type="text" id="editNome" value="${item.nome}"></div>
        <div class="campo"><label>Telefone</label><input type="tel" id="editTelefone" value="${item.telefone || ''}"></div>
        <div class="campo"><label>Tipo</label>
            <select id="editTipoCamisa">
                <option value="trabalhador" ${item.tipo==='trabalhador'?'selected':''}>Trabalhador</option>
                <option value="publico" ${item.tipo==='publico'?'selected':''}>Público em geral</option>
            </select>
        </div>
        <input type="hidden" id="editModelagem" value="Casual">
        <div class="campo"><label>Tamanho</label>
            <select id="editTamanho">${tamOpts(item.tamanho)}</select>
        </div>
    `;
    document.getElementById('modalTitulo').textContent = 'Editar Venda de Camiseta';
    document.getElementById('modalOverlay').style.display = 'flex';
}

function atualizarTamanhoEdit() {
    const sel = document.getElementById('editTamanho');
    if (sel) sel.innerHTML = (TAMANHOS_CAMISETA['Casual'] || []).map(x => `<option value="${x.t}">${x.t} (${x.ref})</option>`).join('');
}

function salvarEdicaoCamiseta() {
    const item = (dados.camisetas || []).find(c => String(c.id) === String(edicaoCamisaId));
    if (!item) { fecharModal(); return; }
    const novoTipo = document.getElementById('editTipoCamisa').value;
    atualizarItem('camisetas', edicaoCamisaId, {
        nome: document.getElementById('editNome').value.trim() || item.nome,
        telefone: document.getElementById('editTelefone').value.trim(),
        tipo: novoTipo,
        modelagem: document.getElementById('editModelagem').value,
        tamanho: document.getElementById('editTamanho').value,
        valor: precoPorTipo(novoTipo) // atualiza valor conforme tipo atual
    });
    fecharModal();
    renderizarPagina();
}

function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    edicaoCamisaId = null;
}

function renderizarPagina() {
    if (!dados.camisetas) dados.camisetas = [];
    const busca = (document.getElementById('buscaCamisa')?.value || '').toLowerCase();

    let lista = [...dados.camisetas];
    if (busca) lista = lista.filter(c => (c.nome||'').toLowerCase().includes(busca));
    if (filtroCamisa === 'trabalhador') lista = lista.filter(c => c.tipo === 'trabalhador');
    else if (filtroCamisa === 'publico') lista = lista.filter(c => c.tipo === 'publico');
    else if (filtroCamisa === 'pago') lista = lista.filter(c => c.pago);
    else if (filtroCamisa === 'pendente') lista = lista.filter(c => !c.pago);
    lista.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));

    const TIPO_LABEL = { trabalhador: 'Trabalhador', publico: 'Público' };
    const tbody = document.querySelector('#tabelaCamisetas tbody');
    if (tbody) {
        tbody.innerHTML = lista.map(c => `
            <tr>
                <td style="font-weight:700">${c.nome}</td>
                <td>${c.telefone || '-'}</td>
                <td><span class="badge-categoria">${TIPO_LABEL[c.tipo] || c.tipo}</span></td>
                <td>${c.modelagem}</td>
                <td>${c.tamanho}</td>
                <td>${(c.valor||0) > 0 ? 'R$ ' + fmt(c.valor) : '-'}</td>
                <td><span class="${c.pago ? 'badge-pago' : 'badge-pendente'}" onclick="togglePagoCamiseta(${c.id})">${c.pago ? 'Pago' : 'Pendente'}</span></td>
                <td><button class="btn-edit" onclick="editarCamiseta(${c.id})">✏️</button></td>
            </tr>
        `).join('') || '<tr><td colspan="8" style="text-align:center;opacity:0.5;padding:15px">Nenhuma camiseta registrada</td></tr>';
    }

    // Resumo simples (só contagem, SEM valores financeiros) — esta página é para quem vende
    const todas = dados.camisetas;
    const totalTrab = todas.filter(c => c.tipo === 'trabalhador').length;
    const totalPub = todas.filter(c => c.tipo === 'publico').length;

    const resumoEl = document.getElementById('resumoCamisetas');
    if (resumoEl) {
        resumoEl.innerHTML = `
            <div class="item neutro"><span>Total Camisetas</span><strong>${todas.length}</strong></div>
            <div class="item neutro"><span>Trabalhador</span><strong>${totalTrab}</strong></div>
            <div class="item neutro"><span>Público</span><strong>${totalPub}</strong></div>
        `;
    }

    const contador = document.getElementById('contadorRegistros');
    if (contador) contador.textContent = todas.length > 0 ? `(${todas.length} vendida${todas.length>1?'s':''})` : '';

    atualizarTamanhosCamiseta();
    renderizarQtdPorTamanho();
}

// Quantidade por tamanho, separada por tipo (vendidas / disponíveis)
function renderizarQtdPorTamanho() {
    const el = document.getElementById('camisetasPorTamanho');
    if (!el) return;
    const todas = dados.camisetas || [];
    const est = (dados.configCamisetas && dados.configCamisetas.estoque) || {};
    const temAlgum = ['trabalhador','publico'].some(tp => est[tp] && Object.values(est[tp]).some(v => (v||0) > 0));
    if (todas.length === 0 && !temAlgum) { el.innerHTML = ''; return; }

    const blocoTipo = (tipo, titulo) => {
        const estTipo = est[tipo] || {};
        const temEstoque = Object.values(estTipo).some(v => (v || 0) > 0);
        const doTipo = todas.filter(c => c.tipo === tipo);
        if (doTipo.length === 0 && !temEstoque) return '';
        let inner = '';
        TAMANHOS_LISTA.forEach(t => {
            const vend = doTipo.filter(c => c.tamanho === t).length;
            const disp = estTipo[t] || 0;
            if (!temEstoque && vend === 0) return;
            const restante = disp - vend;
            let cor = 'rgba(91,192,235,0.15)', borda = 'rgba(91,192,235,0.4)';
            if (temEstoque && disp > 0) {
                if (restante < 0) { cor = 'rgba(239,83,80,0.22)'; borda = 'rgba(239,83,80,0.6)'; }
                else if (restante === 0) { cor = 'rgba(239,83,80,0.15)'; borda = 'rgba(239,83,80,0.4)'; }
                else if (restante <= 2) { cor = 'rgba(255,179,0,0.18)'; borda = 'rgba(255,179,0,0.5)'; }
            }
            const label = temEstoque ? `${vend}/${disp}` + (restante < 0 ? ` (${restante})` : '') : `${vend}`;
            inner += `<span style="background:${cor};border:1px solid ${borda};border-radius:8px;padding:6px 12px;font-size:0.9rem"><strong style="color:var(--cor-amarelo)">${t}</strong>: ${label}</span>`;
        });
        if (!inner) return '';
        return `<div class="tabela-box" style="margin-bottom:12px">
            <h4>${titulo} — ${doTipo.length} camiseta${doTipo.length!==1?'s':''}${temEstoque ? ' (vendidas / disponíveis)' : ''}</h4>
            <div style="display:flex;flex-wrap:wrap;gap:8px">${inner}</div>
        </div>`;
    };
    el.innerHTML = blocoTipo('trabalhador', '👷 Trabalhador') + blocoTipo('publico', '👥 Público em geral');
}

iniciarStatusFirebase();
iniciarSync();
