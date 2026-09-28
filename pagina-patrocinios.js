// ===== PÁGINA PATROCINADORES =====
let ordenacaoPatr = 'alfa';
let edicaoPatrId = null;

function lancarPatrocinio() {
    const nome = document.getElementById('nomePatrocinador').value.trim();
    const tipo = document.getElementById('tipoPatrocinio').value;
    const valor = parseFloat(document.getElementById('valorPatrocinio').value) || 0;
    const desc = document.getElementById('descPatrocinio').value.trim();
    const obs = document.getElementById('obsPatrocinio').value.trim();
    const recebido = document.getElementById('recebidoPatrocinio').checked;
    const logoEnviado = document.getElementById('logoEnviadoPatrocinio') ? document.getElementById('logoEnviadoPatrocinio').checked : false;
    if (!nome) { alert('Preencha o nome do patrocinador'); return; }

    adicionarItem('patrocinadores', { id: Date.now(), nome, tipo, valor, desc, barraca: '', obs, recebido, logoEnviado });

    document.getElementById('nomePatrocinador').value = '';
    document.getElementById('valorPatrocinio').value = '';
    document.getElementById('descPatrocinio').value = '';
    document.getElementById('obsPatrocinio').value = '';
    document.getElementById('recebidoPatrocinio').checked = false;
    if (document.getElementById('logoEnviadoPatrocinio')) document.getElementById('logoEnviadoPatrocinio').checked = false;
    renderizarPagina();
    mostrarToast(`✅ Patrocínio de ${nome} lançado!`);
}

function removerPatrocinio(id) {
    if (!confirm('Excluir este patrocínio?')) return;
    removerItem('patrocinadores', id);
    renderizarPagina();
}

function toggleRecebido(id) {
    const item = (dados.patrocinadores || []).find(p => String(p.id) === String(id));
    if (item) { atualizarItem('patrocinadores', id, { recebido: !item.recebido }); renderizarPagina(); }
}

function toggleLogoEnviado(id) {
    const item = (dados.patrocinadores || []).find(p => String(p.id) === String(id));
    if (item) { atualizarItem('patrocinadores', id, { logoEnviado: !item.logoEnviado }); renderizarPagina(); }
}

function ordenarPatrocinadores(tipo) {
    ordenacaoPatr = tipo;
    document.querySelectorAll('[data-ordpatr]').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-ordpatr="${tipo}"]`);
    if (btn) btn.classList.add('active');
    renderizarPagina();
}

function editarPatrocinio(id) {
    const item = (dados.patrocinadores || []).find(p => String(p.id) === String(id));
    if (!item) return;
    edicaoPatrId = id;
    const tipoSel = (t) => item.tipo === t ? 'selected' : '';
    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Patrocinador</label><input type="text" id="editNome" value="${item.nome}"></div>
        <div class="campo"><label>Tipo</label>
            <select id="editTipo">
                <option value="dinheiro" ${tipoSel('dinheiro')}>💵 Dinheiro</option>
                <option value="servico" ${tipoSel('servico')}>🔧 Serviço</option>
                <option value="produto" ${tipoSel('produto')}>📦 Produto/Material</option>
            </select>
        </div>
        <div class="campo"><label>Valor (R$)</label><input type="number" id="editValor" value="${item.valor}" step="0.01"></div>
        <div class="campo"><label>Descrição</label><input type="text" id="editDesc" value="${item.desc || ''}"></div>
        <div class="campo"><label>Observação</label><input type="text" id="editObs" value="${item.obs || ''}"></div>
    `;
    document.getElementById('modalOverlay').style.display = 'flex';
}

