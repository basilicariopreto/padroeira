// ===== PÁGINA VENDA DE CAMISETAS =====
let edicaoCamisaId = null;
let filtroCamisa = 'todos';
let filtroCamisaDia = 'todos';

function atualizarBotoesDiaCamisa() {
    const container = document.getElementById('filtrosDiaCamisa');
    if (!container) return;
    const dias = [...new Set((dados.camisetas || []).map(c => c.data).filter(Boolean))].sort();
    if (dias.length === 0) { container.innerHTML = ''; return; }
    const btns = dias.map(d => {
        const label = d.split('-').reverse().join('/');
        const ativo = filtroCamisaDia === d ? 'active' : '';
        return `<button class="filtro-btn ${ativo}" data-filtrocamisadia="${d}" onclick="filtrarCamisetasDia('${d}')">${label}</button>`;
    }).join('');
    container.innerHTML =
        `<button class="filtro-btn ${filtroCamisaDia === 'todos' ? 'active' : ''}" data-filtrocamisadia="todos" onclick="filtrarCamisetasDia('todos')">Todos</button>` + btns;
}

function filtrarCamisetasDia(d) {
    filtroCamisaDia = d;
    renderizarPagina();
}

function precoPorTipo(tipo) {
    const cfg = dados.configCamisetas || { precoTrabalhador: 0, precoPublico: 0 };
    return tipo === 'trabalhador' ? (cfg.precoTrabalhador || 0) : (cfg.precoPublico || 0);
}

// Calcula quantas camisetas um pagamento representa (floor do valor / preço unitário)
function qtdPorPagamento(valorPago, tipo) {
    const preco = precoPorTipo(tipo);
    if (!preco || preco <= 0) return 1;
    return Math.max(1, Math.floor((valorPago || 0) / preco));
}

// Atualiza prévia de quantidade ao digitar valor
function atualizarInfoQtdCamisa() {
    const tipo = document.getElementById('camisaTipo').value;
    const valorStr = document.getElementById('camisaValorPago').value;
    const info = document.getElementById('camisaInfoQtd');
    if (!info) return;
    if (!tipo || !valorStr) { info.textContent = ''; return; }
    const valorPago = parseFloat(valorStr) || 0;
    const preco = precoPorTipo(tipo);
    if (preco <= 0) { info.textContent = 'Preço configurado pelo admin.'; info.style.color = '#ffb300'; return; }
    const qtd = Math.floor(valorPago / preco);
    const troco = valorPago - qtd * preco;
    let txt = `= ${qtd} camiseta${qtd !== 1 ? 's' : ''} (R$ ${fmt(preco)}/un.)`;
    if (troco > 0) txt += ` · sobra R$ ${fmt(troco)}`;
    if (qtd < 1) txt = `Valor mínimo: R$ ${fmt(preco)}`;
    info.textContent = txt;
    info.style.color = qtd >= 1 ? '#81c784' : '#ef5350';
}

