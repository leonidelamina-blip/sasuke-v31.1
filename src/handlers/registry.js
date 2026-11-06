'use strict';
const fs = require('fs');
const path = require('path');
const log = require('../utils/logger');
const { LEVELS } = require('../services/permissions');

const NAME_RE = /^[\p{L}\p{N}_-]+$/u;

function walk(dir) {
  dir = path.resolve(dir);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('_')) continue; // ficheiros "_" são modelos/ignorados
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out.sort();
}

function loadModules(dir) {
  const mods = [];
  for (const file of walk(dir)) {
    const m = require(file);
    for (const item of Array.isArray(m) ? m : [m]) mods.push({ item, file });
  }
  return mods;
}

function validateCommand(c, file) {
  const where = path.relative(process.cwd(), file);
  if (!c || typeof c !== 'object') throw new Error(`${where}: comando inválido`);
  if (typeof c.name !== 'string' || !NAME_RE.test(c.name) || c.name !== c.name.toLowerCase()) {
    throw new Error(`${where}: "name" inválido (minúsculas, sem espaços)`);
  }
  if (typeof c.run !== 'function') throw new Error(`${where}: ".${c.name}" sem função run`);
  if (typeof c.categoria !== 'string') throw new Error(`${where}: ".${c.name}" sem categoria`);
  if (typeof c.reaction !== 'string' || !c.reaction) throw new Error(`${where}: ".${c.name}" sem reaction`);
  if (c.level !== undefined && !LEVELS[c.level]) throw new Error(`${where}: ".${c.name}" com level inválido`);
  for (const a of c.aliases || []) if (typeof a !== 'string' || !NAME_RE.test(a)) throw new Error(`${where}: alias inválido em ".${c.name}"`);
}

function loadCommands(dir) {
  const map = new Map();
  const list = [];
  for (const { item: c, file } of loadModules(dir)) {
    validateCommand(c, file);
    for (const n of [c.name, ...(c.aliases || [])]) {
      if (map.has(n)) throw new Error(`Comando/alias duplicado: ".${n}"`);
      map.set(n, c);
    }
    list.push(c);
  }
  return { map, list };
}

function loadRegistry(root = process.cwd()) {
  const commands = loadCommands(path.join(root, 'src', 'commands'));

  const hooks = loadModules(path.join(root, 'src', 'protections'))
    .map(({ item, file }) => {
      if (typeof item.name !== 'string' || typeof item.onMessage !== 'function') {
        throw new Error(`${path.relative(root, file)}: protecção precisa de { name, onMessage }`);
      }
      return item;
    });

  const events = loadModules(path.join(root, 'src', 'handlers', 'events'))
    .map(({ item, file }) => {
      if (typeof item.event !== 'string' || typeof item.run !== 'function') {
        throw new Error(`${path.relative(root, file)}: evento precisa de { event, run }`);
      }
      return item;
    });

  log.info(`Registo carregado: ${commands.list.length}/120 comandos · ${hooks.length} protecções · ${events.length} eventos`);
  return { commands, hooks, events };
}

module.exports = { loadRegistry, loadCommands };
