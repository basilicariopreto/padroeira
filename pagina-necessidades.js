// ===== PÁGINA ITENS NECESSÁRIOS =====
let edicaoNecId = null;

// Categorias especiais que aparecem SÓ nas necessidades (não são barracas de verdade)
const CATEGORIAS_NEC_ESPECIAIS = {
    geral: 'Geral (evento todo)',
    descartaveis: 'Descartáveis'
};
function nomeCategoriaNec(key, comEmoji) {
    if (key === 'geral') return comEmoji ? '🏗️ Geral (Infraestrutura/Evento)' : 'Geral';
    if (key === 'descartaveis') return comEmoji ? '🧻 Descartáveis' : 'Descartáveis';
    const nome = NOMES_BARRACAS[key] || key;
    return comEmoji ? nome : nome.replace(/^.{2}\s?/, '');
}
function opcoesFixasNec(selecionado) {
    return Object.entries(CATEGORIAS_NEC_ESPECIAIS).map(([v, label]) =>
        `<option value="${v}" ${selecionado === v ? 'selected' : ''}>${label}</option>`
    ).join('');
}

function adicionarNecessidade() {
    const barraca = document.getElementById('necessidadeBarraca').value;
    const item = document.getElementById('necessidadeItem').value.trim();
    const qtd = parseFloat(document.getElementById('necessidadeQtd').value) || 1;
    const unidade = document.getElementById('necessidadeUnidade').value;
    const obs = document.getElementById('necessidadeObs').value.trim();
    if (!item) { alert('Preencha o item necessário'); return; }

    adicionarItem('necessidades', { id: Date.now(), barraca, item, qtd, unidade, obs, qtdConseguida: 0, conseguido: false });
    document.getElementById('necessidadeItem').value = '';
    document.getElementById('necessidadeQtd').value = '1';
    document.getElementById('necessidadeObs').value = '';
    renderizarPagina();
    // Mantém a mesma barraca e volta o foco pro item (agiliza lançar vários seguidos)
    const selBarr = document.getElementById('necessidadeBarraca');
    if (selBarr) selBarr.value = barraca;
    const inputItem = document.getElementById('necessidadeItem');
    if (inputItem) inputItem.focus();
    mostrarToast(`✅ Item adicionado!`);
}

function removerNecessidade(id) {
    if (!confirm('Remover este item?')) return;
    removerItem('necessidades', id);
    renderizarPagina();
}

function toggleConseguido(id) {
    const item = (dados.necessidades || []).find(n => String(n.id) === String(id));
    if (!item) return;
    const marcar = !item.conseguido;
    atualizarItem('necessidades', id, { conseguido: marcar, qtdConseguida: marcar ? (item.qtd || 0) : 0 });
    renderizarPagina();
}

// Lançar (somar) uma quantidade recebida/conseguida ao item
function lancarConseguido(id) {
    const item = (dados.necessidades || []).find(n => String(n.id) === String(id));
    if (!item) return;
    const resp = prompt(`Lançar quantidade recebida de "${item.item}"\n(Meta: ${item.qtd} ${item.unidade} | Já conseguido: ${item.qtdConseguida||0} ${item.unidade})\n\nDigite a quantidade que chegou agora:`, '');
    if (resp === null) return;
    const add = parseFloat(String(resp).replace(',', '.'));
    if (isNaN(add) || add === 0) { alert('Digite um número válido.'); return; }
    let novo = (item.qtdConseguida || 0) + add;
    if (novo < 0) novo = 0;
    atualizarItem('necessidades', id, { qtdConseguida: novo, conseguido: novo >= (item.qtd || 0) });
    renderizarPagina();
    mostrarToast(`✅ Lançado ${add} ${item.unidade} de ${item.item}`);
}

