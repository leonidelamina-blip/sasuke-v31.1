# AUDITORIA — SASUKE V31.1 — SHADOW GOD

Gerado em 2026-11-06T09:30:28.472Z · Node v22.23.4

> Os testes usam um **WhatsApp simulado** (sem rede e sem Baileys). Validam a lógica, as permissões, o aluguer, a persistência e as respostas. **Não** substituem o teste com uma conta real: a ligação, o Pairing Code, o envio real de fotos, as respostas dos servidores do WhatsApp e as APIs externas só se confirmam no teu telemóvel.

Comandos carregados: **120/120** · sem implementação: **0**

| Nº | Comando | Função | Implementação | Teste simulado |
|---|---|---|---|---|
| 1 | .ban | Bane e remove participantes | ✅ implementado | ✅ OK |
| 2 | .kick | Remove participantes | ✅ implementado | ✅ OK |
| 3 | .add | Adiciona participantes pelo número | ✅ implementado | ✅ OK |
| 4 | .promover | Promove a administrador | ✅ implementado | ✅ OK |
| 5 | .rebaixar | Remove a administração | ✅ implementado | ✅ OK |
| 6 | .mute | Silencia participantes (apaga as suas mensagens) | ✅ implementado | ✅ OK |
| 7 | .unmute | Remove o silenciamento | ✅ implementado | ✅ OK |
| 8 | .banlist | Lista os banidos do grupo | ✅ implementado | ✅ OK |
| 9 | .unban | Remove alguém da lista de banidos | ✅ implementado | ✅ OK |
| 10 | .admins | Lista os administradores | ✅ implementado | ✅ OK |
| 11 | .membros | Mostra a contagem e a lista de membros | ✅ implementado | ✅ OK |
| 12 | .online | Mostra quem está online (só quem a privacidade deixa ver) | ✅ implementado | ✅ OK |
| 13 | .abrir | Abre o grupo (todos escrevem) | ✅ implementado | ✅ OK |
| 14 | .fechar | Fecha o grupo (só admins escrevem) | ✅ implementado | ✅ OK |
| 15 | .abrirhorario | Programa a abertura diária do grupo | ✅ implementado | ✅ OK |
| 16 | .fecharhorario | Programa o fecho diário do grupo | ✅ implementado | ✅ OK |
| 17 | .nome | Altera o nome do grupo | ✅ implementado | ✅ OK |
| 18 | .desc | Altera a descrição do grupo | ✅ implementado | ✅ OK |
| 19 | .link | Mostra o link de convite do grupo | ✅ implementado | ✅ OK |
| 20 | .novolink | Revoga o link e cria um novo | ✅ implementado | ✅ OK |
| 21 | .infogp | Informações do grupo | ✅ implementado | ✅ OK |
| 22 | .boasvindas | Liga/desliga as boas-vindas | ✅ implementado | ✅ OK |
| 23 | .nanobemvindo | Personaliza a mensagem de boas-vindas | ✅ implementado | ✅ OK |
| 24 | .saidas | Liga/desliga as despedidas | ✅ implementado | ✅ OK |
| 25 | .nanosaida | Personaliza a mensagem de despedida | ✅ implementado | ✅ OK |
| 26 | .autoresposta | Resposta automática quando o bot é marcado | ✅ implementado | ✅ OK |
| 27 | .hidetag | Marca todos sem mostrar os @ | ✅ implementado | ✅ OK |
| 28 | .marcar | Marca todos os membros | ✅ implementado | ✅ OK |
| 29 | .delete | Apaga a mensagem respondida | ✅ implementado | ✅ OK |
| 30 | .limpar | Apaga as últimas N mensagens vistas pelo bot (máx. 30) | ✅ implementado | ✅ OK |
| 31 | .dectetor | Deteta e anuncia alterações no grupo | ✅ implementado | ✅ OK |
| 32 | .revelar | Mostra os dados da mensagem respondida (sem violar privacidade) | ✅ implementado | ✅ OK |
| 33 | .nano | Estado e controlo do sistema Nano (gatilhos e respostas) | ✅ implementado | ✅ OK |
| 34 | .nanoadd | Adiciona um gatilho e resposta | ✅ implementado | ✅ OK |
| 35 | .nanolist | Lista os gatilhos do grupo | ✅ implementado | ✅ OK |
| 36 | .nanodel | Remove um gatilho (nº ou texto) | ✅ implementado | ✅ OK |
| 37 | .limparnano | Apaga todos os gatilhos do grupo | ✅ implementado | ✅ OK |
| 38 | .antilink | Apaga links de grupos do WhatsApp | ✅ implementado | ✅ OK |
| 39 | .antilinkhard | Apaga qualquer link | ✅ implementado | ✅ OK |
| 40 | .anticanal | Apaga links e reencaminhamentos de canais | ✅ implementado | ✅ OK |
| 41 | .antifoto | Apaga fotos | ✅ implementado | ✅ OK |
| 42 | .antivideo | Apaga vídeos | ✅ implementado | ✅ OK |
| 43 | .antiaudio | Apaga áudios | ✅ implementado | ✅ OK |
| 44 | .antisticker | Apaga stickers | ✅ implementado | ✅ OK |
| 45 | .antidoc | Apaga documentos | ✅ implementado | ✅ OK |
| 46 | .antiviewonce | Apaga mensagens de visualização única | ✅ implementado | ✅ OK |
| 47 | .antifake | Remove números fora dos prefixos permitidos (por defeito +258) | ✅ implementado | ✅ OK |
| 48 | .antiflood | Avisa quem envia mensagens depressa demais | ✅ implementado | ✅ OK |
| 49 | .antipalavrao | Apaga mensagens com palavrões | ✅ implementado | ✅ OK |
| 50 | .antidelete | Repõe mensagens apagadas (só as que o bot recebeu) | ✅ implementado | ✅ OK |
| 51 | .automover | Remove quem atinge o limite de avisos | ✅ implementado | ✅ OK |
| 52 | .maxavisos | Define o limite de avisos e gere avisos de membros | ✅ implementado | ✅ OK |
| 53 | .compra | Informações de compra e registo de pedidos | ✅ implementado | ✅ OK |
| 54 | .tabela | Tabela de preços do grupo | ✅ implementado | ✅ OK |
| 55 | .contas | Contas do grupo | ✅ implementado | ✅ OK |
| 56 | .carteira | Carteira do grupo | ✅ implementado | ✅ OK |
| 57 | .pagamento | Formas de pagamento do grupo | ✅ implementado | ✅ OK |
| 58 | .megas | Pacotes de megas do grupo | ✅ implementado | ✅ OK |
| 59 | .loja | Loja do grupo | ✅ implementado | ✅ OK |
| 60 | .saldo | Os teus pontos e pedidos neste grupo | ✅ implementado | ✅ OK |
| 61 | .addmpesa | Regista um número M-Pesa do grupo | ✅ implementado | ✅ OK |
| 62 | .addemola | Regista um número e-Mola do grupo | ✅ implementado | ✅ OK |
| 63 | .antiburlador | Alerta contra comprovativos falsos | ✅ implementado | ✅ OK |
| 64 | .liberartodos | Modo livre: membros usam comandos de administração (excepto os sensíveis) | ✅ implementado | ✅ OK |
| 65 | .liberar | Define quem pode usar um comando (ex.: .liberar ban) | ✅ implementado | ✅ OK |
| 66 | .clientes | Gere os clientes do grupo | ✅ implementado | ✅ OK |
| 67 | .modolivre | Liga/desliga o modo livre | ✅ implementado | ✅ OK |
| 68 | .bloqueartodos | Desactiva o modo livre e remove todas as liberações | ✅ implementado | ✅ OK |
| 69 | .permissoes | Mostra o teu nível e as permissões do grupo | ✅ implementado | ✅ OK |
| 70 | .alugar | Activa ou renova o aluguer de um grupo | ✅ implementado | ✅ OK |
| 71 | .tirardias | Remove dias de um aluguer | ✅ implementado | ✅ OK |
| 72 | .anular | Cancela o aluguer de um grupo | ✅ implementado | ✅ OK |
| 73 | .alugueis | Lista os grupos e o estado dos alugueres | ✅ implementado | ✅ OK |
| 74 | .conectar | Liga uma nova sessão por Pairing Code | ✅ implementado | ✅ OK |
| 75 | .qrcode | Liga uma nova sessão por QR Code | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 76 | .sessoes | Lista e gere as sessões ligadas | ✅ implementado | ✅ OK |
| 77 | .bangp | Bloqueia/desbloqueia um grupo (o bot ignora-o) | ✅ implementado | ✅ OK |
| 78 | .sasuke | Fotografia e ficha de Sasuke Uchiha | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 79 | .naruto | Fotografia e ficha de Naruto Uzumaki | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 80 | .itachi | Fotografia e ficha de Itachi Uchiha | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 81 | .waifu | Waifu aleatória com fotografia, nome e anime | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 82 | .anime | Pesquisa um personagem de anime | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 83 | .wallpaper | Wallpaper de anime | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 84 | .quote | Frase de anime com fotografia | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 85 | .amv | Envia um AMV da biblioteca local ou de fontes configuradas | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 86 | .otaku | Ranking de pontos dos utilizadores | ✅ implementado | ✅ OK |
| 87 | .madara | Fotografia e ficha de Madara Uchiha | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 88 | .kakashi | Fotografia e ficha de Kakashi Hatake | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 89 | .sakura | Fotografia e ficha de Sakura Haruno | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 90 | .hinata | Fotografia e ficha de Hinata Hyuga | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 91 | .obito | Fotografia e ficha de Obito Uchiha | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 92 | .menu | Menu oficial com fotografia | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 93 | .dono | Dados do proprietário | ✅ implementado | ✅ OK |
| 94 | .sobre | Informações do bot | ✅ implementado | ✅ OK |
| 95 | .ping | Latência real, uptime e estado do sistema | ✅ implementado | ✅ OK |
| 96 | .perfil | O teu perfil (ou de quem marcares) | ✅ implementado | ✅ OK |
| 97 | .canal | Canal oficial | ✅ implementado | 🟡 erro tratado (fonte externa/config) |
| 98 | .dado | Lança um dado (padrão 6 lados) | ✅ implementado | ✅ OK |
| 99 | .moeda | Cara ou coroa | ✅ implementado | ✅ OK |
| 100 | .8ball | Bola mágica | ✅ implementado | ✅ OK |
| 101 | .ranking | Membros mais activos do grupo | ✅ implementado | ✅ OK |
| 102 | .beijar | beijar alguém | ✅ implementado | ✅ OK |
| 103 | .abraçar | abraçar alguém | ✅ implementado | ✅ OK |
| 104 | .socar | socar alguém | ✅ implementado | ✅ OK |
| 105 | .style-menu | Estilo visual do menu e identidade | ✅ implementado | ✅ OK |
| 106 | .jutsu | Jutsu aleatório | ✅ implementado | ✅ OK |
| 107 | .sharingan | Descobre o teu nível de Sharingan (diversão, muda por dia) | ✅ implementado | ✅ OK |
| 108 | .ship | Compatibilidade entre duas pessoas (diversão) | ✅ implementado | ✅ OK |
| 109 | .casal | Casal do dia (diversão) | ✅ implementado | ✅ OK |
| 110 | .daily | Prémio diário de pontos | ✅ implementado | ✅ OK |
| 111 | .settabela | Define a tabela do grupo | ✅ implementado | ✅ OK |
| 112 | .setpagamento | Define o pagamento do grupo | ✅ implementado | ✅ OK |
| 113 | .setmegas | Define os megas do grupo | ✅ implementado | ✅ OK |
| 114 | .setcontas | Define as contas do grupo | ✅ implementado | ✅ OK |
| 115 | .setcarteira | Define a carteira do grupo | ✅ implementado | ✅ OK |
| 116 | .setcompra | Define as instruções de compra do grupo | ✅ implementado | ✅ OK |
| 117 | .setloja | Define a loja do grupo | ✅ implementado | ✅ OK |
| 118 | .vertabela | Proprietário: vê a tabela de um grupo | ✅ implementado | ✅ OK |
| 119 | .limpartabela | Proprietário: apaga a tabela de um grupo | ✅ implementado | ✅ OK |
| 120 | .verloja | Proprietário: vê a loja de um grupo | ✅ implementado | ✅ OK |

