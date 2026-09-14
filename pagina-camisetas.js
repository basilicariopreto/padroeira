// ===== PÁGINA VENDA DE CAMISETAS =====
let edicaoCamisaId = null;
let filtroCamisa = 'todos';

function precoPorTipo(tipo) {
    const cfg = dados.configCamisetas || { precoTrabalhador: 0, precoPublico: 0 };
    return tipo === 'trabalhador' ? (cfg.precoTrabalhador || 0) : (cfg.precoPublico || 0);
}

function contarVendidasPorTamanho(tamanho) {
    return (dados.camisetas || []).filter(c => c.tamanho === tamanho).length;
}

function atualizarTamanhosCamiseta() {
    const sel = document.getElementById('camisaTamanho');
    if (!sel) return;
    const estoque = (dados.configCamisetas && dados.configCamisetas.estoque) || {};
    const temEstoque = Object.values(estoque).some(v => (v || 0) > 0);
    sel.innerHTML = '<option value="">Tamanho...</option>' + (TAMANHOS_CAMISETA['Casual'] || []).map(x => {
        const disp = estoque[x.t] || 0;
        const vend = contarVendidasPorTamanho(x.t);
        const restante = disp - vend;
        let sufixo = ` (${x.ref})`;
        let disabled = '';
        if (temEstoque && disp > 0) {
            sufixo = ` — ${restante > 0 ? restante + ' disp.' : 'ESGOTADO'}`;
            if (restante <= 0) disabled = ' disabled';
        }
        return `<option value="${x.t}"${disabled}>${x.t}${sufixo}</option>`;
    }).join('');
}

function atualizarPrecoCamiseta() {
    const tipo = document.getElementById('camisaTipo').value;
    const info = document.getElementById('camisaPrecoInfo');
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

    if (!nome) { alert('Preencha o nome da pessoa'); return; }
    if (!tipo) { alert('Selecione o tipo de comprador'); return; }
    if (!tamanho) { alert('Selecione o tamanho'); return; }

    // Checagem de estoque por tamanho (se configurado)
    const estoque = (dados.configCamisetas && dados.configCamisetas.estoque) || {};
    const disp = estoque[tamanho] || 0;
    if (disp > 0) {
        const vend = contarVendidasPorTamanho(tamanho);
        if (vend >= disp) {
            alert(`Estoque esgotado para o tamanho ${tamanho}!\nDisponível: ${disp} | Já registradas: ${vend}`);
            return;
        }
    }

    // valor é registrado no momento (snapshot do preço configurado). Se ainda não tem preço, fica 0.
    const valor = precoPorTipo(tipo);

    adicionarItem('camisetas', { id: Date.now(), nome, telefone, tipo, modelagem: modelagem || 'Casual', tamanho, valor, pago });

    document.getElementById('camisaNome').value = '';
    document.getElementById('camisaTelefone').value = '';
    document.getElementById('camisaTipo').value = '';
    document.getElementById('camisaTamanho').value = '';
    document.getElementById('camisaPago').checked = true;
    document.getElementById('camisaPrecoInfo').textContent = '';

    renderizarPagina();
    mostrarToast(`✅ Camiseta de ${nome} registrada!`);
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

// Quantidade por tamanho (vendidas / disponíveis)
function renderizarQtdPorTamanho() {
    const el = document.getElementById('camisetasPorTamanho');
    if (!el) return;
    const todas = dados.camisetas || [];
    const estoque = (dados.configCamisetas && dados.configCamisetas.estoque) || {};
    const temEstoqueConfig = Object.values(estoque).some(v => (v || 0) > 0);

    const contagem = {};
    todas.forEach(c => { contagem[c.tamanho] = (contagem[c.tamanho] || 0) + 1; });

    if (todas.length === 0 && !temEstoqueConfig) { el.innerHTML = ''; return; }

    let html = `<div class="tabela-box" style="margin-bottom:12px">
        <h4>Camisetas por tamanho${temEstoqueConfig ? ' (vendidas / disponíveis)' : ''} — ${todas.length} no total</h4>
        <div style="display:flex;flex-wrap:wrap;gap:8px">`;
    TAMANHOS_LISTA.forEach(t => {
        const vend = contagem[t] || 0;
        const disp = estoque[t] || 0;
        if (!temEstoqueConfig && vend === 0) return;
        let cor = 'rgba(91,192,235,0.15)', borda = 'rgba(91,192,235,0.4)', extra = '';
        if (temEstoqueConfig) {
            const restante = disp - vend;
            if (disp > 0 && restante <= 0) { cor = 'rgba(239,83,80,0.18)'; borda = 'rgba(239,83,80,0.5)'; extra = ' ESGOTADO'; }
            else if (disp > 0 && restante <= 2) { cor = 'rgba(255,179,0,0.18)'; borda = 'rgba(255,179,0,0.5)'; }
        }
        const label = temEstoqueConfig ? `${vend}/${disp}${extra}` : `${vend}`;
        html += `<span style="background:${cor};border:1px solid ${borda};border-radius:8px;padding:6px 12px;font-size:0.9rem"><strong style="color:var(--cor-amarelo)">${t}</strong>: ${label}</span>`;
    });
    html += '</div></div>';
    el.innerHTML = html;
}

iniciarStatusFirebase();
iniciarSync();
