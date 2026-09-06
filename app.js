// ===== CONFIGURAÇÃO =====
const BARRACAS = [
    'fazendinha', 'cachorro-quente', 'kafta', 'pernil', 'pastel',
    'batata-frita', 'doces', 'bar', 'chopp', 'kids', 'bingo', 'artesanato'
];

const NOMES_BARRACAS = {
    'fazendinha': '🌽 Fazendinha',
    'cachorro-quente': '🌭 Cachorro Quente',
    'kafta': '🥙 Kafta',
    'pernil': '🥪 Lanche de Pernil',
    'pastel': '🥟 Pastel',
    'batata-frita': '🍟 Batata Frita',
    'doces': '🍬 Doces',
    'bar': '🍺 Bar',
    'chopp': '🍻 Chopp',
    'kids': '🎠 Espaço Kids',
    'bingo': '🎯 Bingo/Leilão',
    'artesanato': '🎨 Artesanato'
};

const DIAS_FESTA = {
    1: '09/Out (Sex)',
    2: '10/Out (Sáb)',
    3: '11/Out (Dom)',
    4: '12/Out (Seg)'
};

// Tamanhos das camisetas (com tórax/altura de referência)
const TAMANHOS_CAMISETA = {
    'Baby Look': [
        { t: '3P', ref: 'Tórax 40 / Altura 51' },
        { t: 'PP', ref: 'Tórax 42 / Altura 53' },
        { t: 'P', ref: 'Tórax 44 / Altura 55' },
        { t: 'M', ref: 'Tórax 46 / Altura 57' },
        { t: 'G', ref: 'Tórax 48 / Altura 59' },
        { t: 'GG', ref: 'Tórax 50 / Altura 61' },
        { t: '3G', ref: 'Tórax 52 / Altura 63' },
        { t: '4G', ref: 'Tórax 50 / Altura 65' },
        { t: '5G', ref: 'Tórax 57 / Altura 67' },
        { t: '6G', ref: 'Tórax 59 / Altura 69' },
        { t: '7G', ref: 'Tórax 61 / Altura 69' }
    ],
    'Casual': [
        { t: '3P', ref: 'Tórax 44 / Altura 63' },
        { t: 'PP', ref: 'Tórax 46 / Altura 64' },
        { t: 'P', ref: 'Tórax 48 / Altura 68' },
        { t: 'M', ref: 'Tórax 50 / Altura 69' },
        { t: 'G', ref: 'Tórax 52 / Altura 71' },
        { t: 'GG', ref: 'Tórax 54 / Altura 73' },
        { t: '3G', ref: 'Tórax 54 / Altura 75' },
        { t: '4G', ref: 'Tórax 58 / Altura 77' },
        { t: '5G', ref: 'Tórax 60 / Altura 78' },
        { t: '6G', ref: 'Tórax 62 / Altura 78' },
        { t: '7G', ref: 'Tórax 64 / Altura 78' }
    ]
};

// ===== FORMATAÇÃO BRASILEIRA =====
function fmt(valor) {
    const n = Number(valor);
    return (isNaN(n) ? 0 : n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function R$(valor) {
    return 'R$ ' + fmt(valor);
}

// Toast global de feedback
function mostrarToast(msg, tipo) {
    const existing = document.querySelector('.toast-global');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-global' + (tipo === 'error' ? ' error' : '');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}

// Produtos por barraca (para caixa rápido)
const PRODUTOS_BARRACA = {
    'fazendinha': [{nome:'Chocolate Quente',preco:15},{nome:'Curau',preco:15},{nome:'Milho Cozido',preco:10},{nome:'Pamonha',preco:20},{nome:'Pipoca',preco:5},{nome:'Quentão',preco:12},{nome:'Vinho Quente',preco:17}],
    'cachorro-quente': [{nome:'Cachorro Quente',preco:17}],
    'kafta': [{nome:'Kafta',preco:17}],
    'pernil': [{nome:'Lanche de Pernil',preco:20}],
    'pastel': [{nome:'Pastel',preco:15}],
    'batata-frita': [{nome:'Batata Frita',preco:15}],
    'doces': [{nome:'Doce 250g',preco:25},{nome:'Doce 500g',preco:35},{nome:'Doces Variados',preco:15},{nome:'Geleia',preco:30},{nome:'Morango no Espeto',preco:25},{nome:'Pudim de Pote',preco:20}],
    'bar': [{nome:'Água',preco:5},{nome:'Cerveja',preco:10},{nome:'Refrigerante',preco:8},{nome:'Suco',preco:7}],
    'chopp': [{nome:'Chopp Ashby Pilsen',preco:10},{nome:'Chopp de Vinho',preco:14},{nome:'Chopp Heineken',preco:14},{nome:'Chopp IPA Session',preco:14}],
    'kids': [{nome:'Espaço Kids',preco:20}],
    'bingo': [{nome:'Bingo Cartela Especial',preco:20},{nome:'Bingo Cartela Simples',preco:10}],
    'artesanato': []
};

// ===== STORAGE (Firebase + localStorage como fallback) =====
const STORAGE_KEY = 'padroeira_financeiro_v1';
let filtro = 'todos';
let filtroDespesa = 'todos';

function dadosVazios() {
    const d = { despesas: [], patrocinadores: [], doadores: [], necessidades: [], doacoesEntrada: [], caixas: [], camisetas: [], configCaixas: { fixos: 0, volantes: 0 }, configCamisetas: { precoTrabalhador: 0, precoPublico: 0, custoTrabalhador: 0, custoPublico: 0 }, meta: 0, configBarracas: null, configProdutos: null };
    BARRACAS.forEach(b => { d[b] = { vendas: [] }; });
    return d;
}

// Converte objetos do Firebase de volta para arrays
function normalizarDados(d) {
    if (d.patrocinadores && !Array.isArray(d.patrocinadores)) {
        d.patrocinadores = Object.values(d.patrocinadores);
    }
    if (!d.patrocinadores) d.patrocinadores = [];

    if (d.despesas && !Array.isArray(d.despesas)) {
        d.despesas = Object.values(d.despesas);
    }
    if (!d.despesas) d.despesas = [];

    // Normalizar barracas fixas
    BARRACAS.forEach(b => {
        if (!d[b]) d[b] = { vendas: [] };
        if (d[b].vendas && !Array.isArray(d[b].vendas)) {
            d[b].vendas = Object.values(d[b].vendas);
        }
        if (!d[b].vendas) d[b].vendas = [];
    });

    // Normalizar barracas DINÂMICAS (vindas da config, ainda não registradas em BARRACAS)
    if (d.configBarracas) {
        const cfgBarracas = Array.isArray(d.configBarracas) ? d.configBarracas : Object.values(d.configBarracas);
        cfgBarracas.forEach(cb => {
            const bid = cb.id;
            if (!bid) return;
            if (!d[bid]) d[bid] = { vendas: [] };
            if (d[bid].vendas && !Array.isArray(d[bid].vendas)) {
                d[bid].vendas = Object.values(d[bid].vendas);
            }
            if (!d[bid].vendas) d[bid].vendas = [];
        });
    }

    if (!d.meta) d.meta = 0;

    // Normalizar config
    if (d.configBarracas && !Array.isArray(d.configBarracas)) {
        d.configBarracas = Object.values(d.configBarracas);
    }
    if (d.configProdutos) {
        Object.keys(d.configProdutos).forEach(key => {
            if (d.configProdutos[key] && !Array.isArray(d.configProdutos[key])) {
                d.configProdutos[key] = Object.values(d.configProdutos[key]);
            }
        });
    }
    // Normalizar doadores
    if (d.doadores && !Array.isArray(d.doadores)) d.doadores = Object.values(d.doadores);
    if (!d.doadores) d.doadores = [];

    // Normalizar necessidades
    if (d.necessidades && !Array.isArray(d.necessidades)) d.necessidades = Object.values(d.necessidades);
    if (!d.necessidades) d.necessidades = [];
    d.necessidades.forEach(n => {
        if (n.qtdConseguida == null) n.qtdConseguida = n.conseguido ? (n.qtd || 0) : 0;
    });

    // Normalizar doações de entrada (dinheiro)
    if (d.doacoesEntrada && !Array.isArray(d.doacoesEntrada)) d.doacoesEntrada = Object.values(d.doacoesEntrada);
    if (!d.doacoesEntrada) d.doacoesEntrada = [];

    // Normalizar caixas
    if (d.caixas && !Array.isArray(d.caixas)) d.caixas = Object.values(d.caixas);
    if (!d.caixas) d.caixas = [];
    d.caixas.forEach(c => {
        if (c.dias && !Array.isArray(c.dias)) c.dias = Object.values(c.dias);
        if (!c.dias) c.dias = [];
    });
    if (!d.configCaixas) d.configCaixas = { fixos: 0, volantes: 0 };

    if (d.camisetas && !Array.isArray(d.camisetas)) d.camisetas = Object.values(d.camisetas);
    if (!d.camisetas) d.camisetas = [];
    if (!d.configCamisetas) d.configCamisetas = { precoTrabalhador: 0, precoPublico: 0, custoTrabalhador: 0, custoPublico: 0 };
    if (d.configCamisetas.custoTrabalhador === undefined) d.configCamisetas.custoTrabalhador = 0;
    if (d.configCamisetas.custoPublico === undefined) d.configCamisetas.custoPublico = 0;

    // Garantir que todos os ids sejam NÚMERO (Firebase converte chaves para string)
    ['patrocinadores','despesas','doadores','necessidades','doacoesEntrada','caixas','camisetas'].forEach(campo => {
        if (Array.isArray(d[campo])) d[campo].forEach(x => { if (x && x.id != null) x.id = Number(x.id); });
    });

    return d;
}

function carregarDados() {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) {
        const parsed = JSON.parse(d);
        return normalizarDados(parsed);
    }
    return dadosVazios();
}

function salvarDados(d) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    // Salva no Firebase também
    if (typeof salvarFirebase === 'function') {
        salvarFirebase(d);
    }
}

// ===== OPERAÇÕES ITEM-A-ITEM (seguras para uso simultâneo) =====
// Campos que várias pessoas podem lançar ao mesmo tempo. Grava/remove/atualiza
// só o item específico no Firebase, evitando sobrescrita entre dispositivos.
function adicionarItem(campo, item) {
    if (!dados[campo]) dados[campo] = [];
    dados[campo].push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    if (typeof fbAdicionarItem === 'function') fbAdicionarItem(campo, item);
    else if (typeof salvarFirebase === 'function') salvarFirebase(dados);
}

function removerItem(campo, id) {
    if (!dados[campo]) dados[campo] = [];
    // Guarda cópia na lixeira ANTES de remover (segurança contra perda acidental)
    const itemRemovido = dados[campo].find(x => String(x.id) === String(id));
    if (itemRemovido && typeof fbEnviarLixeira === 'function') fbEnviarLixeira(campo, itemRemovido);
    dados[campo] = dados[campo].filter(x => String(x.id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    // Remove SÓ o item por id (não reescreve o campo inteiro — evita apagar itens de outros dispositivos)
    if (typeof fbRemoverItem === 'function') fbRemoverItem(campo, id);
    else if (typeof fbGravarCampo === 'function') fbGravarCampo(campo, dados[campo]);
    else if (typeof salvarFirebase === 'function') salvarFirebase(dados);
}

function atualizarItem(campo, id, novosCampos) {
    if (!dados[campo]) dados[campo] = [];
    const item = dados[campo].find(x => String(x.id) === String(id));
    if (!item) return;
    Object.assign(item, novosCampos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    // Grava SÓ o item alterado por id (não reescreve o campo inteiro — evita apagar itens de outros dispositivos)
    if (typeof fbAtualizarItem === 'function') fbAtualizarItem(campo, id, item);
    else if (typeof fbGravarCampo === 'function') fbGravarCampo(campo, dados[campo]);
    else if (typeof salvarFirebase === 'function') salvarFirebase(dados);
}

let dados = carregarDados();

// Ao iniciar, carrega do Firebase (dados mais recentes)
if (typeof carregarFirebase === 'function') {
    carregarFirebase().then(dadosFirebase => {
        if (dadosFirebase) {
            dados = normalizarDados(dadosFirebase);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
            renderizarTudo();
        } else {
            salvarFirebase(dados);
        }
    }).catch(err => console.log('Firebase offline, usando localStorage'));
}

// Escutar mudanças em tempo real do Firebase (sync entre dispositivos)
if (typeof escutarMudancas === 'function') {
    escutarMudancas(function(dadosFirebase) {
        try {
            const norm = normalizarDados(dadosFirebase);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(norm));
            dados = norm;
            // Recarregar barracas dinâmicas caso tenham vindo do outro dispositivo
            if (typeof carregarConfigDinamica === 'function') carregarConfigDinamica();
            renderizarTudo();
        } catch (err) {
            console.error('Erro ao sincronizar dados do Firebase:', err);
        }
    });
}

// ===== NAVEGAÇÃO =====
document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('sec-' + btn.dataset.section).classList.add('active');
    });
});

// ===== SELETOR DE DIA (só filtra vendas) =====
document.querySelectorAll('.dia-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.dia-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtro = btn.dataset.dia === 'todos' ? 'todos' : parseInt(btn.dataset.dia);
        renderizarTudo();
    });
});

// ===== LANÇAR VENDA (barracas com select) =====
function lancarVenda(barraca) {
    const select = document.getElementById('prod-' + barraca);
    const qtdInput = document.getElementById('qtd-' + barraca);
    const produto = select.value;
    const preco = parseFloat(select.selectedOptions[0].dataset.preco);
    const qtd = parseInt(qtdInput.value) || 1;
    if (!produto || isNaN(preco) || qtd < 1) return;

    const dia = filtro === 'todos' ? 1 : filtro;
    dados[barraca].vendas.push({
        id: Date.now(), dia, produto, preco, qtd, total: preco * qtd
    });
    salvarDados(dados);
    qtdInput.value = 1;
    renderizarTudo();
}

// ===== LANÇAR VENDA ARTESANATO (preço livre) =====
function lancarVendaArtesanato() {
    const descInput = document.getElementById('descVenda-artesanato');
    const precoInput = document.getElementById('precoVenda-artesanato');
    const qtdInput = document.getElementById('qtd-artesanato');
    const produto = descInput.value.trim();
    const preco = parseFloat(precoInput.value);
    const qtd = parseInt(qtdInput.value) || 1;
    if (!produto || isNaN(preco) || preco <= 0 || qtd < 1) return;

    const dia = filtro === 'todos' ? 1 : filtro;
    dados['artesanato'].vendas.push({
        id: Date.now(), dia, produto, preco, qtd, total: preco * qtd
    });
    salvarDados(dados);
    descInput.value = ''; precoInput.value = ''; qtdInput.value = 1;
    renderizarTudo();
}

// ===== LANÇAR VENDA LEILÃO (preço livre) =====
function lancarVendaLeilao() {
    const descInput = document.getElementById('descVenda-bingo');
    const precoInput = document.getElementById('precoVenda-bingo');
    const qtdInput = document.getElementById('qtdLeilao-bingo');
    const produto = descInput.value.trim();
    const preco = parseFloat(precoInput.value);
    const qtd = parseInt(qtdInput.value) || 1;
    if (!produto || isNaN(preco) || preco <= 0 || qtd < 1) return;

    const dia = filtro === 'todos' ? 1 : filtro;
    dados['bingo'].vendas.push({
        id: Date.now(), dia, produto, preco, qtd, total: preco * qtd
    });
    salvarDados(dados);
    descInput.value = ''; precoInput.value = ''; qtdInput.value = 1;
    renderizarTudo();
}

// ===== DESPESAS (independente de dia) =====
// ===== DESPESAS - NOTA COM MÚLTIPLOS ITENS =====
let itensNotaAtual = [];

function adicionarItemNota() {
    const desc = document.getElementById('descDespesa').value.trim();
    const qtd = parseFloat(document.getElementById('qtdDespesa').value) || 1;
    const unidade = document.getElementById('unidadeDespesa').value;
    const valor = parseFloat(document.getElementById('valorDespesa').value);
    const destino = document.getElementById('destinoDespesa').value;
    const obs = document.getElementById('obsDespesa').value.trim();

    if (!desc || isNaN(valor) || valor <= 0) { alert('Preencha a descrição e valor do item'); return; }

    itensNotaAtual.push({ desc, qtd, unidade, valor, destino, obs });

    // Limpar campos do item
    document.getElementById('descDespesa').value = '';
    document.getElementById('qtdDespesa').value = '1';
    document.getElementById('valorDespesa').value = '';
    document.getElementById('obsDespesa').value = '';

    renderizarItensNota();
}

function removerItemNota(index) {
    itensNotaAtual.splice(index, 1);
    renderizarItensNota();
}

function renderizarItensNota() {
    const container = document.getElementById('itensNotaAtual');
    const totalEl = document.getElementById('totalNotaAtual');
    const btnFinalizar = document.getElementById('btnFinalizarNota');
    if (!container) return;

    if (itensNotaAtual.length === 0) {
        container.innerHTML = '<p style="opacity:0.4;font-size:0.8rem;text-align:center;padding:8px">Adicione itens com o botão "+ Item". Eles aparecem aqui antes de salvar.</p>';
        if (totalEl) totalEl.textContent = '';
        if (btnFinalizar) btnFinalizar.style.display = 'none';
        return;
    }

    const total = itensNotaAtual.reduce((s, i) => s + i.valor, 0);
    let html = '<div style="background:rgba(0,0,0,0.25);border-radius:10px;padding:12px;border:2px solid rgba(91,192,235,0.4)">';
    html += '<div style="font-size:0.82rem;font-weight:700;color:var(--cor-amarelo);margin-bottom:8px">📝 Itens da nota (' + itensNotaAtual.length + '):</div>';
    itensNotaAtual.forEach((item, i) => {
        const destNome = item.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[item.destino] || item.destino).replace(/^.{2}\s?/, '');
        html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:0.82rem">
            <span style="color:rgba(255,255,255,0.5);font-weight:700;min-width:20px">${i+1}.</span>
            <span style="flex:1;color:var(--cor-palha)">${item.desc} <small style="opacity:0.6">(${item.qtd} ${item.unidade})</small></span>
            <span style="color:#81c784;font-weight:700;min-width:90px;text-align:right">R$ ${fmt(item.valor)}</span>
            <span style="font-size:0.72rem;color:rgba(91,192,235,0.8);min-width:80px;text-align:center;background:rgba(91,192,235,0.1);padding:2px 6px;border-radius:8px">→ ${destNome}</span>
            <button class="btn-delete" onclick="removerItemNota(${i})" style="padding:2px 8px;font-size:0.7rem">X</button>
        </div>`;
    });
    html += `<div style="margin-top:10px;padding-top:8px;border-top:2px solid rgba(91,192,235,0.3);display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:0.85rem;color:rgba(255,255,255,0.6)">${itensNotaAtual.length} ${itensNotaAtual.length === 1 ? 'item' : 'itens'} na nota</span>
        <span style="font-size:1.2rem;font-weight:800;color:#66bb6a">TOTAL: R$ ${fmt(total)}</span>
    </div>`;
    html += '</div>';
    container.innerHTML = html;

    if (totalEl) totalEl.textContent = '';
    if (btnFinalizar) btnFinalizar.style.display = 'inline-block';
}

function finalizarNota() {
    if (itensNotaAtual.length === 0) return;

    const categoria = document.getElementById('categoriaDespesa').value;
    const local = document.getElementById('localDespesa').value.trim();
    const doacao = document.getElementById('doacaoDespesa').checked;
    const pagarDepois = document.getElementById('pagarDespesa').checked;
    const dataVencimento = pagarDepois ? (document.getElementById('dataVencimentoDespesa').value || '') : '';
    const patrocinadorId = doacao ? (document.getElementById('patrocinadorDespesa').value || '') : '';

    // Lançar cada item como uma despesa separada (mesmo local/nota)
    // Usa adicionarItem (item-a-item no Firebase) para não sobrescrever dados de outros dispositivos
    const notaId = Date.now();
    const notaItensCount = itensNotaAtual.length;
    const notaTotal = itensNotaAtual.reduce((s, i) => s + i.valor, 0);
    itensNotaAtual.forEach((item, i) => {
        adicionarItem('despesas', {
            id: notaId + i,
            categoria,
            desc: item.desc,
            qtd: item.qtd,
            unidade: item.unidade,
            valor: item.valor,
            local,
            obs: item.obs,
            destino: item.destino,
            doacao,
            pago: !pagarDepois,
            patrocinadorId,
            dataVencimento,
            notaId: notaId // agrupa itens da mesma nota
        });
    });

    // Limpar tudo
    itensNotaAtual = [];
    document.getElementById('localDespesa').value = '';
    document.getElementById('doacaoDespesa').checked = false;
    document.getElementById('pagarDespesa').checked = false;
    document.getElementById('dataVencimentoDespesa').style.display = 'none';
    document.getElementById('dataVencimentoDespesa').value = '';
    document.getElementById('patrocinadorDespesa').style.display = 'none';
    renderizarItensNota();
    renderizarTudo();
    mostrarToast(`✅ Nota lançada! ${notaItensCount} ${notaItensCount === 1 ? 'item' : 'itens'} - ${R$(notaTotal)}`);
    registrarAcao(`Nota lançada: ${local || 'sem local'} - ${notaItensCount} itens`);
}

// Manter compatibilidade - lançar item único direto (usado pelo interceptor de histórico)
function lancarDespesa() {
    const desc = document.getElementById('descDespesa').value.trim();
    const valor = parseFloat(document.getElementById('valorDespesa').value);
    if (!desc || isNaN(valor) || valor <= 0) return;
    adicionarItemNota();
    finalizarNota();
}

function toggleDataVencimento() {
    const check = document.getElementById('pagarDespesa').checked;
    const input = document.getElementById('dataVencimentoDespesa');
    if (input) input.style.display = check ? 'inline-block' : 'none';
}

function toggleDataVencimentoCaixa() {
    const check = document.getElementById('caixaPagar').checked;
    const row = document.getElementById('caixaVencimentoRow');
    if (row) row.style.display = check ? 'flex' : 'none';
}

function removerDespesa(id) {
    removerItem('despesas', id);
    renderizarTudo();
}

function togglePagoDespesa(id) {
    const item = dados.despesas.find(d => String(d.id) === String(id));
    if (item) { atualizarItem('despesas', id, { pago: !item.pago }); renderizarTudo(); }
}

const FILTRO_GRUPOS = {
    alimentos: ['Carnes','Pães e Massas','Verduras e Legumes','Temperos e Condimentos','Laticínios','Bebidas (compra)','Doces e Ingredientes','Óleos e Gorduras','Outros Alimentos'],
    infraestrutura: ['Barracas e Tendas','Mesas e Cadeiras','Iluminação','Energia / Gerador','Palco','Banheiros Químicos'],
    equipamentos: ['Som e Música','Refrigeração','Fogão / Chapa / Fritadeira','Chopeira','Outros Equipamentos'],
    operacional: ['Segurança','Descartáveis','Limpeza','Gás','Carvão / Lenha','Embalagens'],
    divulgacao: ['Decoração','Divulgação / Marketing','Impressos'],
    servicos: ['Transporte / Frete','Pessoal / Mão de obra','Taxas e Licenças','Seguros','Outros']
};

function filtrarDespesas(tipo) {
    filtroDespesa = tipo;
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.filtro-btn[data-filtro="${tipo}"]`);
    if (btn) btn.classList.add('active');
    renderizarDespesas();
}