function salvarEdicaoPatrocinio() {
    const item = (dados.patrocinadores || []).find(p => String(p.id) === String(edicaoPatrId));
    if (!item) { fecharModal(); return; }
    const v = document.getElementById('editValor').value;
    atualizarItem('patrocinadores', edicaoPatrId, {
        nome: document.getElementById('editNome').value.trim() || item.nome,
        tipo: document.getElementById('editTipo').value,
        valor: v === '' ? 0 : parseFloat(v),
        desc: document.getElementById('editDesc').value.trim(),
        obs: document.getElementById('editObs').value.trim()
    });
    fecharModal();
    renderizarPagina();
}

function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    edicaoPatrId = null;
}

function renderizarPagina() {
    if (!dados.patrocinadores) dados.patrocinadores = [];
    const tbody = document.querySelector('#tabelaPatrocinadores tbody');
    const busca = (document.getElementById('buscaPatrocinador')?.value || '').toLowerCase();
    let lista = [...dados.patrocinadores];

    if (busca) lista = lista.filter(p => p.nome.toLowerCase().includes(busca) || (p.desc||'').toLowerCase().includes(busca));
    if (ordenacaoPatr === 'alfa') lista.sort((a,b) => a.nome.localeCompare(b.nome));
    else if (ordenacaoPatr === 'valor') lista.sort((a,b) => b.valor - a.valor);
    else if (ordenacaoPatr === 'pendente') lista = lista.filter(p => !p.recebido).sort((a,b) => a.nome.localeCompare(b.nome));
    else if (ordenacaoPatr === 'recebido') lista = lista.filter(p => p.recebido).sort((a,b) => a.nome.localeCompare(b.nome));

    const TIPO_BADGE = { dinheiro: '💵 Dinheiro', servico: '🔧 Serviço', produto: '📦 Produto' };

    if (tbody) {
        tbody.innerHTML = lista.map(p => `
            <tr>
                <td style="font-weight:700">${p.nome}</td>
                <td><span class="badge-categoria">${TIPO_BADGE[p.tipo] || '💵 Dinheiro'}</span></td>
                <td>${p.desc || '-'}</td>
                <td>${p.valor > 0 ? 'R$ ' + fmt(p.valor) : '-'}</td>
                <td><span class="${p.recebido ? 'badge-pago' : 'badge-pendente'}" onclick="toggleRecebido(${p.id})">${p.recebido ? 'Recebido' : 'Pendente'}</span></td>
                <td><span class="${p.logoEnviado ? 'badge-pago' : 'badge-pendente'}" onclick="toggleLogoEnviado(${p.id})">${p.logoEnviado ? 'Enviado' : 'Pendente'}</span></td>
                <td><button class="btn-edit" onclick="editarPatrocinio(${p.id})">✏️</button> <button class="btn-delete" onclick="removerPatrocinio(${p.id})">X</button></td>
            </tr>
        `).join('') || '<tr><td colspan="7" style="text-align:center;opacity:0.5;padding:15px">Nenhum patrocinador cadastrado</td></tr>';
    }

    // Resumo
    const todos = dados.patrocinadores;
    const totalDinheiro = todos.filter(p => (p.tipo||'dinheiro') === 'dinheiro').reduce((s,p) => s + (p.valor||0), 0);
    const totalServico = todos.filter(p => p.tipo === 'servico').reduce((s,p) => s + (p.valor||0), 0);
    const totalProduto = todos.filter(p => p.tipo === 'produto').reduce((s,p) => s + (p.valor||0), 0);
    const totalGeral = todos.reduce((s,p) => s + (p.valor||0), 0);
    const recebido = todos.filter(p => p.recebido).reduce((s,p) => s + (p.valor||0), 0);

    const resumoEl = document.getElementById('resumoPatrocinadores');
    if (resumoEl) {
        resumoEl.innerHTML = `
            <div class="item positivo"><span>Total Geral</span><strong>${R$(totalGeral)}</strong></div>
            <div class="item positivo"><span>💵 Dinheiro</span><strong>${R$(totalDinheiro)}</strong></div>
            <div class="item doacao"><span>🔧 Serviços</span><strong>${R$(totalServico)}</strong></div>
            <div class="item doacao"><span>📦 Produtos</span><strong>${R$(totalProduto)}</strong></div>
            <div class="item positivo"><span>Recebido</span><strong>${R$(recebido)}</strong></div>
            <div class="item negativo"><span>Pendente</span><strong>${R$(totalGeral - recebido)}</strong></div>
            <div class="item neutro"><span>Qtd</span><strong>${todos.length}</strong></div>
        `;
    }

    const contador = document.getElementById('contadorRegistros');
    if (contador) contador.textContent = todos.length > 0 ? `(${todos.length} cadastrado${todos.length>1?'s':''})` : '';
}

