'use strict';
// Testes reais dos módulos que não dependem do WhatsApp: node scripts/selftest.js
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../config.json');
const { Database } = require('../src/database/db');
const { Permissions } = require('../src/services/permissions');
const { Rental } = require('../src/services/rental');
const { MessageScheduler } = require('../src/services/messageScheduler');
const { loadCommands } = require('../src/handlers/registry');
const { DAY } = require('../src/utils/helpers');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sasuke-'));
const results = [];
async function t(nome, fn) {
  try { await fn(); results.push([true, nome]); } catch (e) { results.push([false, nome, e.message]); }
}
const G1 = '120363000000000001@g.us';
const G2 = '120363000000000002@g.us';

(async () => {
  // ---------- Base de dados ----------
  await t('DB: cria ficheiros e persiste após reinício', () => {
    const dir = path.join(tmp, 'db1');
    const db = new Database(dir, { backupIntervaloMin: 0 }).init();
    db.groupOf('nano', G1, () => ({ gatilhos: { oi: 'olá' } }));
    db.close();
    const db2 = new Database(dir, { backupIntervaloMin: 0 }).init();
    assert.strictEqual(db2.get('nano').grupos[G1].gatilhos.oi, 'olá');
    for (const n of ['grupos', 'alugueis', 'usuarios', 'advertencias', 'nano', 'configuracoes', 'compras', 'ranking', 'pagamentos']) {
      assert.ok(fs.existsSync(path.join(dir, n + '.json')), n);
    }
    db2.close();
  });

  await t('DB: recupera ficheiro corrompido a partir de backup', () => {
    const dir = path.join(tmp, 'db2');
    const db = new Database(dir, { backupIntervaloMin: 0 }).init();
    db.groupOf('nano', G1, () => ({ x: 1 }));
    db.close(); // cria backup com os dados
    fs.writeFileSync(path.join(dir, 'nano.json'), '{ isto não é json');
    const db2 = new Database(dir, { backupIntervaloMin: 0 }).init();
    assert.strictEqual(db2.get('nano').grupos[G1].x, 1);
    db2.close();
  });

  await t('DB: dados de grupos diferentes ficam separados', () => {
    const db = new Database(path.join(tmp, 'db3'), { backupIntervaloMin: 0 }).init();
    db.groupOf('pagamentos', G1, () => ({ texto: 'A' }));
    db.groupOf('pagamentos', G2, () => ({ texto: 'B' }));
    assert.strictEqual(db.get('pagamentos').grupos[G1].texto, 'A');
    assert.strictEqual(db.get('pagamentos').grupos[G2].texto, 'B');
    db.close();
  });

  await t('DB: backups respeitam o limite', () => {
    const db = new Database(path.join(tmp, 'db4'), { backupIntervaloMin: 0, backupsManter: 3 }).init();
    for (let i = 0; i < 6; i++) db.backup('teste');
    assert.ok(fs.readdirSync(db.backupDir).length <= 3);
    db.close();
  });

  // ---------- Aluguer ----------
  const db = new Database(path.join(tmp, 'db5'), { backupIntervaloMin: 0 }).init();
  const rental = new Rental(db, config);

  await t('Aluguer: alugar activa o grupo', () => {
    assert.strictEqual(rental.isActive(G1), false);
    const r = rental.alugar(G1, 30, 'dono', 'Grupo A');
    assert.strictEqual(r.acao, 'alugar');
    assert.strictEqual(r.diasRestantes, 30);
    assert.strictEqual(rental.isActive(G1), true);
    assert.strictEqual(rental.isActive(G2), false);
  });
  await t('Aluguer: renovar soma dias ao fim actual', () => {
    const antes = rental.get(G1).expira;
    const r = rental.alugar(G1, 10);
    assert.strictEqual(r.acao, 'renovar');
    assert.strictEqual(rental.get(G1).expira, antes + 10 * DAY);
  });
  await t('Aluguer: tirardias reduz e pode expirar', () => {
    rental.tirarDias(G1, 5);
    assert.strictEqual(rental.info(G1).diasRestantes, 35);
    const r = rental.tirarDias(G1, 35);
    assert.strictEqual(r.expirou, true);
    assert.strictEqual(rental.isActive(G1), false);
    assert.strictEqual(rental.tick().length, 1); // pendente de aviso
    rental.markNotified(G1);
    assert.strictEqual(rental.tick().length, 0);
  });
  await t('Aluguer: reactivar após expirar preserva histórico', () => {
    rental.alugar(G1, 7);
    assert.strictEqual(rental.isActive(G1), true);
    assert.ok(rental.historico(G1).length >= 4);
  });
  await t('Aluguer: anular cancela e rejeita grupo sem aluguer', () => {
    rental.anular(G1);
    assert.strictEqual(rental.info(G1).estado, 'cancelado');
    assert.throws(() => rental.anular(G2), /não tem aluguer/);
  });
  await t('Aluguer: expira por tempo (tick) e valida entradas', () => {
    rental.alugar(G2, 1);
    rental.get(G2).expira = Date.now() - 1000;
    assert.strictEqual(rental.tick().length, 1);
    assert.strictEqual(rental.info(G2).estado, 'expirado');
    assert.throws(() => rental.alugar(G2, 0), /inválido/);
    assert.throws(() => rental.alugar(G2, 'abc'), /inválido/);
    assert.throws(() => rental.alugar('123@s.whatsapp.net', 5), /grupo inválido/);
  });
  await t('Aluguer: persiste após reinício', () => {
    db.flush();
    const dbB = new Database(db.dir, { backupIntervaloMin: 0 }).init();
    const rB = new Rental(dbB, config);
    assert.strictEqual(rB.isActive(G1), false);
    assert.strictEqual(rB.info(G2).estado, 'expirado');
    assert.ok(rB.historico(G1).length > 0);
    dbB.close();
  });

  // ---------- Permissões ----------
  const perms = new Permissions(db, config);
  const cmdAdmin = { name: 'ban', level: 'admin' };
  const cmdDono = { name: 'alugar', level: 'dono' };
  const cmdSeguro = { name: 'liberar', level: 'admin', nuncaLiberar: true };

  await t('Permissões: dono reconhecido por número internacional', () => {
    assert.ok(perms.isOwner(['258852223969']));
    assert.ok(!perms.isOwner(['258872698781'])); // número do bot não é dono
    assert.ok(!perms.isOwner(['999']));
  });
  await t('Permissões: níveis e verificação por comando', () => {
    const m = { isOwner: false, isAdmin: false, gid: G1, number: '111' };
    assert.strictEqual(perms.can(cmdAdmin, m).ok, false);
    assert.strictEqual(perms.can(cmdAdmin, { ...m, isAdmin: true }).ok, true);
    assert.strictEqual(perms.can(cmdDono, { ...m, isAdmin: true }).ok, false);
    assert.strictEqual(perms.can(cmdDono, { ...m, isOwner: true }).ok, true);
  });
  await t('Permissões: clientes por grupo', () => {
    assert.ok(perms.addCliente(G1, '111'));
    assert.strictEqual(perms.addCliente(G1, '111'), false);
    assert.strictEqual(perms.level({ gid: G1, number: '111' }), 'cliente');
    assert.strictEqual(perms.level({ gid: G2, number: '111' }), 'membro');
    assert.ok(perms.removeCliente(G1, '111'));
  });
  await t('Permissões: .liberar por comando e modo livre', () => {
    const m = { isOwner: false, isAdmin: false, gid: G1, number: '222' };
    perms.setLiberado(G1, 'ban', 'membro');
    assert.strictEqual(perms.can(cmdAdmin, m).ok, true);
    assert.strictEqual(perms.can(cmdAdmin, { ...m, gid: G2 }).ok, false); // outro grupo não é afectado
    perms.removeLiberado(G1, 'ban');
    assert.strictEqual(perms.can(cmdAdmin, m).ok, false);
    perms.setModoLivre(G1, true);
    assert.strictEqual(perms.can(cmdAdmin, m).ok, true);
    assert.strictEqual(perms.can(cmdSeguro, m).ok, false); // nuncaLiberar
    assert.strictEqual(perms.can(cmdDono, m).ok, false);
    perms.setModoLivre(G1, false);
    assert.throws(() => perms.setLiberado(G1, 'ban', 'dono'), /inválido/);
  });

  // ---------- Scheduler ----------
  const fastCfg = { intervals: { text: 20, react: 5, default: 20 }, globalGapMs: 5, retryBaseMs: 20, typing: false, dedupeWindowMs: 300 };
  const mkSock = () => { const s = { sent: [], fail: 0, async sendMessage(jid, c) { if (s.fail > 0) { s.fail--; throw new Error('falha simulada'); } s.sent.push([jid, c]); return { ok: 1 }; } }; return s; };

  await t('Scheduler: mantém a ordem por chat', async () => {
    const sc = new MessageScheduler(fastCfg); const sock = mkSock(); sc.setSocket(sock); sc.setReady(true);
    await Promise.all([1, 2, 3, 4].map((n) => sc.send('a@g.us', { text: 'm' + n })));
    assert.deepStrictEqual(sock.sent.map((x) => x[1].text), ['m1', 'm2', 'm3', 'm4']);
    sc.stop();
  });
  await t('Scheduler: impede mensagens duplicadas', async () => {
    const sc = new MessageScheduler(fastCfg); const sock = mkSock(); sc.setSocket(sock); sc.setReady(true);
    await Promise.all([sc.send('a@g.us', { text: 'igual' }), sc.send('a@g.us', { text: 'igual' })]);
    assert.strictEqual(sock.sent.length, 1);
    assert.strictEqual(sc.stats().duplicados, 1);
    sc.stop();
  });
  await t('Scheduler: retenta e depois consegue', async () => {
    const sc = new MessageScheduler(fastCfg); const sock = mkSock(); sock.fail = 2; sc.setSocket(sock); sc.setReady(true);
    await sc.send('a@g.us', { text: 'retry' });
    assert.strictEqual(sock.sent.length, 1);
    sc.stop();
  });
  await t('Scheduler: desiste após o limite de tentativas', async () => {
    const sc = new MessageScheduler({ ...fastCfg, maxRetries: 2 }); const sock = mkSock(); sock.fail = 99; sc.setSocket(sock); sc.setReady(true);
    await assert.rejects(sc.send('a@g.us', { text: 'x' }), /falha simulada/);
    assert.strictEqual(sock.sent.length, 0);
    sc.stop();
  });
  await t('Scheduler: cancelamento e validação de tarefas', async () => {
    const sc = new MessageScheduler(fastCfg); const sock = mkSock(); sc.setSocket(sock); sc.setReady(true);
    const p1 = sc.send('a@g.us', { text: 'primeira' });
    const p2 = sc.send('a@g.us', { text: 'cancelada' }); p2.catch(() => {});
    const p3 = sc.send('a@g.us', { text: 'invalida', validate: () => false }); p3.catch(() => {});
    sc.cancelChat('a@g.us', 'teste');
    await assert.rejects(p2, /teste/);
    await p1.catch(() => {});
    assert.ok(!sock.sent.some((x) => x[1].text === 'invalida'));
    await assert.rejects(sc.send('a@g.us', null), /inválido/);
    sc.stop();
  });
  await t('Scheduler: respeita o limite de concorrência', async () => {
    const sc = new MessageScheduler({ ...fastCfg, maxConcurrent: 2, globalGapMs: 0 }); sc.setSocket({}); sc.setReady(true);
    let cur = 0; let max = 0;
    const job = () => sc.enqueue('c' + Math.random(), 'admin', async () => { cur++; max = Math.max(max, cur); await new Promise((r) => setTimeout(r, 30)); cur--; }, { typing: false });
    await Promise.all(Array.from({ length: 8 }, job));
    assert.ok(max <= 2, 'max=' + max);
    sc.stop();
  });
  await t('Scheduler: espera pela ligação e falha sem ligação', async () => {
    const sc = new MessageScheduler({ ...fastCfg, readyTimeoutMs: 300 }); sc.setSocket(mkSock());
    await assert.rejects(sc.send('a@g.us', { text: 'x' }), /sem ligação/);
    sc.stop();
  });

  // ---------- Carregador de comandos ----------
  await t('Registo: valida contrato e detecta duplicados', () => {
    const dir = path.join(tmp, 'cmds'); fs.mkdirSync(dir);
    const ok = "module.exports=[{name:'a',categoria:'X',reaction:'⚡',run(){}},{name:'b',aliases:['bb'],categoria:'X',reaction:'⚡',run(){}}];";
    fs.writeFileSync(path.join(dir, 'ok.js'), ok);
    assert.strictEqual(loadCommands(dir).list.length, 2);
    fs.writeFileSync(path.join(dir, 'dup.js'), "module.exports={name:'bb',categoria:'X',reaction:'⚡',run(){}};");
    assert.throws(() => loadCommands(dir), /duplicado/);
    fs.unlinkSync(path.join(dir, 'dup.js'));
    fs.writeFileSync(path.join(dir, 'mau.js'), "module.exports={name:'Mau',categoria:'X',reaction:'⚡',run(){}};");
    assert.throws(() => loadCommands(dir), /inválido/);
    fs.unlinkSync(path.join(dir, 'mau.js'));
    fs.writeFileSync(path.join(dir, '_ignorado.js'), 'throw new Error("não devia carregar")');
    assert.strictEqual(loadCommands(dir).list.length, 2);
  });

  // ---------- Utilitários e serviços novos ----------
  await t('Horário automático: executa uma vez por dia dentro da janela', () => {
    const { due, localParts } = require('../src/services/groupSchedule');
    rental.alugar(G1, 5);
    const cfg = db.groupConfig(G1);
    const agora = Date.now();
    const lp = localParts(agora, 'Africa/Maputo');
    const hh = String(Math.floor(lp.minutes / 60)).padStart(2, '0'); const mm = String(lp.minutes % 60).padStart(2, '0');
    cfg.horario.abrir = `${hh}:${mm}`;
    assert.deepStrictEqual(due(db, rental, 'Africa/Maputo', agora).map((x) => x.acao), ['abrir']);
    assert.strictEqual(due(db, rental, 'Africa/Maputo', agora).length, 0); // já executado hoje
    cfg.horario.fechar = '03:00';
    assert.strictEqual(due(db, rental, 'Africa/Maputo', Date.UTC(2026, 0, 1, 12, 0)).filter((x) => x.acao === 'fechar').length, 0); // fora da janela
  });
  await t('Fonte 1 converte para itálico negrito oficial', () => {
    const { fonte1 } = require('../src/utils/format');
    assert.strictEqual(fonte1('SASUKE'), '𝑺𝑨𝑺𝑼𝑲𝑬');
    assert.strictEqual(fonte1('V31.1'), '𝑽31.1');
  });
  await t('Números moçambicanos e alvos de comandos', () => {
    const { normNum, resolveTargets } = require('../src/utils/targets');
    assert.strictEqual(normNum('841234567'), '258841234567');
    assert.strictEqual(normNum('+258 84 123 4567'), '258841234567');
    assert.strictEqual(normNum('123'), null);
    const r = resolveTargets({ mentioned: ['1@s.whatsapp.net'], quotedSender: '2@s.whatsapp.net', args: ['841234567', '@1'] });
    assert.deepStrictEqual(r, ['1@s.whatsapp.net', '258841234567@s.whatsapp.net']);
  });
  await t('Nano: combina por palavras, ignora acentos e maiúsculas', () => {
    const { combinar } = require('../src/protections/nano');
    const g = [{ id: 1, gatilho: 'Olá', resposta: 'x' }, { id: 2, gatilho: 'preço do plano', resposta: 'y' }];
    assert.strictEqual(combinar('OLA pessoal!', g).id, 1);
    assert.strictEqual(combinar('qual o Preço do plano?', g).id, 2);
    assert.strictEqual(combinar('colada', g), null); // não casa dentro de palavras
  });
  await t('Lista oficial tem exactamente 120 comandos, todos carregados', () => {
    const { TODOS } = require('../src/services/menuData');
    const { loadCommands } = require('../src/handlers/registry');
    assert.strictEqual(TODOS.length, 120);
    assert.strictEqual(new Set(TODOS).size, 120);
    const l = loadCommands(path.join(__dirname, '..', 'src', 'commands')).list.map((c) => c.name).sort();
    assert.deepStrictEqual(l, [...TODOS].sort());
  });

  db.close();
  fs.rmSync(tmp, { recursive: true, force: true });

  const falhas = results.filter((r) => !r[0]);
  for (const r of results) console.log(`${r[0] ? '✅' : '❌'} ${r[1]}${r[0] ? '' : ' — ' + r[2]}`);
  console.log(`\n${results.length - falhas.length}/${results.length} testes passaram.`);
  process.exit(falhas.length ? 1 : 0);
})();