function renderizarDespesas() {
    let lista = dados.despesas;
    if (filtroDespesa === 'doacao') {
        lista = lista.filter(d => d.doacao);
    } else if (filtroDespesa === 'pendente') {
        lista = lista.filter(d => !d.pago);
    } else if (filtroDespesa === 'hoje') {
        const hoje = new Date().toISOString().split('T')[0];
        lista = lista.filter(d => {
            // Filtrar por ID (timestamp do dia) já que não tem campo "data de lançamento"
            const dataLanc = new Date(d.id).toISOString().split('T')[0];
            return dataLanc === hoje;
        });
    } else if (filtroDespesa !== 'todos') {
        const grupo = FILTRO_GRUPOS[filtroDespesa];
        if (grupo) {
            lista = lista.filter(d => grupo.includes(d.categoria));
        }
    }

    const tbody = document.querySelector('#tabelaDespesas tbody');
    tbody.innerHTML = lista.map(d => {
        const nomeDestino = d.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[d.destino] || d.destino);
        const qtdStr = d.qtd && d.unidade ? `${d.qtd} ${d.unidade}` : '-';
        const localStr = d.local || '-';
        const vencStr = d.dataVencimento ? d.dataVencimento.split('-').reverse().join('/') : '';
        const statusLabel = d.pago ? 'Pago' : (vencStr ? `Pagar ${vencStr}` : 'Pendente');
        return `
        <tr>
            <td><span class="badge-categoria">${d.categoria}</span></td>
            <td>${d.desc}${d.obs ? '<br><small style="opacity:0.6">' + d.obs + '</small>' : ''}</td>
            <td>${qtdStr}</td>
            <td>${nomeDestino}</td>
            <td>R$ ${fmt(d.valor)}</td>
            <td>${localStr}</td>
            <td><span class="${d.doacao ? 'badge-doacao' : 'badge-compra'}">${d.doacao ? '🎁 ' + getNomePatrocinador(d.patrocinadorId) : 'Compra'}</span></td>
            <td><span class="${d.pago ? 'badge-pago' : 'badge-pendente'}" onclick="togglePagoDespesa(${d.id})">${statusLabel}</span></td>
            <td>
                <button class="btn-edit" onclick="editarDespesa(${d.id})">✏️</button>
                <button class="btn-delete" onclick="confirmarExclusao('Excluir esta despesa?', () => removerDespesa(${d.id}))">X</button>
            </td>
        </tr>`;
    }).join('');

    // Resumo despesas
    const total = dados.despesas.reduce((s, d) => s + d.valor, 0);
    const totalDoacoes = dados.despesas.filter(d => d.doacao).reduce((s, d) => s + d.valor, 0);
    const totalCompras = total - totalDoacoes;
    const totalPago = dados.despesas.filter(d => d.pago && !d.doacao).reduce((s, d) => s + d.valor, 0);
    const totalPendente = dados.despesas.filter(d => !d.pago && !d.doacao).reduce((s, d) => s + d.valor, 0);
    const totalItens = dados.despesas.length;

    document.getElementById('resumoDespesas').innerHTML = `
        <div class="item negativo"><span>Total Despesas</span><strong>${R$(total)}</strong></div>
        <div class="item doacao"><span>🎁 Doações</span><strong>${R$(totalDoacoes)}</strong></div>
        <div class="item negativo"><span>Compras</span><strong>${R$(totalCompras)}</strong></div>
        <div class="item positivo"><span>Pago</span><strong>${R$(totalPago)}</strong></div>
        <div class="item negativo"><span>Pendente</span><strong>${R$(totalPendente)}</strong></div>
        <div class="item neutro"><span>Itens Lanç.</span><strong>${totalItens}</strong></div>
    `;

    // Totalizador por local de compra
    const localEl = document.getElementById('totaisPorLocal');
    if (localEl) {
        const localMap = {};
        dados.despesas.forEach(d => {
            if (d.doacao) return; // não conta doações
            const loc = (d.local && d.local.trim()) ? d.local.trim() : 'Não informado';
            if (!localMap[loc]) localMap[loc] = { valor: 0, qtd: 0 };
            localMap[loc].valor += d.valor;
            localMap[loc].qtd++;
        });
        const locais = Object.entries(localMap).sort((a,b) => b[1].valor - a[1].valor);
        if (locais.length > 0) {
            localEl.innerHTML = locais.map(([loc, v]) => 
                `<div class="ranking-item"><span class="ranking-nome">🏪 ${loc}</span><span class="ranking-qtd">${v.qtd} itens</span><span class="ranking-valor">${R$(v.valor)}</span></div>`
            ).join('');
        } else {
            localEl.innerHTML = '<p style="opacity:0.5;text-align:center;padding:10px">Nenhuma compra registrada</p>';
        }
    }

    // Renderizar contas a pagar
    renderizarContasAPagar();
}

function renderizarContasAPagar() {
    const container = document.getElementById('contasAPagar');
    if (!container) return;
    
    const pendentes = (dados.despesas || []).filter(d => !d.pago && !d.doacao);
    if (pendentes.length === 0) {
        container.innerHTML = '<p style="opacity:0.5;text-align:center;padding:10px">Nenhuma conta pendente</p>';
        return;
    }
    
    // Ordenar por data de vencimento (sem data fica no final)
    const ordenadas = [...pendentes].sort((a, b) => {
        if (!a.dataVencimento && !b.dataVencimento) return 0;
        if (!a.dataVencimento) return 1;
        if (!b.dataVencimento) return -1;
        return a.dataVencimento.localeCompare(b.dataVencimento);
    });
    
    const hoje = new Date().toISOString().split('T')[0];
    const totalPendente = ordenadas.reduce((s, d) => s + d.valor, 0);
    
    let html = `<div class="ranking-item" style="border-bottom:2px solid var(--cor-amarelo);margin-bottom:8px;padding-bottom:8px"><span class="ranking-nome" style="color:var(--cor-amarelo);font-weight:700">Total pendente: ${R$(totalPendente)} (${ordenadas.length} itens)</span></div>`;
    
    ordenadas.forEach(d => {
        let dataStr = '';
        let statusCor = '';
        if (d.dataVencimento) {
            const dataFmt = d.dataVencimento.split('-').reverse().join('/');
            if (d.dataVencimento < hoje) {
                dataStr = `<span style="color:#ef5350;font-weight:700">⚠️ Vencido ${dataFmt}</span>`;
                statusCor = 'border-left:3px solid #ef5350;padding-left:10px;';
            } else if (d.dataVencimento === hoje) {
                dataStr = `<span style="color:#ffb300;font-weight:700">⏰ Vence HOJE</span>`;
                statusCor = 'border-left:3px solid #ffb300;padding-left:10px;';
            } else {
                dataStr = `<span style="color:#81c784">📅 Vence ${dataFmt}</span>`;
                statusCor = 'border-left:3px solid #81c784;padding-left:10px;';
            }
        } else {
            dataStr = '<span style="opacity:0.5">Sem data definida</span>';
        }
        const dest = d.destino === 'geral' ? '' : ` → ${(NOMES_BARRACAS[d.destino]||d.destino||'').replace(/^.{2}\s?/,'')}`;
        html += `<div class="ranking-item" style="${statusCor}"><span class="ranking-nome">${d.desc}${dest}<br><small>${dataStr}</small></span><span class="ranking-valor">${R$(d.valor)}</span></div>`;
    });
    
    container.innerHTML = html;
}

// ===== PATROCINADORES =====
function lancarPatrocinio() {
    const nome = document.getElementById('nomePatrocinador').value.trim();
    const tipo = document.getElementById('tipoPatrocinio').value;
    const valor = parseFloat(document.getElementById('valorPatrocinio').value) || 0;
    const desc = document.getElementById('descPatrocinio').value.trim();
    const barraca = document.getElementById('barracaPatrocinio').value;
    const obs = document.getElementById('obsPatrocinio').value.trim();
    const recebido = document.getElementById('recebidoPatrocinio').checked;
    if (!nome) { alert('Preencha o nome do patrocinador'); return; }

    adicionarItem('patrocinadores', { id: Date.now(), nome, tipo, valor, desc, barraca, obs, recebido });
    document.getElementById('nomePatrocinador').value = '';
    document.getElementById('valorPatrocinio').value = '';
    document.getElementById('descPatrocinio').value = '';
    document.getElementById('barracaPatrocinio').value = '';
    document.getElementById('obsPatrocinio').value = '';
    document.getElementById('recebidoPatrocinio').checked = false;
    renderizarTudo();
}

function removerPatrocinio(id) {
    removerItem('patrocinadores', id);
    renderizarTudo();
}

function toggleRecebido(id) {
    const item = dados.patrocinadores.find(p => String(p.id) === String(id));
    if (item) { atualizarItem('patrocinadores', id, { recebido: !item.recebido }); renderizarTudo(); }
}

let ordenacaoPatr = 'alfa';

function getNomePatrocinador(id) {
    if (!id) return 'Doação';
    const p = (dados.patrocinadores || []).find(x => x.id == id);
    return p ? p.nome : 'Doação';
}

function ordenarPatrocinadores(tipo) {
    ordenacaoPatr = tipo;
    document.querySelectorAll('[data-ordpatr]').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-ordpatr="${tipo}"]`);
    if (btn) btn.classList.add('active');
    renderizarPatrocinadores();
}

function togglePatrocinadorDespesa() {
    const check = document.getElementById('doacaoDespesa').checked;
    const select = document.getElementById('patrocinadorDespesa');
    if (check) {
        select.style.display = 'block';
        // Preencher com patrocinadores cadastrados
        const opts = dados.patrocinadores.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        select.innerHTML = '<option value="">Selecione o patrocinador (opcional)...</option>' + opts;
    } else {
        select.style.display = 'none';
    }
}

function renderizarPatrocinadores() {
    const tbody = document.querySelector('#tabelaPatrocinadores tbody');
    const busca = (document.getElementById('buscaPatrocinador')?.value || '').toLowerCase();
    
    let lista = [...(dados.patrocinadores || [])];
    
    // Filtro de busca
    if (busca) {
        lista = lista.filter(p => p.nome.toLowerCase().includes(busca) || (p.desc||'').toLowerCase().includes(busca));
    }
    
    // Ordenação
    if (ordenacaoPatr === 'alfa') lista.sort((a,b) => a.nome.localeCompare(b.nome));
    else if (ordenacaoPatr === 'valor') lista.sort((a,b) => b.valor - a.valor);
    else if (ordenacaoPatr === 'pendente') lista = lista.filter(p => !p.recebido).sort((a,b) => a.nome.localeCompare(b.nome));
    else if (ordenacaoPatr === 'recebido') lista = lista.filter(p => p.recebido).sort((a,b) => a.nome.localeCompare(b.nome));

    // Função para calcular total de doações vinculadas a um patrocinador
    function totalDoacoesPatrocinador(id) {
        return (dados.despesas || []).filter(d => d.doacao && d.patrocinadorId == id).reduce((s, d) => s + d.valor, 0);
    }

    const TIPO_BADGE = { dinheiro: '💵 Dinheiro', servico: '🔧 Serviço', produto: '📦 Produto' };

    tbody.innerHTML = lista.map(p => {
        const tipoBadge = TIPO_BADGE[p.tipo] || '💵 Dinheiro';
        const barracaNome = p.barraca ? (NOMES_BARRACAS[p.barraca] || p.barraca) : '-';
        const descTxt = p.desc || p.obs || '-';
        const doacoesVinculadas = totalDoacoesPatrocinador(p.id);
        const valorTotal = (p.valor || 0) + doacoesVinculadas;
        const valorDisplay = p.valor > 0 && doacoesVinculadas > 0 
            ? `R$ ${fmt(valorTotal)}<br><small style="opacity:0.6">Direto: R$ ${fmt(p.valor)} + Doações: R$ ${fmt(doacoesVinculadas)}</small>`
            : doacoesVinculadas > 0 
                ? `R$ ${fmt(doacoesVinculadas)}<br><small style="opacity:0.6">(via doações)</small>`
                : p.valor > 0 ? `R$ ${fmt(p.valor)}` : '-';
        return `
        <tr>
            <td style="font-weight:700">${p.nome}</td>
            <td><span class="badge-categoria">${tipoBadge}</span></td>
            <td>${descTxt}</td>
            <td>${valorDisplay}</td>
            <td>${barracaNome}</td>
            <td><span class="${p.recebido ? 'badge-pago' : 'badge-pendente'}" onclick="toggleRecebido(${p.id})">${p.recebido ? 'Recebido' : 'Pendente'}</span></td>
            <td>
                <button class="btn-edit" onclick="editarPatrocinio(${p.id})">✏️</button>
                <button class="btn-delete" onclick="confirmarExclusao('Excluir este patrocínio?', () => removerPatrocinio(${p.id}))">X</button>
            </td>
        </tr>`;
    }).join('');

    // Resumo — somar doações vinculadas no total
    const todos = dados.patrocinadores || [];
    const totalDinheiro = todos.filter(p => (p.tipo||'dinheiro') === 'dinheiro').reduce((s,p) => s + (p.valor||0), 0);
    const totalServico = todos.filter(p => p.tipo === 'servico').reduce((s,p) => s + (p.valor||0) + totalDoacoesPatrocinador(p.id), 0);
    const totalProduto = todos.filter(p => p.tipo === 'produto').reduce((s,p) => s + (p.valor||0) + totalDoacoesPatrocinador(p.id), 0);
    const totalGeral = todos.reduce((s,p) => s + (p.valor||0) + totalDoacoesPatrocinador(p.id), 0);
    const recebido = todos.filter(p => p.recebido).reduce((s,p) => s + (p.valor||0) + totalDoacoesPatrocinador(p.id), 0);
    const pendente = totalGeral - recebido;

    document.getElementById('resumoPatrocinadores').innerHTML = `
        <div class="item positivo"><span>Total Geral</span><strong>${R$(totalGeral)}</strong></div>
        <div class="item positivo"><span>💵 Dinheiro</span><strong>${R$(totalDinheiro)}</strong></div>
        <div class="item doacao"><span>🔧 Serviços</span><strong>${R$(totalServico)}</strong></div>
        <div class="item doacao"><span>📦 Produtos</span><strong>${R$(totalProduto)}</strong></div>
        <div class="item positivo"><span>Recebido</span><strong>${R$(recebido)}</strong></div>
        <div class="item negativo"><span>Pendente</span><strong>${R$(pendente)}</strong></div>
        <div class="item neutro"><span>Qtd</span><strong>${todos.length}</strong></div>
    `;

    // Detalhe de doações por patrocinador (expandido abaixo da tabela)
    const detalheEl = document.getElementById('detalhePatrocinadores');
    if (detalheEl) {
        let detHtml = '';
        todos.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(p => {
            const doacoes = (dados.despesas||[]).filter(d => d.doacao && d.patrocinadorId == p.id);
            if (doacoes.length === 0) return; // só mostra se tiver despesas vinculadas
            detHtml += `<div class="patr-detalhe-card">
                <div class="patr-detalhe-header">${p.nome} <small>${{dinheiro:'💵',servico:'🔧',produto:'📦'}[p.tipo]||'💵'}</small></div>`;
            if (doacoes.length > 0) {
                detHtml += '<div class="patr-detalhe-itens">';
                doacoes.forEach(d => {
                    const dest = d.destino === 'geral' ? '' : ` → ${(NOMES_BARRACAS[d.destino]||'').replace(/^.{2}/,'')}`;
                    detHtml += `<div class="patr-detalhe-item">• ${d.desc}${dest} — <strong>${R$(d.valor)}</strong></div>`;
                });
                const totalDoado = doacoes.reduce((s,d) => s + d.valor, 0);
                detHtml += `<div class="patr-detalhe-total">Total doado: ${R$(totalDoado)}</div>`;
                detHtml += '</div>';
            }
            detHtml += '</div>';
        });
        detalheEl.innerHTML = detHtml || '<p style="opacity:0.5;text-align:center;padding:15px">Nenhuma doação vinculada ainda</p>';
    }
}

// ===== RENDERIZAR BARRACA (só vendas) =====
function removerVenda(barraca, id) {
    dados[barraca].vendas = dados[barraca].vendas.filter(v => String(v.id) !== String(id));
    salvarDados(dados); renderizarTudo();
}

function renderizarBarraca(barraca) {
    const tb = document.querySelector('#tblVendas-' + barraca + ' tbody');
    if (!tb) return;

    const vendas = filtro === 'todos' ? dados[barraca].vendas : dados[barraca].vendas.filter(v => v.dia === filtro);
    const totalVendas = vendas.reduce((s, v) => s + v.total, 0);
    const totalItens = vendas.reduce((s, v) => s + v.qtd, 0);

    // Despesas vinculadas a esta barraca
    const despesasBarraca = dados.despesas.filter(d => d.destino === barraca);
    const totalDespesas = despesasBarraca.filter(d => !d.doacao).reduce((s, d) => s + d.valor, 0);
    const totalDoacoes = despesasBarraca.filter(d => d.doacao).reduce((s, d) => s + d.valor, 0);
    const resultado = totalVendas - totalDespesas;
    const custoUnit = totalItens > 0 ? totalDespesas / totalItens : 0;

    // Se filtro "todos", agrupar vendas por produto
    if (filtro === 'todos' && vendas.length > 0) {
        const agrupado = {};
        vendas.forEach(v => {
            if (!agrupado[v.produto]) agrupado[v.produto] = { produto: v.produto, preco: v.preco, qtd: 0, total: 0 };
            agrupado[v.produto].qtd += v.qtd;
            agrupado[v.produto].total += v.total;
        });
        const lista = Object.values(agrupado).sort((a,b) => a.produto.localeCompare(b.produto));
        tb.innerHTML = lista.map(v => `
            <tr>
                <td><span class="badge-dia">Todos</span></td>
                <td>${v.produto}</td>
                <td><strong>${v.qtd}</strong></td>
                <td>R$ ${fmt(v.preco)}</td>
                <td><strong>R$ ${fmt(v.total)}</strong></td>
                <td></td>
            </tr>
        `).join('');
    } else {
        const vendasOrdenadas = [...vendas].sort((a,b) => a.produto.localeCompare(b.produto));
        tb.innerHTML = vendasOrdenadas.map(v => `
            <tr>
                <td><span class="badge-dia">${DIAS_FESTA[v.dia]}</span></td>
                <td>${v.produto}</td>
                <td>${v.qtd}</td>
                <td>R$ ${fmt(v.preco)}</td>
                <td>R$ ${fmt(v.total)}</td>
                <td>
                    <button class="btn-edit" onclick="editarVenda('${barraca}', ${v.id})">✏️</button>
                    <button class="btn-delete" onclick="confirmarExclusao('Excluir esta venda?', () => removerVenda('${barraca}', ${v.id}))">X</button>
                </td>
            </tr>
        `).join('');
    }

    // Resumo por dia
    let resumoDiaHtml = '<div class="resumo-dias-barraca">';
    [1,2,3,4].forEach(d => {
        const vDia = dados[barraca].vendas.filter(v => v.dia === d);
        const tDia = vDia.reduce((s,v) => s + v.total, 0);
        const iDia = vDia.reduce((s,v) => s + v.qtd, 0);
        if (iDia > 0) resumoDiaHtml += `<span class="resumo-dia-item"><strong>${DIAS_FESTA[d]}</strong>: ${iDia} un = ${R$(tDia)}</span>`;
    });
    resumoDiaHtml += '</div>';

    // Lista de despesas vinculadas
    let despHtml = '';
    if (despesasBarraca.length > 0) {
        despHtml = '<div class="desp-vinculadas"><h4>Despesas desta barraca:</h4><div class="desp-vinc-lista">';
        despHtml += despesasBarraca.map(d => {
            const tipo = d.doacao ? `<span class="badge-doacao">🎁 ${getNomePatrocinador(d.patrocinadorId)}</span>` : '<span class="badge-compra">Compra</span>';
            return `<div class="desp-vinc-item">${tipo} ${d.desc} — <strong>${R$(d.valor)}</strong></div>`;
        }).join('');
        despHtml += '</div></div>';
    }

    const cls = resultado >= 0 ? 'positivo' : 'negativo';
    const lbl = filtro === 'todos' ? '' : ` (${DIAS_FESTA[filtro]})`;
    document.getElementById('resumo-' + barraca).innerHTML = `
        ${resumoDiaHtml}
        <div class="resumo-barraca-inner">
            <div class="item positivo"><span>Vendas${lbl}</span><strong>${R$(totalVendas)}</strong></div>
            <div class="item neutro"><span>Itens</span><strong>${totalItens}</strong></div>
            <div class="item negativo"><span>Custos</span><strong>${R$(totalDespesas)}</strong></div>
            <div class="item doacao"><span>🎁 Doações</span><strong>${R$(totalDoacoes)}</strong></div>
            <div class="item ${cls}"><span>Resultado</span><strong>${R$(resultado)}</strong></div>
            <div class="item neutro"><span>Custo/Item</span><strong>${R$(custoUnit)}</strong></div>
        </div>
        ${despHtml}
    `;
}

// ===== RESUMO GERAL =====
function atualizarResumoGeral() {
    let totalVendas = 0;
    let totalItens = 0;
    BARRACAS.forEach(b => {
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        totalVendas += vendas.reduce((s, v) => s + v.total, 0);
        totalItens += vendas.reduce((s, v) => s + v.qtd, 0);
    });

    const patrsDinheiro = dados.patrocinadores.filter(p => (p.tipo||'dinheiro') === 'dinheiro');
    // Só patrocínio em dinheiro JÁ RECEBIDO entra no caixa/receita. Pendente fica como "a receber".
    const totalPatrocinadores = patrsDinheiro.filter(p => p.recebido).reduce((s, p) => s + (p.valor||0), 0);
    const totalPatrPendente = patrsDinheiro.filter(p => !p.recebido).reduce((s, p) => s + (p.valor||0), 0);
    const totalPatrServico = dados.patrocinadores.filter(p => p.tipo === 'servico').reduce((s, p) => s + (p.valor||0), 0);
    const totalPatrProduto = dados.patrocinadores.filter(p => p.tipo === 'produto').reduce((s, p) => s + (p.valor||0), 0);
    const totalPatrEspecie = totalPatrServico + totalPatrProduto; // não entra no caixa
    const totalDespesasCompra = dados.despesas.filter(d => !d.doacao).reduce((s, d) => s + (d.valor||0), 0);
    const totalDoacoes = dados.despesas.filter(d => d.doacao).reduce((s, d) => s + (d.valor||0), 0);
    const totalDoacoesEntrada = (dados.doacoesEntrada || []).reduce((s, d) => s + (d.valor||0), 0);
    // Camisetas: só as PAGAS entram na receita (pendentes ficam como "a receber")
    const totalCamisetasPagas = (dados.camisetas || []).filter(c => c.pago).reduce((s, c) => s + (c.valor||0), 0);

    // Receita = só DINHEIRO que entra no caixa (vendas, patrocínio em dinheiro RECEBIDO, doações em dinheiro, camisetas pagas).
    // Patrocínio pendente ou em serviço/produto NÃO entra na receita (mostrado à parte).
    const receita = totalVendas + totalPatrocinadores + totalDoacoesEntrada + totalCamisetasPagas;
    const saldo = receita - totalDespesasCompra;

    document.getElementById('receitaTotal').textContent = R$(receita);
    let receitaDet = `Vendas: ${R$(totalVendas)} | Patroc. $: ${R$(totalPatrocinadores)} | Doações: ${R$(totalDoacoesEntrada)} | Camisetas: ${R$(totalCamisetasPagas)}`;
    const extras = [];
    if (totalPatrPendente > 0) extras.push(`${R$(totalPatrPendente)} em patrocínio a receber`);
    if (totalPatrEspecie > 0) extras.push(`${R$(totalPatrEspecie)} em serviços/produtos (doação)`);
    if (extras.length > 0) receitaDet += ` | Não entra no caixa: ${extras.join(' + ')}`;
    document.getElementById('receitaDetalhe').textContent = receitaDet;
    document.getElementById('gastoTotal').textContent = R$(totalDespesasCompra);
    document.getElementById('gastoDetalhe').textContent = `Doações em produtos: ${R$(totalDoacoes)} (não conta como gasto)`;

    const saldoEl = document.getElementById('saldoFinal');
    saldoEl.textContent = R$(saldo);
    saldoEl.style.color = saldo >= 0 ? '#66bb6a' : '#ef5350';
    document.getElementById('saldoDetalhe').textContent = `${totalItens} itens vendidos no total`;
}

function exportarPatrocinadoresPDF() {
    const patrs = dados.patrocinadores || [];
    if (patrs.length === 0) { alert('Nenhum patrocinador cadastrado'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;
    const cfg = getConfigEvento();

    doc.setFontSize(16); doc.setTextColor(91, 192, 235);
    doc.text('LISTA DE PATROCINADORES', pageW / 2, y, { align: 'center' }); y += 8;
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`${cfg.nomeEvento} - Edição ${cfg.edicao}`, pageW / 2, y, { align: 'center' }); y += 6;
    doc.text(cfg.datas, pageW / 2, y, { align: 'center' }); y += 12;

    const TIPOS = { dinheiro: 'Dinheiro', servico: 'Serviço', produto: 'Produto' };
    const lista = [...patrs].sort((a,b) => a.nome.localeCompare(b.nome));

    doc.autoTable({
        startY: y, theme: 'grid',
        headStyles: { fillColor: [91, 192, 235], textColor: [255,255,255], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        styles: { overflow: 'linebreak', cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 55 },
            1: { cellWidth: 22 },
            2: { cellWidth: 60 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 }
        },
        head: [['Patrocinador', 'Tipo', 'Descrição', 'Valor', 'Status']],
        body: lista.map(p => [
            p.nome || '-',
            TIPOS[p.tipo] || 'Dinheiro',
            p.desc || '-',
            (p.valor||0) > 0 ? 'R$ ' + fmt(p.valor||0) : '-',
            p.recebido ? 'Recebido' : 'Pendente'
        ])
    });
    y = doc.lastAutoTable.finalY + 8;

    const totalGeral = lista.reduce((s,p) => s + (p.valor||0), 0);
    const totalDinheiro = lista.filter(p => (p.tipo||'dinheiro') === 'dinheiro').reduce((s,p) => s + (p.valor||0), 0);
    const recebido = lista.filter(p => p.recebido).reduce((s,p) => s + (p.valor||0), 0);
    doc.setFontSize(9); doc.setTextColor(80);
    doc.text(`Total: ${lista.length} patrocinadores | Valor total: R$ ${fmt(totalGeral)} | Dinheiro: R$ ${fmt(totalDinheiro)} | Recebido: R$ ${fmt(recebido)} | Pendente: R$ ${fmt(totalGeral - recebido)}`, 14, y);

    doc.save('patrocinadores_padroeira.pdf');
    mostrarToast('📄 Lista de patrocinadores exportada!');
}

function exportarPatrocinadoresCSV() {
    const patrs = dados.patrocinadores || [];
    if (patrs.length === 0) { alert('Nenhum patrocinador cadastrado'); return; }
    const TIPOS = { dinheiro: 'Dinheiro', servico: 'Serviço', produto: 'Produto' };
    let csv = 'Patrocinador;Tipo;Descrição;Valor;Status;Observação\n';
    [...patrs].sort((a,b) => a.nome.localeCompare(b.nome)).forEach(p => {
        csv += `${p.nome};${TIPOS[p.tipo]||'Dinheiro'};${p.desc||''};${p.valor > 0 ? fmt(p.valor) : ''};${p.recebido ? 'Recebido' : 'Pendente'};${p.obs||''}\n`;
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'patrocinadores_padroeira.csv';
    link.click();
    mostrarToast('📥 CSV exportado!');
}

// ===== DASHBOARD =====
function renderizarDashboard() {
    const container = document.getElementById('dashboardCards');
    let html = '';

    BARRACAS.forEach(b => {
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        const tVendas = vendas.reduce((s, v) => s + v.total, 0);
        const tItens = vendas.reduce((s, v) => s + v.qtd, 0);
        const despB = dados.despesas.filter(d => d.destino === b && !d.doacao);
        const tDesp = despB.reduce((s, d) => s + d.valor, 0);
        const resultado = tVendas - tDesp;
        const cls = resultado >= 0 ? 'positivo' : 'negativo';

        html += `
            <div class="dash-card clickable" onclick="navegarPara('${b}')">
                <h4>${NOMES_BARRACAS[b]}</h4>
                <div class="valores">
                    <span class="v-receita">Vendas: ${R$(tVendas)}</span>
                    <span class="v-gasto">Desp: ${R$(tDesp)}</span>
                </div>
                <div class="resultado ${cls}">${R$(resultado)}</div>
                <div class="itens-info">${tItens} itens vendidos</div>
            </div>
        `;
    });

    // Card despesas gerais (sem barraca vinculada)
    const despGeral = dados.despesas.filter(d => d.destino === 'geral' && !d.doacao);
    const tDespGeral = despGeral.reduce((s, d) => s + d.valor, 0);
    const tDoacoes = dados.despesas.filter(d => d.doacao).reduce((s, d) => s + d.valor, 0);
    html += `
        <div class="dash-card clickable" onclick="navegarPara('despesas')">
            <h4>💰 Despesas Gerais</h4>
            <div class="valores">
                <span class="v-gasto">Compras gerais: ${R$(tDespGeral)}</span>
                <span class="v-receita">Doações: ${R$(tDoacoes)}</span>
            </div>
            <div class="resultado negativo">- ${R$(tDespGeral)}</div>
        </div>
    `;

    // Card patrocinadores
    const tPatr = dados.patrocinadores.reduce((s, p) => s + p.valor, 0);
    const patrPend = dados.patrocinadores.filter(p => !p.recebido).reduce((s, p) => s + p.valor, 0);
    html += `
        <div class="dash-card clickable" onclick="navegarPara('patrocinadores')">
            <h4>🤝 Patrocinadores</h4>
            <div class="valores">
                <span class="v-receita">Total: ${R$(tPatr)}</span>
                <span class="v-gasto">Pendente: ${R$(patrPend)}</span>
            </div>
            <div class="resultado positivo">+ ${R$(tPatr)}</div>
        </div>
    `;

    container.innerHTML = html;
}

// ===== GRÁFICOS =====
let chartBarracas = null;
let chartDias = null;
let chartPizza = null;
let chartRecDesp = null;

function renderizarGraficos() {
    const labels = BARRACAS.map(b => NOMES_BARRACAS[b].replace(/^.{2}/, ''));
    const vendasData = BARRACAS.map(b => {
        const v = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(x => x.dia === filtro);
        return v.reduce((s, x) => s + x.total, 0);
    });
    const despData = BARRACAS.map(b => {
        return dados.despesas.filter(d => d.destino === b && !d.doacao).reduce((s, d) => s + d.valor, 0);
    });

    const ctxB = document.getElementById('graficoBarracas');
    if (chartBarracas) chartBarracas.destroy();
    chartBarracas = new Chart(ctxB, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Vendas', data: vendasData, backgroundColor: 'rgba(102,187,106,0.7)', borderColor: '#66bb6a', borderWidth: 1 },
                { label: 'Despesas', data: despData, backgroundColor: 'rgba(239,83,80,0.7)', borderColor: '#ef5350', borderWidth: 1 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#f5deb3' } } },
            scales: {
                x: { ticks: { color: '#f5deb3', font: { size: 9 } }, grid: { color: 'rgba(245,222,179,0.08)' } },
                y: { ticks: { color: '#f5deb3' }, grid: { color: 'rgba(245,222,179,0.08)' } }
            }
        }
    });

    // Por dia
    const diasLabels = Object.values(DIAS_FESTA);
    const vendasDia = [1,2,3,4].map(d => {
        let t = 0;
        BARRACAS.forEach(b => { t += dados[b].vendas.filter(v => v.dia === d).reduce((s, v) => s + v.total, 0); });
        return t;
    });

    const ctxD = document.getElementById('graficoDias');
    if (chartDias) chartDias.destroy();
    chartDias = new Chart(ctxD, {
        type: 'bar',
        data: {
            labels: diasLabels,
            datasets: [
                { label: 'Vendas', data: vendasDia, backgroundColor: ['rgba(229,57,53,0.7)','rgba(255,179,0,0.7)','rgba(67,160,71,0.7)','rgba(30,136,229,0.7)'], borderWidth: 1 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#f5deb3' } } },
            scales: {
                x: { ticks: { color: '#f5deb3' }, grid: { color: 'rgba(245,222,179,0.08)' } },
                y: { ticks: { color: '#f5deb3' }, grid: { color: 'rgba(245,222,179,0.08)' } }
            }
        }
    });

    // Gráfico de Pizza — % por barraca
    const pizzaColors = ['#e53935','#ffb300','#43a047','#1e88e5','#8e24aa','#f4511e','#00897b','#5c6bc0','#d81b60','#6d4c41','#00acc1','#7cb342'];
    const pizzaData = BARRACAS.map(b => {
        const v = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(x => x.dia === filtro);
        return v.reduce((s, x) => s + x.total, 0);
    }).filter((v,i) => v > 0 || false);
    const pizzaLabels = BARRACAS.map((b,i) => ({ nome: (NOMES_BARRACAS[b]||b).replace(/^.{2}/,''), val: filtro === 'todos' ? dados[b].vendas.reduce((s,x)=>s+x.total,0) : dados[b].vendas.filter(x=>x.dia===filtro).reduce((s,x)=>s+x.total,0) })).filter(x => x.val > 0);

    const ctxP = document.getElementById('graficoPizza');
    if (ctxP) {
        if (chartPizza) chartPizza.destroy();
        chartPizza = new Chart(ctxP, {
            type: 'doughnut',
            data: {
                labels: pizzaLabels.map(x => x.nome),
                datasets: [{ data: pizzaLabels.map(x => x.val), backgroundColor: pizzaColors, borderWidth: 2, borderColor: '#1a0f0a' }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { color: '#f5deb3', font: { size: 10 } } } }
            }
        });
    }

    // Gráfico Receita vs Despesa
    const totalVendasGeral = BARRACAS.reduce((s,b) => s + dados[b].vendas.reduce((ss,v)=>ss+v.total,0), 0);
    const totalPatrDinheiro = (dados.patrocinadores||[]).filter(p=>(p.tipo||'dinheiro')==='dinheiro').reduce((s,p)=>s+(p.valor||0),0);
    const totalDespGeral = (dados.despesas||[]).filter(d=>!d.doacao).reduce((s,d)=>s+d.valor,0);
    const totalDoacGeral = (dados.despesas||[]).filter(d=>d.doacao).reduce((s,d)=>s+d.valor,0);

    const ctxRD = document.getElementById('graficoReceitaDespesa');
    if (ctxRD) {
        if (chartRecDesp) chartRecDesp.destroy();
        chartRecDesp = new Chart(ctxRD, {
            type: 'doughnut',
            data: {
                labels: ['Vendas', 'Patrocínios $', 'Despesas (compras)', 'Doações recebidas'],
                datasets: [{
                    data: [totalVendasGeral, totalPatrDinheiro, totalDespGeral, totalDoacGeral],
                    backgroundColor: ['#66bb6a','#42a5f5','#ef5350','#ce93d8'],
                    borderWidth: 2, borderColor: '#1a0f0a'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom', labels: { color: '#f5deb3', font: { size: 10 } } } }
            }
        });
    }
}

// ===== RANKING =====
function renderizarRanking() {
    const container = document.getElementById('rankingProdutos');
    const prodMap = {};

    BARRACAS.forEach(b => {
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        vendas.forEach(v => {
            const key = v.produto + '|' + b;
            if (!prodMap[key]) prodMap[key] = { nome: v.produto, barraca: b, qtd: 0, valor: 0 };
            prodMap[key].qtd += v.qtd;
            prodMap[key].valor += v.total;
        });
    });

    const ranking = Object.values(prodMap).sort((a, b) => b.qtd - a.qtd).slice(0, 15);

    if (ranking.length === 0) {
        container.innerHTML = '<p style="text-align:center;opacity:0.5;padding:20px;">Nenhuma venda registrada ainda</p>';
        return;
    }

    container.innerHTML = ranking.map((item, i) => {
        let posClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
        return `
            <div class="ranking-item">
                <span class="ranking-pos ${posClass}">${i + 1}°</span>
                <span class="ranking-nome">${item.nome}<br><span class="ranking-barraca">${NOMES_BARRACAS[item.barraca]}</span></span>
                <span class="ranking-qtd">${item.qtd} un.</span>
                <span class="ranking-valor">${R$(item.valor)}</span>
            </div>
        `;
    }).join('');
}

// ===== EXPORTAR CSV =====
function exportarCSV() {
    let csv = 'Tipo;Barraca;Dia;Categoria;Descricao;Qtd;Valor Unit;Total;Obs;Doacao;Status\n';

    BARRACAS.forEach(b => {
        dados[b].vendas.forEach(v => {
            csv += `Venda;${NOMES_BARRACAS[b]};${DIAS_FESTA[v.dia]};;${v.produto};${v.qtd};${v.preco.toFixed(2)};${v.total.toFixed(2)};;;\n`;
        });
    });

    dados.despesas.forEach(d => {
        const dest = d.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[d.destino] || d.destino);
        csv += `Despesa;${dest};;${d.categoria};${d.desc};;${d.valor.toFixed(2)};${d.valor.toFixed(2)};${d.obs || ''};${d.doacao ? 'Sim' : 'Não'};${d.pago ? 'Pago' : 'Pendente'}\n`;
    });

    dados.patrocinadores.forEach(p => {
        csv += `Patrocinio;;;Patrocinio;${p.nome};;${p.valor.toFixed(2)};${p.valor.toFixed(2)};${p.obs || ''};;${p.recebido ? 'Recebido' : 'Pendente'}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'financeiro_padroeira_2026.csv';
    link.click();
}

