// Firebase Configuration - Festa da Padroeira 2026
// IMPORTANTE: Crie um novo projeto Firebase para a Padroeira
// ou use o mesmo projeto do Arraiá com um path diferente
const firebaseConfig = {
    apiKey: "AIzaSyBs7zNRlW8i5sJaLypb3WXAuRsdSfD0AVo",
    authDomain: "arraiabasilica.firebaseapp.com",
    databaseURL: "https://arraiabasilica-default-rtdb.firebaseio.com",
    projectId: "arraiabasilica",
    storageBucket: "arraiabasilica.firebasestorage.app",
    messagingSenderId: "989762035527",
    appId: "1:989762035527:web:613a5d2fba39badbbff662",
    measurementId: "G-K9PJSTKW42"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
// Usa path separado para não misturar com dados do Arraiá
const dbRef = db.ref('padroeira');

// ===== FUNÇÕES DE SINCRONIZAÇÃO =====

// Salvar dados no Firebase
// Usa update() por campo de topo em vez de set() no nó inteiro.
// IMPORTANTE: NÃO reescreve os campos geridos item-a-item (patrocinadores, despesas,
// doacoesEntrada, doadores, necessidades, caixas) — esses só são gravados pelas funções
// fbAdicionarItem/fbGravarCampo, para não desfazer o formato chaveado por id (que evita
// duplicação e perda). Aqui gravamos só vendas de barraca, config e meta.
const CAMPOS_ITEM_A_ITEM_FB = ['patrocinadores', 'despesas', 'doacoesEntrada', 'doadores', 'necessidades', 'caixas', 'camisetas'];
// Nós que NUNCA devem ser tocados por um update de dados (lixeira e edição anterior)
const CAMPOS_PROTEGIDOS_FB = ['lixeira', 'edicao_anterior'];

function salvarFirebase(dados) {
    // Converter para JSON e voltar para limpar undefined/funções
    const limpo = JSON.parse(JSON.stringify(dados));
    // Remove os campos item-a-item para não sobrescrevê-los como array de posição
    CAMPOS_ITEM_A_ITEM_FB.forEach(campo => { delete limpo[campo]; });
    // Remove nós protegidos que não fazem parte do objeto de dados operacional
    CAMPOS_PROTEGIDOS_FB.forEach(campo => { delete limpo[campo]; });
    dbRef.update(limpo).catch(err => {
        console.error('Erro ao salvar no Firebase:', err);
        // Avisa o usuário quando a gravação falha (ex: regras expiradas / sem permissão)
        if (typeof mostrarToast === 'function') {
            mostrarToast('⚠️ ERRO: dados NÃO salvos no servidor. Verifique a conexão.', 'error');
        }
    });
}

// Carregar dados do Firebase (retorna Promise)
function carregarFirebase() {
    return dbRef.once('value').then(snapshot => snapshot.val());
}

// Escutar mudanças em tempo real
function escutarMudancas(callback) {
    dbRef.on('value', snapshot => {
        const dados = snapshot.val();
        if (dados) callback(dados);
    });
}

// ===== OPERAÇÕES ITEM-A-ITEM (seguras para uso simultâneo) =====
// Grava/remove/atualiza UM item dentro de um campo (ex: patrocinadores),
// usando o id do item como chave. Dois dispositivos adicionando ao mesmo
// tempo NÃO se sobrescrevem, pois cada item tem sua própria chave.

// Reescreve o campo INTEIRO no Firebase como objeto chaveado pelo id de cada item.
// Isso corrige o problema de itens antigos que ficaram salvos por POSIÇÃO (0,1,2)
// em vez de por id — garantindo que editar/remover sempre acerte o registro certo.
// Recebe a lista atual (array) do campo, já com a alteração aplicada localmente.
function fbGravarCampo(campo, lista) {
    const obj = {};
    (lista || []).forEach(item => {
        if (item && item.id != null) {
            obj[String(item.id)] = JSON.parse(JSON.stringify(item));
        }
    });
    // set() substitui o campo inteiro pela versão chaveada por id (sem duplicatas de posição)
    return dbRef.child(campo).set(obj).catch(err => {
        console.error('Erro ao gravar campo no Firebase:', err);
        if (typeof mostrarToast === 'function') mostrarToast('⚠️ ERRO: dados NÃO salvos no servidor. Verifique a conexão.', 'error');
    });
}

function fbAdicionarItem(campo, item) {
    const limpo = JSON.parse(JSON.stringify(item));
    return dbRef.child(campo).child(String(item.id)).set(limpo).catch(err => {
        console.error('Erro ao adicionar item no Firebase:', err);
        if (typeof mostrarToast === 'function') mostrarToast('⚠️ ERRO: item NÃO salvo no servidor. Verifique a conexão.', 'error');
    });
}

function fbRemoverItem(campo, id) {
    return dbRef.child(campo).child(String(id)).remove().catch(err => {
        console.error('Erro ao remover item no Firebase:', err);
        if (typeof mostrarToast === 'function') mostrarToast('⚠️ ERRO: não foi possível remover no servidor.', 'error');
    });
}

function fbAtualizarItem(campo, id, item) {
    const limpo = JSON.parse(JSON.stringify(item));
    return dbRef.child(campo).child(String(id)).set(limpo).catch(err => {
        console.error('Erro ao atualizar item no Firebase:', err);
        if (typeof mostrarToast === 'function') mostrarToast('⚠️ ERRO: alteração NÃO salva no servidor.', 'error');
    });
}

// ===== LIXEIRA (segurança contra remoção acidental) =====
// Guarda uma cópia de todo item removido no nó 'lixeira', com data e origem,
// para poder restaurar depois. Mantém no máximo os 200 registros mais recentes.
function fbEnviarLixeira(campo, item) {
    if (!item || item.id == null) return Promise.resolve();
    const registro = {
        campo,
        item: JSON.parse(JSON.stringify(item)),
        removidoEm: new Date().toISOString(),
        chave: Date.now() + '_' + item.id
    };
    return dbRef.child('lixeira').child(registro.chave).set(registro).catch(err => {
        console.error('Erro ao gravar na lixeira:', err);
    });
}

// Retorna a lista da lixeira (array), mais recentes primeiro
function fbListarLixeira() {
    return dbRef.child('lixeira').once('value').then(snap => {
        const val = snap.val() || {};
        return Object.values(val).sort((a, b) => (b.removidoEm || '').localeCompare(a.removidoEm || ''));
    }).catch(() => []);
}

// Restaura um item da lixeira de volta ao seu campo original
function fbRestaurarLixeira(chave) {
    return dbRef.child('lixeira').child(chave).once('value').then(snap => {
        const reg = snap.val();
        if (!reg || !reg.item || reg.item.id == null) return false;
        return dbRef.child(reg.campo).child(String(reg.item.id)).set(reg.item).then(() => {
            return dbRef.child('lixeira').child(chave).remove().then(() => true);
        });
    }).catch(err => { console.error('Erro ao restaurar da lixeira:', err); return false; });
}

// Apaga um registro da lixeira definitivamente
function fbExcluirLixeira(chave) {
    return dbRef.child('lixeira').child(chave).remove().catch(err => console.error('Erro ao excluir da lixeira:', err));
}