function editarNecessidade(id) {
    const item = (dados.necessidades || []).find(n => String(n.id) === String(id));
    if (!item) return;
    edicaoNecId = id;
    const unidades = ['un','kg','g','L','cx','pct','fardo','dz','lata','saco','bandeja'];
    const unidadeOpts = unidades.map(u => `<option value="${u}" ${item.unidade === u ? 'selected' : ''}>${u}</option>`).join('');
    const barracaOpts = opcoesFixasNec(item.barraca) +
        BARRACAS.map(b => `<option value="${b}" ${item.barraca === b ? 'selected' : ''}>${(NOMES_BARRACAS[b]||b).replace(/^.{2}\s?/,'')}</option>`).join('');
    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Barraca</label><select id="editNecBarraca">${barracaOpts}</select></div>
        <div class="campo"><label>Item</label><input type="text" id="editNecItem" value="${(item.item||'').replace(/"/g,'&quot;')}"></div>
        <div class="campo"><label>Quantidade (meta)</label><input type="number" id="editNecQtd" value="${item.qtd || 0}" min="0" step="0.01"></div>
        <div class="campo"><label>Unidade</label><select id="editNecUnidade">${unidadeOpts}</select></div>
        <div class="campo"><label>Já conseguido</label><input type="number" id="editNecConseguida" value="${item.qtdConseguida || 0}" min="0" step="0.01"></div>
        <div class="campo"><label>Observação</label><input type="text" id="editNecObs" value="${(item.obs||'').replace(/"/g,'&quot;')}"></div>
    `;
    document.getElementById('modalTitulo').textContent = 'Editar Item Necessário';
    document.getElementById('modalOverlay').style.display = 'flex';
}

function salvarEdicaoNecessidade() {
    if (edicaoNecId == null) return;
    const qtd = parseFloat(document.getElementById('editNecQtd').value) || 0;
    const conseguida = parseFloat(document.getElementById('editNecConseguida').value) || 0;
    atualizarItem('necessidades', edicaoNecId, {
        barraca: document.getElementById('editNecBarraca').value,
        item: document.getElementById('editNecItem').value.trim(),
        qtd,
        unidade: document.getElementById('editNecUnidade').value,
        qtdConseguida: conseguida,
        obs: document.getElementById('editNecObs').value.trim(),
        conseguido: conseguida >= qtd
    });
    fecharModal();
    renderizarPagina();
    mostrarToast('✅ Item atualizado!');
}

function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    edicaoNecId = null;
}

function renderizarPagina() {
    if (!dados.necessidades) dados.necessidades = [];

    // Atualizar select de barracas
    const select = document.getElementById('necessidadeBarraca');
    if (select) {
        const valorAtual = select.value;
        const opts = opcoesFixasNec() + BARRACAS.map(b =>
            `<option value="${b}">${(NOMES_BARRACAS[b]||b).replace(/^.{2}\s?/,'')}</option>`
        ).join('');
        select.innerHTML = opts;
        if (valorAtual) select.value = valorAtual;
    }

    const contador = document.getElementById('contadorRegistros');
    if (contador) contador.textContent = dados.necessidades.length > 0 ? `(${dados.necessidades.length} item${dados.necessidades.length>1?'ns':''})` : '';

    const container = document.getElementById('listaNecessidades');
    if (!container) return;

    const agrupado = {};
    dados.necessidades.forEach(n => {
        const key = n.barraca || 'geral';
        if (!agrupado[key]) agrupado[key] = [];
        agrupado[key].push(n);
    });

    if (Object.keys(agrupado).length === 0) {
        container.innerHTML = '<p style="opacity:0.5;text-align:center;padding:20px">Nenhum item necessário cadastrado. Adicione itens acima.</p>';
        return;
    }

    let html = '';
    const totalItens = dados.necessidades.length;
    const totalConseguidos = dados.necessidades.filter(n => n.conseguido).length;
    html += `<div class="resumo-barraca" style="margin-bottom:15px"><div class="item neutro"><span>Total de Itens</span><strong>${totalItens}</strong></div><div class="item positivo"><span>Concluídos</span><strong>${totalConseguidos}</strong></div><div class="item negativo"><span>Faltando</span><strong>${totalItens - totalConseguidos}</strong></div></div>`;

    const keys = Object.keys(agrupado).sort((a, b) => {
        if (a === 'geral') return -1;
        if (b === 'geral') return 1;
        if (a === 'descartaveis') return 1;
        if (b === 'descartaveis') return -1;
        return (NOMES_BARRACAS[a]||a).localeCompare(NOMES_BARRACAS[b]||b);
    });

    keys.forEach(key => {
        const nome = nomeCategoriaNec(key, true);
        const itens = agrupado[key];
        const conseguidos = itens.filter(n => n.conseguido).length;
        html += `<div class="tabela-box" style="margin-bottom:12px">
            <h4>${nome} <small style="opacity:0.6">(${conseguidos}/${itens.length} concluídos)</small></h4>
            <table><thead><tr><th></th><th>Item</th><th>Meta</th><th>Conseguido</th><th>Falta</th><th>Obs</th><th></th></tr></thead><tbody>`;
        itens.forEach(n => {
            const conseguida = n.qtdConseguida || 0;
            const falta = Math.max(0, (n.qtd || 0) - conseguida);
            const cls = n.conseguido ? 'style="opacity:0.55;text-decoration:line-through"' : '';
            const corFalta = falta === 0 ? 'var(--cor-verde)' : 'var(--cor-vermelho)';
            html += `<tr ${cls}>
                <td><input type="checkbox" ${n.conseguido ? 'checked' : ''} onchange="toggleConseguido(${n.id})" style="width:18px;height:18px;accent-color:var(--cor-verde);cursor:pointer" title="Marcar tudo como conseguido"></td>
                <td>${n.item}</td>
                <td>${n.qtd} ${n.unidade}</td>
                <td>${conseguida} ${n.unidade}</td>
                <td style="color:${corFalta};font-weight:700">${falta} ${n.unidade}</td>
                <td>${n.obs || '-'}</td>
                <td style="white-space:nowrap">
                    <button class="btn-venda" style="padding:3px 8px" onclick="lancarConseguido(${n.id})" title="Lançar quantidade recebida">+</button>
                    <button class="btn-edit" onclick="editarNecessidade(${n.id})" title="Editar item">✏️</button>
                    <button class="btn-delete" onclick="removerNecessidade(${n.id})">X</button>
                </td>
            </tr>`;
        });
        html += '</tbody></table></div>';
    });

    container.innerHTML = html;
}

function exportarNecessidadesPDF() {
    if (!dados.necessidades || dados.necessidades.length === 0) { alert('Nenhum item cadastrado'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(16); doc.setTextColor(91, 192, 235);
    doc.text('LISTA DE ITENS NECESSÁRIOS', pageW / 2, y, { align: 'center' }); y += 8;
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text('Festa da Padroeira - Edição 2026', pageW / 2, y, { align: 'center' }); y += 6;
    doc.text('09, 10, 11 e 12 de Outubro', pageW / 2, y, { align: 'center' }); y += 10;

    doc.setFontSize(9); doc.setTextColor(100);
    const totalItens = dados.necessidades.length;
    const totalConseguidos = dados.necessidades.filter(n => n.conseguido).length;
    doc.text(`Total: ${totalItens} itens | Concluídos: ${totalConseguidos} | Faltando: ${totalItens - totalConseguidos}`, 14, y); y += 10;
    doc.setTextColor(0);

    const agrupado = {};
    dados.necessidades.forEach(n => {
        const key = n.barraca || 'geral';
        if (!agrupado[key]) agrupado[key] = [];
        agrupado[key].push(n);
    });
    const keys = Object.keys(agrupado).sort((a, b) => {
        if (a === 'geral') return -1; if (b === 'geral') return 1;
        if (a === 'descartaveis') return 1; if (b === 'descartaveis') return -1;
        return (NOMES_BARRACAS[a]||a).localeCompare(NOMES_BARRACAS[b]||b);
    });
    keys.forEach(key => {
        const nome = nomeCategoriaNec(key, false);
        const itens = agrupado[key];
        if (y + 20 > 270) { doc.addPage(); y = 20; }
        doc.autoTable({
            startY: y, theme: 'striped',
            headStyles: { fillColor: [91, 192, 235] },
            styles: { overflow: 'linebreak', cellPadding: 2, fontSize: 9 },
            columnStyles: { 0: { cellWidth: 62 }, 1: { cellWidth: 26 }, 2: { cellWidth: 26 }, 3: { cellWidth: 24 }, 4: { cellWidth: 34 } },
            head: [[nome, 'Meta', 'Conseguido', 'Falta', 'Obs']],
            body: itens.map(n => {
                const conseguida = n.qtdConseguida || 0;
                const falta = Math.max(0, (n.qtd || 0) - conseguida);
                return [n.item || '-', `${n.qtd||0} ${n.unidade||''}`, `${conseguida} ${n.unidade||''}`, falta === 0 ? 'OK' : `${falta} ${n.unidade||''}`, n.obs || '-'];
            })
        });
        y = doc.lastAutoTable.finalY + 8;
    });

    doc.save('lista_necessidades_padroeira.pdf');
    mostrarToast('📄 Lista exportada!');
}

function exportarNecessidadesCSV() {
    if (!dados.necessidades || dados.necessidades.length === 0) { alert('Nenhum item cadastrado'); return; }
    let csv = 'Barraca;Item;Meta;Conseguido;Falta;Unidade;Observação;Status\n';
    dados.necessidades.forEach(n => {
        const barraca = n.barraca === 'geral' ? 'Geral' : (NOMES_BARRACAS[n.barraca]||n.barraca||'').replace(/^.{2}\s?/,'');
        const conseguida = n.qtdConseguida || 0;
        const falta = Math.max(0, (n.qtd || 0) - conseguida);
        csv += `${barraca};${n.item};${n.qtd};${conseguida};${falta};${n.unidade};${n.obs||''};${n.conseguido ? 'Concluído' : 'Faltando'}\n`;
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'necessidades_padroeira.csv';
    link.click();
}

// Consolida os itens somando o mesmo produto de todas as barracas (por nome + unidade)
function consolidarNecessidades() {
    const mapa = {};
    (dados.necessidades || []).forEach(n => {
        const nomeLimpoOriginal = (n.item || '').trim();
        const nomeChave = nomeLimpoOriginal.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const chave = nomeChave + '||' + (n.unidade || '');
        if (!mapa[chave]) {
            mapa[chave] = { item: nomeLimpoOriginal, unidade: n.unidade || '', meta: 0, conseguido: 0, barracas: {} };
        }
        const g = mapa[chave];
        g.meta += (n.qtd || 0);
        g.conseguido += (n.qtdConseguida || 0);
        const bnome = nomeCategoriaNec(n.barraca || 'geral', false);
        g.barracas[bnome] = (g.barracas[bnome] || 0) + (n.qtd || 0);
    });
    return Object.values(mapa).sort((a, b) => a.item.localeCompare(b.item));
}

// Exporta um PDF com a LISTA DE COMPRAS CONSOLIDADA (soma total por item)
function exportarNecessidadesConsolidadoPDF() {
    if (!dados.necessidades || dados.necessidades.length === 0) { alert('Nenhum item cadastrado'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(16); doc.setTextColor(91, 192, 235);
    doc.text('LISTA DE COMPRAS (TOTAL GERAL)', pageW / 2, y, { align: 'center' }); y += 8;
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text('Festa da Padroeira - Edição 2026', pageW / 2, y, { align: 'center' }); y += 6;
    doc.text('09, 10, 11 e 12 de Outubro', pageW / 2, y, { align: 'center' }); y += 6;
    doc.setFontSize(8); doc.setTextColor(110);
    doc.text('Soma de cada item em todas as barracas. "Onde" mostra as barracas que pedem o item.', pageW / 2, y, { align: 'center' }); y += 8;
    doc.setTextColor(0);

    const consolidado = consolidarNecessidades();
    doc.autoTable({
        startY: y, theme: 'grid',
        headStyles: { fillColor: [91, 192, 235], textColor: [255,255,255], fontSize: 9 },
        styles: { overflow: 'linebreak', cellPadding: 2.5, fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 28, halign: 'center' },
            2: { cellWidth: 28, halign: 'center' },
            3: { cellWidth: 72 }
        },
        head: [['Item', 'Total', 'Falta', 'Onde (barracas)']],
        body: consolidado.map(g => {
            const falta = Math.max(0, g.meta - g.conseguido);
            const unidade = g.unidade ? ' ' + g.unidade : '';
            const onde = Object.entries(g.barracas)
                .map(([b, q]) => `${b}: ${fmtQtdCard(q)}${unidade}`)
                .join('  •  ');
            return [
                g.item,
                `${fmtQtdCard(g.meta)}${unidade}`,
                falta === 0 ? 'OK' : `${fmtQtdCard(falta)}${unidade}`,
                onde
            ];
        })
    });

    doc.save('lista_compras_total_padroeira.pdf');
    if (typeof mostrarToast === 'function') mostrarToast('📄 Lista de compras (total) exportada!');
}

// Unidade por extenso para os cards (ex: 160 Kg - Carne Moída)
function unidadeExtenso(u, qtd) {
    const plural = (qtd || 0) > 1;
    const mapa = {
        un: plural ? 'Unidades' : 'Unidade',
        kg: 'Kg', g: 'g', L: plural ? 'Litros' : 'Litro',
        cx: plural ? 'Caixas' : 'Caixa',
        pct: plural ? 'Pacotes' : 'Pacote',
        fardo: plural ? 'Fardos' : 'Fardo',
        dz: plural ? 'Dúzias' : 'Dúzia',
        lata: plural ? 'Latas' : 'Lata',
        saco: plural ? 'Sacos' : 'Saco',
        bandeja: plural ? 'Bandejas' : 'Bandeja'
    };
    return mapa[u] || u || '';
}

function fmtQtdCard(q) {
    const n = Number(q) || 0;
    return Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
}

// Exporta um CARD (estilo cartaz) por barraca, no visual da Festa da Padroeira
// ===== HELPERS DE DESENHO DO CARD (estilo cartaz Padroeira) =====
const CARD_CORES = {
    azulTopo: [30, 84, 158], azulMeio: [16, 46, 96], azulBase: [8, 24, 54],
    dourado: [206, 164, 78], douradoClaro: [232, 200, 128],
    creme: [249, 243, 224], textoEscuro: [24, 46, 86]
};
function cardLimparNome(txt) {
    return String(txt || '')
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\uFE0F\u200D]/gu, '')
        .replace(/\s+/g, ' ').trim();
}
function cardFundo(doc, pageW, pageH) {
    const C = CARD_CORES;
    const metade = pageH * 0.55;
    const faixas = 90;
    for (let i = 0; i < faixas; i++) {
        const t = i / (faixas - 1);
        let r, g, b;
        if (t < 0.5) { const k = t / 0.5;
            r = C.azulTopo[0] + (C.azulMeio[0] - C.azulTopo[0]) * k;
            g = C.azulTopo[1] + (C.azulMeio[1] - C.azulTopo[1]) * k;
            b = C.azulTopo[2] + (C.azulMeio[2] - C.azulTopo[2]) * k;
        } else { const k = (t - 0.5) / 0.5;
            r = C.azulMeio[0] + (C.azulBase[0] - C.azulMeio[0]) * k;
            g = C.azulMeio[1] + (C.azulBase[1] - C.azulMeio[1]) * k;
            b = C.azulMeio[2] + (C.azulBase[2] - C.azulMeio[2]) * k;
        }
        doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
        doc.rect(0, (pageH / faixas) * i, pageW, pageH / faixas + 0.6, 'F');
    }
    if (typeof doc.GState === 'function' && typeof doc.setGState === 'function') {
        doc.setGState(new doc.GState({ opacity: 0.10 }));
        doc.setDrawColor(...C.dourado);
        doc.setLineWidth(1.4);
        for (let w = 0; w < 5; w++) {
            const baseY = metade + w * 12;
            let prevX = 0, prevY = baseY;
            for (let x = 0; x <= pageW; x += 6) {
                const y = baseY + Math.sin((x / pageW) * Math.PI * 3 + w) * 6;
                doc.line(prevX, prevY, x, y);
                prevX = x; prevY = y;
            }
        }
        doc.setGState(new doc.GState({ opacity: 1 }));
    }
}
function cardMoldura(doc, pageW, pageH) {
    const C = CARD_CORES;
    doc.setDrawColor(...C.dourado); doc.setLineWidth(1.3);
    doc.rect(9, 9, pageW - 18, pageH - 18);
    doc.setLineWidth(0.4); doc.setDrawColor(...C.douradoClaro);
    doc.rect(11.5, 11.5, pageW - 23, pageH - 23);
    const L = 14, off = 9;
    doc.setDrawColor(...C.dourado); doc.setLineWidth(1.6);
    [[off, off, 1, 1], [pageW - off, off, -1, 1], [off, pageH - off, 1, -1], [pageW - off, pageH - off, -1, -1]]
        .forEach(([x, y, sx, sy]) => {
            doc.line(x, y, x + L * sx, y);
            doc.line(x, y, x, y + L * sy);
            doc.setFillColor(...C.dourado);
            doc.rect(x - 1.3, y - 1.3, 2.6, 2.6, 'F');
        });
}
function cardBadge(doc, cx, cy, texto1, texto2) {
    const C = CARD_CORES;
    doc.setFillColor(...C.azulBase); doc.circle(cx, cy, 12, 'F');
    doc.setDrawColor(...C.dourado); doc.setLineWidth(1.1); doc.circle(cx, cy, 12, 'S');
    doc.setLineWidth(0.4); doc.circle(cx, cy, 9.5, 'S');
    doc.setTextColor(...C.douradoClaro); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.text(texto1, cx, cy - 0.5, { align: 'center' });
    doc.setFontSize(6); doc.setTextColor(...C.dourado);
    if (texto2) doc.text(texto2, cx, cy + 4, { align: 'center' });
}
function cardDivisoria(doc, cx, y, meia) {
    const C = CARD_CORES;
    doc.setDrawColor(...C.dourado); doc.setLineWidth(0.7);
    doc.line(cx - meia, y, cx - 7, y);
    doc.line(cx + 7, y, cx + meia, y);
    doc.setFillColor(...C.dourado);
    doc.lines([[3, -3], [3, 3], [-3, 3], [-3, -3]], cx - 3, y, [1, 1], 'F', true);
    doc.setFillColor(...C.douradoClaro);
    doc.circle(cx - meia, y, 0.9, 'F');
    doc.circle(cx + meia, y, 0.9, 'F');
}
function ordenarItensCard(lista) {
    const peso = n => {
        const t = ((n.obs||'') + ' ' + (n.item||'')).toLowerCase();
        if (t.includes('descart')) return 2;
        if (t.includes('farofa')) return 1;
        return 0;
    };
    return [...lista].sort((a, b) => peso(a) - peso(b) || (a.item||'').localeCompare(b.item||''));
}

function exportarNecessidadesCards() {
    if (!dados.necessidades || dados.necessidades.length === 0) { alert('Nenhum item cadastrado'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const C = CARD_CORES;

    const agrupado = {};
    dados.necessidades.forEach(n => {
        const key = n.barraca || 'geral';
        if (!agrupado[key]) agrupado[key] = [];
        agrupado[key].push(n);
    });
    const keys = Object.keys(agrupado).sort((a, b) => {
        if (a === 'geral') return -1; if (b === 'geral') return 1;
        if (a === 'descartaveis') return 1; if (b === 'descartaveis') return -1;
        return (NOMES_BARRACAS[a]||a).localeCompare(NOMES_BARRACAS[b]||b);
    });

    keys.forEach((key, idx) => {
        if (idx > 0) doc.addPage();
        const nome = cardLimparNome(nomeCategoriaNec(key, false)).toUpperCase();
        const itens = ordenarItensCard(agrupado[key]);

        cardFundo(doc, pageW, pageH);
        cardMoldura(doc, pageW, pageH);
        cardBadge(doc, pageW / 2, 26, '2026', 'PADROEIRA');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.dourado);
        doc.setFontSize(16);
        doc.text('MATERIAIS  E  INSUMOS', pageW / 2, 52, { align: 'center' });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        const nomeLinhas = doc.splitTextToSize(nome, pageW - 46);
        doc.text(nomeLinhas, pageW / 2, 67, { align: 'center' });
        let headBottom = 67 + (nomeLinhas.length - 1) * 11;

        const ly = headBottom + 8;
        cardDivisoria(doc, pageW / 2, ly, 48);

        const boxX = 18, boxTop = ly + 11, boxW = pageW - 36;
        const boxBottomMax = pageH - 30;
        const boxH = boxBottomMax - boxTop;
        const padX = 13, padTop = 15, padBottom = 9;

        if (typeof doc.GState === 'function' && typeof doc.setGState === 'function') {
            doc.setFillColor(0, 0, 0);
            doc.setGState(new doc.GState({ opacity: 0.20 }));
            doc.roundedRect(boxX + 2, boxTop + 2.2, boxW, boxH, 8, 8, 'F');
            doc.setGState(new doc.GState({ opacity: 1 }));
        }
        doc.setFillColor(...C.creme);
        doc.roundedRect(boxX, boxTop, boxW, boxH, 8, 8, 'F');
        doc.setDrawColor(...C.dourado); doc.setLineWidth(1.1);
        doc.roundedRect(boxX, boxTop, boxW, boxH, 8, 8, 'S');
        doc.setDrawColor(...C.douradoClaro); doc.setLineWidth(0.4);
        doc.roundedRect(boxX + 2.2, boxTop + 2.2, boxW - 4.4, boxH - 4.4, 6, 6, 'S');

        const linhas = itens.map((n, i) => {
            const q = fmtQtdCard(n.qtd);
            const u = unidadeExtenso(n.unidade, n.qtd);
            const unidadeTxt = u ? `${u} ` : '';
            const terminador = i === itens.length - 1 ? '.' : ';';
            return `${q} ${unidadeTxt}- ${n.item}${terminador}`;
        });
        const alturaUtil = boxH - padTop - padBottom;

        function planejar(colunas, fonte, entrelinha) {
            const larguraCol = (boxW - padX * 2 - (colunas === 2 ? 10 : 0)) / colunas;
            doc.setFontSize(fonte);
            const blocos = linhas.map(l => doc.splitTextToSize(l, larguraCol - 5));
            const totalVis = blocos.reduce((s, b) => s + b.length, 0);
            const porColuna = Math.ceil(totalVis / colunas);
            return { larguraCol, blocos, totalVis, cabe: porColuna * entrelinha <= alturaUtil };
        }
        const tentativas = [
            { colunas: 1, fonte: 15, entrelinha: 9.4 },
            { colunas: 1, fonte: 14, entrelinha: 8.8 },
            { colunas: 1, fonte: 13, entrelinha: 8.1 },
            { colunas: 1, fonte: 12, entrelinha: 7.4 },
            { colunas: 2, fonte: 12, entrelinha: 7.2 },
            { colunas: 2, fonte: 11, entrelinha: 6.6 },
            { colunas: 2, fonte: 10, entrelinha: 6.0 },
            { colunas: 2, fonte: 9,  entrelinha: 5.5 }
        ];
        let plano = null, cfg = null;
        for (const t of tentativas) {
            const p = planejar(t.colunas, t.fonte, t.entrelinha);
            if (p.cabe) { plano = p; cfg = t; break; }
        }
        if (!plano) { cfg = tentativas[tentativas.length - 1]; plano = planejar(cfg.colunas, cfg.fonte, cfg.entrelinha); }

        const visuais = [];
        plano.blocos.forEach(b => b.forEach((l, i) => visuais.push({ txt: l, inicio: i === 0 })));
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(cfg.fonte);
        const porColuna = Math.ceil(visuais.length / cfg.colunas);

        function desenhaColuna(arr, x, topo) {
            let ty = topo;
            arr.forEach(o => {
                if (o.inicio) { doc.setFillColor(...C.dourado); doc.circle(x - 3, ty - 1.4, 1.1, 'F'); }
                doc.setTextColor(...C.textoEscuro);
                doc.text(o.txt, x + 1, ty);
                ty += cfg.entrelinha;
            });
        }
        if (cfg.colunas === 1) {
            desenhaColuna(visuais, boxX + padX + 3, boxTop + padTop);
        } else {
            desenhaColuna(visuais.slice(0, porColuna), boxX + padX + 3, boxTop + padTop);
            desenhaColuna(visuais.slice(porColuna), boxX + padX + 3 + plano.larguraCol + 10, boxTop + padTop);
        }

        cardDivisoria(doc, pageW / 2, pageH - 26, 40);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...C.dourado);
        doc.setFontSize(13);
        doc.text('FESTA DA PADROEIRA 2026', pageW / 2, pageH - 19, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(225, 230, 240);
        doc.setFontSize(8.5);
        doc.text('Basílica Menor Nossa Senhora da Conceição Aparecida', pageW / 2, pageH - 13.5, { align: 'center' });
    });

    doc.save('materiais_insumos_padroeira.pdf');
    if (typeof mostrarToast === 'function') mostrarToast('📄 Cards de materiais exportados!');
}

iniciarStatusFirebase();
iniciarSync();
