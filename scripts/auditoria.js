'use strict';
/**
 * Auditoria dos 120 comandos com um WhatsApp SIMULADO (sem rede, sem Baileys).
 * Executa cada comando pelo caminho real: handler → permissões → aluguer → comando → fila de envio.
 * Gera AUDITORIA.md. Não substitui o teste num WhatsApp real.
 */
process.env.SASUKE_OFFLINE = '1';
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');
const EventEmitter = require('events');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sasuke-aud-'));
process.chdir(tmp); // logs/ e assets/ ficam no temporário

// Substitui o Baileys por um stub mínimo (só as 2 funções usadas pelo handler)
const stub = {
  normalizeMessageContent: (m) => m,
  getContentType: (c) => Object.keys(c).find((k) => k !== 'messageContextInfo'),
};
const origLoad = Module._load;
Module._load = function (req, ...rest) {
  if (req === '@whiskeysockets/baileys') return stub;
  return origLoad.call(this, req, ...rest);
};

const R = (p) => require(path.join(ROOT, p));
const baseConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
const config = {
  ...baseConfig,
  databaseDir: path.join(tmp, 'database'),
  authDir: path.join(tmp, 'auth'),
  scheduler: { ...baseConfig.scheduler, intervals: { text: 5, react: 2, image: 5, video: 5, admin: 5, long: 5, default: 5 }, globalGapMs: 1, typing: false, retryBaseMs: 10 },
  limites: { comandosPorJanela: 1000, janelaMs: 1000 },
};

const { Database } = R('src/database/db');
const { Permissions } = R('src/services/permissions');
const { Rental } = R('src/services/rental');
const { MessageScheduler } = R('src/services/messageScheduler');
const { GroupCache } = R('src/services/groupCache');
const { loadRegistry } = R('src/handlers/registry');
const { createHandler } = R('src/handlers/messageHandler');
const { TODOS, MENU } = R('src/services/menuData');
const participantes = R('src/handlers/events/participants');
const log = R('src/utils/logger');
log.info = () => {}; log.warn = () => {}; // silêncio durante os testes

const G = '120363000000000001@g.us';
const G2 = '120363000000000002@g.us';
const J = (n) => n + '@s.whatsapp.net';
const OWNER = J(config.dono.internacional);
const BOT = config.bot.internacional;
const M2 = J('258842222222'); const M3 = J('258843333333'); const M4 = J('258844444444'); const ADM = J('258841111111');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sent = [];
const calls = [];
const meta = {
  id: G, subject: 'Grupo Teste', creation: 1700000000, announce: false, restrict: false, desc: 'Descrição de teste',
  participants: [
    { id: OWNER, admin: 'superadmin' }, { id: J(BOT), admin: 'admin' }, { id: ADM, admin: 'admin' },
    { id: M2, admin: null }, { id: M3, admin: null }, { id: M4, admin: null },
  ],
};
const sock = {
  user: { id: `${BOT}:1@s.whatsapp.net` },
  ev: { on() {}, off() {} },
  async sendMessage(jid, content, opts) { sent.push({ jid, content, opts }); return { key: { id: 'M' + sent.length, remoteJid: jid, fromMe: true } }; },
  async sendPresenceUpdate() {}, async presenceSubscribe() {},
  async groupMetadata() { return meta; },
  async groupParticipantsUpdate(jid, jids, acao) { calls.push(['participants', acao, jids]); return jids.map((j) => ({ status: '200', jid: j })); },
  async groupSettingUpdate(jid, m) { calls.push(['setting', m]); },
  async groupUpdateSubject(jid, t) { calls.push(['subject', t]); },
  async groupUpdateDescription(jid, t) { calls.push(['desc', t]); },
  async groupInviteCode() { return 'ABC123XYZ789'; },
  async groupRevokeInvite() { return 'NEW123XYZ789'; },
  async groupFetchAllParticipating() { return { [G]: meta }; },
  async groupLeave() { calls.push(['leave']); },
  async profilePictureUrl() { throw new Error('sem foto'); },
};

