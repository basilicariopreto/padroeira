// ===== PÁGINA ITENS NECESSÁRIOS =====
let edicaoNecId = null;

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
    const barracaOpts = '<option value="geral" ' + (item.barraca === 'geral' ? 'selected' : '') + '>Geral (evento todo)</option>' +
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
        const opts = '<option value="geral">Geral (evento todo)</option>' + BARRACAS.map(b =>
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
        return (NOMES_BARRACAS[a]||a).localeCompare(NOMES_BARRACAS[b]||b);
    });

    keys.forEach(key => {
        const nome = key === 'geral' ? '🏗️ Geral (Infraestrutura/Evento)' : (NOMES_BARRACAS[key] || key);
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
        return (NOMES_BARRACAS[a]||a).localeCompare(NOMES_BARRACAS[b]||b);
    });
    keys.forEach(key => {
        const nome = key === 'geral' ? 'Geral (Infraestrutura)' : (NOMES_BARRACAS[key]||key).replace(/^.{2}\s?/,'');
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
function exportarNecessidadesCards() {
    if (!dados.necessidades || dados.necessidades.length === 0) { alert('Nenhum item cadastrado'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const AZUL_TOPO = [26, 78, 150];
    const AZUL_MAIS_ESCURO = [7, 22, 50];
    const DOURADO = [214, 170, 74];
    const CREME = [248, 241, 220];
    const TEXTO_ESCURO = [22, 44, 84];

    function limparNome(txt) {
        return String(txt || '')
            .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\uFE0F\u200D]/gu, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    function ordenarItens(lista) {
        const peso = n => {
            const t = ((n.obs||'') + ' ' + (n.item||'')).toLowerCase();
            if (t.includes('descart')) return 2;
            if (t.includes('farofa')) return 1;
            return 0;
        };
        return [...lista].sort((a, b) => peso(a) - peso(b) || (a.item||'').localeCompare(b.item||''));
    }

    const agrupado = {};
    dados.necessidades.forEach(n => {
        const key = n.barraca || 'geral';
        if (!agrupado[key]) agrupado[key] = [];
        agrupado[key].push(n);
    });
    const keys = Object.keys(agrupado).sort((a, b) => {
        if (a === 'geral') return -1; if (b === 'geral') return 1;
        return (NOMES_BARRACAS[a]||a).localeCompare(NOMES_BARRACAS[b]||b);
    });

    keys.forEach((key, idx) => {
        if (idx > 0) doc.addPage();
        const nome = limparNome(key === 'geral' ? 'Geral' : (NOMES_BARRACAS[key]||key)).toUpperCase();
        const itens = ordenarItens(agrupado[key]);

        // Fundo com gradiente (faixas)
        const faixas = 60;
        for (let i = 0; i < faixas; i++) {
            const t = i / (faixas - 1);
            const r = Math.round(AZUL_TOPO[0] + (AZUL_MAIS_ESCURO[0] - AZUL_TOPO[0]) * t);
            const g = Math.round(AZUL_TOPO[1] + (AZUL_MAIS_ESCURO[1] - AZUL_TOPO[1]) * t);
            const b = Math.round(AZUL_TOPO[2] + (AZUL_MAIS_ESCURO[2] - AZUL_TOPO[2]) * t);
            doc.setFillColor(r, g, b);
            doc.rect(0, (pageH / faixas) * i, pageW, pageH / faixas + 0.5, 'F');
        }

        // Moldura dourada
        doc.setDrawColor(...DOURADO);
        doc.setLineWidth(1.2);
        doc.rect(8, 8, pageW - 16, pageH - 16);
        doc.setLineWidth(0.4);
        doc.rect(10.5, 10.5, pageW - 21, pageH - 21);

        // Cabeçalho
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DOURADO);
        doc.setFontSize(19);
        doc.text('MATERIAIS E INSUMOS', pageW / 2, 30, { align: 'center' });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(32);
        const nomeLinhas = doc.splitTextToSize(nome, pageW - 40);
        doc.text(nomeLinhas, pageW / 2, 46, { align: 'center' });
        let headBottom = 46 + (nomeLinhas.length - 1) * 12;

        const ly = headBottom + 8;
        doc.setDrawColor(...DOURADO);
        doc.setLineWidth(0.6);
        doc.line(pageW / 2 - 45, ly, pageW / 2 - 6, ly);
        doc.line(pageW / 2 + 6, ly, pageW / 2 + 45, ly);
        doc.setFillColor(...DOURADO);
        doc.rect(pageW / 2 - 2.2, ly - 2.2, 4.4, 4.4, 'F');

        // Caixa creme
        const boxX = 18, boxTop = ly + 12, boxW = pageW - 36;
        const linhas = itens.map(n => {
            const q = fmtQtdCard(n.qtd);
            const u = unidadeExtenso(n.unidade, n.qtd);
            const unidadeTxt = u ? `${u} ` : '';
            return `${q} ${unidadeTxt}- ${n.item}`;
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        const larguraTexto = boxW - 24;
        let linhasWrap = [];
        linhas.forEach((l, i) => {
            const terminador = i === linhas.length - 1 ? '.' : ';';
            linhasWrap.push(doc.splitTextToSize(l + terminador, larguraTexto));
        });
        const alturaLinha = 8.6;
        const totalLinhasVisuais = linhasWrap.reduce((s, p) => s + p.length, 0);
        const boxH = Math.min(pageH - boxTop - 32, 20 + totalLinhasVisuais * alturaLinha);

        if (typeof doc.GState === 'function' && typeof doc.setGState === 'function') {
            doc.setFillColor(0, 0, 0);
            doc.setGState(new doc.GState({ opacity: 0.18 }));
            doc.roundedRect(boxX + 1.5, boxTop + 1.8, boxW, boxH, 7, 7, 'F');
            doc.setGState(new doc.GState({ opacity: 1 }));
        }
        doc.setFillColor(...CREME);
        doc.roundedRect(boxX, boxTop, boxW, boxH, 7, 7, 'F');
        doc.setDrawColor(...DOURADO);
        doc.setLineWidth(0.8);
        doc.roundedRect(boxX, boxTop, boxW, boxH, 7, 7, 'S');

        doc.setTextColor(...TEXTO_ESCURO);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        let ty = boxTop + 14;
        linhasWrap.forEach(partes => {
            partes.forEach(p => {
                doc.text(p, boxX + 12, ty);
                ty += alturaLinha;
            });
        });

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DOURADO);
        doc.setFontSize(13);
        doc.text('FESTA DA PADROEIRA 2026', pageW / 2, pageH - 20, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(225, 230, 240);
        doc.setFontSize(9);
        doc.text('Basílica Menor Nossa Senhora da Conceição Aparecida', pageW / 2, pageH - 14, { align: 'center' });
    });

    doc.save('materiais_insumos_padroeira.pdf');
    if (typeof mostrarToast === 'function') mostrarToast('📄 Cards de materiais exportados!');
}

iniciarStatusFirebase();
iniciarSync();
