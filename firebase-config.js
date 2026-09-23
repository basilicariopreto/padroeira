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
// Nós que NUNCA devem ser tocados por um update de dados (lixeira, edição anterior, backups, usuários)
const CAMPOS_PROTEGIDOS_FB = ['lixeira', 'edicao_anterior', 'backups', 'usuarios'];

function salvarFirebase(dados) {
    // Converter para JSON e voltar para limpar undefined/funções
    const limpo = JSON.parse(JSON.stringify(dados));
    // Remove os campos item-a-item para não sobrescrevê-los como array de posição
    CAMPOS_ITEM_A_ITEM_FB.forEach(campo => { delete limpo[campo]; });
    // Remove nós protegidos que não fazem parte do objeto de dados operacional
    CAMPOS_PROTEGIDOS_FB.forEach(campo => { delete limpo[campo]; });
    // Remove as VENDAS de cada barraca do payload: vendas são gravadas item-a-item
    // (fbAdicionarVenda/fbRemoverVenda/fbAtualizarVenda), para não sobrescrever a lista
    // inteira quando duas pessoas lançam na mesma barraca.
    Object.keys(limpo).forEach(k => {
        if (limpo[k] && typeof limpo[k] === 'object' && Object.prototype.hasOwnProperty.call(limpo[k], 'vendas')) {
            delete limpo[k].vendas;
            // se a barraca só tinha vendas, evita gravar objeto vazio que apagaria o nó
            if (Object.keys(limpo[k]).length === 0) delete limpo[k];
        }
    });
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

// ===== VENDAS DE BARRACA (item-a-item, por id) =====
// Grava/remove/atualiza UMA venda dentro de barraca/vendas/<id>, para várias
// pessoas lançarem na MESMA barraca sem se sobrescrever.
function fbAdicionarVenda(barraca, venda) {
    const limpo = JSON.parse(JSON.stringify(venda));
    return dbRef.child(barraca).child('vendas').child(String(venda.id)).set(limpo).catch(err => {
        console.error('Erro ao adicionar venda no Firebase:', err);
        if (typeof mostrarToast === 'function') mostrarToast('⚠️ ERRO: venda NÃO salva no servidor. Verifique a conexão.', 'error');
    });
}

function fbRemoverVenda(barraca, id) {
    return dbRef.child(barraca).child('vendas').child(String(id)).remove().catch(err => {
        console.error('Erro ao remover venda no Firebase:', err);
        if (typeof mostrarToast === 'function') mostrarToast('⚠️ ERRO: não foi possível remover a venda no servidor.', 'error');
    });
}

function fbAtualizarVenda(barraca, id, venda) {
    const limpo = JSON.parse(JSON.stringify(venda));
    return dbRef.child(barraca).child('vendas').child(String(id)).set(limpo).catch(err => {
        console.error('Erro ao atualizar venda no Firebase:', err);
        if (typeof mostrarToast === 'function') mostrarToast('⚠️ ERRO: alteração da venda NÃO salva no servidor.', 'error');
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

// ===== BACKUP AUTOMÁTICO DIÁRIO =====
// Grava uma cópia COMPLETA dos dados (incluindo os campos item-a-item) num nó
// 'backups/AAAA-MM-DD'. Roda 1x por dia, na primeira abertura após as 10h.
// Mantém os últimos 30 backups (apaga os mais antigos).

const BACKUP_HORA_MINIMA = 10; // só faz backup a partir das 10h
const BACKUP_MAX = 30;         // quantos backups manter

function dataHojeISO() {
    // AAAA-MM-DD no fuso local
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
}

// Lê o nó 'padroeira' inteiro e grava como backup do dia (se ainda não existir hoje e já passou das 10h)
function fbBackupDiarioSeNecessario() {
    try {
        if (new Date().getHours() < BACKUP_HORA_MINIMA) return; // ainda não deu a hora
        const hoje = dataHojeISO();
        dbRef.child('backups').child(hoje).child('criadoEm').once('value').then(snap => {
            if (snap.exists()) return; // já tem backup de hoje
            // Copia os dados operacionais (sem incluir os próprios backups/lixeira p/ não inchar)
            dbRef.once('value').then(all => {
                const dados = all.val() || {};
                const copia = {};
                Object.keys(dados).forEach(k => {
                    if (k === 'backups' || k === 'lixeira') return; // não duplica esses nós
                    copia[k] = dados[k];
                });
                const registro = { criadoEm: new Date().toISOString(), dados: copia };
                dbRef.child('backups').child(hoje).set(registro).then(() => {
                    limparBackupsAntigos();
                }).catch(err => console.error('Erro ao gravar backup:', err));
            });
        });
    } catch (e) { console.error('Backup falhou:', e); }
}

function limparBackupsAntigos() {
    dbRef.child('backups').once('value').then(snap => {
        const val = snap.val() || {};
        const chaves = Object.keys(val).sort(); // AAAA-MM-DD ordena cronologicamente
        if (chaves.length <= BACKUP_MAX) return;
        const remover = chaves.slice(0, chaves.length - BACKUP_MAX);
        remover.forEach(k => dbRef.child('backups').child(k).remove());
    }).catch(() => {});
}

// Lista os backups disponíveis (mais recentes primeiro): [{ data, criadoEm }]
function fbListarBackups() {
    return dbRef.child('backups').once('value').then(snap => {
        const val = snap.val() || {};
        return Object.keys(val).map(k => ({ data: k, criadoEm: val[k].criadoEm || '' }))
            .sort((a, b) => b.data.localeCompare(a.data));
    }).catch(() => []);
}

// Restaura um backup: sobrescreve o nó padroeira com os dados salvos.
// Antes de restaurar, gera um backup de segurança do estado atual.
function fbRestaurarBackup(data) {
    return dbRef.child('backups').child(data).once('value').then(snap => {
        const reg = snap.val();
        if (!reg || !reg.dados) return false;
        // salva um "antes-da-restauracao" pra não perder o estado atual
        return dbRef.once('value').then(all => {
            const atual = all.val() || {};
            const copia = {};
            Object.keys(atual).forEach(k => { if (k !== 'backups' && k !== 'lixeira') copia[k] = atual[k]; });
            const chaveSeg = 'antes-restauracao-' + Date.now();
            return dbRef.child('backups').child(chaveSeg).set({ criadoEm: new Date().toISOString(), dados: copia }).then(() => {
                // Restaura cada campo do backup (set em cada chave do backup)
                const promessas = Object.keys(reg.dados).map(k => dbRef.child(k).set(reg.dados[k]));
                return Promise.all(promessas).then(() => true);
            });
        });
    }).catch(err => { console.error('Erro ao restaurar backup:', err); return false; });
}

function fbExcluirBackup(data) {
    return dbRef.child('backups').child(data).remove().catch(err => console.error('Erro ao excluir backup:', err));
}

// ===== USUÁRIOS / LOGIN (admin) =====
// Usuários ficam no nó 'usuarios' do Firebase com a senha em HASH (SHA-256).
// O usuário "admin" é fixo no código (senha Basilica2026) e sempre pode gerenciar usuários.
// OBS: por ser site estático, isto é uma "tranca" (impede uso casual), não segurança de banco.

async function hashSenha(texto) {
    try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        // fallback simples caso crypto.subtle não esteja disponível (contexto não-HTTPS)
        let h = 0; for (let i = 0; i < texto.length; i++) { h = (h << 5) - h + texto.charCodeAt(i); h |= 0; }
        return 'f' + String(h);
    }
}

// Valida login. Retorna { ok, usuario: {nome, admin} } ou { ok:false }
async function fbValidarLogin(usuario, senha) {
    const u = (usuario || '').trim().toLowerCase();
    // Admin fixo
    if (u === 'admin' && senha === 'Basilica2026') {
        return { ok: true, usuario: { nome: 'admin', admin: true } };
    }
    try {
        const snap = await dbRef.child('usuarios').child(u).once('value');
        const reg = snap.val();
        if (!reg) return { ok: false };
        const h = await hashSenha(senha);
        if (h === reg.senhaHash) return { ok: true, usuario: { nome: reg.nome || u, admin: false } };
        return { ok: false };
    } catch (e) { return { ok: false }; }
}

// Cria/atualiza um usuário organizador (só o admin chama). Retorna Promise<boolean>
async function fbSalvarUsuario(usuario, nome, senha) {
    const u = (usuario || '').trim().toLowerCase();
    if (!u || u === 'admin') return false;
    const senhaHash = await hashSenha(senha);
    return dbRef.child('usuarios').child(u).set({
        nome: nome || u, senhaHash, criadoEm: new Date().toISOString()
    }).then(() => true).catch(() => false);
}

function fbListarUsuarios() {
    return dbRef.child('usuarios').once('value').then(snap => {
        const val = snap.val() || {};
        return Object.keys(val).map(k => ({ usuario: k, nome: val[k].nome || k, criadoEm: val[k].criadoEm || '' }))
            .sort((a, b) => a.usuario.localeCompare(b.usuario));
    }).catch(() => []);
}

function fbRemoverUsuario(usuario) {
    return dbRef.child('usuarios').child((usuario || '').toLowerCase()).remove().catch(() => {});
}