function exportarPatrocinadoresPDF() {
    const patrs = dados.patrocinadores || [];
    if (patrs.length === 0) { alert('Nenhum patrocinador cadastrado'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(16); doc.setTextColor(91, 192, 235);
    doc.text('LISTA DE PATROCINADORES', pageW / 2, y, { align: 'center' }); y += 8;
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text('Festa da Padroeira - Edição 2026', pageW / 2, y, { align: 'center' }); y += 6;
    doc.text('09, 10, 11 e 12 de Outubro', pageW / 2, y, { align: 'center' }); y += 12;

    const TIPOS = { dinheiro: 'Dinheiro', servico: 'Serviço', produto: 'Produto' };
    const lista = [...patrs].sort((a,b) => a.nome.localeCompare(b.nome));

    doc.autoTable({
        startY: y, theme: 'grid',
        headStyles: { fillColor: [91, 192, 235], textColor: [255,255,255], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        styles: { overflow: 'linebreak', cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 22 }, 2: { cellWidth: 60 }, 3: { cellWidth: 25 }, 4: { cellWidth: 25 } },
        head: [['Patrocinador', 'Tipo', 'Descrição', 'Valor', 'Status', 'Logo']],
        body: lista.map(p => [
            p.nome || '-', TIPOS[p.tipo] || 'Dinheiro', p.desc || '-',
            (p.valor||0) > 0 ? 'R$ ' + fmt(p.valor||0) : '-',
            p.recebido ? 'Recebido' : 'Pendente',
            p.logoEnviado ? 'Enviado' : 'Pendente'
        ])
    });
    y = doc.lastAutoTable.finalY + 8;
    const tGeral = lista.reduce((s,p) => s + (p.valor||0), 0);
    const rec = lista.filter(p => p.recebido).reduce((s,p) => s + (p.valor||0), 0);
    doc.setFontSize(9); doc.setTextColor(80);
    doc.text(`Total: ${lista.length} patrocinadores | Valor total: R$ ${fmt(tGeral)} | Recebido: R$ ${fmt(rec)} | Pendente: R$ ${fmt(tGeral - rec)}`, 14, y);
    doc.save('patrocinadores_padroeira.pdf');
    mostrarToast('📄 PDF exportado!');
}

function exportarPatrocinadoresCSV() {
    const patrs = dados.patrocinadores || [];
    if (patrs.length === 0) { alert('Nenhum patrocinador cadastrado'); return; }
    const TIPOS = { dinheiro: 'Dinheiro', servico: 'Serviço', produto: 'Produto' };
    let csv = 'Patrocinador;Tipo;Descrição;Valor;Status;Logo;Observação\n';
    [...patrs].sort((a,b) => a.nome.localeCompare(b.nome)).forEach(p => {
        csv += `${p.nome};${TIPOS[p.tipo]||'Dinheiro'};${p.desc||''};${p.valor > 0 ? fmt(p.valor) : ''};${p.recebido ? 'Recebido' : 'Pendente'};${p.logoEnviado ? 'Enviado' : 'Pendente'};${p.obs||''}\n`;
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'patrocinadores_padroeira.csv';
    link.click();
    mostrarToast('📥 CSV exportado!');
}

iniciarStatusFirebase();
iniciarSync();
