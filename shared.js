// ===== SHARED: núcleo comum para as páginas focadas =====
// Reutiliza o mesmo Firebase (firebase-config.js) e o mesmo STORAGE_KEY do painel principal.

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
const DIAS_CAIXAS = DIAS_FESTA;

const STORAGE_KEY = 'padroeira_financeiro_v1';

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

function fmt(valor) {
    const n = Number(valor);
    return (isNaN(n) ? 0 : n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function R$(valor) { return 'R$ ' + fmt(valor); }

function mostrarToast(msg, tipo) {
    const existing = document.querySelector('.toast-global');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-global' + (tipo === 'error' ? ' error' : '');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}

function dadosVazios() {
    const d = { despesas: [], patrocinadores: [], doadores: [], necessidades: [], doacoesEntrada: [], caixas: [], camisetas: [], configCaixas: { fixos: 0, volantes: 0 }, configCamisetas: { precoTrabalhador: 0, precoPublico: 0, custoTrabalhador: 0, custoPublico: 0 }, meta: 0, configBarracas: null, configProdutos: null };
    BARRACAS.forEach(b => { d[b] = { vendas: [] }; });
    return d;
}

function normalizarDados(d) {
    if (!d) return dadosVazios();
    if (d.patrocinadores && !Array.isArray(d.patrocinadores)) d.patrocinadores = Object.values(d.patrocinadores);
    if (!d.patrocinadores) d.patrocinadores = [];
    if (d.despesas && !Array.isArray(d.despesas)) d.despesas = Object.values(d.despesas);
    if (!d.despesas) d.despesas = [];

    if (d.configBarracas && !Array.isArray(d.configBarracas)) d.configBarracas = Object.values(d.configBarracas);

    // Registrar barracas dinâmicas na memória
    if (d.configBarracas) {
        d.configBarracas.forEach(cb => {
            if (!cb || !cb.id) return;
            if (!BARRACAS.includes(cb.id)) BARRACAS.push(cb.id);
            const temEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(cb.nome || '');
            NOMES_BARRACAS[cb.id] = temEmoji ? cb.nome : '🏪 ' + (cb.nome || cb.id);
        });
    }

    BARRACAS.forEach(b => {
        if (!d[b]) d[b] = { vendas: [] };
        if (d[b].vendas && !Array.isArray(d[b].vendas)) d[b].vendas = Object.values(d[b].vendas);
        if (!d[b].vendas) d[b].vendas = [];
    });

    if (!d.meta) d.meta = 0;

    if (d.configProdutos) {
        Object.keys(d.configProdutos).forEach(key => {
            if (d.configProdutos[key] && !Array.isArray(d.configProdutos[key])) {
                d.configProdutos[key] = Object.values(d.configProdutos[key]);
            }
        });
    }

    if (d.doadores && !Array.isArray(d.doadores)) d.doadores = Object.values(d.doadores);
    if (!d.doadores) d.doadores = [];
    if (d.necessidades && !Array.isArray(d.necessidades)) d.necessidades = Object.values(d.necessidades);
    if (!d.necessidades) d.necessidades = [];
    d.necessidades.forEach(n => {
        if (n.qtdConseguida == null) n.qtdConseguida = n.conseguido ? (n.qtd || 0) : 0;
    });
    if (d.doacoesEntrada && !Array.isArray(d.doacoesEntrada)) d.doacoesEntrada = Object.values(d.doacoesEntrada);
    if (!d.doacoesEntrada) d.doacoesEntrada = [];
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

    // Garantir que todos os ids sejam NÚMERO (Firebase converte chaves para string)
    ['patrocinadores','despesas','doadores','necessidades','doacoesEntrada','caixas','camisetas'].forEach(campo => {
        if (Array.isArray(d[campo])) d[campo].forEach(x => { if (x && x.id != null) x.id = Number(x.id); });
    });

    return d;
}

function carregarDados() {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) {
        try { return normalizarDados(JSON.parse(d)); } catch { return dadosVazios(); }
    }
    return dadosVazios();
}

function salvarDados(d) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    if (typeof salvarFirebase === 'function') salvarFirebase(d);
}

// ===== OPERAÇÕES ITEM-A-ITEM (seguras para uso simultâneo) =====
// Campos que podem ser lançados por várias pessoas ao mesmo tempo.
// Em vez de salvar a lista inteira (que causaria sobrescrita entre dispositivos),
// grava/remove/atualiza só o item específico no Firebase.
const CAMPOS_ITEM_A_ITEM = ['patrocinadores', 'despesas', 'doacoesEntrada', 'doadores', 'necessidades'];

function adicionarItem(campo, item) {
    if (!dados[campo]) dados[campo] = [];
    dados[campo].push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    indicarSalvando();
    // Grava só o item novo (não sobrescreve o que outros dispositivos possam ter adicionado)
    const p = (typeof fbAdicionarItem === 'function') ? fbAdicionarItem(campo, item) : Promise.resolve();
    if (p && p.then) p.then(indicarSalvo);
    else indicarSalvo();
}

function removerItem(campo, id) {
    if (!dados[campo]) dados[campo] = [];
    // Guarda cópia na lixeira ANTES de remover (segurança contra perda acidental)
    const itemRemovido = dados[campo].find(x => String(x.id) === String(id));
    if (itemRemovido && typeof fbEnviarLixeira === 'function') fbEnviarLixeira(campo, itemRemovido);
    // Compara como string para funcionar com id número ou string (Firebase)
    dados[campo] = dados[campo].filter(x => String(x.id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    indicarSalvando();
    // Remove SÓ o item por id (não reescreve o campo inteiro — evita apagar itens de outros dispositivos)
    const p = (typeof fbRemoverItem === 'function') ? fbRemoverItem(campo, id)
        : (typeof fbGravarCampo === 'function') ? fbGravarCampo(campo, dados[campo]) : Promise.resolve();
    if (p && p.then) p.then(indicarSalvo);
    else indicarSalvo();
}

function atualizarItem(campo, id, novosCampos) {
    if (!dados[campo]) dados[campo] = [];
    // Compara como string para funcionar com id número ou string (Firebase)
    const item = dados[campo].find(x => String(x.id) === String(id));
    if (!item) return;
    Object.assign(item, novosCampos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    indicarSalvando();
    // Grava SÓ o item alterado por id (não reescreve o campo inteiro — evita apagar itens de outros dispositivos)
    const p = (typeof fbAtualizarItem === 'function') ? fbAtualizarItem(campo, id, item)
        : (typeof fbGravarCampo === 'function') ? fbGravarCampo(campo, dados[campo]) : Promise.resolve();
    if (p && p.then) p.then(indicarSalvo);
    else indicarSalvo();
}

// ===== INDICADOR DE SALVAMENTO =====
function indicarSalvando() {
    const el = document.getElementById('saveStatus');
    if (el) { el.textContent = '⏳ Salvando...'; el.style.color = '#ffb300'; }
}
function indicarSalvo() {
    const el = document.getElementById('saveStatus');
    if (el) {
        el.textContent = '✓ Salvo';
        el.style.color = '#81c784';
        setTimeout(() => { if (el.textContent === '✓ Salvo') el.textContent = ''; }, 2500);
    }
}

// Objeto global de dados usado pelas páginas
let dados = carregarDados();

// Carrega do Firebase e escuta em tempo real. Chama renderizarPagina() (definida em cada página).
function iniciarSync() {
    if (typeof carregarFirebase === 'function') {
        carregarFirebase().then(dadosFirebase => {
            if (dadosFirebase) {
                dados = normalizarDados(dadosFirebase);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
            } else {
                salvarFirebase(dados);
            }
            if (typeof renderizarPagina === 'function') renderizarPagina();
        }).catch(() => {
            if (typeof renderizarPagina === 'function') renderizarPagina();
        });
    } else {
        if (typeof renderizarPagina === 'function') renderizarPagina();
    }

    if (typeof escutarMudancas === 'function') {
        escutarMudancas(function(dadosFirebase) {
            try {
                const norm = normalizarDados(dadosFirebase);
                // Salva SÓ no localStorage — NÃO chama salvarFirebase aqui
                // para evitar loop (escuta → salva → dispara evento → escuta...)
                localStorage.setItem(STORAGE_KEY, JSON.stringify(norm));
                dados = norm;
                if (typeof renderizarPagina === 'function') renderizarPagina();
            } catch (err) {
                console.error('Erro ao sincronizar:', err);
            }
        });
    }
}

function nomeBarraca(id) {
    if (!id || id === 'geral') return 'Geral';
    return (NOMES_BARRACAS[id] || id);
}

// Status de conexão Firebase
function iniciarStatusFirebase() {
    if (typeof firebase !== 'undefined' && firebase.database) {
        firebase.database().ref('.info/connected').on('value', snap => {
            const el = document.getElementById('firebaseStatus');
            if (el) {
                el.innerHTML = snap.val() === true
                    ? '<span class="status-dot online"></span> Online'
                    : '<span class="status-dot offline"></span> Offline';
            }
        });
    }
}

// Recarregar dados manualmente do Firebase
function atualizarDados() {
    indicarSalvando();
    const el = document.getElementById('saveStatus');
    if (el) el.textContent = '🔄 Atualizando...';
    if (typeof carregarFirebase === 'function') {
        carregarFirebase().then(dadosFirebase => {
            if (dadosFirebase) {
                dados = normalizarDados(dadosFirebase);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
            }
            if (typeof renderizarPagina === 'function') renderizarPagina();
            if (el) { el.textContent = '✓ Atualizado'; el.style.color = '#81c784'; setTimeout(() => { el.textContent = ''; }, 2500); }
        }).catch(() => {
            if (el) { el.textContent = '⚠️ Erro ao atualizar'; el.style.color = '#ef5350'; }
        });
    }
}