**Resumo:** ✅ 104 OK · 🟡 16 dependem de fonte externa/configuração · ❌ 0 falhas

## Protecções, eventos e regras

| Teste | Resultado |
|---|---|
| antilink apaga link de grupo e avisa | ✅ |
| antipalavrao apaga palavrão | ✅ |
| antifoto apaga imagem | ✅ |
| antiviewonce apaga visualização única | ✅ |
| administradores são isentos das protecções | ✅ |
| antiflood reage a rajadas | ✅ |
| avisos e ocorrências ficam registados | ✅ |
| mute apaga mensagens de silenciados | ✅ |
| nano responde ao gatilho | ✅ |
| antidelete repõe mensagem apagada (já recebida) | ✅ |
| membro sem permissão não usa .ban (❌) | ✅ |
| administrador usa comandos de administração | ✅ |
| grupo sem aluguer recebe o aviso com dados do dono | ✅ |
| grupo sem aluguer não executa comandos reservados | ✅ |
| dados do dono não aparecem em comandos normais | ✅ |
| tabela do grupo A e do grupo B ficam separadas | ✅ |
| boas-vindas enviadas com menção e nome do grupo | ✅ |
| despedida enviada (saída voluntária) | ✅ |
| despedida diferencia remoção por admin | ✅ |
| antifake remove números fora do +258 | ✅ |
| banido que volta é removido outra vez | ✅ |
| sem aluguer não há boas-vindas | ✅ |
| anular desactiva o aluguer | ✅ |
| após anular, o grupo volta a receber aviso de aluguer | ✅ |

## Execuções adicionais

| Execução | Resultado |
|---|---|
| .nanoadd oi | olá {nome} | ✅ OK |
| .compra pedir 5GB | ✅ OK |
| .compra lista | ✅ OK |
| .compra confirmar 1 | ✅ OK |
| .bangp | ✅ OK |
| .mute @258843333333 | ✅ OK |
| .unmute @258843333333 | ✅ OK |

## O que só se confirma no WhatsApp real

- Ligação, Pairing Code e reconexão.
- Fotografia real de perfil nas boas-vindas/despedidas.
- `.menu` com a fotografia (precisa de `assets/sasuke.jpg` ou acesso à internet).
- `.waifu`, `.anime`, `.wallpaper`, `.quote` (APIs externas: Jikan, waifu.im, nekos.best, waifu.pics, animechan) e `.amv` (precisa de vídeos em `assets/amv/` ou URLs em `config.json`).
- `.online` (depende da privacidade de cada pessoa) e `.antidelete` (só repõe o que o bot recebeu).
