'use strict';
const { jidToNumber } = require('../../utils/helpers');
const { botNumbers } = require('../../utils/format');
const { ativo, prot, warnings } = require('../../services/protecao');
const welcome = require('../../services/welcome');
const log = require('../../utils/logger');

// Remoções feitas pelo próprio bot (banidos / antifake): não geram mensagem de despedida.
const silenciar = new Map();
const marcar = (gid, n) => silenciar.set(`${gid}|${n}`, Date.now());
const foiSilenciado = (gid, n) => {
  const t = silenciar.get(`${gid}|${n}`);
  return !!t && Date.now() - t < 60000;
};

async function removerBot(env, gid, jid, motivo) {
  const n = jidToNumber(jid);
  marcar(gid, n);
  await env.scheduler.run(gid, (s) => s.groupParticipantsUpdate(gid, [jid], 'remove'));
  warnings(env.db).ocorrencia(gid, n, motivo, 'remocao');
}

module.exports = {
  event: 'group-participants.update',
  async run(env, data) {
    const { id: gid, action, author } = data;
    const { db, rental, groups, sock } = env;
    if (!gid || !rental.isActive(gid)) return; // funcionalidades reservadas a grupos com aluguer
    const rec = db.groupRecord(gid);
    if (rec.bloqueado) return;

    let meta = null;
    try { meta = await groups.get(sock, gid, true); } catch { /* segue sem metadados */ }
    const bots = botNumbers({ sock });
    const botAdmin = !!meta?.participants?.find((p) => [p.id, p.lid, p.phoneNumber].filter(Boolean).some((x) => bots.includes(jidToNumber(x))))?.admin;

    for (const raw of data.participants || []) {
      const jid = welcome.partJid(raw);
      const num = jidToNumber(jid);
      if (bots.includes(num)) continue;
      try {
        if (action === 'add') {
          if (rec.banidos?.[num]) {
            if (botAdmin) { await removerBot(env, gid, jid, 'banido tentou voltar'); await env.scheduler.send(gid, { text: `🩸 @${num} está banido deste grupo e foi removido.`, mentions: [jid] }); }
            continue;
          }
          if (ativo(db, gid, 'antifake') && botAdmin) {
            const prefs = prot(db, gid, 'antifake').prefixos || ['258'];
            if (!prefs.some((p) => num.startsWith(p))) {
              await removerBot(env, gid, jid, 'número não permitido (antifake)');
              await env.scheduler.send(gid, { text: `🚫 @${num} removido: número fora dos prefixos permitidos (${prefs.map((p) => '+' + p).join(', ')}).`, mentions: [jid] });
              continue;
            }
          }
          await welcome.boasVindas(env, gid, jid, meta);
        } else if (action === 'remove') {
          if (foiSilenciado(gid, num)) continue;
          const removido = !!author && jidToNumber(author) !== num;
          await welcome.despedida(env, gid, jid, meta, removido);
        }
      } catch (e) {
        log.warn(`Evento ${action} em ${gid} (${num}): ${e.message}`);
      }
    }
  },
};