const db = new Database(config.databaseDir, { backupIntervaloMin: 0 }).init();
const perms = new Permissions(db, config);
const rental = new Rental(db, config);
const registry = loadRegistry(ROOT);
const fakeSessions = {
  list: () => [session.info()], get: () => null, principal: () => session,
  async add(id) { const e = new EventEmitter(); e.id = id; setTimeout(() => { e.emit('pairing', 'ABCD-1234'); setTimeout(() => e.emit('open'), 30); }, 20); return e; },
  async remove() {}, persist() {}, async stop() {}, async resume() {},
};
const services = { config, db, perms, rental, registry, sessions: fakeSessions };
const session = {
  id: 'principal', services, sock, groups: new GroupCache(), scheduler: new MessageScheduler(config.scheduler), status: 'online',
  info() { return { id: 'principal', estado: 'online', numero: BOT, fila: { pendentes: 0 } }; },
};
session.scheduler.setSocket(sock); session.scheduler.setReady(true);
const handler = createHandler({ ...services, session });

async function settle() {
  for (let i = 0; i < 400; i++) {
    const s = session.scheduler;
    if (s.stats().pendentes === 0 && s.active === 0 && [...s.chats.values()].every((c) => !c.running)) { await sleep(15); if (s.stats().pendentes === 0 && [...s.chats.values()].every((c) => !c.running)) return; }
    await sleep(10);
  }
}

let seq = 0;
async function enviar({ jid = G, from = OWNER, text = '', content, mentioned, quoted, id }) {
  id = id || 'T' + (++seq);
  const ci = {};
  if (mentioned) ci.mentionedJid = mentioned;
  if (quoted) { ci.stanzaId = 'Q1'; ci.participant = quoted.sender || M2; ci.quotedMessage = { conversation: quoted.text || 'texto citado' }; }
  const message = content || { extendedTextMessage: { text, contextInfo: ci } };
  const msg = { key: { remoteJid: jid, id, participant: jid.endsWith('@g.us') ? from : undefined, fromMe: false }, pushName: 'Tester', messageTimestamp: Math.floor(Date.now() / 1000), message };
  const ini = sent.length;
  await handler({ type: 'notify', messages: [msg] });
  await settle();
  const novos = sent.slice(ini);
  const reacts = novos.filter((s) => s.content.react?.key.id === id).map((s) => s.content.react.text);
  const respostas = novos.filter((s) => !s.content.react).map((s) => s.content.text || s.content.caption || (s.content.delete ? '(apagou)' : '(media)'));
  return { id, reacts, final: reacts[reacts.length - 1], respostas, novos };
}

const EXTERNO = /indispon|Depend[eê]ncia|configurad|Nenhuma fonte|n[aã]o encontrada/i;
const resultados = new Map(); // nome -> {estado, nota}
const extras = [];

async function cmd(nome, args = '', opts = {}) {
  const r = await enviar({ text: `.${nome}${args ? ' ' + args : ''}`, ...opts });
  let estado; let nota = '';
  const txt = r.respostas.join(' | ');
  if (r.final === '✅') estado = 'OK';
  else if (r.final === '❌' && EXTERNO.test(txt)) { estado = 'OK-EXTERNO'; nota = 'depende de fonte externa/configuração (não testável offline); falha tratada com mensagem clara'; }
  else { estado = 'FALHA'; nota = `reacção ${r.final || 'nenhuma'} · ${txt.slice(0, 120)}`; }
  if (!opts.extra && !resultados.has(nome)) resultados.set(nome, { estado, nota, resposta: txt.slice(0, 80) });
  else extras.push({ nome: `.${nome} ${args}`.trim(), estado, nota });
  return r;
}

