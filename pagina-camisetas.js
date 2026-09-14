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
    renderizarGradeTamanhosCamisa();
}

function renderizarGradeTamanhosCamisa() {
    const grade = document.getElementById('gradeTamanhosCamisa');
    if (!grade) return;
    // Se o usuário está digitando em algum campo da grade, NÃO reconstruir (evita apagar por um sync do Firebase)
    const ativo = document.activeElement;
    if (ativo && ativo.id && ativo.id.indexOf('gradeTam_') === 0) { atualizarTotalCamisa(); return; }
    const tipo = document.getElementById('camisaTipo') ? document.getElementById('camisaTipo').value : '';
    if (!tipo) { grade.innerHTML = '<span style="opacity:0.6;font-size:0.85rem">Selecione o tipo de comprador para lançar as quantidades por tamanho.</span>'; return; }
    const est = (dados.configCamisetas && dados.configCamisetas.estoque) || {};
    const estTipo = est[tipo] || {};
    const temEstoque = Object.values(estTipo).some(v => (v || 0) > 0);
    grade.innerHTML = (TAMANHOS_CAMISETA['Casual'] || []).map(x => {
        const id = 'gradeTam_' + x.t;
        let info = '';
        if (temEstoque) {
            const disp = estTipo[x.t] || 0;
            const restante = disp - contarVendidas(tipo, x.t);
            info = `<div style="font-size:0.68rem;opacity:0.75;margin-top:1px">${restante} disp.</div>`;
        }
        return `<div style="text-align:center">
            <label style="display:block;font-size:0.78rem;color:var(--cor-palha);font-weight:700;margin-bottom:2px">${x.t}</label>
            <input type="number" inputmode="numeric" id="${id}" value="" min="0" placeholder="0" class="input-tam-camisa" oninput="atualizarTotalCamisa()">
            ${info}
        </div>`;
    }).join('');
    atualizarTotalCamisa();
}

// Só recalcula o texto do total (NÃO recria a grade — senão apagaria os outros campos)
function atualizarTotalCamisa() {
    const tipo = document.getElementById('camisaTipo') ? document.getElementById('camisaTipo').value : '';
    const info = document.getElementById('camisaPrecoInfo');
    if (!info) return;
    if (!tipo) { info.textContent = ''; return; }
    const preco = precoPorTipo(tipo);
    let total = 0;
    (TAMANHOS_CAMISETA['Casual'] || []).forEach(x => {
        const inp = document.getElementById('gradeTam_' + x.t);
        total += inp ? (parseInt(inp.value) || 0) : 0;
    });
    let txt = preco > 0 ? `Valor unitário: ${R$(preco)}` : 'Valor: a definir (configure na página principal)';
    if (total > 0 && preco > 0) txt += ` | ${total} camiseta${total > 1 ? 's' : ''} = ${R$(preco * total)}`;
    else if (total > 0) txt += ` | ${total} camiseta${total > 1 ? 's' : ''}`;
    info.textContent = txt;
}

// Chamada quando muda o TIPO: reconstrói a grade (limpa quantidades) e recalcula total
function atualizarPrecoCamiseta() {
    renderizarGradeTamanhosCamisa();
}