// ===== BACKUP =====
function exportarJSON() {
    const exportData = {
        versao: '4.0',
        evento: 'Festa da Padroeira 2026',
        datas: ['09/10/2026', '10/10/2026', '11/10/2026', '12/10/2026'],
        exportadoEm: new Date().toISOString(),
        dados: dados
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup_padroeira_2026.json';
    link.click();
}

function importarJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importado = JSON.parse(e.target.result);
            // Suporta formato direto ou com envelope
            const novoDados = importado.dados || importado;
            if (novoDados && typeof novoDados === 'object') {
                dados = novoDados;
                salvarDados(dados);
                renderizarTudo();
                alert('Backup restaurado com sucesso!');
            }
        } catch (err) {
            alert('Erro ao importar. Verifique se o arquivo é um backup válido.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ===== RENDERIZAR TUDO =====
function renderizarTudo() {
    BARRACAS.forEach(renderizarBarraca);
    renderizarDespesas();
    renderizarPatrocinadores();
    atualizarResumoGeral();
    renderizarDashboard();
    renderizarGraficos();
    renderizarRanking();
    atualizarContador();
    atualizarMeta();
    renderizarComparativo();
    renderizarMargem();
    renderizarResumoDoacoes();
    renderizarUltimosGastos();
    renderizarDoadores();
    renderizarNecessidades();
    renderizarDoacoesEntrada();
    renderizarCaixas();
    renderizarCamisetas();
}

// ===== MODAL DE EDIÇÃO =====
let edicaoAtual = null; // { tipo: 'venda'|'despesa'|'patrocinio', barraca, id }

function abrirModal(titulo) {
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalOverlay').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    edicaoAtual = null;
}

function editarVenda(barraca, id) {
    const item = dados[barraca].vendas.find(v => String(v.id) === String(id));
    if (!item) return;
    edicaoAtual = { tipo: 'venda', barraca, id };

    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Produto</label><input type="text" id="editProduto" value="${item.produto}"></div>
        <div class="campo"><label>Quantidade</label><input type="number" id="editQtd" value="${item.qtd}" min="1"></div>
        <div class="campo"><label>Preço Unitário (R$)</label><input type="number" id="editPreco" value="${item.preco}" step="0.01"></div>
        <div class="campo"><label>Dia</label>
            <select id="editDia">
                <option value="1" ${item.dia===1?'selected':''}>09/Out (Sex)</option>
                <option value="2" ${item.dia===2?'selected':''}>10/Out (Sáb)</option>
                <option value="3" ${item.dia===3?'selected':''}>11/Out (Dom)</option>
                <option value="4" ${item.dia===4?'selected':''}>12/Out (Seg)</option>
            </select>
        </div>
    `;
    abrirModal('Editar Venda');
}

function editarDespesa(id) {
    const item = dados.despesas.find(d => String(d.id) === String(id));
    if (!item) return;
    edicaoAtual = { tipo: 'despesa', id };

    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Descrição</label><input type="text" id="editDesc" value="${item.desc}"></div>
        <div class="campo"><label>Valor (R$)</label><input type="number" id="editValor" value="${item.valor}" step="0.01"></div>
        <div class="campo"><label>Quantidade</label><input type="number" id="editQtd" value="${item.qtd || 1}" min="1"></div>
        <div class="campo"><label>Local da Compra</label><input type="text" id="editLocal" value="${item.local || ''}"></div>
        <div class="campo"><label>Observação</label><input type="text" id="editObs" value="${item.obs || ''}"></div>
    `;
    abrirModal('Editar Despesa');
}

function editarPatrocinio(id) {
    const item = dados.patrocinadores.find(p => String(p.id) === String(id));
    if (!item) return;
    edicaoAtual = { tipo: 'patrocinio', id };

    const tipoSel = (t) => item.tipo === t ? 'selected' : '';
    const barracaOpts = ['','geral','fazendinha','cachorro-quente','kafta','pernil','pastel','batata-frita','doces','bar','chopp','kids','bingo','artesanato'];
    const barracaLabels = {'':'Sem vínculo','geral':'Geral','fazendinha':'Fazendinha','cachorro-quente':'Cachorro Quente','kafta':'Kafta','pernil':'Pernil','pastel':'Pastel','batata-frita':'Batata Frita','doces':'Doces','bar':'Bar','chopp':'Chopp','kids':'Espaço Kids','bingo':'Bingo/Leilão','artesanato':'Artesanato'};
    const barracaSel = barracaOpts.map(b => `<option value="${b}" ${(item.barraca||'')=== b?'selected':''}>${barracaLabels[b]}</option>`).join('');

    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Patrocinador</label><input type="text" id="editNome" value="${item.nome}"></div>
        <div class="campo"><label>Tipo de Patrocínio</label>
            <select id="editTipo">
                <option value="dinheiro" ${tipoSel('dinheiro')}>💵 Dinheiro</option>
                <option value="servico" ${tipoSel('servico')}>🔧 Serviço</option>
                <option value="produto" ${tipoSel('produto')}>📦 Produto/Material</option>
            </select>
        </div>
        <div class="campo"><label>Valor (R$)</label><input type="number" id="editValor" value="${item.valor}" step="0.01"></div>
        <div class="campo"><label>Descrição (o que fornece)</label><input type="text" id="editDesc" value="${item.desc || ''}"></div>
        <div class="campo"><label>Barraca vinculada</label><select id="editBarraca">${barracaSel}</select></div>
        <div class="campo"><label>Observação</label><input type="text" id="editObs" value="${item.obs || ''}"></div>
    `;
    abrirModal('Editar Patrocínio');
}

function salvarEdicao() {
    if (!edicaoAtual) return;

    if (edicaoAtual.tipo === 'venda') {
        const item = dados[edicaoAtual.barraca].vendas.find(v => String(v.id) === String(edicaoAtual.id));
        if (item) {
            item.produto = document.getElementById('editProduto').value.trim() || item.produto;
            item.qtd = parseInt(document.getElementById('editQtd').value) || item.qtd;
            item.preco = parseFloat(document.getElementById('editPreco').value) || item.preco;
            item.dia = parseInt(document.getElementById('editDia').value) || item.dia;
            item.total = item.preco * item.qtd;
        }
    } else if (edicaoAtual.tipo === 'despesa') {
        const item = dados.despesas.find(d => String(d.id) === String(edicaoAtual.id));
        if (item) {
            item.desc = document.getElementById('editDesc').value.trim() || item.desc;
            item.valor = parseFloat(document.getElementById('editValor').value) || item.valor;
            item.qtd = parseFloat(document.getElementById('editQtd').value) || item.qtd;
            item.local = document.getElementById('editLocal').value.trim();
            item.obs = document.getElementById('editObs').value.trim();
        }
    } else if (edicaoAtual.tipo === 'patrocinio') {
        const item = dados.patrocinadores.find(p => String(p.id) === String(edicaoAtual.id));
        if (item) {
            item.nome = document.getElementById('editNome').value.trim() || item.nome;
            item.tipo = document.getElementById('editTipo').value;
            const novoValor = document.getElementById('editValor').value;
            item.valor = novoValor === '' ? 0 : parseFloat(novoValor);
            item.desc = document.getElementById('editDesc').value.trim();
            item.barraca = document.getElementById('editBarraca').value;
            item.obs = document.getElementById('editObs').value.trim();
        }
    } else if (edicaoAtual.tipo === 'doador') {
        if (!dados.doadores) dados.doadores = [];
        const item = dados.doadores.find(d => String(d.id) === String(edicaoAtual.id));
        if (item) {
            item.nome = document.getElementById('editNome').value.trim() || item.nome;
            item.item = document.getElementById('editItem').value.trim() || item.item;
            const novoValor = document.getElementById('editValor').value;
            item.valor = novoValor === '' ? 0 : parseFloat(novoValor);
            item.obs = document.getElementById('editObs').value.trim();
        }
    }

    // Salvar: campos de risco regravam o campo inteiro chaveado por id; vendas vão com salvarDados
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    const mapaCampo = { despesa: 'despesas', patrocinio: 'patrocinadores', doador: 'doadores' };
    const campo = mapaCampo[edicaoAtual.tipo];
    if (campo && typeof fbGravarCampo === 'function') {
        fbGravarCampo(campo, dados[campo]); // regrava campo inteiro por id (elimina duplicata de posição)
    } else {
        // venda (barraca) ou fallback
        if (typeof salvarFirebase === 'function') salvarFirebase(dados);
    }
    fecharModal();
    renderizarTudo();
}

// ===== CONFIRMAÇÃO DE EXCLUSÃO =====
function confirmarExclusao(msg, callback) {
    if (confirm(msg)) callback();
}

// ===== GASTO RÁPIDO =====
function toggleCaixaPatrocinador() {
    const check = document.getElementById('caixaDoacao').checked;
    const row = document.getElementById('caixaPatrocinadorRow');
    if (check) {
        row.style.display = 'flex';
        const select = document.getElementById('caixaPatrocinador');
        const opts = (dados.patrocinadores||[]).map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
        select.innerHTML = '<option value="">Selecione quem doou (opcional)...</option>' + opts;
    } else {
        row.style.display = 'none';
    }
}

// Auto-selecionar categoria com base no destino
function autoCategoriaGastoRapido() {
    const destino = document.getElementById('caixaDestino').value;
    const catSelect = document.getElementById('caixaCategoria');
    if (!catSelect) return;
    const mapa = {
        'bar': 'Bebidas (compra)', 'chopp': 'Bebidas (compra)',
        'cachorro-quente': 'Carnes', 'kafta': 'Carnes', 'pernil': 'Carnes',
        'pastel': 'Óleos e Gorduras', 'batata-frita': 'Óleos e Gorduras',
        'doces': 'Doces e Ingredientes', 'fazendinha': 'Outros Alimentos',
        'kids': 'Outros', 'bingo': 'Outros', 'artesanato': 'Outros'
    };
    if (mapa[destino]) catSelect.value = mapa[destino];
}

function gastoRapido() {
    const desc = document.getElementById('caixaDesc').value.trim();
    const valor = parseFloat(document.getElementById('caixaValor').value);
    const destino = document.getElementById('caixaDestino').value;
    const categoria = document.getElementById('caixaCategoria').value;
    const doacao = document.getElementById('caixaDoacao').checked;
    const pagarDepois = document.getElementById('caixaPagar') ? document.getElementById('caixaPagar').checked : false;
    const dataVencimento = pagarDepois ? (document.getElementById('caixaDataVencimento')?.value || '') : '';
    const patrocinadorId = doacao ? (document.getElementById('caixaPatrocinador')?.value || '') : '';

    if (!desc || isNaN(valor) || valor <= 0) return;

    adicionarItem('despesas', {
        id: Date.now(), categoria, desc, qtd: 1, unidade: 'un',
        valor, local: '', obs: '(Lançado rápido)', destino, doacao, pago: !pagarDepois, patrocinadorId, dataVencimento
    });

    // Feedback
    const fb = document.getElementById('caixaFeedback');
    fb.innerHTML = `<div class="caixa-toast">✅ ${desc} - ${R$(valor)} ${doacao ? '(doação)' : ''}</div>`;
    setTimeout(() => { fb.innerHTML = ''; }, 3000);

    // Limpar
    document.getElementById('caixaDesc').value = '';
    document.getElementById('caixaValor').value = '';
    document.getElementById('caixaDoacao').checked = false;
    if (document.getElementById('caixaPagar')) document.getElementById('caixaPagar').checked = false;
    if (document.getElementById('caixaDataVencimento')) document.getElementById('caixaDataVencimento').value = '';
    if (document.getElementById('caixaVencimentoRow')) document.getElementById('caixaVencimentoRow').style.display = 'none';
    document.getElementById('caixaPatrocinadorRow').style.display = 'none';

    renderizarUltimosGastos();
    renderizarTudo();
}

function renderizarUltimosGastos() {
    const container = document.getElementById('caixaUltimos');
    if (!container) return;
    const ultimos = (dados.despesas || []).filter(d => d.obs === '(Lançado rápido)').slice(-10).reverse();
    if (ultimos.length === 0) {
        container.innerHTML = '<p style="opacity:0.5;text-align:center;padding:10px;font-size:0.8rem">Nenhum gasto rápido ainda</p>';
        return;
    }
    container.innerHTML = ultimos.map(d => {
        const dest = d.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[d.destino] || d.destino);
        return `<div class="ranking-item"><span class="ranking-nome">${d.doacao?'🎁':'💰'} ${d.desc}</span><span class="ranking-barraca">${dest}</span><span class="ranking-valor">${R$(d.valor)}</span></div>`;
    }).join('');
}

function renderizarCaixa() { renderizarUltimosGastos(); }

// ===== META =====
function salvarMeta() {
    const meta = parseFloat(document.getElementById('metaValor').value) || 0;
    dados.meta = meta;
    salvarDados(dados);
    atualizarMeta();
}

function atualizarMeta() {
    const meta = dados.meta || 0;
    const metaInput = document.getElementById('metaValor');
    if (metaInput && meta > 0) metaInput.value = meta;
    
    let totalVendas = 0;
    BARRACAS.forEach(b => {
        if (dados[b]) totalVendas += dados[b].vendas.reduce((s,v) => s + v.total, 0);
    });
    
    const metaTexto = document.getElementById('metaTexto');
    const metaProg = document.getElementById('metaProgresso');
    
    if (meta > 0) {
        const pct = Math.min((totalVendas / meta) * 100, 100);
        if (metaTexto) metaTexto.textContent = `${R$(totalVendas)} / ${R$(meta)} (${pct.toFixed(0)}%)`;
        if (metaProg) {
            metaProg.style.width = pct + '%';
            metaProg.style.background = pct >= 100 ? '#66bb6a' : pct >= 70 ? '#ff8f00' : '#ef5350';
        }
    } else {
        if (metaTexto) metaTexto.textContent = '';
        if (metaProg) metaProg.style.width = '0%';
    }
}

// ===== CONTADOR EM TEMPO REAL =====
function atualizarContador() {
    const container = document.getElementById('contadorTopo');
    if (!container) return;
    
    let html = '';
    BARRACAS.forEach(b => {
        if (!dados[b]) return;
        const vendas = filtro === 'todos' ? dados[b].vendas : dados[b].vendas.filter(v => v.dia === filtro);
        const itens = vendas.reduce((s,v) => s + v.qtd, 0);
        if (itens > 0) {
            const nome = NOMES_BARRACAS[b].replace(/^.{2}/, '');
            html += `<span class="contador-item"><strong>${itens}</strong> ${nome}</span>`;
        }
    });
    container.innerHTML = html || '<span class="contador-item" style="opacity:0.5">Nenhuma venda ainda</span>';
}

// ===== COMPARATIVO ENTRE DIAS =====
function renderizarComparativo() {
    const tbody = document.querySelector('#tabelaComparativo tbody');
    if (!tbody) return;
    
    let html = '';
    let totaisDia = [0,0,0,0];
    
    BARRACAS.forEach(b => {
        if (!dados[b]) return;
        let row = `<tr><td style="color:var(--cor-amarelo);font-weight:700;font-size:0.8rem">${NOMES_BARRACAS[b]}</td>`;
        let totalBarraca = 0;
        [1,2,3,4].forEach((d,i) => {
            const vd = dados[b].vendas.filter(v => v.dia === d).reduce((s,v) => s + v.total, 0);
            totalBarraca += vd;
            totaisDia[i] += vd;
            row += `<td>R$ ${fmt(vd)}</td>`;
        });
        row += `<td style="font-weight:700;color:#66bb6a">R$ ${fmt(totalBarraca)}</td></tr>`;
        html += row;
    });
    
    // Linha de total
    html += `<tr style="border-top:2px solid var(--cor-amarelo)"><td style="font-weight:800;color:var(--cor-amarelo)">TOTAL</td>`;
    let grandTotal = 0;
    totaisDia.forEach(t => { html += `<td style="font-weight:700">R$ ${fmt(t)}</td>`; grandTotal += t; });
    html += `<td style="font-weight:800;color:#66bb6a">R$ ${fmt(grandTotal)}</td></tr>`;
    
    tbody.innerHTML = html;
}

// ===== MARGEM POR BARRACA =====
function renderizarMargem() {
    const container = document.getElementById('margemBarracas');
    if (!container) return;
    
    let html = '';
    BARRACAS.forEach(b => {
        if (!dados[b]) return;
        const vendas = dados[b].vendas.reduce((s,v) => s + v.total, 0);
        const desp = (dados.despesas||[]).filter(d => d.destino === b && !d.doacao).reduce((s,d) => s + d.valor, 0);
        const doac = (dados.despesas||[]).filter(d => d.destino === b && d.doacao).reduce((s,d) => s + d.valor, 0);
        const lucro = vendas - desp;
        const cls = lucro >= 0 ? 'positivo' : 'negativo';
        const pct = vendas > 0 ? ((lucro/vendas)*100).toFixed(0) : 0;
        
        html += `
            <div class="dash-card">
                <h4>${NOMES_BARRACAS[b]}</h4>
                <div class="valores">
                    <span class="v-receita">Vendas: ${R$(vendas)}</span>
                    <span class="v-gasto">Custos: ${R$(desp)}</span>
                </div>
                <div class="resultado ${cls}">Lucro: ${R$(lucro)} (${pct}%)</div>
                ${doac > 0 ? `<div class="itens-info">Doações: ${R$(doac)}</div>` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

// ===== RESUMO DE DOAÇÕES =====
function renderizarResumoDoacoes() {
    const container = document.getElementById('resumoDoacoes');
    if (!container) return;
    
    const doacoes = (dados.despesas||[]).filter(d => d.doacao);
    if (doacoes.length === 0) {
        container.innerHTML = '<p style="text-align:center;opacity:0.5;padding:15px">Nenhuma doação registrada</p>';
        return;
    }
    
    const total = doacoes.reduce((s,d) => s + d.valor, 0);
    let html = `<div class="ranking-item" style="border-bottom:2px solid var(--cor-amarelo);margin-bottom:8px"><span class="ranking-nome" style="color:var(--cor-amarelo)">Total em doações: ${R$(total)} (${doacoes.length} itens)</span></div>`;
    
    doacoes.forEach(d => {
        const dest = d.destino === 'geral' ? '' : ` → ${NOMES_BARRACAS[d.destino]||d.destino}`;
        html += `<div class="ranking-item"><span class="ranking-nome">🎁 ${d.desc}${dest}</span><span class="ranking-valor">${R$(d.valor)}</span></div>`;
    });
    container.innerHTML = html;
}

// ===== RELATÓRIO PDF COMPLETO =====
function gerarRelatorioPDF() {
    gerarPDFComLogo(null);
}

function gerarPDFComLogo(logoBase64) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Helpers
    const center = (text, yy, size) => { doc.setFontSize(size || 12); doc.text(text, pageW / 2, yy, { align: 'center' }); };
    const checkPage = (need) => { if (y + need > 270) { doc.addPage(); addHeaderFooter(); y = 25; } };
    const titulo = (text) => { checkPage(15); doc.setFontSize(14); doc.setTextColor(230, 81, 0); doc.text(text, 14, y); y += 8; doc.setTextColor(0); doc.setFontSize(10); };

    // Cabeçalho e rodapé em todas as páginas
    function addHeaderFooter() {
        const totalPages = doc.internal.getNumberOfPages();
        const pg = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text('Arraiá da Basílica 2026 | Relatório Financeiro', 14, 10);
        doc.text(`Página ${pg}`, pageW - 14, 10, { align: 'right' });
        doc.text('Basílica Menor Nossa Senhora da Conceição Aparecida', pageW / 2, 290, { align: 'center' });
        doc.setTextColor(0);
    }

    // ===== CAPA =====
    const cfg = getConfigEvento();
    y = 100;
    doc.setFontSize(24);
    doc.setTextColor(91, 192, 235);
    center(cfg.nomeEvento, y, 24);
    doc.setTextColor(0);
    center('Relatório Financeiro Completo', y + 14, 14);
    center('Edição ' + cfg.edicao, y + 26, 12);
    center(cfg.datas, y + 38, 11);
    doc.setFontSize(10);
    center(cfg.igreja, y + 60);
    center(cfg.cidade, y + 68);
    center('Gerado em: ' + new Date().toLocaleString('pt-BR'), y + 82);
    doc.addPage();
    addHeaderFooter();
    y = 25;

    // ===== RESUMO EXECUTIVO =====
    titulo('1. RESUMO EXECUTIVO');
    let totalVendas = 0, totalItens = 0;
    BARRACAS.forEach(b => {
        if (dados[b]) {
            totalVendas += dados[b].vendas.reduce((s,v) => s + v.total, 0);
            totalItens += dados[b].vendas.reduce((s,v) => s + v.qtd, 0);
        }
    });
    const patrsDin = (dados.patrocinadores||[]).filter(p => (p.tipo||'dinheiro') === 'dinheiro');
    const patrDinheiro = patrsDin.filter(p => p.recebido).reduce((s,p) => s + (p.valor||0), 0);
    const patrDinheiroPend = patrsDin.filter(p => !p.recebido).reduce((s,p) => s + (p.valor||0), 0);
    const patrServico = (dados.patrocinadores||[]).filter(p => p.tipo === 'servico').reduce((s,p) => s + p.valor, 0);
    const patrProduto = (dados.patrocinadores||[]).filter(p => p.tipo === 'produto').reduce((s,p) => s + p.valor, 0);
    const doacoesEntradaTotalPDF = (dados.doacoesEntrada||[]).reduce((s,d) => s + (d.valor||0), 0);
    const camisetasPagasPDF = (dados.camisetas||[]).filter(c => c.pago).reduce((s,c) => s + (c.valor||0), 0);
    const despCompras = (dados.despesas||[]).filter(d => !d.doacao).reduce((s,d) => s + d.valor, 0);
    const despDoacoes = (dados.despesas||[]).filter(d => d.doacao).reduce((s,d) => s + d.valor, 0);
    // Receita = só dinheiro no caixa: vendas + patrocínio $ recebido + doações em dinheiro + camisetas pagas
    const receita = totalVendas + patrDinheiro + doacoesEntradaTotalPDF + camisetasPagasPDF;
    const saldo = receita - despCompras;
    const meta = dados.meta || 0;

    doc.autoTable({
        startY: y, theme: 'grid',
        headStyles: { fillColor: [230, 81, 0] },
        head: [['Indicador', 'Valor']],
        body: [
            ['Total de Vendas (barracas)', 'R$ ' + fmt(totalVendas)],
            ['Total de Itens Vendidos', totalItens.toString()],
            ['Patrocínios em Dinheiro (recebido)', 'R$ ' + fmt(patrDinheiro)],
            ['Patrocínios em Dinheiro (a receber)', 'R$ ' + fmt(patrDinheiroPend)],
            ['Doações em Dinheiro', 'R$ ' + fmt(doacoesEntradaTotalPDF)],
            ['Camisetas (pagas)', 'R$ ' + fmt(camisetasPagasPDF)],
            ['Patrocínios em Serviços (doação, não entra no caixa)', 'R$ ' + fmt(patrServico)],
            ['Patrocínios em Produtos (doação, não entra no caixa)', 'R$ ' + fmt(patrProduto)],
            ['RECEITA TOTAL (dinheiro no caixa)', 'R$ ' + fmt(receita)],
            ['Despesas (compras)', 'R$ ' + fmt(despCompras)],
            ['Itens recebidos como doação', 'R$ ' + fmt(despDoacoes)],
            ['SALDO FINAL', 'R$ ' + fmt(saldo)],
            ['Meta de Faturamento', meta > 0 ? 'R$ ' + fmt(meta) + ' (' + Math.min((totalVendas/meta*100),100).toFixed(0) + '%)' : 'Não definida']
        ]
    });
    y = doc.lastAutoTable.finalY + 15;

    // ===== PATROCINADORES =====
    checkPage(30);
    titulo('2. PATROCINADORES');
    const patrs = [...(dados.patrocinadores||[])].sort((a,b) => a.nome.localeCompare(b.nome));
    if (patrs.length > 0) {
        const TIPOS = { dinheiro: '$ Dinheiro', servico: 'Serviço', produto: 'Produto' };
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [21, 101, 192] },
            styles: { overflow: 'linebreak', fontSize: 8, cellPadding: 2 },
            head: [['Patrocinador', 'Tipo', 'Descrição', 'Valor', 'Barraca', 'Status']],
            body: patrs.map(p => [
                p.nome || '-',
                TIPOS[p.tipo] || 'Dinheiro',
                p.desc || '-',
                'R$ ' + fmt(p.valor),
                p.barraca ? (NOMES_BARRACAS[p.barraca] || p.barraca).replace(/^.{2}/, '') : '-',
                p.recebido ? 'Recebido' : 'Pendente'
            ]),
            columnStyles: { 0: { cellWidth: 38 }, 2: { cellWidth: 40 } }
        });
        y = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(9);
        doc.text(`Total: ${patrs.length} patrocinadores | Dinheiro: R$ ${fmt(patrDinheiro)} | Serviços: R$ ${fmt(patrServico)} | Produtos: R$ ${fmt(patrProduto)}`, 14, y);
        y += 15;
    } else {
        doc.text('Nenhum patrocinador cadastrado.', 14, y); y += 15;
    }

    // ===== CARDÁPIO - PRODUTOS E PREÇOS =====
    checkPage(30);
    titulo('3. CARDÁPIO - PRODUTOS E PREÇOS POR BARRACA');
    BARRACAS.forEach(b => {
        const produtos = dados.configProdutos ? dados.configProdutos[b] : PRODUTOS_BARRACA[b];
        if (!produtos || produtos.length === 0) return;
        checkPage(15);
        const nome = (NOMES_BARRACAS[b]||b).replace(/^.{2}\s?/,'');
        const prods = (Array.isArray(produtos) ? produtos : Object.values(produtos)).sort((a,b) => a.nome.localeCompare(b.nome));
        doc.autoTable({
            startY: y, theme: 'striped',
            headStyles: { fillColor: [91, 192, 235] },
            head: [[nome, 'Preço']],
            body: prods.map(p => [p.nome, 'R$ ' + fmt(p.preco)])
        });
        y = doc.lastAutoTable.finalY + 5;
    });
    y += 10;

    // ===== VENDAS POR BARRACA =====
    checkPage(30);
    titulo('4. VENDAS POR BARRACA');
    const tabelaBarracas = BARRACAS.filter(b => dados[b] && dados[b].vendas.length > 0).map(b => {
        const v = dados[b].vendas.reduce((s,x) => s + x.total, 0);
        const it = dados[b].vendas.reduce((s,x) => s + x.qtd, 0);
        const desp = (dados.despesas||[]).filter(d => d.destino === b && !d.doacao).reduce((s,d) => s + d.valor, 0);
        const lucro = v - desp;
        return [(NOMES_BARRACAS[b]||b).replace(/^.{2}/,''), it, 'R$ ' + fmt(v), 'R$ ' + fmt(desp), 'R$ ' + fmt(lucro)];
    });
    if (tabelaBarracas.length > 0) {
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [46, 125, 50] },
            head: [['Barraca', 'Itens', 'Vendas', 'Custos', 'Lucro']],
            body: tabelaBarracas
        });
        y = doc.lastAutoTable.finalY + 15;
    }

    // ===== DETALHAMENTO POR PRODUTO =====
    checkPage(30);
    titulo('5. VENDAS DETALHADAS POR PRODUTO');
    BARRACAS.forEach(b => {
        if (!dados[b] || dados[b].vendas.length === 0) return;
        checkPage(20);
        const nome = (NOMES_BARRACAS[b]||b).replace(/^.{2}/,'');
        // Agrupar por produto
        const prodMap = {};
        dados[b].vendas.forEach(v => {
            if (!prodMap[v.produto]) prodMap[v.produto] = { qtd: 0, valor: 0, dias: {1:0,2:0,3:0,4:0} };
            prodMap[v.produto].qtd += v.qtd;
            prodMap[v.produto].valor += v.total;
            prodMap[v.produto].dias[v.dia] = (prodMap[v.produto].dias[v.dia] || 0) + v.qtd;
        });
        const prods = Object.entries(prodMap).map(([n, d]) => [n, d.dias[1], d.dias[2], d.dias[3], d.dias[4], d.qtd, 'R$ ' + fmt(d.valor)]).sort((a,b) => a[0].localeCompare(b[0]));

        doc.autoTable({
            startY: y, theme: 'striped',
            headStyles: { fillColor: [92, 61, 46] },
            head: [[nome, DIAS_FESTA[1].split(' ')[0], DIAS_FESTA[2].split(' ')[0], DIAS_FESTA[3].split(' ')[0], DIAS_FESTA[4].split(' ')[0], 'Total Qt', 'Faturamento']],
            body: prods
        });
        y = doc.lastAutoTable.finalY + 8;
    });

    // ===== COMPARATIVO POR DIA =====
    checkPage(30);
    titulo('6. COMPARATIVO ENTRE DIAS');
    const diasData = [1,2,3,4].map(d => {
        let vendas = 0, itens = 0;
        BARRACAS.forEach(b => {
            if (dados[b]) {
                vendas += dados[b].vendas.filter(v => v.dia === d).reduce((s,v) => s + v.total, 0);
                itens += dados[b].vendas.filter(v => v.dia === d).reduce((s,v) => s + v.qtd, 0);
            }
        });
        return [DIAS_FESTA[d], itens, 'R$ ' + fmt(vendas)];
    });
    doc.autoTable({
        startY: y, theme: 'grid',
        headStyles: { fillColor: [21, 101, 192] },
        head: [['Dia', 'Itens Vendidos', 'Faturamento']],
        body: diasData
    });
    y = doc.lastAutoTable.finalY + 15;

    // ===== RANKING DE PRODUTOS =====
    checkPage(30);
    titulo('7. RANKING - PRODUTOS MAIS VENDIDOS');
    const rankMap = {};
    BARRACAS.forEach(b => {
        if (!dados[b]) return;
        dados[b].vendas.forEach(v => {
            if (!rankMap[v.produto]) rankMap[v.produto] = { qtd: 0, valor: 0, barraca: b };
            rankMap[v.produto].qtd += v.qtd;
            rankMap[v.produto].valor += v.total;
        });
    });
    const ranking = Object.entries(rankMap).map(([n,d]) => ({ nome: n, ...d })).sort((a,b) => b.qtd - a.qtd).slice(0, 20);
    if (ranking.length > 0) {
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [255, 143, 0] },
            head: [['#', 'Produto', 'Barraca', 'Qtd Vendida', 'Faturamento']],
            body: ranking.map((r, i) => [i+1, r.nome, (NOMES_BARRACAS[r.barraca]||'').replace(/^.{2}/,''), r.qtd, 'R$ ' + fmt(r.valor)])
        });
        y = doc.lastAutoTable.finalY + 15;
    }

    // ===== DESPESAS =====
    checkPage(30);
    titulo('8. DESPESAS');
    const despesas = dados.despesas || [];
    if (despesas.length > 0) {
        // Resumo por categoria
        const catMap = {};
        despesas.forEach(d => {
            if (!catMap[d.categoria]) catMap[d.categoria] = { compras: 0, doacoes: 0 };
            if (d.doacao) catMap[d.categoria].doacoes += d.valor;
            else catMap[d.categoria].compras += d.valor;
        });
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [198, 40, 40] },
            head: [['Categoria', 'Compras', 'Doações', 'Total']],
            body: Object.entries(catMap).map(([cat, v]) => [cat, 'R$ ' + fmt(v.compras), 'R$ ' + fmt(v.doacoes), 'R$ ' + fmt(v.compras + v.doacoes)])
        });
        y = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(9);
        doc.text(`Total Compras: R$ ${fmt(despCompras)} | Total Doações: R$ ${fmt(despDoacoes)} | ${despesas.length} itens`, 14, y);
        y += 15;

        // Lista completa
        checkPage(20);
        doc.setFontSize(10); doc.text('Detalhamento:', 14, y); y += 5;
        doc.autoTable({
            startY: y, theme: 'striped', styles: { fontSize: 7, overflow: 'linebreak', cellPadding: 2 },
            headStyles: { fillColor: [92, 61, 46] },
            columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 40 }, 2: { cellWidth: 16 }, 3: { cellWidth: 20 }, 4: { cellWidth: 22 }, 5: { cellWidth: 20 }, 6: { cellWidth: 24 }, 7: { cellWidth: 16 } },
            head: [['Categoria', 'Descrição', 'Qtd', 'Valor', 'Local', 'Destino', 'Tipo', 'Status']],
            body: despesas.map(d => [
                d.categoria || '-', d.desc || '-', (d.qtd||1) + ' ' + (d.unidade||'un'),
                'R$ ' + fmt(d.valor), d.local || '-',
                d.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[d.destino]||d.destino||'').replace(/^.{2}/,''),
                d.doacao ? 'Doação' + (d.patrocinadorId ? ' (' + getNomePatrocinador(d.patrocinadorId) + ')' : '') : 'Compra',
                d.pago ? 'Pago' : 'Pendente'
            ])
        });
        y = doc.lastAutoTable.finalY + 15;
    }

    // ===== DOAÇÕES RECEBIDAS =====
    const doacoes = despesas.filter(d => d.doacao);
    if (doacoes.length > 0) {
        checkPage(30);
        titulo('9. DOAÇÕES RECEBIDAS');
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [106, 27, 154] },
            head: [['Item', 'Valor Estimado', 'Patrocinador', 'Barraca']],
            body: doacoes.map(d => [
                d.desc,
                'R$ ' + fmt(d.valor),
                d.patrocinadorId ? getNomePatrocinador(d.patrocinadorId) : '-',
                d.destino === 'geral' ? 'Geral' : (NOMES_BARRACAS[d.destino]||d.destino||'').replace(/^.{2}/,'')
            ])
        });
        y = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(9);
        doc.text(`Total em doações: R$ ${fmt(despDoacoes)} (${doacoes.length} itens)`, 14, y);
        y += 15;
    }

    // ===== ECONOMIA COM DOAÇÕES =====
    const doacoesPDF = (dados.despesas||[]).filter(d => d.doacao);
    if (doacoesPDF.length > 0) {
        checkPage(40);
        titulo('10. ECONOMIA COM DOAÇÕES');
        const totalEconomia = doacoesPDF.reduce((s,d) => s + d.valor, 0);
        const pctEcon = despCompras > 0 ? ((totalEconomia / (despCompras + totalEconomia)) * 100).toFixed(0) : 0;
        
        doc.setFontSize(11);
        const textoEcon = `Graças às doações dos patrocinadores, a festa economizou R$ ${fmt(totalEconomia)} em produtos e serviços, o que representa ${pctEcon}% do total de gastos que seriam necessários (R$ ${fmt(despCompras + totalEconomia)}).`;
        const linhasEcon = doc.splitTextToSize(textoEcon, pageW - 28);
        doc.text(linhasEcon, 14, y);
        y += linhasEcon.length * 6 + 10;

        // Tabela de doadores
        const doadoresMap = {};
        doacoesPDF.forEach(d => {
            const nome = d.patrocinadorId ? getNomePatrocinador(d.patrocinadorId) : 'Não identificado';
            if (!doadoresMap[nome]) doadoresMap[nome] = { itens: 0, valor: 0 };
            doadoresMap[nome].itens++;
            doadoresMap[nome].valor += d.valor;
        });
        const doadoresLista = Object.entries(doadoresMap).sort((a,b) => b[1].valor - a[1].valor);
        
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [106, 27, 154] },
            head: [['Doador', 'Qtd Itens', 'Valor Total']],
            body: doadoresLista.map(([nome, d]) => [nome, d.itens, 'R$ ' + fmt(d.valor)])
        });
        y = doc.lastAutoTable.finalY + 15;
    }

    // ===== DOADORES - BINGO E LEILÃO =====
    const doadoresPDF = dados.doadores || [];
    if (doadoresPDF.length > 0) {
        checkPage(30);
        const secDoadores = (doacoesPDF.length > 0 ? 10 : 9);
        titulo(secDoadores + '. DOADORES - BINGO E LEILÃO (Agradecimento)');
        doc.setFontSize(10);
        doc.text('Agradecemos às empresas e pessoas que doaram itens/prêmios para o bingo e leilão:', 14, y);
        y += 8;

        // Agrupar por doador
        const doadoresAgrup = {};
        doadoresPDF.forEach(d => {
            if (!doadoresAgrup[d.nome]) doadoresAgrup[d.nome] = [];
            doadoresAgrup[d.nome].push(d);
        });

        const bodyDoadores = [];
        Object.entries(doadoresAgrup).sort((a,b) => a[0].localeCompare(b[0])).forEach(([nome, itens]) => {
            const itensTxt = itens.map(i => i.item).join(', ');
            const totalVal = itens.reduce((s,i) => s + (i.valor||0), 0);
            bodyDoadores.push([nome, itensTxt, itens.length, totalVal > 0 ? 'R$ ' + fmt(totalVal) : '-']);
        });

        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [106, 27, 154] },
            head: [['Doador', 'Itens Doados', 'Qtd', 'Valor Est.']],
            body: bodyDoadores,
            columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 80 } }
        });
        y = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(9);
        doc.text(`Total: ${Object.keys(doadoresAgrup).length} doadores | ${doadoresPDF.length} itens`, 14, y);
        y += 15;
    }

    // ===== DOAÇÕES EM DINHEIRO =====
    const doacoesEntradaPDF = dados.doacoesEntrada || [];
    if (doacoesEntradaPDF.length > 0) {
        checkPage(30);
        titulo('DOAÇÕES EM DINHEIRO');
        const TIPOS_DOACAO = { pessoa: 'Pessoa Física', empresa: 'Empresa', saldo: 'Saldo Anterior', outro: 'Outro' };
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [46, 125, 50] },
            head: [['Doador', 'Tipo', 'Valor', 'Data', 'Status']],
            body: doacoesEntradaPDF.map(d => [
                d.nome,
                TIPOS_DOACAO[d.tipo] || d.tipo,
                'R$ ' + fmt(d.valor),
                d.data ? d.data.split('-').reverse().join('/') : '-',
                d.recebido ? 'Recebido' : 'Pendente'
            ])
        });
        y = doc.lastAutoTable.finalY + 5;
        const totalDoaEnt = doacoesEntradaPDF.reduce((s,d) => s + d.valor, 0);
        doc.setFontSize(9);
        doc.text(`Total em doações: R$ ${fmt(totalDoaEnt)} | ${doacoesEntradaPDF.length} doadores`, 14, y);
        y += 15;
    }

    // ===== ITENS NECESSÁRIOS =====
    const necessidadesPDF = dados.necessidades || [];
    if (necessidadesPDF.length > 0) {
        checkPage(30);
        titulo('ITENS NECESSÁRIOS');
        const conseguidos = necessidadesPDF.filter(n => n.conseguido).length;
        doc.setFontSize(9);
        doc.text(`Total: ${necessidadesPDF.length} itens | Conseguidos: ${conseguidos} | Pendentes: ${necessidadesPDF.length - conseguidos}`, 14, y);
        y += 8;

        // Agrupar por barraca
        const necAgrup = {};
        necessidadesPDF.forEach(n => {
            const key = n.barraca || 'geral';
            if (!necAgrup[key]) necAgrup[key] = [];
            necAgrup[key].push(n);
        });
        const necKeys = Object.keys(necAgrup).sort((a,b) => {
            if (a === 'geral') return -1; if (b === 'geral') return 1;
            return (NOMES_BARRACAS[a]||a).localeCompare(NOMES_BARRACAS[b]||b);
        });
        necKeys.forEach(key => {
            const nome = key === 'geral' ? 'Geral (Infraestrutura)' : (NOMES_BARRACAS[key]||key).replace(/^.{2}\s?/,'');
            const itens = necAgrup[key];
            if (y + 15 > 270) { doc.addPage(); y = 20; }
            doc.autoTable({
                startY: y, theme: 'striped',
                headStyles: { fillColor: [91, 192, 235] },
                head: [[nome, 'Qtd', 'Obs', 'Status']],
                body: itens.map(n => [n.item, `${n.qtd} ${n.unidade}`, n.obs || '-', n.conseguido ? 'Conseguido' : 'PENDENTE'])
            });
            y = doc.lastAutoTable.finalY + 5;
        });
        y += 10;
    }

    // ===== CAMISETAS =====
    const camisetasPDF = dados.camisetas || [];
    if (camisetasPDF.length > 0) {
        checkPage(30);
        titulo('VENDA DE CAMISETAS');
        const TIPO_LBL = { trabalhador: 'Trabalhador', publico: 'Público' };
        doc.autoTable({
            startY: y, theme: 'grid',
            headStyles: { fillColor: [91, 192, 235], textColor: [255,255,255], fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            styles: { overflow: 'linebreak', cellPadding: 2 },
            head: [['Nome', 'Telefone', 'Tipo', 'Modelagem', 'Tam.', 'Valor', 'Status']],
            body: [...camisetasPDF].sort((a,b)=>(a.nome||'').localeCompare(b.nome||'')).map(c => [
                c.nome || '-', c.telefone || '-', TIPO_LBL[c.tipo] || c.tipo,
                c.modelagem || '-', c.tamanho || '-',
                (c.valor||0) > 0 ? 'R$ ' + fmt(c.valor) : '-',
                c.pago ? 'Pago' : 'Pendente'
            ])
        });
        y = doc.lastAutoTable.finalY + 5;
        const totCamis = camisetasPDF.reduce((s,c)=>s+(c.valor||0),0);
        const totCamisPagas = camisetasPDF.filter(c=>c.pago).reduce((s,c)=>s+(c.valor||0),0);
        doc.setFontSize(9); doc.setTextColor(80);
        doc.text(`Total: ${camisetasPDF.length} camisetas | Valor total: R$ ${fmt(totCamis)} | Recebido: R$ ${fmt(totCamisPagas)} | A receber: R$ ${fmt(totCamis - totCamisPagas)}`, 14, y);
        y += 15;
    }

    // ===== RESULTADO FINAL =====
    checkPage(40);
    const secFinal = (doacoesPDF.length > 0 ? 10 : 9) + ((dados.doadores||[]).length > 0 ? 1 : 0) + (doacoesEntradaPDF.length > 0 ? 1 : 0) + (necessidadesPDF.length > 0 ? 1 : 0) + (camisetasPDF.length > 0 ? 1 : 0);
    titulo(secFinal + '. RESULTADO FINAL');
    doc.autoTable({
        startY: y, theme: 'grid',
        headStyles: { fillColor: [46, 125, 50] },
        head: [['', 'Valor']],
        body: (function(){
            const doacEnt = doacoesEntradaPDF.reduce((s,d) => s + (d.valor||0), 0);
            const camisPagas = (dados.camisetas || []).filter(c => c.pago).reduce((s,c) => s + (c.valor||0), 0);
            const receitaTotalPdf = receita + doacEnt + camisPagas;
            const saldoLiqPdf = saldo + doacEnt + camisPagas;
            return [
                ['(+) Vendas nas barracas', 'R$ ' + fmt(totalVendas)],
                ['(+) Patrocínios em dinheiro', 'R$ ' + fmt(patrDinheiro)],
                ['(+) Doações em dinheiro', 'R$ ' + fmt(doacEnt)],
                ['(+) Camisetas (pagas)', 'R$ ' + fmt(camisPagas)],
                ['(=) RECEITA TOTAL', 'R$ ' + fmt(receitaTotalPdf)],
                ['(-) Despesas (compras)', 'R$ ' + fmt(despCompras)],
                ['(=) SALDO LÍQUIDO', 'R$ ' + fmt(saldoLiqPdf)],
                ['', ''],
                ['Itens vendidos no total', totalItens.toString()],
                ['Barracas ativas', BARRACAS.filter(b => dados[b] && dados[b].vendas.length > 0).length.toString()],
                ['Patrocinadores', (dados.patrocinadores||[]).length.toString()],
                ['Doadores (dinheiro)', doacoesEntradaPDF.length.toString()],
                ['Camisetas vendidas', (dados.camisetas||[]).length.toString()],
                ['Economia com doações em produtos', 'R$ ' + fmt(despDoacoes)]
            ];
        })()
    });

    // ===== PÁGINA DE ASSINATURAS =====
    doc.addPage();
    y = 60;
    doc.setFontSize(14); doc.setTextColor(230, 81, 0);
    center('TERMO DE APROVAÇÃO', y, 14);
    doc.setTextColor(0);
    y += 20;
    
    // Texto do termo
    doc.setFontSize(10);
    const texto = `Em cumprimento às normas de transparência e responsabilidade administrativa, declaramos que o Relatório Financeiro do ${cfg.nomeEvento} – Edição ${cfg.edicao} foi devidamente analisado, encontrando-se em conformidade com a movimentação financeira realizada durante o evento. Assim, aprovamos a presente prestação de contas, por expressar fielmente as receitas, despesas e o resultado financeiro obtido.`;
    const linhas = doc.splitTextToSize(texto, pageW - 28);
    doc.text(linhas, 14, y);
    y += linhas.length * 6 + 25;

    // Data acima das assinaturas
    doc.setFontSize(10);
    center(`${cfg.cidade}, ______ de __________________ de ${cfg.edicao}`, y);
    y += 30;

    // Assinaturas em formato de 2 linhas (nome + cargo), uma abaixo da outra
    const assinaturas = [
        { nome: cfg.ass1Nome, cargo: cfg.ass1Cargo },
        { nome: cfg.ass2Nome, cargo: cfg.ass2Cargo },
        { nome: cfg.ass3Nome, cargo: cfg.ass3Cargo }
    ].filter(a => a.nome);

    assinaturas.forEach(ass => {
        doc.line(14, y, 100, y); // linha
        y += 5;
        doc.setFontSize(10);
        doc.text(ass.nome, 14, y); // nome
        y += 5;
        doc.setFontSize(9); doc.setTextColor(80);
        doc.text(ass.cargo, 14, y); // cargo
        doc.setTextColor(0);
        y += 20;
    });

    // Aplicar cabeçalho/rodapé em todas as páginas
    const totalPages = doc.internal.getNumberOfPages();
    const cfgPdf = getConfigEvento();
    for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text(`${cfgPdf.nomeEvento} ${cfgPdf.edicao} | Relatório Financeiro`, 14, 10);
        doc.text(`Página ${i} de ${totalPages}`, pageW - 14, 10, { align: 'right' });
        doc.text(cfgPdf.igreja, pageW / 2, 290, { align: 'center' });
        doc.setTextColor(0);
    }

    doc.save('relatorio_padroeira_2026.pdf');
    alert('Relatório PDF gerado com sucesso!');
    registrarAcao('Relatório PDF gerado');
}

