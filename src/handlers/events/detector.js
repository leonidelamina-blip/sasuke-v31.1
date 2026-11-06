'use strict';
const { jidToNumber } = require('../../utils/helpers');
const welcome = require('../../services/welcome');
const log = require('../../utils/logger');

const ativo = (env, gid) => env.rental.isActive(gid) && env.db.groupConfig(gid).dectetor;

// .dectetor: anuncia promoções, despromoções e alterações ao grupo.
module.exports = [
  {
    event: 'group-participants.update',
    async run(env, data) {
      const { id: gid, action, author } = data;
      if (!['promote', 'demote'].includes(action) || !ativo(env, gid)) return;
      for (const raw of data.participants || []) {
        const jid = welcome.partJid(raw);
        const quem = author ? `@${jidToNumber(author)} ` : '';
        const t = action === 'promote'
          ? `👑 ${quem}promoveu @${jidToNumber(jid)} a administrador.`
          : `⬇️ ${quem}removeu a administração de @${jidToNumber(jid)}.`;
        await env.scheduler.send(gid, { text: t, mentions: [jid, author].filter(Boolean) }).catch((e) => log.warn(e.message));
      }
    },
  },
  {
    event: 'groups.update',
    async run(env, u) {
      const gid = u.id;
      if (!gid || !ativo(env, gid)) return;
      const l = [];
      if (u.subject !== undefined) l.push(`📝 Nome do grupo alterado para: ${u.subject}`);
      if (u.desc !== undefined) l.push('📄 A descrição do grupo foi alterada.');
      if (u.announce === true) l.push('🔒 Agora só os administradores podem enviar mensagens.');
      if (u.announce === false) l.push('🔓 Agora todos podem enviar mensagens.');
      if (u.restrict === true) l.push('⚙️ Só os administradores podem editar as informações do grupo.');
      if (u.restrict === false) l.push('⚙️ Todos podem editar as informações do grupo.');
      if (!l.length) return;
      await env.scheduler.send(gid, { text: `👁️ ${l.join('\n')}` }).catch((e) => log.warn(e.message));
    },
  },
];