function registrarCamiseta() {
    const nome = document.getElementById('camisaNome').value.trim();
    const telefone = document.getElementById('camisaTelefone').value.trim();
    const tipo = document.getElementById('camisaTipo').value;
    const modelagem = document.getElementById('camisaModelagem').value;
    const pago = document.getElementById('camisaPago').checked;

    if (!nome) { alert('Preencha o nome da pessoa'); return; }
    if (!tipo) { alert('Selecione o tipo de comprador'); return; }

    const pedidos = [];
    (TAMANHOS_CAMISETA['Casual'] || []).forEach(x => {
        const inp = document.getElementById('gradeTam_' + x.t);
        const q = inp ? (parseInt(inp.value) || 0) : 0;
        if (q > 0) pedidos.push({ tamanho: x.t, qtd: q });
    });
    if (pedidos.length === 0) { alert('Informe a quantidade de pelo menos um tamanho'); return; }

    const avisos = [];
    pedidos.forEach(p => {
        const disp = estoqueDe(tipo, p.tamanho);
        if (disp > 0) {
            const restante = disp - contarVendidas(tipo, p.tamanho);
            if (p.qtd > restante) avisos.push(`${p.tamanho}: pedido ${p.qtd}, disponível ${restante}`);
        }
    });
    if (avisos.length > 0) {
        if (BLOQUEAR_ESTOQUE_CAMISETA) {
            alert('Estoque insuficiente:\n' + avisos.join('\n'));
            return;
        } else {
            if (!confirm('Atenção: alguns tamanhos passam do estoque (ficarão negativos):\n\n' + avisos.join('\n') + '\n\nRegistrar mesmo assim?')) return;
        }
    }

    const valor = precoPorTipo(tipo);
    const totalCriadas = pedidos.reduce((s, p) => s + p.qtd, 0);
    let base = Date.now();
    pedidos.forEach(p => {
        for (let i = 0; i < p.qtd; i++) {
            adicionarItem('camisetas', { id: base++, nome, telefone, tipo, modelagem: modelagem || 'Casual', tamanho: p.tamanho, valor, pago });
        }
    });

    document.getElementById('camisaNome').value = '';
    document.getElementById('camisaTelefone').value = '';
    document.getElementById('camisaTipo').value = '';
    document.getElementById('camisaPago').checked = true;
    document.getElementById('camisaPrecoInfo').textContent = '';
    renderizarGradeTamanhosCamisa();

    renderizarPagina();
    mostrarToast(`✅ ${totalCriadas} camiseta${totalCriadas > 1 ? 's' : ''} de ${nome} registrada${totalCriadas > 1 ? 's' : ''}!`);
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

    const tbody = document.querySelector('#tabelaCamisetas tbody');
    if (tbody) {
        const grupos = agruparCamisetas(lista);
        tbody.innerHTML = grupos.map(g => linhaGrupoCamiseta(g)).join('')
            || '<tr><td colspan="7" style="text-align:center;opacity:0.5;padding:15px">Nenhuma camiseta registrada</td></tr>';
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

// Agrupa camisetas iguais (nome+telefone+tipo+tamanho+pago) para a tabela ficar enxuta
function agruparCamisetas(lista) {
    const mapa = {};
    lista.forEach(c => {
        const chave = [c.nome||'', c.telefone||'', c.tipo||'', c.tamanho||'', c.pago?1:0].join('|');
        if (!mapa[chave]) mapa[chave] = { ...c, qtd: 0, ids: [] };
        mapa[chave].qtd++;
        mapa[chave].ids.push(c.id);
    });
    return Object.values(mapa).sort((a,b) =>
        (a.nome||'').localeCompare(b.nome||'') ||
        (a.tipo||'').localeCompare(b.tipo||'') ||
        TAMANHOS_LISTA.indexOf(a.tamanho) - TAMANHOS_LISTA.indexOf(b.tamanho) ||
        (a.pago?1:0) - (b.pago?1:0)
    );
}

// Linha agrupada (esta página NÃO mostra valores financeiros)
function linhaGrupoCamiseta(g) {
    const TIPO_LABEL = { trabalhador: 'Trabalhador', publico: 'Público' };
    const idsStr = g.ids.join(',');
    return `
        <tr>
            <td style="font-weight:700">${g.nome}</td>
            <td>${g.telefone || '-'}</td>
            <td><span class="badge-categoria">${TIPO_LABEL[g.tipo] || g.tipo}</span></td>
            <td>${g.tamanho}</td>
            <td style="text-align:center;font-weight:700">${g.qtd}</td>
            <td><span class="${g.pago ? 'badge-pago' : 'badge-pendente'}" onclick="pagarGrupoCamiseta('${idsStr}')" style="cursor:pointer">${g.pago ? 'Pago' : 'Pendente'}</span></td>
            <td><button class="btn-edit" onclick="editarCamiseta(${g.ids[0]})" title="Editar">✏️</button></td>
        </tr>`;
}

// Marca pago/pendente; se grupo pendente com mais de 1, pergunta quantos pagar
function pagarGrupoCamiseta(idsStr) {
    const ids = String(idsStr).split(',');
    const itens = (dados.camisetas || []).filter(c => ids.includes(String(c.id)));
    if (itens.length === 0) return;
    if (itens[0].pago) {
        itens.forEach(c => atualizarItem('camisetas', c.id, { pago: false }));
        renderizarPagina();
        return;
    }
    if (itens.length === 1) {
        atualizarItem('camisetas', itens[0].id, { pago: true });
        renderizarPagina();
        return;
    }
    const resp = prompt(`Quantas camisetas estão sendo pagas agora?\n(${itens.length} pendentes de ${itens[0].nome} - tamanho ${itens[0].tamanho})`, String(itens.length));
    if (resp === null) return;
    let n = parseInt(resp);
    if (isNaN(n) || n <= 0) { alert('Digite um número válido.'); return; }
    if (n > itens.length) n = itens.length;
    for (let i = 0; i < n; i++) atualizarItem('camisetas', itens[i].id, { pago: true });
    renderizarPagina();
    mostrarToast(`✅ ${n} camiseta${n>1?'s':''} marcada${n>1?'s':''} como paga${n>1?'s':''}!`);
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