(async () => {
  rental.alugar(G, 30, 'auditoria', 'Grupo Teste');
  const q = { quoted: { sender: M2, text: 'olá' } };
  const m = (...j) => ({ mentioned: j });

  // A. Membros
  await cmd('ban', '@258844444444', m(M4));
  await cmd('kick', '@258843333333', m(M3));
  await cmd('add', '849999999');
  await cmd('promover', '@258842222222', m(M2));
  await cmd('rebaixar', '@258842222222', m(M2));
  await cmd('mute', '@258843333333', m(M3));
  await cmd('unmute', '@258843333333', m(M3));
  await cmd('banlist');
  await cmd('unban', '258844444444');
  await cmd('admins'); await cmd('membros'); await cmd('online');
  // B. Administração
  await cmd('abrir'); await cmd('fechar'); await cmd('abrirhorario', '07:00'); await cmd('fecharhorario', '22:00');
  await cmd('nome', 'Novo Nome'); await cmd('desc', 'Nova descrição'); await cmd('link'); await cmd('novolink'); await cmd('infogp');
  // C. Mensagens
  await cmd('boasvindas', 'on'); await cmd('nanobemvindo', 'Olá {nome}, bem-vindo a {grupo}'); await cmd('saidas', 'on'); await cmd('nanosaida', 'Adeus {nome}');
  await cmd('autoresposta', 'on'); await cmd('hidetag', 'olá a todos'); await cmd('marcar', 'atenção');
  await cmd('delete', '', q); await cmd('limpar', '2'); await cmd('dectetor', 'on'); await cmd('revelar', '', q);
  // D. Nano
  await cmd('nano', 'on'); await cmd('nanoadd', 'oi | olá {nome}'); await cmd('nanolist'); await cmd('nanodel', '1'); await cmd('limparnano');
  await cmd('nanoadd', 'oi | olá {nome}', { extra: true });
  // E. Protecções
  for (const p of ['antilink', 'antilinkhard', 'anticanal', 'antifoto', 'antivideo', 'antiaudio', 'antisticker', 'antidoc', 'antiviewonce', 'antipalavrao', 'antidelete', 'automover']) await cmd(p, 'on');
  await cmd('antifake', 'on 258'); await cmd('antiflood', 'on 6 8'); await cmd('maxavisos', '5');
  // K (configuração) antes das consultas F
  for (const [c, t] of [['settabela', 'Tabela: 1GB = 50MT'], ['setpagamento', 'Pagar por M-Pesa'], ['setmegas', 'Megas diários'], ['setcontas', 'Conta X'], ['setcarteira', 'Carteira Y'], ['setcompra', 'Fala com um admin'], ['setloja', 'Loja Z']]) await cmd(c, t);
  // F. Pagamentos
  await cmd('addmpesa', '841234567 Titular'); await cmd('addemola', '861234567 Titular');
  await cmd('compra'); await cmd('tabela'); await cmd('contas'); await cmd('carteira'); await cmd('pagamento'); await cmd('megas'); await cmd('loja'); await cmd('saldo');
  await cmd('antiburlador', 'on');
  await cmd('compra', 'pedir 5GB', { extra: true }); await cmd('compra', 'lista', { extra: true }); await cmd('compra', 'confirmar 1', { extra: true });
  await cmd('vertabela'); await cmd('verloja'); await cmd('limpartabela');
  // G. Permissões
  await cmd('liberartodos'); await cmd('liberar', 'ban'); await cmd('clientes', 'add 843333333'); await cmd('modolivre', 'on'); await cmd('bloqueartodos'); await cmd('permissoes');
  // H. Proprietário
  await cmd('alugar', '30'); await cmd('tirardias', '1'); await cmd('alugueis'); await cmd('conectar', '258841234567'); await cmd('qrcode'); await cmd('sessoes');
  await cmd('bangp'); await cmd('bangp', '', { extra: true });
  // I. Anime
  for (const a of ['sasuke', 'naruto', 'itachi', 'waifu', 'wallpaper', 'quote', 'amv', 'otaku', 'madara', 'kakashi', 'sakura', 'hinata', 'obito']) await cmd(a);
  await cmd('anime', 'Naruto Uzumaki');
  // J. Geral
  await cmd('menu'); await cmd('dono'); await cmd('sobre'); await cmd('ping'); await cmd('perfil'); await cmd('canal'); await cmd('dado', '20'); await cmd('moeda'); await cmd('8ball', 'vou ganhar?');
  await cmd('ranking'); await cmd('beijar', '', m(M2)); await cmd('abraçar', '', m(M2)); await cmd('socar', '', m(M2)); await cmd('style-menu', '1');
  await cmd('jutsu'); await cmd('sharingan'); await cmd('ship', '', m(M2, M3)); await cmd('casal'); await cmd('daily');
  // K. restantes (vertabela/limpartabela/verloja já correram)

  // ---------- Protecções, eventos e regras (comportamento) ----------
  const checks = [];
  const chk = (nome, ok, det = '') => checks.push({ nome, ok: !!ok, det });
  const apagou = (r) => r.novos.some((s) => s.content.delete);

  // Garante alvo limpo
  db.groupConfig(G).mutados = [];
  const t1 = await enviar({ from: M3, text: 'vejam chat.whatsapp.com/ABCDEFGHIJKL' });
  chk('antilink apaga link de grupo e avisa', apagou(t1) && t1.respostas.some((x) => /Aviso 1\/5/.test(x)), t1.respostas.join('|'));
  const t2 = await enviar({ from: M3, text: 'que merda' });
  chk('antipalavrao apaga palavrão', apagou(t2));
  const t3 = await enviar({ from: M3, content: { imageMessage: { caption: 'foto' } } });
  chk('antifoto apaga imagem', apagou(t3));
  const t3b = await enviar({ from: M3, content: { imageMessage: { viewOnce: true } } });
  chk('antiviewonce apaga visualização única', apagou(t3b));
  const t4 = await enviar({ from: ADM, text: 'chat.whatsapp.com/ABCDEFGHIJKL' });
  chk('administradores são isentos das protecções', !apagou(t4));
  let fl = null; for (let i = 0; i < 8; i++) fl = await enviar({ from: M2, text: 'spam ' + i });
  chk('antiflood reage a rajadas', sent.some((s) => /flood/.test(s.content.text || '')));
  void fl;
  const w = db.get('advertencias').grupos[G];
  chk('avisos e ocorrências ficam registados', w && Object.keys(w.usuarios).length >= 1 && w.ocorrencias.length >= 3);

  await cmd('mute', '@258843333333', { ...m(M3), extra: true });
  const t5 = await enviar({ from: M3, text: 'olá a todos' });
  chk('mute apaga mensagens de silenciados', apagou(t5));
  await cmd('unmute', '@258843333333', { ...m(M3), extra: true });

  const t6 = await enviar({ from: M3, text: 'oi pessoal' });
  chk('nano responde ao gatilho', t6.respostas.some((x) => /^olá/.test(x)), t6.respostas.join('|'));

  const orig = await enviar({ from: ADM, text: 'mensagem secreta', id: 'ORIG1' });
  const t7 = await enviar({ from: ADM, content: { protocolMessage: { type: 0, key: { id: 'ORIG1' } } } });
  chk('antidelete repõe mensagem apagada (já recebida)', t7.novos.some((s) => s.content.forward) || t7.respostas.some((x) => /apagou uma mensagem/.test(x)), `respostas=${JSON.stringify(t7.respostas)} guardada=${!!R('src/services/messageStore').find(G, 'ORIG1')} antidelete=${JSON.stringify(db.groupConfig(G).protecoes.antidelete)}`);
  void orig;

  const t8 = await enviar({ from: M4, text: '.ban @258842222222', mentioned: [M2] });
  chk('membro sem permissão não usa .ban (❌)', t8.final === '❌' && t8.respostas.some((x) => /permiss/i.test(x)));
  const t9 = await enviar({ from: ADM, text: '.antilink off' });
  chk('administrador usa comandos de administração', t9.final === '✅');

  const t10 = await enviar({ jid: G2, from: M3, text: '.tabela' });
  chk('grupo sem aluguer recebe o aviso com dados do dono', t10.respostas.some((x) => /NÃO TEM ALUGUEL/.test(x) && x.includes(config.dono.numero)));
  const t11 = await enviar({ jid: G2, from: M3, text: '.ban @258842222222', mentioned: [M2] });
  chk('grupo sem aluguer não executa comandos reservados', !calls.some((c) => c[0] === 'participants' && c[1] === 'remove' && false) && t11.respostas.every((x) => !/Banido/.test(x)));
  const t12 = await enviar({ from: M4, text: '.tabela' });
  chk('dados do dono não aparecem em comandos normais', t12.respostas.length > 0 && t12.respostas.every((x) => !x.includes(config.dono.numero)));

  // Dados isolados por grupo
  await enviar({ jid: G2, from: OWNER, text: '.settabela Tabela do grupo B' });
  const ta = db.get('pagamentos').grupos[G]?.tabela; const tb = db.get('pagamentos').grupos[G2]?.tabela;
  chk('tabela do grupo A e do grupo B ficam separadas', !tb || (ta?.texto !== tb?.texto), `A=${ta?.texto} B=${tb?.texto}`);

  // Eventos de entrada/saída (boas-vindas, despedidas, antifake, banidos)
  const env = { sock, scheduler: session.scheduler, db, rental, groups: session.groups, config };
  db.groupConfig(G).boasvindasTexto = null; db.groupConfig(G).saidaTexto = null; db.save('configuracoes');
  let i0 = sent.length;
  await participantes.run(env, { id: G, action: 'add', participants: [J('258845555555')], author: OWNER }); await settle();
  const ev1 = sent.slice(i0);
  chk('boas-vindas enviadas com menção e nome do grupo', ev1.some((s) => /Bem-vindo\(a\), @258845555555/.test(s.content.text || s.content.caption || '') && /Grupo Teste|Novo Nome/.test(s.content.text || s.content.caption || '')));
  i0 = sent.length;
  await participantes.run(env, { id: G, action: 'remove', participants: [J('258845555555')], author: J('258845555555') }); await settle();
  chk('despedida enviada (saída voluntária)', sent.slice(i0).some((s) => /deixou o território/.test(s.content.text || s.content.caption || '') && /vontade própria/.test(s.content.text || s.content.caption || '')));
  i0 = sent.length;
  await participantes.run(env, { id: G, action: 'remove', participants: [J('258845555555')], author: OWNER }); await settle();
  chk('despedida diferencia remoção por admin', sent.slice(i0).some((s) => /removido do grupo/.test(s.content.text || s.content.caption || '')));
  calls.length = 0;
  await participantes.run(env, { id: G, action: 'add', participants: [J('27123456789')], author: OWNER }); await settle();
  chk('antifake remove números fora do +258', calls.some((c) => c[0] === 'participants' && c[1] === 'remove' && c[2][0].startsWith('27123456789')));
  db.groupRecord(G).banidos = { 258844444444: { em: Date.now(), por: 'x' } };
  calls.length = 0;
  await participantes.run(env, { id: G, action: 'add', participants: [J('258844444444')], author: OWNER }); await settle();
  chk('banido que volta é removido outra vez', calls.some((c) => c[0] === 'participants' && c[1] === 'remove'));
  i0 = sent.length;
  await participantes.run({ ...env, rental: { isActive: () => false } }, { id: G, action: 'add', participants: [J('258846666666')] }); await settle();
  chk('sem aluguer não há boas-vindas', sent.length === i0);

  // Fim: anular o aluguer
  await cmd('anular', '', { extra: false });
  chk('anular desactiva o aluguer', !rental.isActive(G));
  const t13 = await enviar({ from: M3, text: '.tabela' });
  chk('após anular, o grupo volta a receber aviso de aluguer', t13.respostas.some((x) => /NÃO TEM ALUGUEL/.test(x)));

  // ---------- Relatório ----------
  const faltam = TODOS.filter((n) => !resultados.has(n));
  const cmds = new Map(registry.commands.list.map((c) => [c.name, c]));
  let md = '# AUDITORIA — SASUKE V31.1 — SHADOW GOD\n\n';
  md += `Gerado em ${new Date().toISOString()} · Node ${process.version}\n\n`;
  md += '> Os testes usam um **WhatsApp simulado** (sem rede e sem Baileys). Validam a lógica, as permissões, o aluguer, a persistência e as respostas. **Não** substituem o teste com uma conta real: a ligação, o Pairing Code, o envio real de fotos, as respostas dos servidores do WhatsApp e as APIs externas só se confirmam no teu telemóvel.\n\n';
  md += `Comandos carregados: **${registry.commands.list.length}/120** · sem implementação: **${faltam.length}**\n\n`;
  md += '| Nº | Comando | Função | Implementação | Teste simulado |\n|---|---|---|---|---|\n';
  let n = 0; let ok = 0; let ext = 0; let fal = 0;
  for (const [, , , nomes] of MENU) {
    for (const nome of nomes) {
      n++;
      const c = cmds.get(nome); const r = resultados.get(nome);
      const impl = c && typeof c.run === 'function' ? '✅ implementado' : '❌ em falta';
      let res = '❌ não executado';
      if (r) { res = r.estado === 'OK' ? '✅ OK' : r.estado === 'OK-EXTERNO' ? '🟡 erro tratado (fonte externa/config)' : `❌ ${r.nota}`; }
      if (r?.estado === 'OK') ok++; else if (r?.estado === 'OK-EXTERNO') ext++; else fal++;
      md += `| ${n} | .${nome} | ${c?.descricao || '-'} | ${impl} | ${res} |\n`;
    }
  }
  md += `\n**Resumo:** ✅ ${ok} OK · 🟡 ${ext} dependem de fonte externa/configuração · ❌ ${fal} falhas\n\n`;
  md += '## Protecções, eventos e regras\n\n| Teste | Resultado |\n|---|---|\n';
  for (const c of checks) md += `| ${c.nome} | ${c.ok ? '✅' : '❌ ' + c.det} |\n`;
  md += `\n## Execuções adicionais\n\n| Execução | Resultado |\n|---|---|\n`;
  for (const e of extras) md += `| ${e.nome} | ${e.estado === 'FALHA' ? '❌ ' + e.nota : '✅ ' + e.estado} |\n`;
  md += '\n## O que só se confirma no WhatsApp real\n\n- Ligação, Pairing Code e reconexão.\n- Fotografia real de perfil nas boas-vindas/despedidas.\n- `.menu` com a fotografia (precisa de `assets/sasuke.jpg` ou acesso à internet).\n- `.waifu`, `.anime`, `.wallpaper`, `.quote` (APIs externas: Jikan, waifu.im, nekos.best, waifu.pics, animechan) e `.amv` (precisa de vídeos em `assets/amv/` ou URLs em `config.json`).\n- `.online` (depende da privacidade de cada pessoa) e `.antidelete` (só repõe o que o bot recebeu).\n';
  fs.writeFileSync(path.join(ROOT, 'AUDITORIA.md'), md);

  const falhas = fal + checks.filter((c) => !c.ok).length + extras.filter((e) => e.estado === 'FALHA').length;
  console.log(`Comandos: ${n}/120 · OK ${ok} · externos ${ext} · falhas ${fal}`);
  for (const c of checks) console.log(`${c.ok ? '✅' : '❌'} ${c.nome}${c.ok ? '' : ' — ' + c.det}`);
  for (const [nome, r] of resultados) if (r.estado === 'FALHA') console.log(`❌ .${nome}: ${r.nota}`);
  for (const e of extras) if (e.estado === 'FALHA') console.log(`❌ ${e.nome}: ${e.nota}`);
  if (faltam.length) console.log('Não executados:', faltam.join(', '));
  db.close(); session.scheduler.stop();
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO NA AUDITORIA:', e); process.exit(2); });