// ===== CONFIGURAÇÕES: BARRACAS E PRODUTOS DINÂMICOS =====
function getBarracasConfig() {
    // Se tem config salva, usa ela; senão usa a padrão
    if (dados.configBarracas) return dados.configBarracas;
    return BARRACAS.map(b => ({ id: b, nome: NOMES_BARRACAS[b] }));
}

function getProdutosConfig() {
    if (dados.configProdutos) return dados.configProdutos;
    return PRODUTOS_BARRACA;
}

function adicionarBarraca() {
    const id = document.getElementById('novaBarracaId').value.trim().toLowerCase().replace(/\s+/g, '-');
    const nome = document.getElementById('novaBarracaNome').value.trim();
    if (!id || !nome) { alert('Preencha o ID e o Nome da barraca'); return; }

    // Salvar config
    if (!dados.configBarracas) {
        dados.configBarracas = BARRACAS.map(b => ({ id: b, nome: NOMES_BARRACAS[b] }));
    }
    if (!dados.configProdutos) {
        dados.configProdutos = JSON.parse(JSON.stringify(PRODUTOS_BARRACA));
    }

    // Verificar se já existe
    if (dados.configBarracas.find(b => b.id === id)) { alert('Já existe uma barraca com esse ID'); return; }

    dados.configBarracas.push({ id, nome });
    dados.configProdutos[id] = [];
    if (!dados[id]) dados[id] = { vendas: [] };

    // Atualizar as constantes em memória
    if (!BARRACAS.includes(id)) BARRACAS.push(id);
    NOMES_BARRACAS[id] = nome;
    PRODUTOS_BARRACA[id] = [];

    salvarDados(dados);
    document.getElementById('novaBarracaId').value = '';
    document.getElementById('novaBarracaNome').value = '';
    renderizarConfig();
    alert(`Barraca "${nome}" criada! Recarregue a página para ver no menu.`);
}