function registrarCamiseta() {
    const nome = document.getElementById('camisaNome').value.trim();
    const tipo = document.getElementById('camisaTipo').value;
    const valorStr = document.getElementById('camisaValorPago').value;
    const valorPago = parseFloat(valorStr) || 0;
    const obs = document.getElementById('camisaObs').value.trim();
    const dataEl = document.getElementById('camisaData');
    const data = dataEl ? dataEl.value : new Date().toISOString().split('T')[0];

    if (!nome) { alert('Preencha o nome da pessoa'); return; }
    if (!tipo) { alert('Selecione o tipo (Trabalhador ou Público)'); return; }
    if (valorPago <= 0) { alert('Informe o valor pago'); return; }

    const qtd = qtdPorPagamento(valorPago, tipo);
    const preco = precoPorTipo(tipo);
    if (preco > 0 && valorPago % preco !== 0) {
        const msg = `Valor R$ ${fmt(valorPago)} com preço R$ ${fmt(preco)}/un. = ${qtd} camiseta${qtd>1?'s':''} (sobra R$ ${fmt(valorPago - qtd*preco)}). Confirma?`;
        if (!confirm(msg)) return;
    }

    adicionarItem('camisetas', {
        id: Date.now(),
        nome,
        tipo,
        valor: valorPago,
        pago: true,
        pagamento: document.getElementById('camisaPagamento') ? document.getElementById('camisaPagamento').value : 'pix',
        obs,
        data: data || new Date().toISOString().split('T')[0]
    });

    document.getElementById('camisaNome').value = '';
    document.getElementById('camisaTipo').value = '';
    document.getElementById('camisaValorPago').value = '';
    document.getElementById('camisaObs').value = '';
    document.getElementById('camisaInfoQtd').textContent = '';
    const pgto = document.getElementById('camisaPagamento');
    if (pgto) pgto.value = 'pix';
    renderizarPagina();
    mostrarToast(`✅ ${qtd} camiseta${qtd>1?'s':''} de ${nome} registrada${qtd>1?'s':''}!`);
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
    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Nome</label><input type="text" id="editNome" value="${item.nome || ''}"></div>
        <div class="campo"><label>Tipo</label>
            <select id="editTipoCamisa">
                <option value="trabalhador" ${item.tipo==='trabalhador'?'selected':''}>Trabalhador</option>
                <option value="publico" ${item.tipo==='publico'?'selected':''}>Público em geral</option>
            </select>
        </div>
        <div class="campo"><label>Valor pago R$</label><input type="number" id="editValorCamisa" value="${item.valor || 0}" step="0.01" min="0"></div>
        <div class="campo"><label>Forma de pagamento</label>
            <select id="editPagamentoCamisa">
                <option value="pix" ${(item.pagamento||'pix')==='pix'?'selected':''}>💙 Pix</option>
                <option value="dinheiro" ${item.pagamento==='dinheiro'?'selected':''}>💵 Dinheiro</option>
                <option value="cartao" ${item.pagamento==='cartao'?'selected':''}>💳 Cartão</option>
            </select>
        </div>
        <div class="campo"><label>Data</label><input type="date" id="editDataCamisa" value="${item.data || ''}"></div>
        <div class="campo"><label>Observação</label><input type="text" id="editObsCamisa" value="${item.obs || ''}"></div>
    `;
    document.getElementById('modalTitulo').textContent = 'Editar Venda de Camiseta';
    document.getElementById('modalOverlay').style.display = 'flex';
}

function salvarEdicaoCamiseta() {
    const item = (dados.camisetas || []).find(c => String(c.id) === String(edicaoCamisaId));
    if (!item) { fecharModal(); return; }
    const v = document.getElementById('editValorCamisa').value;
    atualizarItem('camisetas', edicaoCamisaId, {
        nome: document.getElementById('editNome').value.trim() || item.nome,
        tipo: document.getElementById('editTipoCamisa').value,
        valor: v === '' ? 0 : parseFloat(v),
        pagamento: document.getElementById('editPagamentoCamisa').value,
        data: document.getElementById('editDataCamisa').value,
        obs: document.getElementById('editObsCamisa').value.trim(),
        pago: true
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

    // Setar data padrão (hoje) no campo se ainda estiver vazio
    const dataEl = document.getElementById('camisaData');
    if (dataEl && !dataEl.value) dataEl.value = new Date().toISOString().split('T')[0];

    const busca = (document.getElementById('buscaCamisa')?.value || '').toLowerCase();

    let lista = [...dados.camisetas];
    atualizarBotoesDiaCamisa();
    if (busca) lista = lista.filter(c => (c.nome||'').toLowerCase().includes(busca));
    if (filtroCamisa === 'trabalhador') lista = lista.filter(c => c.tipo === 'trabalhador');
    else if (filtroCamisa === 'publico') lista = lista.filter(c => c.tipo === 'publico');
    if (filtroCamisaDia !== 'todos') lista = lista.filter(c => (c.data || '') === filtroCamisaDia);
    lista.sort((a,b) => (b.data||'').localeCompare(a.data||'') || (a.nome||'').localeCompare(b.nome||''));

    const tbody = document.querySelector('#tabelaCamisetas tbody');
    if (tbody) {
        const TIPO_LABEL = { trabalhador: '👷 Trabalhador', publico: '👥 Público' };
        const PGTO_LABEL = { pix: '💙 Pix', dinheiro: '💵 Din.', cartao: '💳 Crt.' };
        tbody.innerHTML = lista.map(c => {
            const qtd = qtdPorPagamento(c.valor || 0, c.tipo);
            const dataFmt = c.data ? c.data.split('-').reverse().join('/') : '-';
            const pgto = PGTO_LABEL[c.pagamento || 'pix'] || '💙 Pix';
            return `<tr>
                <td>${dataFmt}</td>
                <td style="font-weight:700">${c.nome || '-'}</td>
                <td><span class="badge-categoria">${TIPO_LABEL[c.tipo] || c.tipo}</span></td>
                <td style="text-align:center;font-weight:700">${qtd}</td>
                <td style="font-size:0.82rem">${pgto}</td>
                <td style="opacity:0.7;font-size:0.82rem">${c.obs || '-'}</td>
                <td><button class="btn-edit" onclick="editarCamiseta(${c.id})" title="Editar">✏️</button></td>
            </tr>`;
        }).join('') || '<tr><td colspan="7" style="text-align:center;opacity:0.5;padding:15px">Nenhum registro de venda</td></tr>';
    }

    // Resumo por tipo (sem valores financeiros — esta página é para quem vende)
    const todas = dados.camisetas;
    const qtdTrab = todas.filter(c=>c.tipo==='trabalhador').reduce((s,c)=>s+qtdPorPagamento(c.valor||0,'trabalhador'),0);
    const qtdPub = todas.filter(c=>c.tipo==='publico').reduce((s,c)=>s+qtdPorPagamento(c.valor||0,'publico'),0);
    const cfg = dados.configCamisetas || {};
    const dispTrab = cfg.qtdTrabalhador || 0;
    const dispPub = cfg.qtdPublico || 0;

    const resumoEl = document.getElementById('resumoCamisetas');
    if (resumoEl) {
        resumoEl.innerHTML = `
            <div class="item neutro"><span>Total camisetas</span><strong>${qtdTrab + qtdPub}</strong></div>
            <div class="item neutro"><span>👷 Trabalhador</span><strong>${qtdTrab}${dispTrab > 0 ? ' / ' + dispTrab : ''}</strong></div>
            <div class="item neutro"><span>👥 Público</span><strong>${qtdPub}${dispPub > 0 ? ' / ' + dispPub : ''}</strong></div>
            ${dispTrab > 0 ? `<div class="item ${(dispTrab-qtdTrab)>=0?'positivo':'negativo'}"><span>Restam (trab.)</span><strong style="color:${(dispTrab-qtdTrab)>=0?'#81c784':'#ef5350'}">${dispTrab-qtdTrab}</strong></div>` : ''}
            ${dispPub > 0 ? `<div class="item ${(dispPub-qtdPub)>=0?'positivo':'negativo'}"><span>Restam (públ.)</span><strong style="color:${(dispPub-qtdPub)>=0?'#81c784':'#ef5350'}">${dispPub-qtdPub}</strong></div>` : ''}
        `;
    }

    const contador = document.getElementById('contadorRegistros');
    if (contador) contador.textContent = (qtdTrab+qtdPub) > 0 ? `(${qtdTrab+qtdPub} vendida${(qtdTrab+qtdPub)>1?'s':''})` : '';
}

iniciarStatusFirebase();
iniciarSync();
