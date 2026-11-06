'use strict';
const textos = require('../utils/textos');
const { conhecidos, resolverGrupo, sessaoDe } = require('../utils/grupos');
const { userError, waitEvent } = require('../utils/format');
const { parseDays, digits } = require('../utils/helpers');

const D = { categoria: 'Proprietário', level: 'dono', nuncaLiberar: true, free: true };
const nomeGrupo = (ctx, gid) => ctx.db.groupRecord(gid).nome || gid;

async function avisar(ctx, gid, texto) {
  if (gid === ctx.jid) return ctx.send({ text: texto });
  await sessaoDe(ctx, gid).scheduler.send(gid, { text: texto });
  return null;
}

module.exports = [
  {
    ...D, name: 'alugar', reaction: '👑', descricao: 'Activa ou renova o aluguer de um grupo',
    async run(ctx) {
      const dias = parseDays(ctx.args[0]);
      if (!dias) throw userError('Uso: .alugar <dias> [nº da lista .alugueis | ID do grupo]\nDentro do grupo basta .alugar 30');
      const gid = await resolverGrupo(ctx, ctx.args[1], { refresh: true });
      const r = ctx.rental.alugar(gid, dias, ctx.number, ctx.db.groupRecord(gid).nome);
      ctx.session.groups.invalidate(gid);
      let aviso = '';
      try { await avisar(ctx, gid, textos.aluguelAtivo(dias)); } catch (e) { aviso = `\n⚠️ Aluguer registado, mas não consegui avisar o grupo: ${e.message}`; }
      if (gid !== ctx.jid) await ctx.reply(`✅ ${r.acao === 'alugar' ? 'Alugado' : 'Renovado'}: ${nomeGrupo(ctx, gid)}\n⏳ Restam ${r.diasRestantes} dias.${aviso}`);
      else if (r.acao === 'renovar') await ctx.reply(`⏳ Total de dias restantes: ${r.diasRestantes}.`);
    },
  },
  {
    ...D, name: 'tirardias', reaction: '➖', descricao: 'Remove dias de um aluguer',
    async run(ctx) {
      const dias = parseDays(ctx.args[0]);
      if (!dias) throw userError('Uso: .tirardias <dias> [nº da lista | ID do grupo]');
      const gid = await resolverGrupo(ctx, ctx.args[1]);
      const r = ctx.rental.tirarDias(gid, dias, ctx.number);
      await ctx.reply(`➖ ${dias} dia(s) removido(s) de ${nomeGrupo(ctx, gid)}.\n` + (r.expirou ? '🥀 O aluguer expirou (o grupo será avisado).' : `⏳ Restam ${r.diasRestantes} dias.`));
    },
  },
  {
    ...D, name: 'anular', reaction: '🚫', descricao: 'Cancela o aluguer de um grupo',
    async run(ctx) {
      const gid = await resolverGrupo(ctx, ctx.args[0]);
      ctx.rental.anular(gid, ctx.number);
      let aviso = '';
      try { await avisar(ctx, gid, textos.aluguelAnulado(ctx.config)); } catch (e) { aviso = `\n⚠️ Não consegui avisar o grupo: ${e.message}`; }
      if (gid !== ctx.jid) await ctx.reply(`🚫 Aluguer anulado: ${nomeGrupo(ctx, gid)}.${aviso}`);
    },
  },
  {
    ...D, name: 'alugueis', reaction: '📜', descricao: 'Lista os grupos e o estado dos alugueres',
    async run(ctx) {
      const lista = await conhecidos(ctx, { refresh: true });
      if (!lista.length) return ctx.reply('📜 Ainda não conheço nenhum grupo.');
      const filtro = (ctx.args[0] || '').toLowerCase();
      const linhas = [];
      let ativos = 0;
      lista.forEach((g, i) => {
        const inf = ctx.rental.info(g.gid);
        if (inf.estado === 'ativo') ativos++;
        const est = inf.estado === 'ativo' ? `✅ ${inf.diasRestantes}d` : inf.estado === 'nenhum' ? '➖ sem aluguer' : `❌ ${inf.estado}`;
        if (filtro === 'ativos' && inf.estado !== 'ativo') return;
        if (filtro === 'expirados' && !['expirado', 'cancelado'].includes(inf.estado)) return;
        linhas.push(`${i + 1}. ${g.nome || g.gid}${g.bloqueado ? ' 🔒' : ''} — ${est}`);
      });
      await ctx.reply(`📜 Grupos (${lista.length}) · ✅ activos: ${ativos}\n\n${linhas.slice(0, 80).join('\n') || 'Nada a mostrar.'}${linhas.length > 80 ? `\n…e mais ${linhas.length - 80}` : ''}\n\nUsa o número da lista: .alugar 30 3`);
    },
  },
  {
    ...D, name: 'conectar', reaction: '🔌', descricao: 'Liga uma nova sessão por Pairing Code',
    async run(ctx) {
      const phone = digits(ctx.args[0]);
      if (!/^\d{10,15}$/.test(phone)) throw userError('Uso: .conectar 258xxxxxxxxx (número internacional da conta do novo bot)');
      if (phone === ctx.config.dono.internacional) throw userError('Esse é o número do proprietário. Usa o número de uma conta dedicada ao bot.');
      if (!ctx.sessions) throw userError('Gestor de sessões indisponível.');
      if (ctx.sessions.list().length >= ctx.config.sessoes.max) throw userError(`Limite de ${ctx.config.sessoes.max} sessões atingido.`);
      const id = 's' + phone;
      if (ctx.sessions.get(id)) throw userError('Essa sessão já existe. Vê com .sessoes');
      const s = await ctx.sessions.add(id, { phone });
      let code;
      try { code = await waitEvent(s, 'pairing', 45000); } catch {
        await ctx.sessions.remove(id, { apagarAuth: true });
        throw userError('Não consegui obter o código de emparelhamento. Tenta de novo.');
      }
      await ctx.reply(`🔌 Código para +${phone}:\n\n${code}\n\nNo WhatsApp dessa conta: Aparelhos ligados › Ligar com número de telefone. Aguardo a ligação (2 min)…`);
      try { await waitEvent(s, 'open', 120000); await ctx.reply(`✅ Sessão ${id} ligada.`); } catch {
        await ctx.reply(`⏳ A sessão ${id} ainda não ligou. Podes remover com .sessoes remover ${id}`);
      }
    },
  },
  {
    ...D, name: 'qrcode', reaction: '📷', descricao: 'Liga uma nova sessão por QR Code',
    async run(ctx) {
      let QR;
      try { QR = require('qrcode'); } catch { throw userError('Dependência "qrcode" em falta. Executa: npm install'); }
      if (!ctx.sessions) throw userError('Gestor de sessões indisponível.');
      if (ctx.sessions.list().length >= ctx.config.sessoes.max) throw userError(`Limite de ${ctx.config.sessoes.max} sessões atingido.`);
      const id = 'qr' + Date.now().toString(36);
      const s = await ctx.sessions.add(id, {}, { persist: false });
      let ligou = false;
      try {
        for (let i = 0; i < 4 && !ligou; i++) {
          const ev = await Promise.race([waitEvent(s, 'qr', 40000).then((q) => ({ q })), waitEvent(s, 'open', 40000).then(() => ({ open: true }))]);
          if (ev.open) { ligou = true; break; }
          const png = await QR.toBuffer(ev.q, { width: 420, margin: 2 });
          await ctx.send({ image: png, caption: `📷 QR da sessão ${id} (${i + 1}/4). Lê em: Aparelhos ligados › Ligar um aparelho.` });
          const r = await Promise.race([waitEvent(s, 'open', 55000).then(() => 'open'), waitEvent(s, 'qr', 55000).then(() => 'qr')]).catch(() => 'tempo');
          if (r === 'open') ligou = true;
        }
      } finally {
        if (ligou) { ctx.sessions.persist(id, null); }
        else await ctx.sessions.remove(id, { apagarAuth: true });
      }
      if (!ligou) throw userError('O QR expirou sem ligação. Tenta de novo com .qrcode');
      await ctx.reply(`✅ Sessão ${id} ligada e guardada.`);
    },
  },
  {
    ...D, name: 'sessoes', reaction: '🧩', descricao: 'Lista e gere as sessões ligadas',
    async run(ctx) {
      if (!ctx.sessions) throw userError('Gestor de sessões indisponível.');
      const a = (ctx.args[0] || '').toLowerCase();
      const id = ctx.args[1];
      if (a === 'parar' || a === 'iniciar' || a === 'remover') {
        if (!id) throw userError(`Uso: .sessoes ${a} <id>`);
        if (id === ctx.config.sessaoPrincipal) throw userError('A sessão principal não pode ser gerida por aqui.');
        if (!ctx.sessions.get(id)) throw userError('Sessão inexistente.');
        if (a === 'parar') await ctx.sessions.stop(id);
        else if (a === 'iniciar') await ctx.sessions.resume(id);
        else await ctx.sessions.remove(id, { apagarAuth: true });
        return ctx.reply(`🧩 Sessão ${id}: ${a === 'parar' ? 'parada' : a === 'iniciar' ? 'iniciada' : 'removida (credenciais apagadas)'}.`);
      }
      const l = ctx.sessions.list();
      await ctx.reply(`🧩 Sessões (${l.length}):\n` + l.map((s) => `• ${s.id}${s.numero ? ' (+' + s.numero + ')' : ''} — ${s.estado} · fila ${s.fila.pendentes}`).join('\n') + '\n\nUso: .sessoes parar|iniciar|remover <id>');
    },
  },
  {
    ...D, name: 'bangp', reaction: '⛔', descricao: 'Bloqueia/desbloqueia um grupo (o bot ignora-o)',
    async run(ctx) {
      const sair = ctx.args.includes('sair');
      const token = ctx.args.find((a) => a !== 'sair');
      const gid = await resolverGrupo(ctx, token, { refresh: true });
      const rec = ctx.db.groupRecord(gid);
      rec.bloqueado = !rec.bloqueado;
      ctx.db.save('grupos');
      let extra = '';
      if (rec.bloqueado && sair) {
        try { await sessaoDe(ctx, gid).scheduler.run(gid, (s) => s.groupLeave(gid)); extra = '\n👋 O bot saiu do grupo.'; } catch (e) { extra = `\n⚠️ Não consegui sair: ${e.message}`; }
      }
      await ctx.reply(`${rec.bloqueado ? '⛔ Grupo BLOQUEADO' : '✅ Grupo DESBLOQUEADO'}: ${rec.nome || gid}${extra}${rec.bloqueado && !sair ? '\nℹ️ Usa ".bangp sair" para o bot também sair do grupo.' : ''}`);
    },
  },
];