function adicionarProduto() {
    const barraca = document.getElementById('configBarracaSelect').value;
    const nome = document.getElementById('novoProdutoNome').value.trim();
    const preco = parseFloat(document.getElementById('novoProdutoPreco').value);
    if (!barraca || !nome || isNaN(preco) || preco <= 0) { alert('Preencha todos os campos'); return; }

    if (!dados.configProdutos) {
        dados.configProdutos = JSON.parse(JSON.stringify(PRODUTOS_BARRACA));
    }
    if (!dados.configProdutos[barraca]) dados.configProdutos[barraca] = [];

    dados.configProdutos[barraca].push({ nome, preco });
    PRODUTOS_BARRACA[barraca] = dados.configProdutos[barraca];

    salvarDados(dados);
    document.getElementById('novoProdutoNome').value = '';
    document.getElementById('novoProdutoPreco').value = '';
    renderizarConfig();
    atualizarSelectsProdutos(barraca);
    alert(`Produto "${nome}" adicionado à barraca!`);
}

function removerProduto(barraca, index) {
    if (!confirm('Remover este produto?')) return;
    if (!dados.configProdutos) {
        dados.configProdutos = JSON.parse(JSON.stringify(PRODUTOS_BARRACA));
    }
    dados.configProdutos[barraca].splice(index, 1);
    PRODUTOS_BARRACA[barraca] = dados.configProdutos[barraca];
    salvarDados(dados);
    renderizarConfig();
    atualizarSelectsProdutos(barraca);
}

function atualizarSelectsProdutos(barraca) {
    // Atualizar o select da barraca na seção de vendas - sempre em ordem alfabética
    const select = document.getElementById('prod-' + barraca);
    if (select) {
        let produtos = dados.configProdutos ? dados.configProdutos[barraca] : PRODUTOS_BARRACA[barraca];
        if (produtos) {
            produtos = [...produtos].sort((a, b) => a.nome.localeCompare(b.nome));
            select.innerHTML = produtos.map(p => 
                `<option value="${p.nome}" data-preco="${p.preco}">${p.nome} - R$ ${fmt(p.preco)}</option>`
            ).join('');
        }
    }
}

