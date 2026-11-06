'use strict';

const TOPO = [
  '╔═══ 🩸 𝑺𝑯𝑨𝑫𝑶𝑾 𝑮𝑶𝑫 🩸 ═══╗',
  '👁️ 𝑴𝑨𝑵𝑮𝑬𝑲𝒀𝑶 𝑺𝑯𝑨𝑹𝑰𝑵𝑮𝑨𝑵',
  '⚫ 𝑺𝑨𝑺𝑼𝑲𝑬 𝑼𝑪𝑯𝑰𝑯𝑨',
  '🩸 "𝑽𝒐𝒄𝒆𝒔 𝒔𝒂𝒐 𝒇𝒓𝒂𝒄𝒐𝒔... 𝒎𝒆 𝒅𝒂𝒐 𝒏𝒐𝒋𝒐."',
  '╚════════════════════════╝',
].join('\n');

// Único sítio (além de .menu/.dono/.sobre) onde os dados do dono podem aparecer.
function semAluguel(config) {
  return [
    '🩸 ESTE GRUPO NÃO TEM ALUGUEL ACTIVO.',
    '',
    '👁️ Para activar o SASUKE SHADOW GOD:',
    '',
    `👑 ${String(config.dono.nome).toUpperCase()}`,
    `📞 ${config.dono.numero}`,
    `🔗 ${config.dono.link}`,
  ].join('\n');
}

function aluguelAtivo(dias) {
  return [
    '🩸 SASUKE V31.1 — SHADOW GOD',
    '',
    '👁️ ALUGUER ACTIVO!',
    '',
    `⚡ Duração: ${dias} dias.`,
    '',
    '👑 CORE 77 ACTIVADO.',
  ].join('\n');
}

function aluguelExpirado(config) {
  return [
    '🩸 SASUKE V31.1 — SHADOW GOD',
    '',
    '🥀 O ALUGUER DESTE GRUPO EXPIROU.',
    '',
    '⚫ As funcionalidades reservadas foram desactivadas.',
    '👁️ Os dados do grupo foram preservados.',
    '',
    semAluguel(config),
  ].join('\n');
}

function aluguelAnulado(config) {
  return [
    '🩸 SASUKE V31.1 — SHADOW GOD',
    '',
    '🥀 O ALUGUER DESTE GRUPO FOI ANULADO.',
    '',
    '⚫ As funcionalidades reservadas foram desactivadas.',
    '👁️ Os dados do grupo foram preservados.',
    '',
    semAluguel(config),
  ].join('\n');
}

const semPermissao = '🩸 Sem permissão para usar este comando.';
const soGrupos = '🩸 Este comando só pode ser usado em grupos.';
const botSemAdmin = '🩸 Preciso de ser administrador do grupo para executar este comando.';
const erroGenerico = '🩸 Ocorreu um erro ao executar o comando. Tenta novamente mais tarde.';

module.exports = { TOPO, semAluguel, aluguelAtivo, aluguelExpirado, aluguelAnulado, semPermissao, soGrupos, botSemAdmin, erroGenerico };
