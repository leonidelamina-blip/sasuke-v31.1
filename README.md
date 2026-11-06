# 🩸 SASUKE V31.1 — SHADOW GOD
**CORE 77 · Mangekyō Sharingan · Node.js + Baileys** — bot WhatsApp modular, com aluguer por grupo, 120 comandos, protecções, Nano, boas-vindas com foto e fila de envio (Human Response System).

## 1. Instalação (Android / Termux)
```
pkg update && pkg upgrade
pkg install nodejs git unzip
unzip SASUKE-V31.1.zip && cd SASUKE-V31.1
npm install
npm start
```
Em VPS/GitHub: Node.js ≥ 18, `git` instalado (o Baileys precisa), `npm install`, `npm start` (ou `pm2 start index.js --name sasuke`).

## 2. Primeira ligação (Pairing Code)
1. `npm start` mostra **CÓDIGO DE EMPARELHAMENTO** no terminal (conta do número do bot, `config.json → bot.internacional`).
2. No WhatsApp dessa conta: *Aparelhos ligados → Ligar com número de telefone* → escreve o código.
3. Quando aparecer `✅ Ligado ao WhatsApp`, o bot está pronto. As credenciais ficam em `auth/` (**nunca** publiques esta pasta).

## 3. Configuração (`config.json`)
- `dono` / `bot`: números (o do bot e o do dono **têm de ser diferentes**; o arranque recusa se forem iguais).
- Se o bot não te reconhecer como dono (contas com LID), adiciona o teu LID em `dono.lids`.
- `canal`: nome e link do canal (para `.canal`). `amv.urls`: links directos de vídeos para `.amv`.
- `scheduler`: intervalos da fila de envio, tentativas e concorrência.

## 4. Imagens (opcional, recomendado)
- `assets/sasuke.jpg` — foto oficial do `.menu` (se faltar, o bot tenta obtê-la online; se não conseguir, **avisa com erro** e envia o menu sem imagem).
- `assets/padrao.jpg` — imagem usada nas boas-vindas/despedidas quando a pessoa não tem foto pública.
- `assets/anime/<nome>.jpg` — fotos dos personagens (senão são obtidas da Jikan e guardadas aqui). `assets/anime/wallpapers/` — wallpapers próprios. `assets/amv/` — vídeos para `.amv`.

## 5. Como usar (resumo)
1. **Alugar um grupo** (só o dono): adiciona o bot ao grupo e, nesse grupo, `.alugar 30`. Ou, em privado, `.alugueis` (lista numerada) e `.alugar 30 <nº>`.
2. Sem aluguer activo, o grupo só recebe o aviso de aluguer. Com aluguer: todos os comandos, protecções, boas-vindas, etc.
3. **Configurar o negócio do grupo** (admins): `.settabela`, `.setpagamento`, `.setmegas`, `.setcontas`, `.setcarteira`, `.setcompra`, `.setloja`, `.addmpesa 84xxxxxxx Nome`, `.addemola 86xxxxxxx Nome`. Todos consultam com `.tabela`, `.pagamento`, … Cada grupo tem os seus dados separados.
4. **Protecções**: `.antilink on`, `.antiflood on 6 8`, `.antifake on 258`, `.maxavisos 3`, `.automover on`… O bot precisa de ser **administrador** para apagar mensagens e remover membros.
5. **Boas-vindas/despedidas**: `.boasvindas on/off`, `.nanobemvindo <texto>`, `.saidas on/off`, `.nanosaida <texto>`. Variáveis: `{nome} {numero} {grupo} {membros} {data} {hora} {foto}`.
6. **Nano**: `.nanoadd gatilho | resposta`, `.nanolist`, `.nanodel 1`, `.limparnano`, `.nano on/off`.
7. **Permissões**: `.liberar ban` (membros podem usar `.ban`), `.liberar ban admin|cliente|off`, `.clientes add @user`, `.liberartodos`, `.bloqueartodos`, `.permissoes`.
8. **Sessões extra** (dono): `.conectar 258xxxxxxxxx` (Pairing Code), `.qrcode`, `.sessoes`.

## 6. Limites honestos (por desenho)
- `.online` só mostra quem a privacidade deixa ver. `.antidelete` só repõe o que o bot já recebeu. `.revelar` e `.antiviewonce` **não** abrem visualização única.
- `.compra`/`.saldo`: o bot **não** confirma pagamentos nem vê o saldo M-Pesa/e-Mola; os pedidos só ficam *confirmados* quando um admin o faz (`.compra confirmar <nº>`). `.antiburlador` apenas alerta.
- O Baileys não é oficial: usar bots pode levar ao banimento da conta. A fila de mensagens organiza e limita o envio, mas **não** esconde a automação.
- Alguns comandos dependem de APIs externas (Jikan, waifu.im, nekos.best, waifu.pics, animechan). Se estiverem em baixo, o bot diz-o.

## 7. Dados e segurança
- `database/*.json` (escrita atómica, backups automáticos em `database/backups/`, recuperação se um ficheiro corromper). Logs em `logs/`.
- O `.gitignore` já exclui `auth/`, `logs/`, `database/` e backups.

## 8. Testes e auditoria
- `npm test` — testes dos módulos (base de dados, aluguer, permissões, fila, horário…).
- `npm run auditoria` — corre os 120 comandos num WhatsApp **simulado** e gera `AUDITORIA.md`. Não substitui o teste com uma conta real.

## 9. Estrutura
`index.js` · `config.json` · `database/` · `assets/` · `auth/` · `src/commands` (120 comandos, por categoria) · `src/handlers` (mensagens + eventos) · `src/protections` (protecções automáticas) · `src/services` (fila, aluguer, permissões, ligação…) · `src/utils` · `scripts/`.