function renderizarConfig() {
    // Select de barracas
    const select = document.getElementById('configBarracaSelect');
    const barracas = getBarracasConfig();
    if (select) {
        select.innerHTML = barracas.map(b => `<option value="${b.id}">${b.nome}</option>`).join('');
    }

    // Lista de barracas e produtos
    const container = document.getElementById('listaBarracasProdutos');
    if (!container) return;
    const produtos = getProdutosConfig();

    let html = '';
    barracas.forEach(b => {
        const prods = produtos[b.id] || [];
        html += `<div class="config-barraca">
            <div class="config-barraca-header">${b.nome} <small>(${b.id})</small> <button class="btn-delete" onclick="removerBarraca('${b.id}')" style="margin-left:10px">Excluir Barraca</button></div>
            <div class="config-produtos">`;
        if (prods.length === 0) {
            html += '<span style="opacity:0.5;font-size:0.8rem">Preço variável / sem produtos fixos</span>';
        } else {
            prods.forEach((p, i) => {
                html += `<span class="config-produto-item">${p.nome} - R$ ${fmt(p.preco)} <button class="btn-delete" onclick="removerProduto('${b.id}', ${i})">X</button></span>`;
            });
        }
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

function removerBarraca(id) {
    if (!confirm(`Excluir a barraca "${NOMES_BARRACAS[id] || id}"? Vendas e dados vinculados serão perdidos.`)) return;
    
    // Remover da config
    if (dados.configBarracas) {
        dados.configBarracas = dados.configBarracas.filter(b => b.id !== id);
    } else {
        // Se nunca salvou config, criar a partir das barracas atuais (sem a removida)
        dados.configBarracas = BARRACAS.filter(b => b !== id).map(b => ({ id: b, nome: NOMES_BARRACAS[b] }));
    }
    if (dados.configProdutos && dados.configProdutos[id]) {
        delete dados.configProdutos[id];
    }
    // Remover dados de vendas
    if (dados[id]) delete dados[id];
    
    // Remover do array em memória
    const idx = BARRACAS.indexOf(id);
    if (idx > -1) BARRACAS.splice(idx, 1);
    delete NOMES_BARRACAS[id];
    delete PRODUTOS_BARRACA[id];
    
    salvarDados(dados);
    renderizarConfig();
    atualizarSelectsDestino();
    renderizarTudo();
    alert('Barraca removida! Recarregue a página para atualizar o menu.');
    registrarAcao(`Barraca removida: ${id}`);
}

function atualizarSelectsDestino() {
    // Atualiza todos os selects de destino (despesas, caixa rápido, patrocínios)
    const selects = ['destinoDespesa', 'caixaDestino', 'barracaPatrocinio'];
    selects.forEach(selectId => {
        const el = document.getElementById(selectId);
        if (!el) return;
        // Preservar opções fixas (geral/sem vínculo)
        const primeiraOpcao = selectId === 'barracaPatrocinio' 
            ? '<option value="">Sem vínculo com barraca</option><option value="geral">Geral (evento todo)</option>'
            : '<option value="geral">Geral (evento todo)</option>';
        const barracaOpts = BARRACAS.map(b => 
            `<option value="${b}">${(NOMES_BARRACAS[b] || b).replace(/^.{2}\s?/, '')}</option>`
        ).join('');
        el.innerHTML = primeiraOpcao + barracaOpts;
    });
}

function limparTodosDados() {
    if (!confirm('ATENÇÃO: Isso vai apagar TODOS os dados (vendas, despesas, patrocinadores, doações, necessidades, histórico). Tem certeza?')) return;
    if (!confirm('Última chance! Realmente quer apagar tudo?')) return;
    dados = dadosVazios();
    salvarDados(dados);
    // Limpar histórico também
    historico = [];
    localStorage.removeItem(HISTORICO_KEY);
    renderizarTudo();
    renderizarHistorico();
    alert('Dados limpos com sucesso! Tudo zerado para começar do zero.');
}

// ===== LIXEIRA (recuperar itens apagados) =====
const LIXEIRA_LABEL = {
    camisetas: '👕 Camiseta', patrocinadores: '🤝 Patrocinador', despesas: '🧾 Despesa',
    doacoesEntrada: '💰 Doação em dinheiro', doadores: '🎁 Bingo/Leilão', necessidades: '📋 Necessidade', caixas: '🧑‍💼 Caixa'
};

function descreverItemLixeira(campo, item) {
    if (!item) return '(item)';
    if (campo === 'camisetas') return `${item.nome||'-'} — ${item.modelagem||''} ${item.tamanho||''} (${item.tipo||''})`;
    if (campo === 'patrocinadores') return `${item.nome||'-'} — ${R$(item.valor||0)}`;
    if (campo === 'despesas') return `${item.desc||'-'} — ${R$(item.valor||0)}`;
    if (campo === 'doacoesEntrada') return `${item.nome||item.doador||'-'} — ${R$(item.valor||0)}`;
    if (campo === 'doadores') return `${item.nome||'-'} — ${item.item||''}`;
    if (campo === 'necessidades') return `${item.item||'-'} (${item.qtd||0} ${item.unidade||''})`;
    if (campo === 'caixas') return `${item.nome||'-'}`;
    return item.nome || item.desc || item.item || '(item)';
}

function abrirLixeira() {
    const el = document.getElementById('lixeiraLista');
    if (!el) return;
    el.innerHTML = '<p style="opacity:0.6">Carregando...</p>';
    if (typeof fbListarLixeira !== 'function') { el.innerHTML = '<p style="opacity:0.6">Lixeira indisponível.</p>'; return; }
    fbListarLixeira().then(lista => {
        if (!lista || lista.length === 0) { el.innerHTML = '<p style="opacity:0.6">Nenhum item apagado. 🎉</p>'; return; }
        let html = '<div class="tabela-box"><table><thead><tr><th>Tipo</th><th>Item</th><th>Apagado em</th><th></th></tr></thead><tbody>';
        lista.forEach(reg => {
            const quando = reg.removidoEm ? new Date(reg.removidoEm).toLocaleString('pt-BR') : '-';
            html += `<tr>
                <td>${LIXEIRA_LABEL[reg.campo] || reg.campo}</td>
                <td>${descreverItemLixeira(reg.campo, reg.item)}</td>
                <td style="font-size:0.8rem;opacity:0.8">${quando}</td>
                <td style="white-space:nowrap">
                    <button class="btn-venda" style="padding:3px 8px" onclick="restaurarLixeira('${reg.chave}')" title="Restaurar">↩️ Restaurar</button>
                    <button class="btn-delete" onclick="excluirLixeira('${reg.chave}')" title="Apagar de vez">X</button>
                </td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        el.innerHTML = html;
    });
}

function restaurarLixeira(chave) {
    if (typeof fbRestaurarLixeira !== 'function') return;
    fbRestaurarLixeira(chave).then(ok => {
        if (ok) {
            mostrarToast('↩️ Item restaurado!');
            // o listener em tempo real recarrega os dados; recarrega a lista da lixeira
            setTimeout(abrirLixeira, 400);
        } else {
            alert('Não foi possível restaurar este item.');
        }
    });
}

function excluirLixeira(chave) {
    if (!confirm('Apagar este item da lixeira definitivamente? Não poderá mais recuperar.')) return;
    if (typeof fbExcluirLixeira !== 'function') return;
    fbExcluirLixeira(chave).then(() => { mostrarToast('Item removido da lixeira'); setTimeout(abrirLixeira, 300); });
}

// Carregar config dinâmica ao iniciar
function carregarConfigDinamica() {
    if (dados.configBarracas) {
        dados.configBarracas.forEach(b => {
            if (!BARRACAS.includes(b.id)) BARRACAS.push(b.id);
            // Adicionar emoji padrão se o nome não tiver
            const temEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(b.nome);
            NOMES_BARRACAS[b.id] = temEmoji ? b.nome : '🏪 ' + b.nome;
            // Garantir que a barraca tem dados inicializados
            if (!dados[b.id]) dados[b.id] = { vendas: [] };
        });
    }
    if (dados.configProdutos) {
        Object.keys(dados.configProdutos).forEach(b => {
            if (dados.configProdutos[b]) {
                let prods = Array.isArray(dados.configProdutos[b]) 
                    ? dados.configProdutos[b] 
                    : Object.values(dados.configProdutos[b]);
                // Ordenar A-Z
                prods.sort((a, b) => a.nome.localeCompare(b.nome));
                PRODUTOS_BARRACA[b] = prods;
            }
        });
    }
    // Atualizar todos os selects existentes
    BARRACAS.forEach(b => atualizarSelectsProdutos(b));
    // Atualizar selects de destino com barracas dinâmicas
    atualizarSelectsDestino();
    // Adicionar barracas dinâmicas ao menu e criar seções
    atualizarMenuBarracas();
}

function atualizarMenuBarracas() {
    const menu = document.querySelector('.menu-barracas-vendas');
    if (!menu) return;
    const barracasDefault = ['fazendinha','cachorro-quente','kafta','pernil','pastel','batata-frita','doces','bar','chopp','kids','bingo','artesanato'];
    
    BARRACAS.forEach(b => {
        if (barracasDefault.includes(b)) return;
        if (menu.querySelector(`[data-section="${b}"]`)) return;
        
        // Criar seção dinâmica
        const container = document.querySelector('.container');
        if (container && !document.getElementById('sec-' + b)) {
            const nome = NOMES_BARRACAS[b] || b;
            const section = document.createElement('section');
            section.id = 'sec-' + b;
            section.className = 'section';
            section.innerHTML = `
                <h2>${nome}</h2>
                <div class="painel-madeira">
                    <h3>Lançar Venda (preço variável)</h3>
                    <div class="form-row">
                        <input type="text" id="descVenda-${b}" placeholder="Descrição do item">
                        <input type="number" id="precoVenda-${b}" placeholder="Preço R$" step="0.01" min="0">
                        <input type="number" id="qtd-${b}" placeholder="Qtd" min="1" value="1">
                        <button class="btn-venda" onclick="lancarVendaDinamica('${b}')">Lançar</button>
                    </div>
                </div>
                <div class="tabela-box"><h4>Vendas</h4><table id="tblVendas-${b}"><thead><tr><th>Dia</th><th>Produto</th><th>Qtd</th><th>Unit.</th><th>Total</th><th></th></tr></thead><tbody></tbody></table></div>
                <div class="resumo-barraca" id="resumo-${b}"></div>
            `;
            container.appendChild(section);
        }
        
        // Criar botão no menu
        const btn = document.createElement('button');
        btn.className = 'menu-btn';
        btn.dataset.section = b;
        const nome = NOMES_BARRACAS[b] || b;
        // Adicionar emoji padrão se não tiver
        const temEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(nome);
        btn.textContent = temEmoji ? nome : '🏪 ' + nome;
        btn.addEventListener('click', function() {
            document.querySelectorAll('.menu-btn').forEach(x => x.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById('sec-' + b).classList.add('active');
        });
        menu.appendChild(btn);
    });
}

function lancarVendaDinamica(barraca) {
    const descInput = document.getElementById('descVenda-' + barraca);
    const precoInput = document.getElementById('precoVenda-' + barraca);
    const qtdInput = document.getElementById('qtd-' + barraca);
    const produto = descInput ? descInput.value.trim() : '';
    const preco = precoInput ? parseFloat(precoInput.value) : 0;
    const qtd = qtdInput ? parseInt(qtdInput.value) || 1 : 1;
    if (!produto || isNaN(preco) || preco <= 0 || qtd < 1) return;

    const dia = filtro === 'todos' ? 1 : filtro;
    if (!dados[barraca]) dados[barraca] = { vendas: [] };
    dados[barraca].vendas.push({
        id: Date.now(), dia, produto, preco, qtd, total: preco * qtd
    });
    salvarDados(dados);
    if (descInput) descInput.value = '';
    if (precoInput) precoInput.value = '';
    if (qtdInput) qtdInput.value = '1';
    renderizarTudo();
    mostrarToast(`✅ ${qtd}x ${produto} lançado!`);
    registrarAcao(`Venda: ${qtd}x ${produto} → ${(NOMES_BARRACAS[barraca]||barraca).replace(/^.{2}/,'')}`);
}

carregarConfigDinamica();

// ===== CONFIG DO EVENTO =====
function carregarConfigEvento() {
    const cfg = dados.configEvento || {};
    const el = (id) => document.getElementById(id);
    if (el('cfgNomeEvento')) el('cfgNomeEvento').value = cfg.nomeEvento || 'FESTA DA PADROEIRA';
    if (el('cfgEdicao')) el('cfgEdicao').value = cfg.edicao || '2026';
    if (el('cfgDatas')) el('cfgDatas').value = cfg.datas || '09, 10, 11 e 12 de Outubro';
    if (el('cfgIgreja')) el('cfgIgreja').value = cfg.igreja || 'Basílica Menor Nossa Senhora da Conceição Aparecida';
    if (el('cfgCidade')) el('cfgCidade').value = cfg.cidade || 'São José do Rio Preto - SP';
    if (el('cfgAss1Nome')) el('cfgAss1Nome').value = cfg.ass1Nome || '';
    if (el('cfgAss1Cargo')) el('cfgAss1Cargo').value = cfg.ass1Cargo || '';
    if (el('cfgAss2Nome')) el('cfgAss2Nome').value = cfg.ass2Nome || '';
    if (el('cfgAss2Cargo')) el('cfgAss2Cargo').value = cfg.ass2Cargo || '';
    if (el('cfgAss3Nome')) el('cfgAss3Nome').value = cfg.ass3Nome || '';
    if (el('cfgAss3Cargo')) el('cfgAss3Cargo').value = cfg.ass3Cargo || '';

    // Atualizar header da página
    const headerH1 = document.querySelector('.header h1');
    const headerP = document.querySelector('.header p');
    const headerDatas = document.querySelector('.header .header-datas');
    if (headerH1) headerH1.textContent = cfg.nomeEvento || 'FESTA DA PADROEIRA';
    if (headerP) headerP.textContent = `Controle Financeiro - Edição ${cfg.edicao || '2026'}`;
    if (headerDatas) headerDatas.textContent = cfg.datas || '09, 10, 11 e 12 de Outubro';
}

function salvarConfigEvento() {
    dados.configEvento = {
        nomeEvento: document.getElementById('cfgNomeEvento').value.trim(),
        edicao: document.getElementById('cfgEdicao').value.trim(),
        datas: document.getElementById('cfgDatas').value.trim(),
        igreja: document.getElementById('cfgIgreja').value.trim(),
        cidade: document.getElementById('cfgCidade').value.trim(),
        ass1Nome: document.getElementById('cfgAss1Nome').value.trim(),
        ass1Cargo: document.getElementById('cfgAss1Cargo').value.trim(),
        ass2Nome: document.getElementById('cfgAss2Nome').value.trim(),
        ass2Cargo: document.getElementById('cfgAss2Cargo').value.trim(),
        ass3Nome: document.getElementById('cfgAss3Nome').value.trim(),
        ass3Cargo: document.getElementById('cfgAss3Cargo').value.trim()
    };
    salvarDados(dados);
    carregarConfigEvento();
    alert('Dados do evento salvos!');
    registrarAcao('Config do evento atualizada');
}

function getConfigEvento() {
    return dados.configEvento || {
        nomeEvento: 'FESTA DA PADROEIRA',
        edicao: '2026',
        datas: '09, 10, 11 e 12 de Outubro',
        igreja: 'Basílica Menor Nossa Senhora da Conceição Aparecida',
        cidade: 'São José do Rio Preto - SP'
    };
}

function carregarLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 500000) { alert('Imagem muito grande. Use uma imagem menor que 500KB.'); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        if (!dados.configEvento) dados.configEvento = {};
        dados.configEvento.logo = e.target.result;
        salvarDados(dados);
        exibirLogo();
        mostrarToast('✅ Logo carregado!');
    };
    reader.readAsDataURL(file);
}

function removerLogo() {
    if (!dados.configEvento) return;
    delete dados.configEvento.logo;
    salvarDados(dados);
    exibirLogo();
    mostrarToast('Logo removido');
}

function exibirLogo() {
    const img = document.getElementById('headerLogo');
    const status = document.getElementById('cfgLogoStatus');
    const btnRemover = document.getElementById('btnRemoverLogo');
    const logo = dados.configEvento && dados.configEvento.logo;
    if (img) {
        if (logo) {
            img.src = logo;
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
            img.src = '';
        }
    }
    if (status) status.textContent = logo ? 'Logo carregado' : 'Nenhum logo definido';
    if (btnRemover) btnRemover.style.display = logo ? 'inline-block' : 'none';
}

carregarConfigEvento();
exibirLogo();

// ===== FIREBASE STATUS =====
let firebaseOnline = false;
let ultimaSync = null;

function atualizarStatusFirebase(online) {
    firebaseOnline = online;
    const el = document.getElementById('firebaseStatus');
    if (el) {
        el.innerHTML = online
            ? '<span class="status-dot online"></span> Online'
            : '<span class="status-dot offline"></span> Offline';
    }
}

function registrarSync() {
    ultimaSync = new Date();
    const texto = ultimaSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const syncEl = document.getElementById('lastSync');
    if (syncEl) syncEl.textContent = `Salvo às ${texto}`;
    const footerEl = document.getElementById('footerSync');
    if (footerEl) footerEl.textContent = `Última sincronização: ${texto}`;
}

// Detectar conexão Firebase
if (typeof firebase !== 'undefined' && firebase.database) {
    firebase.database().ref('.info/connected').on('value', snap => {
        atualizarStatusFirebase(snap.val() === true);
    });
}

// Sobrescrever salvarDados para registrar sync
const _salvarDadosOriginal = salvarDados;
salvarDados = function(d) {
    _salvarDadosOriginal(d);
    registrarSync();
};

// ===== HISTÓRICO DE AÇÕES =====
const HISTORICO_KEY = 'arraia_historico';
let historico = JSON.parse(localStorage.getItem(HISTORICO_KEY) || '[]');

function registrarAcao(acao) {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    historico.unshift({ hora, acao, ts: Date.now() });
    if (historico.length > 50) historico = historico.slice(0, 50);
    localStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
    renderizarHistorico();
}

function renderizarHistorico() {
    const el = document.getElementById('historicoLista');
    if (!el) return;
    el.innerHTML = historico.slice(0, 20).map(h =>
        `<div class="historico-item"><span class="hist-hora">${h.hora}</span><span class="hist-acao">${h.acao}</span></div>`
    ).join('') || '<p style="opacity:0.5;font-size:0.8rem">Nenhuma ação ainda</p>';
}

function toggleHistorico() {
    const el = document.getElementById('historicoPainel');
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
        renderizarHistorico();
    }
}

function limparHistorico() {
    if (!confirm('Limpar todo o histórico de ações?')) return;
    historico = [];
    localStorage.removeItem(HISTORICO_KEY);
    renderizarHistorico();
    mostrarToast('Histórico limpo!');
}

// Interceptar funções para registrar no histórico
const _lancarVendaOriginal = lancarVenda;
lancarVenda = function(barraca) {
    const select = document.getElementById('prod-' + barraca);
    const qtd = document.getElementById('qtd-' + barraca);
    const produto = select ? select.value : '';
    const q = qtd ? qtd.value : 1;
    _lancarVendaOriginal(barraca);
    mostrarToast(`✅ ${q}x ${produto} lançado!`);
    registrarAcao(`Venda: ${q}x ${produto} → ${(NOMES_BARRACAS[barraca]||barraca).replace(/^.{2}/,'')}`);
};

const _lancarDespesaOriginal = lancarDespesa;
lancarDespesa = function() {
    const desc = document.getElementById('descDespesa').value.trim();
    const valor = document.getElementById('valorDespesa').value;
    _lancarDespesaOriginal();
    if (desc) registrarAcao(`Despesa: ${desc} R$ ${valor}`);
};

const _lancarPatrocinioOriginal = lancarPatrocinio;
lancarPatrocinio = function() {
    const nome = document.getElementById('nomePatrocinador').value.trim();
    _lancarPatrocinioOriginal();
    if (nome) registrarAcao(`Patrocínio: ${nome}`);
};

const _gastoRapidoOriginal = gastoRapido;
gastoRapido = function() {
    const desc = document.getElementById('caixaDesc').value.trim();
    const valor = document.getElementById('caixaValor').value;
    _gastoRapidoOriginal();
    if (desc) registrarAcao(`Gasto rápido: ${desc} R$ ${valor}`);
};

// ===== BUSCA GLOBAL =====
function buscaGlobalFn() {
    const termo = (document.getElementById('buscaGlobal')?.value || '').toLowerCase().trim();
    const container = document.getElementById('buscaResultados');
    if (!container) return;

    if (!termo || termo.length < 2) { container.style.display = 'none'; return; }

    let resultados = [];

    // Buscar em vendas
    BARRACAS.forEach(b => {
        if (!dados[b]) return;
        dados[b].vendas.forEach(v => {
            if (v.produto.toLowerCase().includes(termo)) {
                resultados.push({ tipo: 'Venda', texto: `${v.produto} x${v.qtd} = ${R$(v.total)}`, detalhe: (NOMES_BARRACAS[b]||'').replace(/^.{2}/,'') });
            }
        });
    });

    // Buscar em despesas
    (dados.despesas||[]).forEach(d => {
        if (d.desc.toLowerCase().includes(termo) || (d.local||'').toLowerCase().includes(termo) || d.categoria.toLowerCase().includes(termo)) {
            resultados.push({ tipo: d.doacao ? 'Doação' : 'Despesa', texto: `${d.desc} = ${R$(d.valor)}`, detalhe: d.categoria });
        }
    });

    // Buscar em patrocinadores
    (dados.patrocinadores||[]).forEach(p => {
        if (p.nome.toLowerCase().includes(termo) || (p.desc||'').toLowerCase().includes(termo)) {
            resultados.push({ tipo: 'Patrocinador', texto: p.nome, detalhe: p.desc || `${R$(p.valor||0)}` });
        }
    });

    if (resultados.length === 0) {
        container.innerHTML = '<div class="busca-item"><span>Nenhum resultado para "' + termo + '"</span></div>';
    } else {
        container.innerHTML = resultados.slice(0, 15).map(r =>
            `<div class="busca-item"><span>${r.texto} <small style="opacity:0.6">${r.detalhe}</small></span><span class="busca-tipo">${r.tipo}</span></div>`
        ).join('');
    }
    container.style.display = 'block';
}

// Fechar busca ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('.status-center') && !e.target.closest('.busca-resultados')) {
        const el = document.getElementById('buscaResultados');
        if (el) el.style.display = 'none';
    }
});

// ===== ATALHOS DE TECLADO =====
document.addEventListener('keydown', (e) => {
    // Ignorar se estiver em input/select/textarea
    if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;

    const atalhos = {
        '1': 'dashboard', '2': 'fazendinha', '3': 'cachorro-quente', '4': 'kafta',
        '5': 'pernil', '6': 'pastel', '7': 'batata-frita', '8': 'doces',
        '9': 'bar', '0': 'chopp', 'd': 'despesas', 'p': 'patrocinadores',
        'g': 'caixa', 'k': 'kids', 'b': 'bingo', 'a': 'artesanato'
    };

    const secao = atalhos[e.key.toLowerCase()];
    if (secao) {
        document.querySelectorAll('.menu-btn').forEach(btn => {
            if (btn.dataset.section === secao) btn.click();
        });
    }
});

// ===== GESTÃO DE CAIXAS =====
const DIAS_CAIXAS = {1: '09/Out (Sex)', 2: '10/Out (Sáb)', 3: '11/Out (Dom)', 4: '12/Out (Seg)'};

function salvarConfigCaixas() {
    if (!dados.configCaixas) dados.configCaixas = {};
    dados.configCaixas.fixos = parseInt(document.getElementById('cfgCaixasFixos').value) || 0;
    dados.configCaixas.volantes = parseInt(document.getElementById('cfgCaixasVolantes').value) || 0;
    salvarDados(dados);
    renderizarCaixas();
    atualizarDiasDisponiveis();
    mostrarToast('Config de caixas salva!');
}

function atualizarDiasDisponiveis() {
    if (!dados.configCaixas) dados.configCaixas = { fixos: 0, volantes: 0 };
    const tipoSelect = document.getElementById('caixaTipo');
    const tipo = tipoSelect ? tipoSelect.value : '';
    const rowDias = document.getElementById('rowDiasCaixa');
    const aviso = document.getElementById('avisoLimiteCaixas');

    // Se não selecionou tipo, esconder dias
    if (!tipo) {
        if (rowDias) rowDias.style.display = 'none';
        if (aviso) aviso.style.display = 'none';
        return;
    }

    const limite = tipo === 'fixo' ? (dados.configCaixas.fixos || 0) : (dados.configCaixas.volantes || 0);
    let diasDisponiveis = 0;
    let diasLotados = [];

    [1,2,3,4].forEach(dia => {
        const checkbox = document.getElementById('caixaDia' + dia);
        const label = document.getElementById('labelCaixaDia' + dia);
        if (!checkbox || !label) return;

        if (limite > 0) {
            const jaCadastrados = (dados.caixas || []).filter(c => c.tipo === tipo && c.dias.includes(dia)).length;
            if (jaCadastrados >= limite) {
                checkbox.checked = false;
                checkbox.disabled = true;
                label.style.opacity = '0.3';
                label.style.textDecoration = 'line-through';
                label.title = `LOTADO (${jaCadastrados}/${limite})`;
                diasLotados.push(DIAS_CAIXAS[dia].split(' ')[0]);
            } else {
                checkbox.disabled = false;
                checkbox.checked = true;
                label.style.opacity = '1';
                label.style.textDecoration = 'none';
                label.title = `${jaCadastrados}/${limite} preenchidos`;
                diasDisponiveis++;
            }
        } else {
            // Sem limite, tudo liberado
            checkbox.disabled = false;
            checkbox.checked = true;
            label.style.opacity = '1';
            label.style.textDecoration = 'none';
            label.title = '';
            diasDisponiveis++;
        }
    });

    // Mostrar/esconder linha de dias
    if (rowDias) {
        if (diasDisponiveis > 0) {
            rowDias.style.display = 'flex';
        } else {
            rowDias.style.display = 'none';
        }
    }

    // Aviso
    if (aviso) {
        if (diasDisponiveis === 0) {
            aviso.style.display = 'block';
            aviso.innerHTML = `⚠️ <strong>Todos os dias estão completos</strong> para Caixa ${tipo === 'fixo' ? 'Fixo' : 'Volante'} (máx ${limite}/dia). Não é possível cadastrar.`;
        } else if (diasLotados.length > 0) {
            aviso.style.display = 'block';
            aviso.innerHTML = `ℹ️ Dias lotados: ${diasLotados.join(', ')} — selecione apenas os dias disponíveis acima.`;
            aviso.style.color = '#ffb300';
        } else {
            aviso.style.display = 'none';
        }
    }
}

function cadastrarCaixa() {
    const nome = document.getElementById('caixaNome').value.trim();
    const telefone = document.getElementById('caixaTelefone').value.trim();
    const tipo = document.getElementById('caixaTipo').value;
    if (!nome) { alert('Preencha o nome da pessoa'); return; }
    if (!tipo) { alert('Selecione o tipo de caixa'); return; }

    const dias = [];
    if (document.getElementById('caixaDia1').checked) dias.push(1);
    if (document.getElementById('caixaDia2').checked) dias.push(2);
    if (document.getElementById('caixaDia3').checked) dias.push(3);
    if (document.getElementById('caixaDia4').checked) dias.push(4);

    if (dias.length === 0) { alert('Selecione pelo menos um dia'); return; }

    // Validar limite por dia
    if (!dados.configCaixas) dados.configCaixas = { fixos: 0, volantes: 0 };
    const limite = tipo === 'fixo' ? (dados.configCaixas.fixos || 0) : (dados.configCaixas.volantes || 0);
    
    if (limite > 0) {
        const diasLotados = [];
        dias.forEach(dia => {
            const jaCadastrados = (dados.caixas || []).filter(c => c.tipo === tipo && c.dias.includes(dia)).length;
            if (jaCadastrados >= limite) {
                diasLotados.push(DIAS_CAIXAS[dia].split(' ')[0]);
            }
        });
        if (diasLotados.length > 0) {
            alert(`Limite de caixas ${tipo === 'fixo' ? 'fixos' : 'volantes'} atingido nos dias: ${diasLotados.join(', ')}.\n\nMáximo configurado: ${limite} por dia.\n\nRemova alguém ou aumente o limite em Config.`);
            return;
        }
    }

    adicionarItem('caixas', { id: Date.now(), nome, telefone, tipo, dias });

    // Limpar e resetar form
    document.getElementById('caixaNome').value = '';
    document.getElementById('caixaTelefone').value = '';
    document.getElementById('caixaTipo').value = '';
    document.getElementById('rowDiasCaixa').style.display = 'none';
    document.getElementById('avisoLimiteCaixas').style.display = 'none';

    renderizarCaixas();
    atualizarDiasDisponiveis();
    mostrarToast(`✅ ${nome} cadastrado como caixa ${tipo}!`);
    registrarAcao(`Caixa cadastrado: ${nome} (${tipo})`);
}

function removerCaixa(id) {
    if (!confirm('Remover esta pessoa dos caixas?')) return;
    removerItem('caixas', id);
    renderizarCaixas();
    atualizarDiasDisponiveis();
}

function editarCaixa(id) {
    const item = (dados.caixas || []).find(c => String(c.id) === String(id));
    if (!item) return;
    edicaoAtual = { tipo: 'caixa', id };

    const diasChecks = [1,2,3,4].map(d =>
        `<label class="checkbox-opt" style="display:inline-flex;margin-right:8px"><input type="checkbox" id="editCaixaDia${d}" ${item.dias.includes(d)?'checked':''}> ${DIAS_CAIXAS[d].split(' ')[0]}</label>`
    ).join('');

    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Nome</label><input type="text" id="editNome" value="${item.nome}"></div>
        <div class="campo"><label>Telefone</label><input type="tel" id="editTelefone" value="${item.telefone || ''}"></div>
        <div class="campo"><label>Tipo</label>
            <select id="editTipoCaixa">
                <option value="fixo" ${item.tipo==='fixo'?'selected':''}>Caixa Fixo</option>
                <option value="volante" ${item.tipo==='volante'?'selected':''}>Caixa Volante</option>
            </select>
        </div>
        <div class="campo"><label>Dias</label><div style="margin-top:5px">${diasChecks}</div></div>
    `;
    abrirModal('Editar Caixa');
}

// Estender salvarEdicao para incluir caixas
const _salvarEdicaoOriginal = salvarEdicao;
salvarEdicao = function() {
    if (edicaoAtual && edicaoAtual.tipo === 'caixa') {
        const item = (dados.caixas || []).find(c => String(c.id) === String(edicaoAtual.id));
        if (item) {
            const novoNome = document.getElementById('editNome').value.trim() || item.nome;
            const novoTelefone = document.getElementById('editTelefone').value.trim();
            const novoTipo = document.getElementById('editTipoCaixa').value;
            const novosDias = [];
            if (document.getElementById('editCaixaDia1').checked) novosDias.push(1);
            if (document.getElementById('editCaixaDia2').checked) novosDias.push(2);
            if (document.getElementById('editCaixaDia3').checked) novosDias.push(3);
            if (document.getElementById('editCaixaDia4').checked) novosDias.push(4);

            // Validar limite nos novos dias
            if (!dados.configCaixas) dados.configCaixas = { fixos: 0, volantes: 0 };
            const limite = novoTipo === 'fixo' ? (dados.configCaixas.fixos || 0) : (dados.configCaixas.volantes || 0);
            if (limite > 0) {
                const diasLotados = [];
                novosDias.forEach(dia => {
                    // Contar excluindo a própria pessoa
                    const jaCadastrados = (dados.caixas || []).filter(c => String(c.id) !== String(item.id) && c.tipo === novoTipo && c.dias.includes(dia)).length;
                    if (jaCadastrados >= limite) {
                        diasLotados.push(DIAS_CAIXAS[dia].split(' ')[0]);
                    }
                });
                if (diasLotados.length > 0) {
                    alert(`Limite de caixas ${novoTipo === 'fixo' ? 'fixos' : 'volantes'} atingido nos dias: ${diasLotados.join(', ')}.\n\nMáximo: ${limite} por dia.`);
                    return;
                }
            }

            atualizarItem('caixas', edicaoAtual.id, {
                nome: novoNome, telefone: novoTelefone, tipo: novoTipo, dias: novosDias
            });
        }
        fecharModal();
        renderizarCaixas();
        atualizarDiasDisponiveis();
        return;
    }
    _salvarEdicaoOriginal();
};

function renderizarCaixas() {
    if (!dados.caixas) dados.caixas = [];
    if (!dados.configCaixas) dados.configCaixas = { fixos: 0, volantes: 0 };

    // Carregar config
    const cfgFixos = document.getElementById('cfgCaixasFixos');
    const cfgVolantes = document.getElementById('cfgCaixasVolantes');
    if (cfgFixos) cfgFixos.value = dados.configCaixas.fixos || 0;
    if (cfgVolantes) cfgVolantes.value = dados.configCaixas.volantes || 0;

    const totalFixos = dados.configCaixas.fixos || 0;
    const totalVolantes = dados.configCaixas.volantes || 0;
    const totalNecessarios = totalFixos + totalVolantes;

    // Resumo
    const resumoEl = document.getElementById('resumoCaixas');
    if (resumoEl) {
        const totalCadastrados = dados.caixas.length;
        const fixosCad = dados.caixas.filter(c => c.tipo === 'fixo').length;
        const volantesCad = dados.caixas.filter(c => c.tipo === 'volante').length;
        resumoEl.innerHTML = `
            <div class="item neutro"><span>Necessários/dia</span><strong>${totalNecessarios}</strong></div>
            <div class="item positivo"><span>Cadastrados</span><strong>${totalCadastrados}</strong></div>
            <div class="item neutro"><span>Fixos</span><strong>${fixosCad}</strong></div>
            <div class="item neutro"><span>Volantes</span><strong>${volantesCad}</strong></div>
        `;
    }

    // Visualização por dia - formato escala
    const porDiaEl = document.getElementById('caixasPorDia');
    if (porDiaEl) {
        // Montar dados por dia
        const escalaDias = [1,2,3,4].map(dia => {
            const fixos = dados.caixas.filter(c => c.tipo === 'fixo' && c.dias.includes(dia)).sort((a,b) => a.nome.localeCompare(b.nome));
            const volantes = dados.caixas.filter(c => c.tipo === 'volante' && c.dias.includes(dia)).sort((a,b) => a.nome.localeCompare(b.nome));
            return { dia, fixos, volantes };
        });

        const maxFixos = Math.max(...escalaDias.map(d => d.fixos.length), 1);
        const maxVolantes = Math.max(...escalaDias.map(d => d.volantes.length), 1);

        let html = '<div class="tabela-box" style="overflow-x:auto"><h4 style="text-align:center;font-size:1.1rem">ESCALA DE CAIXAS - FESTA DA PADROEIRA 2026</h4>';
        html += '<table style="width:100%;border-collapse:collapse;font-size:0.82rem">';
        
        // Cabeçalho dos dias
        html += '<thead><tr style="background:rgba(91,192,235,0.2)">';
        html += '<th style="width:30px;padding:8px;border:1px solid rgba(255,255,255,0.15)"></th>';
        [1,2,3,4].forEach(dia => {
            html += `<th style="padding:8px;text-align:center;border:1px solid rgba(255,255,255,0.15);color:var(--cor-amarelo)">${DIAS_CAIXAS[dia]}</th>`;
        });
        html += '</tr></thead><tbody>';

        // Linha "Caixa Fixo" (título)
        html += '<tr style="background:rgba(212,160,23,0.15)"><td style="padding:6px;border:1px solid rgba(255,255,255,0.1);font-weight:700;text-align:center" colspan="5">Caixa Fixo</td></tr>';

        // Linhas de fixos
        for (let i = 0; i < maxFixos; i++) {
            html += '<tr>';
            html += `<td style="padding:4px 8px;border:1px solid rgba(255,255,255,0.08);text-align:center;color:var(--cor-amarelo);font-weight:700;font-size:0.75rem">${i+1}</td>`;
            [1,2,3,4].forEach((dia, di) => {
                const pessoa = escalaDias[di].fixos[i];
                html += `<td style="padding:4px 8px;border:1px solid rgba(255,255,255,0.08);color:var(--cor-palha)">${pessoa ? pessoa.nome : ''}</td>`;
            });
            html += '</tr>';
        }

        // Linha "Caixa Volante" (título)
        html += '<tr style="background:rgba(129,199,132,0.15)"><td style="padding:6px;border:1px solid rgba(255,255,255,0.1);font-weight:700;text-align:center" colspan="5">Caixa Volante</td></tr>';

        // Linhas de volantes (numeração continua)
        for (let i = 0; i < maxVolantes; i++) {
            html += '<tr>';
            html += `<td style="padding:4px 8px;border:1px solid rgba(255,255,255,0.08);text-align:center;color:#81c784;font-weight:700;font-size:0.75rem">${maxFixos + i + 1}</td>`;
            [1,2,3,4].forEach((dia, di) => {
                const pessoa = escalaDias[di].volantes[i];
                html += `<td style="padding:4px 8px;border:1px solid rgba(255,255,255,0.08);color:var(--cor-palha)">${pessoa ? pessoa.nome : ''}</td>`;
            });
            html += '</tr>';
        }

        html += '</tbody></table></div>';
        porDiaEl.innerHTML = html;
    }

    // Tabela completa
    const tbody = document.querySelector('#tabelaCaixas tbody');
    if (tbody) {
        const lista = [...dados.caixas].sort((a,b) => a.nome.localeCompare(b.nome));
        tbody.innerHTML = lista.map(c => {
            const diasStr = c.dias.map(d => DIAS_CAIXAS[d].split(' ')[0]).join(', ');
            const tipoBadge = c.tipo === 'fixo'
                ? '<span style="background:var(--cor-amarelo);color:#1a1a2e;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:700">Fixo</span>'
                : '<span style="background:#81c784;color:#1a1a2e;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:700">Volante</span>';
            return `<tr>
                <td style="font-weight:700">${c.nome}</td>
                <td>${c.telefone || '-'}</td>
                <td>${tipoBadge}</td>
                <td style="font-size:0.78rem">${diasStr}</td>
                <td>
                    <button class="btn-edit" onclick="editarCaixa(${c.id})">✏️</button>
                    <button class="btn-delete" onclick="removerCaixa(${c.id})">X</button>
                </td>
            </tr>`;
        }).join('');
    }
}

function exportarEscalaPDF() {
    if (!dados.caixas || dados.caixas.length === 0) { alert('Nenhum caixa cadastrado'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;
    const cfg = getConfigEvento();

    // Título
    doc.setFontSize(16); doc.setTextColor(91, 192, 235);
    doc.text('ESCALA DE CAIXAS', pageW / 2, y, { align: 'center' }); y += 7;
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`${cfg.nomeEvento} - Edição ${cfg.edicao}`, pageW / 2, y, { align: 'center' }); y += 6;
    doc.setFontSize(10);
    doc.text(cfg.datas, pageW / 2, y, { align: 'center' }); y += 12;

    // Montar dados por dia
    const escalaDias = [1,2,3,4].map(dia => {
        const fixos = dados.caixas.filter(c => c.tipo === 'fixo' && c.dias.includes(dia)).sort((a,b) => a.nome.localeCompare(b.nome));
        const volantes = dados.caixas.filter(c => c.tipo === 'volante' && c.dias.includes(dia)).sort((a,b) => a.nome.localeCompare(b.nome));
        return { dia, fixos, volantes };
    });

    const maxFixos = Math.max(...escalaDias.map(d => d.fixos.length), 1);
    const maxVolantes = Math.max(...escalaDias.map(d => d.volantes.length), 1);

    // Montar tabela com cabeçalho por dia e separação fixo/volante
    const head = [['#', DIAS_CAIXAS[1], DIAS_CAIXAS[2], DIAS_CAIXAS[3], DIAS_CAIXAS[4]]];
    const body = [];

    // Título Fixo
    body.push([{ content: 'CAIXA FIXO', colSpan: 5, styles: { halign: 'center', fillColor: [212, 160, 23], textColor: [30, 30, 30], fontStyle: 'bold' } }]);

    // Linhas fixos
    for (let i = 0; i < maxFixos; i++) {
        body.push([
            (i + 1).toString(),
            escalaDias[0].fixos[i] ? escalaDias[0].fixos[i].nome : '',
            escalaDias[1].fixos[i] ? escalaDias[1].fixos[i].nome : '',
            escalaDias[2].fixos[i] ? escalaDias[2].fixos[i].nome : '',
            escalaDias[3].fixos[i] ? escalaDias[3].fixos[i].nome : ''
        ]);
    }

    // Título Volante
    body.push([{ content: 'CAIXA VOLANTE', colSpan: 5, styles: { halign: 'center', fillColor: [129, 199, 132], textColor: [30, 30, 30], fontStyle: 'bold' } }]);

    // Linhas volantes
    for (let i = 0; i < maxVolantes; i++) {
        body.push([
            (maxFixos + i + 1).toString(),
            escalaDias[0].volantes[i] ? escalaDias[0].volantes[i].nome : '',
            escalaDias[1].volantes[i] ? escalaDias[1].volantes[i].nome : '',
            escalaDias[2].volantes[i] ? escalaDias[2].volantes[i].nome : '',
            escalaDias[3].volantes[i] ? escalaDias[3].volantes[i].nome : ''
        ]);
    }

    doc.autoTable({
        startY: y,
        theme: 'grid',
        head: head,
        body: body,
        headStyles: { fillColor: [91, 192, 235], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' } },
        styles: { cellPadding: 3 }
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text(`Total: ${dados.caixas.length} pessoas | Fixos: ${dados.caixas.filter(c=>c.tipo==='fixo').length} | Volantes: ${dados.caixas.filter(c=>c.tipo==='volante').length}`, 14, y);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - 14, y, { align: 'right' });

    doc.save('escala_caixas_padroeira.pdf');
    mostrarToast('📄 Escala exportada em PDF!');
}

// ===== DOAÇÕES DE ENTRADA (DINHEIRO) =====
function lancarDoacaoEntrada() {
    const nome = document.getElementById('doacaoNome').value.trim();
    const valor = parseFloat(document.getElementById('doacaoValor').value);
    const tipo = document.getElementById('doacaoTipo').value;
    const data = document.getElementById('doacaoData').value || '';
    const obs = document.getElementById('doacaoObs').value.trim();
    const recebido = document.getElementById('doacaoRecebido').checked;
    if (!nome || isNaN(valor) || valor <= 0) { alert('Preencha o nome e valor da doação'); return; }

    adicionarItem('doacoesEntrada', { id: Date.now(), nome, valor, tipo, data, obs, recebido });
    document.getElementById('doacaoNome').value = '';
    document.getElementById('doacaoValor').value = '';
    document.getElementById('doacaoObs').value = '';
    renderizarDoacoesEntrada();
    renderizarTudo();
    mostrarToast(`✅ Doação de ${nome} - ${R$(valor)} lançada!`);
    registrarAcao(`Doação: ${nome} R$ ${fmt(valor)}`);
}

function removerDoacaoEntrada(id) {
    if (!dados.doacoesEntrada) return;
    removerItem('doacoesEntrada', id);
    renderizarDoacoesEntrada();
    renderizarTudo();
}

function toggleDoacaoRecebida(id) {
    if (!dados.doacoesEntrada) return;
    const item = dados.doacoesEntrada.find(d => String(d.id) === String(id));
    if (item) { atualizarItem('doacoesEntrada', id, { recebido: !item.recebido }); renderizarDoacoesEntrada(); renderizarTudo(); }
}

function renderizarDoacoesEntrada() {
    if (!dados.doacoesEntrada) dados.doacoesEntrada = [];
    const tbody = document.querySelector('#tabelaDoacoesEntrada tbody');
    if (!tbody) return;

    const TIPOS = { pessoa: '👤 Pessoa', empresa: '🏢 Empresa', saldo: '📦 Saldo Anterior', outro: '📌 Outro' };
    const lista = [...dados.doacoesEntrada].sort((a, b) => a.nome.localeCompare(b.nome));

    tbody.innerHTML = lista.map(d => {
        const dataFmt = d.data ? d.data.split('-').reverse().join('/') : '-';
        return `<tr>
            <td style="font-weight:700">${d.nome}</td>
            <td><span class="badge-categoria">${TIPOS[d.tipo] || d.tipo}</span></td>
            <td style="color:#66bb6a;font-weight:700">R$ ${fmt(d.valor)}</td>
            <td>${dataFmt}</td>
            <td>${d.obs || '-'}</td>
            <td><span class="${d.recebido ? 'badge-pago' : 'badge-pendente'}" onclick="toggleDoacaoRecebida(${d.id})">${d.recebido ? 'Recebido' : 'Pendente'}</span></td>
            <td><button class="btn-delete" onclick="confirmarExclusao('Remover esta doação?', () => removerDoacaoEntrada(${d.id}))">X</button></td>
        </tr>`;
    }).join('');

    // Resumo
    const total = dados.doacoesEntrada.reduce((s, d) => s + d.valor, 0);
    const recebido = dados.doacoesEntrada.filter(d => d.recebido).reduce((s, d) => s + d.valor, 0);
    const pendente = total - recebido;
    const qtd = dados.doacoesEntrada.length;

    const resumoEl = document.getElementById('resumoDoacoesEntrada');
    if (resumoEl) {
        resumoEl.innerHTML = `
            <div class="item positivo"><span>Total Doações</span><strong>${R$(total)}</strong></div>
            <div class="item positivo"><span>Recebido</span><strong>${R$(recebido)}</strong></div>
            <div class="item negativo"><span>Pendente</span><strong>${R$(pendente)}</strong></div>
            <div class="item neutro"><span>Doadores</span><strong>${qtd}</strong></div>
        `;
    }
}

// ===== ITENS NECESSÁRIOS POR BARRACA =====
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
    renderizarNecessidades();
    registrarAcao(`Necessidade: ${item} → ${barraca}`);
}

function removerNecessidade(id) {
    if (!dados.necessidades) return;
    removerItem('necessidades', id);
    renderizarNecessidades();
}

function toggleConseguido(id) {
    if (!dados.necessidades) return;
    const item = dados.necessidades.find(n => String(n.id) === String(id));
    if (!item) return;
    // Alterna entre "tudo conseguido" e "nada": ao marcar, iguala qtdConseguida à qtd
    const marcar = !item.conseguido;
    atualizarItem('necessidades', id, { conseguido: marcar, qtdConseguida: marcar ? (item.qtd || 0) : 0 });
    renderizarNecessidades();
}

// Lançar (somar) uma quantidade recebida/conseguida ao item
function lancarConseguido(id) {
    if (!dados.necessidades) return;
    const item = dados.necessidades.find(n => String(n.id) === String(id));
    if (!item) return;
    const resp = prompt(`Lançar quantidade recebida de "${item.item}"\n(Meta: ${item.qtd} ${item.unidade} | Já conseguido: ${item.qtdConseguida||0} ${item.unidade})\n\nDigite a quantidade que chegou agora:`, '');
    if (resp === null) return;
    const add = parseFloat(String(resp).replace(',', '.'));
    if (isNaN(add) || add === 0) { alert('Digite um número válido.'); return; }
    let novo = (item.qtdConseguida || 0) + add;
    if (novo < 0) novo = 0;
    atualizarItem('necessidades', id, { qtdConseguida: novo, conseguido: novo >= (item.qtd || 0) });
    renderizarNecessidades();
    mostrarToast(`✅ Lançado ${add} ${item.unidade} de ${item.item}`);
}

function renderizarNecessidades() {
    if (!dados.necessidades) dados.necessidades = [];
    const container = document.getElementById('listaNecessidades');
    if (!container) return;

    // Atualizar select de barracas
    const select = document.getElementById('necessidadeBarraca');
    if (select) {
        const opts = '<option value="geral">Geral (evento todo)</option>' + BARRACAS.map(b =>
            `<option value="${b}">${(NOMES_BARRACAS[b]||b).replace(/^.{2}\s?/,'')}</option>`
        ).join('');
        select.innerHTML = opts;
    }

    // Agrupar por barraca
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

    // Ordenar: geral primeiro, depois por nome de barraca
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
                    <button class="btn-delete" onclick="confirmarExclusao('Remover este item?', () => removerNecessidade(${n.id}))">X</button>
                </td>
            </tr>`;
        });
        html += '</tbody></table></div>';
    });

    container.innerHTML = html;
}

function editarNecessidade(id) {
    const item = (dados.necessidades || []).find(n => String(n.id) === String(id));
    if (!item) return;
    edicaoAtual = { tipo: 'necessidade', id };
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
    abrirModal('Editar Item Necessário');
}

// Estender salvarEdicao para necessidades
const _salvarEdicaoAntesNecessidade = salvarEdicao;
salvarEdicao = function() {
    if (edicaoAtual && edicaoAtual.tipo === 'necessidade') {
        const qtd = parseFloat(document.getElementById('editNecQtd').value) || 0;
        const conseguida = parseFloat(document.getElementById('editNecConseguida').value) || 0;
        atualizarItem('necessidades', edicaoAtual.id, {
            barraca: document.getElementById('editNecBarraca').value,
            item: document.getElementById('editNecItem').value.trim(),
            qtd,
            unidade: document.getElementById('editNecUnidade').value,
            qtdConseguida: conseguida,
            obs: document.getElementById('editNecObs').value.trim(),
            conseguido: conseguida >= qtd
        });
        fecharModal();
        renderizarNecessidades();
        return;
    }
    _salvarEdicaoAntesNecessidade();
};

function exportarNecessidadesPDF() {
    if (!dados.necessidades || dados.necessidades.length === 0) { alert('Nenhum item cadastrado'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;
    const cfg = getConfigEvento();

    doc.setFontSize(16); doc.setTextColor(91, 192, 235);
    doc.text('LISTA DE ITENS NECESSÁRIOS', pageW / 2, y, { align: 'center' }); y += 8;
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text(`${cfg.nomeEvento} - Edição ${cfg.edicao}`, pageW / 2, y, { align: 'center' }); y += 6;
    doc.text(cfg.datas, pageW / 2, y, { align: 'center' }); y += 10;

    doc.setFontSize(9); doc.setTextColor(100);
    const totalItens = dados.necessidades.length;
    const totalConseguidos = dados.necessidades.filter(n => n.conseguido).length;
    doc.text(`Total: ${totalItens} itens | Conseguidos: ${totalConseguidos} | Pendentes: ${totalItens - totalConseguidos}`, 14, y); y += 10;
    doc.setTextColor(0);

    // Agrupar por barraca
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
            startY: y, theme: 'grid',
            headStyles: { fillColor: [91, 192, 235] },
            styles: { overflow: 'linebreak', cellPadding: 2, fontSize: 9 },
            columnStyles: { 0: { cellWidth: 62 }, 1: { cellWidth: 26 }, 2: { cellWidth: 26 }, 3: { cellWidth: 24 }, 4: { cellWidth: 34 } },
            head: [[nome, 'Meta', 'Conseguido', 'Falta', 'Obs']],
            body: itens.map(n => {
                const conseguida = n.qtdConseguida || 0;
                const falta = Math.max(0, (n.qtd || 0) - conseguida);
                return [n.item, `${n.qtd} ${n.unidade}`, `${conseguida} ${n.unidade}`, falta === 0 ? 'OK' : `${falta} ${n.unidade}`, n.obs || '-'];
            })
        });
        y = doc.lastAutoTable.finalY + 8;
    });

    doc.save('lista_necessidades_padroeira.pdf');
    alert('Lista exportada em PDF!');
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

// Formata a quantidade removendo o ".0" desnecessário
function fmtQtdCard(q) {
    const n = Number(q) || 0;
    return Number.isInteger(n) ? String(n) : String(n).replace('.', ',');
}

// Exporta um CARD (estilo cartaz) por barraca, no visual da Festa da Padroeira
function exportarNecessidadesCards() {
    if (!dados.necessidades || dados.necessidades.length === 0) { alert('Nenhum item cadastrado'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();   // ~210
    const pageH = doc.internal.pageSize.getHeight();  // ~297

    // Paleta Festa da Padroeira (cartaz)
    const AZUL_ESCURO = [13, 42, 92];
    const AZUL_MEDIO = [30, 90, 168];
    const DOURADO = [212, 165, 58];
    const CREME = [247, 240, 222];
    const TEXTO_ESCURO = [20, 40, 80];

    // Agrupar por barraca
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
        const nome = (key === 'geral' ? 'Geral' : (NOMES_BARRACAS[key]||key)).replace(/^.{2}\s?/,'').toUpperCase();
        const itens = agrupado[key];

        // Fundo azul escuro (página inteira)
        doc.setFillColor(...AZUL_ESCURO);
        doc.rect(0, 0, pageW, pageH, 'F');
        // Faixa superior azul médio
        doc.setFillColor(...AZUL_MEDIO);
        doc.rect(0, 0, pageW, 62, 'F');

        // Título
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DOURADO);
        doc.setFontSize(20);
        doc.text('MATERIAIS E INSUMOS', pageW / 2, 26, { align: 'center' });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(30);
        // quebra nome grande se precisar
        const nomeLinhas = doc.splitTextToSize(nome, pageW - 30);
        doc.text(nomeLinhas, pageW / 2, 44, { align: 'center' });

        // Caixa creme com os itens
        const boxX = 18, boxTop = 78, boxW = pageW - 36;
        const linhas = itens.map(n => {
            const q = fmtQtdCard(n.qtd);
            const u = unidadeExtenso(n.unidade, n.qtd);
            const unidadeTxt = u ? `${u} ` : '';
            return `${q} ${unidadeTxt}- ${n.item}`;
        });

        // Calcular altura necessária (texto grande, com wrap)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        const larguraTexto = boxW - 20;
        let linhasWrap = [];
        linhas.forEach((l, i) => {
            const terminador = i === linhas.length - 1 ? '.' : ';';
            const partes = doc.splitTextToSize(l + terminador, larguraTexto);
            linhasWrap.push(partes);
        });
        const alturaLinha = 9;
        const totalLinhasVisuais = linhasWrap.reduce((s, p) => s + p.length, 0);
        const boxH = Math.min(pageH - boxTop - 30, 24 + totalLinhasVisuais * alturaLinha);

        // Fundo da caixa
        doc.setFillColor(...CREME);
        doc.roundedRect(boxX, boxTop, boxW, boxH, 6, 6, 'F');

        // Escrever itens
        doc.setTextColor(...TEXTO_ESCURO);
        let ty = boxTop + 16;
        linhasWrap.forEach(partes => {
            partes.forEach(p => {
                doc.text(p, boxX + 10, ty);
                ty += alturaLinha;
            });
        });

        // Rodapé
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DOURADO);
        doc.setFontSize(13);
        doc.text('FESTA DA PADROEIRA 2026', pageW / 2, pageH - 16, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(220, 225, 235);
        doc.setFontSize(9);
        doc.text('Basílica Menor Nossa Senhora da Conceição Aparecida', pageW / 2, pageH - 9, { align: 'center' });
    });

    doc.save('materiais_insumos_padroeira.pdf');
    if (typeof mostrarToast === 'function') mostrarToast('📄 Cards de materiais exportados!');
}

// ===== VENDA DE CAMISETAS =====
let filtroCamisa = 'todos';
let edicaoCamisaId = null;

function precoPorTipoCamisa(tipo) {
    const cfg = dados.configCamisetas || { precoTrabalhador: 0, precoPublico: 0 };
    return tipo === 'trabalhador' ? (cfg.precoTrabalhador || 0) : (cfg.precoPublico || 0);
}

function custoPorTipoCamisa(tipo) {
    const cfg = dados.configCamisetas || { custoTrabalhador: 0, custoPublico: 0 };
    return tipo === 'trabalhador' ? (cfg.custoTrabalhador || 0) : (cfg.custoPublico || 0);
}

function salvarConfigCamisetas() {
    if (!dados.configCamisetas) dados.configCamisetas = {};
    dados.configCamisetas.precoTrabalhador = parseFloat(document.getElementById('cfgPrecoTrabalhador').value) || 0;
    dados.configCamisetas.precoPublico = parseFloat(document.getElementById('cfgPrecoPublico').value) || 0;
    dados.configCamisetas.custoTrabalhador = parseFloat(document.getElementById('cfgCustoTrabalhador').value) || 0;
    dados.configCamisetas.custoPublico = parseFloat(document.getElementById('cfgCustoPublico').value) || 0;
    salvarDados(dados);
    renderizarCamisetas();
    mostrarToast('Preços das camisetas salvos!');
}

function atualizarTamanhosCamiseta() {
    const modelagem = document.getElementById('camisaModelagem').value;
    const sel = document.getElementById('camisaTamanho');
    if (!sel) return;
    if (!modelagem || !TAMANHOS_CAMISETA[modelagem]) {
        sel.innerHTML = '<option value="">Tamanho...</option>';
        return;
    }
    sel.innerHTML = '<option value="">Tamanho...</option>' + TAMANHOS_CAMISETA[modelagem].map(x =>
        `<option value="${x.t}">${x.t} (${x.ref})</option>`
    ).join('');
}

function atualizarPrecoCamiseta() {
    const tipo = document.getElementById('camisaTipo').value;
    const info = document.getElementById('camisaPrecoInfo');
    if (!info) return;
    if (!tipo) { info.textContent = ''; return; }
    const preco = precoPorTipoCamisa(tipo);
    info.textContent = preco > 0 ? `Valor: ${R$(preco)}` : 'Valor: a definir (configure os preços acima)';
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
    if (!modelagem) { alert('Selecione a modelagem'); return; }
    if (!tamanho) { alert('Selecione o tamanho'); return; }

    const valor = precoPorTipoCamisa(tipo);
    adicionarItem('camisetas', { id: Date.now(), nome, telefone, tipo, modelagem, tamanho, valor, pago });

    document.getElementById('camisaNome').value = '';
    document.getElementById('camisaTelefone').value = '';
    document.getElementById('camisaTipo').value = '';
    document.getElementById('camisaModelagem').value = '';
    document.getElementById('camisaTamanho').innerHTML = '<option value="">Tamanho...</option>';
    document.getElementById('camisaPago').checked = true;
    document.getElementById('camisaPrecoInfo').textContent = '';

    renderizarCamisetas();
    mostrarToast(`✅ Camiseta de ${nome} registrada!`);
    registrarAcao(`Camiseta: ${nome} (${tipo})`);
}

function togglePagoCamiseta(id) {
    const item = (dados.camisetas || []).find(c => String(c.id) === String(id));
    if (item) { atualizarItem('camisetas', id, { pago: !item.pago }); renderizarCamisetas(); }
}

function removerCamiseta(id) {
    if (!confirm('Remover esta venda de camiseta?')) return;
    removerItem('camisetas', id);
    renderizarCamisetas();
}

function filtrarCamisetas(f) {
    filtroCamisa = f;
    document.querySelectorAll('[data-filtrocamisa]').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-filtrocamisa="${f}"]`);
    if (btn) btn.classList.add('active');
    renderizarCamisetas();
}

function editarCamiseta(id) {
    const item = (dados.camisetas || []).find(c => String(c.id) === String(id));
    if (!item) return;
    edicaoAtual = { tipo: 'camiseta', id };
    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Nome</label><input type="text" id="editCamisaNome" value="${item.nome}"></div>
        <div class="campo"><label>Telefone</label><input type="tel" id="editCamisaTelefone" value="${item.telefone || ''}"></div>
        <div class="campo"><label>Tipo</label>
            <select id="editCamisaTipo">
                <option value="trabalhador" ${item.tipo==='trabalhador'?'selected':''}>Trabalhador</option>
                <option value="publico" ${item.tipo==='publico'?'selected':''}>Público em geral</option>
            </select>
        </div>
        <div class="campo"><label>Modelagem</label>
            <select id="editCamisaModelagem" onchange="atualizarTamanhoEditCamisa()">
                <option value="Baby Look" ${item.modelagem==='Baby Look'?'selected':''}>Baby Look</option>
                <option value="Casual" ${item.modelagem==='Casual'?'selected':''}>Casual</option>
            </select>
        </div>
        <div class="campo"><label>Tamanho</label>
            <select id="editCamisaTamanho">${(TAMANHOS_CAMISETA[item.modelagem]||[]).map(x => `<option value="${x.t}" ${x.t===item.tamanho?'selected':''}>${x.t} (${x.ref})</option>`).join('')}</select>
        </div>
        <div class="campo"><label>Valor R$ (edite para dar desconto)</label><input type="number" id="editCamisaValor" value="${item.valor || 0}" step="0.01" min="0"></div>
    `;
    abrirModal('Editar Venda de Camiseta');
}

function atualizarTamanhoEditCamisa() {
    const m = document.getElementById('editCamisaModelagem').value;
    const sel = document.getElementById('editCamisaTamanho');
    if (sel) sel.innerHTML = (TAMANHOS_CAMISETA[m] || []).map(x => `<option value="${x.t}">${x.t} (${x.ref})</option>`).join('');
}

// Estender salvarEdicao para camisetas
const _salvarEdicaoAntesCamiseta = salvarEdicao;
salvarEdicao = function() {
    if (edicaoAtual && edicaoAtual.tipo === 'camiseta') {
        const novoTipo = document.getElementById('editCamisaTipo').value;
        const valorDigitado = document.getElementById('editCamisaValor').value;
        atualizarItem('camisetas', edicaoAtual.id, {
            nome: document.getElementById('editCamisaNome').value.trim(),
            telefone: document.getElementById('editCamisaTelefone').value.trim(),
            tipo: novoTipo,
            modelagem: document.getElementById('editCamisaModelagem').value,
            tamanho: document.getElementById('editCamisaTamanho').value,
            valor: valorDigitado === '' ? 0 : parseFloat(valorDigitado) // valor manual (permite desconto)
        });
        fecharModal();
        renderizarCamisetas();
        return;
    }
    _salvarEdicaoAntesCamiseta();
};

function renderizarCamisetas() {
    if (!dados.camisetas) dados.camisetas = [];
    if (!dados.configCamisetas) dados.configCamisetas = { precoTrabalhador: 0, precoPublico: 0 };

    // Carregar config nos inputs
    const cfgT = document.getElementById('cfgPrecoTrabalhador');
    const cfgP = document.getElementById('cfgPrecoPublico');
    const cfgCT = document.getElementById('cfgCustoTrabalhador');
    const cfgCP = document.getElementById('cfgCustoPublico');
    if (cfgT && document.activeElement !== cfgT) cfgT.value = dados.configCamisetas.precoTrabalhador || '';
    if (cfgP && document.activeElement !== cfgP) cfgP.value = dados.configCamisetas.precoPublico || '';
    if (cfgCT && document.activeElement !== cfgCT) cfgCT.value = dados.configCamisetas.custoTrabalhador || '';
    if (cfgCP && document.activeElement !== cfgCP) cfgCP.value = dados.configCamisetas.custoPublico || '';

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
                <td>
                    <button class="btn-edit" onclick="editarCamiseta(${c.id})">✏️</button>
                    <button class="btn-delete" onclick="removerCamiseta(${c.id})">X</button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="8" style="text-align:center;opacity:0.5;padding:15px">Nenhuma camiseta registrada</td></tr>';
    }

    const todas = dados.camisetas;
    const totalTrab = todas.filter(c => c.tipo === 'trabalhador').length;
    const totalPub = todas.filter(c => c.tipo === 'publico').length;
    const totalValor = todas.reduce((s, c) => s + (c.valor||0), 0);
    const totalPago = todas.filter(c => c.pago).reduce((s, c) => s + (c.valor||0), 0);
    const totalCusto = todas.reduce((s, c) => s + custoPorTipoCamisa(c.tipo), 0);
    const lucroEstimado = totalValor - totalCusto;

    const resumoEl = document.getElementById('resumoCamisetas');
    if (resumoEl) {
        resumoEl.innerHTML = `
            <div class="item neutro"><span>Total Camisetas</span><strong>${todas.length}</strong></div>
            <div class="item neutro"><span>Trabalhador</span><strong>${totalTrab}</strong></div>
            <div class="item neutro"><span>Público</span><strong>${totalPub}</strong></div>
            <div class="item positivo"><span>Valor Total (venda)</span><strong>${R$(totalValor)}</strong></div>
            <div class="item positivo"><span>Recebido</span><strong>${R$(totalPago)}</strong></div>
            <div class="item negativo"><span>A receber</span><strong>${R$(totalValor - totalPago)}</strong></div>
            <div class="item negativo"><span>Custo Total</span><strong>${R$(totalCusto)}</strong></div>
            <div class="item ${lucroEstimado >= 0 ? 'positivo' : 'negativo'}"><span>Lucro Estimado</span><strong>${R$(lucroEstimado)}</strong></div>
        `;
    }

    renderizarQtdPorTamanho();
}

// Quantidade vendida por tamanho (separado por modelagem)
function renderizarQtdPorTamanho() {
    const el = document.getElementById('camisetasPorTamanho');
    if (!el) return;
    const todas = dados.camisetas || [];
    if (todas.length === 0) { el.innerHTML = ''; return; }

    let html = '';
    ['Baby Look', 'Casual'].forEach(modelagem => {
        const daModelagem = todas.filter(c => c.modelagem === modelagem);
        if (daModelagem.length === 0) return;
        // Ordem dos tamanhos conforme a tabela
        const ordem = (TAMANHOS_CAMISETA[modelagem] || []).map(x => x.t);
        const contagem = {};
        daModelagem.forEach(c => { contagem[c.tamanho] = (contagem[c.tamanho] || 0) + 1; });
        const tamanhosPresentes = ordem.filter(t => contagem[t]);
        html += `<div class="tabela-box" style="margin-bottom:12px">
            <h4>${modelagem} — ${daModelagem.length} camiseta${daModelagem.length>1?'s':''}</h4>
            <div style="display:flex;flex-wrap:wrap;gap:8px">`;
        tamanhosPresentes.forEach(t => {
            html += `<span style="background:rgba(91,192,235,0.15);border:1px solid rgba(91,192,235,0.4);border-radius:8px;padding:6px 12px;font-size:0.9rem"><strong style="color:var(--cor-amarelo)">${t}</strong>: ${contagem[t]}</span>`;
        });
        html += '</div></div>';
    });
    el.innerHTML = html;
}

function exportarCamisetasPDF() {
    const lista = dados.camisetas || [];
    if (lista.length === 0) { alert('Nenhuma camiseta registrada'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;
    const cfg = getConfigEvento();

    doc.setFontSize(16); doc.setTextColor(91, 192, 235);
    doc.text('VENDA DE CAMISETAS', pageW / 2, y, { align: 'center' }); y += 8;
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text(`${cfg.nomeEvento} - Edição ${cfg.edicao}`, pageW / 2, y, { align: 'center' }); y += 6;
    doc.text(cfg.datas, pageW / 2, y, { align: 'center' }); y += 12;

    const TIPO_LABEL = { trabalhador: 'Trabalhador', publico: 'Público' };
    const ordenada = [...lista].sort((a,b) => (a.nome||'').localeCompare(b.nome||''));
    doc.autoTable({
        startY: y, theme: 'grid',
        headStyles: { fillColor: [91, 192, 235], textColor: [255,255,255], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        styles: { overflow: 'linebreak', cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 28 }, 2: { cellWidth: 24 }, 3: { cellWidth: 24 }, 4: { cellWidth: 16 }, 5: { cellWidth: 22 }, 6: { cellWidth: 22 } },
        head: [['Nome', 'Telefone', 'Tipo', 'Modelagem', 'Tam.', 'Valor', 'Status']],
        body: ordenada.map(c => [
            c.nome || '-', c.telefone || '-', TIPO_LABEL[c.tipo] || c.tipo,
            c.modelagem || '-', c.tamanho || '-',
            (c.valor||0) > 0 ? 'R$ ' + fmt(c.valor) : '-',
            c.pago ? 'Pago' : 'Pendente'
        ])
    });
    y = doc.lastAutoTable.finalY + 8;
    const totalValor = lista.reduce((s,c) => s + (c.valor||0), 0);
    const totalPago = lista.filter(c => c.pago).reduce((s,c) => s + (c.valor||0), 0);
    const totalCusto = lista.reduce((s,c) => s + custoPorTipoCamisa(c.tipo), 0);
    const lucroEstimado = totalValor - totalCusto;
    doc.setFontSize(9); doc.setTextColor(80);
    const linha1 = `Total: ${lista.length} camisetas | Trabalhador: ${lista.filter(c=>c.tipo==='trabalhador').length} | Público: ${lista.filter(c=>c.tipo==='publico').length}`;
    const linha2 = `Valor total (venda): R$ ${fmt(totalValor)} | Recebido: R$ ${fmt(totalPago)} | A receber: R$ ${fmt(totalValor-totalPago)}`;
    const linha3 = `Custo total: R$ ${fmt(totalCusto)} | Lucro estimado: R$ ${fmt(lucroEstimado)}`;
    doc.text(linha1, 14, y); y += 5;
    doc.text(linha2, 14, y); y += 5;
    doc.text(linha3, 14, y);

    doc.save('camisetas_padroeira.pdf');
    mostrarToast('📄 Lista de camisetas exportada!');
}

function exportarCamisetasCSV() {
    const lista = dados.camisetas || [];
    if (lista.length === 0) { alert('Nenhuma camiseta registrada'); return; }
    const TIPO_LABEL = { trabalhador: 'Trabalhador', publico: 'Público' };
    let csv = 'Nome;Telefone;Tipo;Modelagem;Tamanho;Valor;Status\n';
    [...lista].sort((a,b) => (a.nome||'').localeCompare(b.nome||'')).forEach(c => {
        csv += `${c.nome||''};${c.telefone||''};${TIPO_LABEL[c.tipo]||c.tipo};${c.modelagem||''};${c.tamanho||''};${(c.valor||0) > 0 ? fmt(c.valor) : ''};${c.pago ? 'Pago' : 'Pendente'}\n`;
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'camisetas_padroeira.csv';
    link.click();
    mostrarToast('📥 CSV exportado!');
}

// ===== DOADORES (BINGO/LEILÃO) =====
function lancarDoador() {
    const nome = document.getElementById('doadorNome').value.trim();
    const item = document.getElementById('doadorItem').value.trim();
    const valor = parseFloat(document.getElementById('doadorValor').value) || 0;
    const obs = document.getElementById('doadorObs').value.trim();
    if (!nome || !item) { alert('Preencha o nome do doador e o item doado'); return; }

    adicionarItem('doadores', { id: Date.now(), nome, item, valor, obs });
    document.getElementById('doadorNome').value = '';
    document.getElementById('doadorItem').value = '';
    document.getElementById('doadorValor').value = '';
    document.getElementById('doadorObs').value = '';
    renderizarDoadores();
    registrarAcao(`Doador: ${nome} - ${item}`);
}

function removerDoador(id) {
    if (!dados.doadores) return;
    removerItem('doadores', id);
    renderizarDoadores();
}

function renderizarDoadores() {
    if (!dados.doadores) dados.doadores = [];
    const busca = (document.getElementById('buscaDoador')?.value || '').toLowerCase();
    let lista = [...dados.doadores].sort((a,b) => a.nome.localeCompare(b.nome) || a.item.localeCompare(b.item));
    if (busca) lista = lista.filter(d => d.nome.toLowerCase().includes(busca) || d.item.toLowerCase().includes(busca));

    const tbody = document.querySelector('#tabelaDoadores tbody');
    if (!tbody) return;

    // Agrupar por doador para exibição
    const agrupado = {};
    lista.forEach(d => {
        if (!agrupado[d.nome]) agrupado[d.nome] = [];
        agrupado[d.nome].push(d);
    });

    let html = '';
    Object.entries(agrupado).sort((a,b) => a[0].localeCompare(b[0])).forEach(([nome, itens]) => {
        itens.forEach((d, i) => {
            html += `<tr${i === 0 ? ' style="border-top:2px solid rgba(245,222,179,0.2)"' : ''}>
                <td style="font-weight:700">${i === 0 ? nome : ''}</td>
                <td>${d.item}</td>
                <td>${d.valor > 0 ? R$(d.valor) : '-'}</td>
                <td>${d.obs || '-'}</td>
                <td>
                    <button class="btn-edit" onclick="editarDoador(${d.id})">✏️</button>
                    <button class="btn-delete" onclick="confirmarExclusao('Remover esta doação?', () => removerDoador(${d.id}))">X</button>
                </td>
            </tr>`;
        });
    });
    tbody.innerHTML = html;

    // Resumo
    const total = dados.doadores.reduce((s,d) => s + (d.valor || 0), 0);
    const qtdItens = dados.doadores.length;
    const qtdDoadores = Object.keys(agrupado).length;

    document.getElementById('resumoDoadores').innerHTML = `
        <div class="item doacao"><span>Valor Total Estimado</span><strong>${R$(total)}</strong></div>
        <div class="item neutro"><span>Itens Doados</span><strong>${qtdItens}</strong></div>
        <div class="item neutro"><span>Doadores</span><strong>${qtdDoadores}</strong></div>
    `;

    // Atualizar datalist com nomes únicos (autocomplete)
    const datalist = document.getElementById('listaDoadoresExistentes');
    if (datalist) {
        const nomesUnicos = [...new Set(dados.doadores.map(d => d.nome))].sort();
        datalist.innerHTML = nomesUnicos.map(n => `<option value="${n}">`).join('');
    }
}

function editarDoador(id) {
    if (!dados.doadores) return;
    const item = dados.doadores.find(d => String(d.id) === String(id));
    if (!item) return;
    edicaoAtual = { tipo: 'doador', id };

    document.getElementById('modalConteudo').innerHTML = `
        <div class="campo"><label>Doador</label><input type="text" id="editNome" value="${item.nome}"></div>
        <div class="campo"><label>Item Doado</label><input type="text" id="editItem" value="${item.item}"></div>
        <div class="campo"><label>Valor Estimado R$</label><input type="number" id="editValor" value="${item.valor || 0}" step="0.01"></div>
        <div class="campo"><label>Observação</label><input type="text" id="editObs" value="${item.obs || ''}"></div>
    `;
    abrirModal('Editar Doador');
}

// ===== NAVEGAÇÃO VIA CARD =====
function navegarPara(secao) {
    const btn = document.querySelector(`.menu-btn[data-section="${secao}"]`);
    if (btn) btn.click();
}

// ===== ENCERRAR EDIÇÃO =====
function encerrarEdicao() {
    if (!confirm('Você está prestes a ENCERRAR a edição 2026.\n\nIsso vai:\n1. Gerar um backup automático\n2. Salvar como "edição anterior" para comparativo\n3. Limpar vendas, despesas e patrocínios\n4. Manter configuração de barracas e produtos\n\nTem certeza?')) return;
    if (!confirm('ÚLTIMA CONFIRMAÇÃO: Todos os dados de vendas, despesas e patrocínios serão removidos. O backup será salvo automaticamente no seu computador.\n\nContinuar?')) return;

    // 1. Gerar backup
    exportarJSON();

    // 2. Salvar como edição anterior NO FIREBASE
    const edicaoAnterior = {
        edicao: '2026',
        encerradoEm: new Date().toISOString(),
        dados: JSON.parse(JSON.stringify(dados))
    };
    localStorage.setItem('arraia_edicao_anterior', JSON.stringify(edicaoAnterior));
    // Salvar no Firebase para acessar de qualquer lugar
    if (typeof db !== 'undefined') {
        db.ref('edicao_anterior').set(edicaoAnterior);
    }

    // 3. Limpar dados mantendo config
    const configBarracas = dados.configBarracas;
    const configProdutos = dados.configProdutos;
    const configEvento = dados.configEvento;
    const configCamisetas = dados.configCamisetas;
    const configCaixas = dados.configCaixas;
    dados = dadosVazios();
    dados.configBarracas = configBarracas;
    dados.configProdutos = configProdutos;
    dados.configEvento = configEvento;
    if (configCamisetas) dados.configCamisetas = configCamisetas;
    if (configCaixas) dados.configCaixas = configCaixas;
    salvarDados(dados);

    alert('Edição 2026 encerrada!\n\nBackup salvo no computador.\nDados limpos para próxima edição.\nA configuração de barracas e produtos foi mantida.');
    renderizarTudo();
    registrarAcao('Edição 2026 encerrada');
}

// ===== COMPARATIVO COM EDIÇÃO ANTERIOR =====
function importarEdicaoAnterior(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importado = JSON.parse(e.target.result);
            const dadosAnt = importado.dados || importado;
            if (dadosAnt && typeof dadosAnt === 'object') {
                const edicaoAnterior = {
                    edicao: importado.evento || importado.edicao || 'Anterior',
                    dados: dadosAnt
                };
                localStorage.setItem('arraia_edicao_anterior', JSON.stringify(edicaoAnterior));
                if (typeof db !== 'undefined') {
                    db.ref('edicao_anterior').set(edicaoAnterior);
                }
                alert('Edição anterior importada! O comparativo aparecerá no dashboard.');
                renderizarComparativoAnterior();
            }
        } catch (err) {
            alert('Erro ao importar. Verifique se é um backup válido.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function limparEdicaoAnterior() {
    if (!confirm('Remover o comparativo com edição anterior?')) return;
    localStorage.removeItem('arraia_edicao_anterior');
    if (typeof db !== 'undefined') db.ref('edicao_anterior').remove();
    document.getElementById('comparativoAnterior').style.display = 'none';
    document.getElementById('btnLimparAnterior').style.display = 'none';
    document.getElementById('comparativoStatus').innerHTML = '';
}

function renderizarComparativoAnterior() {
    let stored = localStorage.getItem('arraia_edicao_anterior');
    
    // Se não tem local, tenta buscar do Firebase
    if (!stored && typeof db !== 'undefined') {
        db.ref('edicao_anterior').once('value').then(snap => {
            const val = snap.val();
            if (val) {
                localStorage.setItem('arraia_edicao_anterior', JSON.stringify(val));
                _renderComparativo(val);
            }
        });
        return;
    }
    
    if (!stored) return;
    _renderComparativo(JSON.parse(stored));
}

function _renderComparativo(anterior) {
    const dadosAnt = anterior.dados;
    if (!dadosAnt) return;

    // Normalizar dados anteriores
    if (dadosAnt.patrocinadores && !Array.isArray(dadosAnt.patrocinadores)) dadosAnt.patrocinadores = Object.values(dadosAnt.patrocinadores);
    if (dadosAnt.despesas && !Array.isArray(dadosAnt.despesas)) dadosAnt.despesas = Object.values(dadosAnt.despesas);

    // Mostrar no config
    document.getElementById('btnLimparAnterior').style.display = 'inline-block';
    document.getElementById('comparativoStatus').innerHTML = `<p style="color:#66bb6a;font-size:0.85rem;margin-top:10px">✅ Edição "${anterior.edicao}" carregada para comparação</p>`;

    // Calcular totais anteriores
    let vendasAnt = 0, itensAnt = 0;
    BARRACAS.forEach(b => {
        if (dadosAnt[b] && dadosAnt[b].vendas) {
            const v = Array.isArray(dadosAnt[b].vendas) ? dadosAnt[b].vendas : Object.values(dadosAnt[b].vendas);
            vendasAnt += v.reduce((s, x) => s + (x.total || 0), 0);
            itensAnt += v.reduce((s, x) => s + (x.qtd || 0), 0);
        }
    });
    const despAnt = (dadosAnt.despesas || []).filter(d => !d.doacao).reduce((s, d) => s + d.valor, 0);
    const patrAnt = (dadosAnt.patrocinadores || []).filter(p => (p.tipo || 'dinheiro') === 'dinheiro').reduce((s, p) => s + (p.valor || 0), 0);
    const saldoAnt = vendasAnt + patrAnt - despAnt;

    // Calcular totais atuais
    let vendasAtual = 0, itensAtual = 0;
    BARRACAS.forEach(b => {
        if (dados[b]) {
            vendasAtual += dados[b].vendas.reduce((s, v) => s + v.total, 0);
            itensAtual += dados[b].vendas.reduce((s, v) => s + v.qtd, 0);
        }
    });
    const despAtual = (dados.despesas || []).filter(d => !d.doacao).reduce((s, d) => s + d.valor, 0);
    const patrAtual = (dados.patrocinadores || []).filter(p => (p.tipo || 'dinheiro') === 'dinheiro').reduce((s, p) => s + (p.valor || 0), 0);
    const saldoAtual = vendasAtual + patrAtual - despAtual;

    // Comparar
    function compara(atual, anterior) {
        if (anterior === 0) return { pct: atual > 0 ? '+100' : '0', cls: 'positivo', seta: '↑' };
        const diff = ((atual - anterior) / anterior * 100);
        return { pct: (diff >= 0 ? '+' : '') + diff.toFixed(0), cls: diff >= 0 ? 'positivo' : 'negativo', seta: diff >= 0 ? '↑' : '↓' };
    }

    const cVendas = compara(vendasAtual, vendasAnt);
    const cItens = compara(itensAtual, itensAnt);
    const cSaldo = compara(saldoAtual, saldoAnt);

    const container = document.getElementById('comparativoCards');
    const wrap = document.getElementById('comparativoAnterior');
    wrap.style.display = 'block';

    container.innerHTML = `
        <div class="dash-card">
            <h4>Vendas</h4>
            <div class="valores"><span class="v-receita">Atual: ${R$(vendasAtual)}</span><span class="v-gasto">Anterior: ${R$(vendasAnt)}</span></div>
            <div class="resultado ${cVendas.cls}">${cVendas.seta} ${cVendas.pct}%</div>
        </div>
        <div class="dash-card">
            <h4>Itens Vendidos</h4>
            <div class="valores"><span class="v-receita">Atual: ${itensAtual}</span><span class="v-gasto">Anterior: ${itensAnt}</span></div>
            <div class="resultado ${cItens.cls}">${cItens.seta} ${cItens.pct}%</div>
        </div>
        <div class="dash-card">
            <h4>Saldo Final</h4>
            <div class="valores"><span class="v-receita">Atual: ${R$(saldoAtual)}</span><span class="v-gasto">Anterior: ${R$(saldoAnt)}</span></div>
            <div class="resultado ${cSaldo.cls}">${cSaldo.seta} ${cSaldo.pct}%</div>
        </div>
        <div class="dash-card">
            <h4>Despesas</h4>
            <div class="valores"><span class="v-receita">Atual: ${R$(despAtual)}</span><span class="v-gasto">Anterior: ${R$(despAnt)}</span></div>
            <div class="resultado ${compara(despAtual,despAnt).cls}">${compara(despAtual,despAnt).seta} ${compara(despAtual,despAnt).pct}%</div>
        </div>
    `;
}

// ===== INIT =====
renderizarTudo();
if (document.getElementById('caixaGrid')) renderizarCaixa();
renderizarConfig();
renderizarHistorico();
renderizarComparativoAnterior();
atualizarStatusFirebase(false);
