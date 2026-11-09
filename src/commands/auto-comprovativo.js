// 🩸 SASUKE V31.2 — SHADOW GOD
// MODULE: COMPRA

const fs = require("fs");
const path = require("path");

const DB = path.join(__dirname, "../../database/compras.json");

function carregar() {
    try {
        if (!fs.existsSync(DB)) {
            fs.mkdirSync(path.dirname(DB), { recursive: true });
            fs.writeFileSync(DB, "{}");
        }
        return JSON.parse(fs.readFileSync(DB, "utf8"));
    } catch {
        return {};
    }
}

function guardar(data) {
    fs.mkdirSync(path.dirname(DB), { recursive: true });
    fs.writeFileSync(DB, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "compra",
    alias: ["comprar", "pedido"],
    desc: "Registar uma compra",
    category: "PAGAMENTOS",

    async run({ sock, m, args, from }) {
        const reagir = async (emoji) => {
            try {
                await sock.sendMessage(from, {
                    react: { text: emoji, key: m.key }
                });
            } catch {}
        };

        try {
            const quantidade = Number(args[0]);

            if (!Number.isSafeInteger(quantidade) || quantidade <= 0) {
                await reagir("⚠️");
                return sock.sendMessage(from, {
                    text: `╔═══ 🩸 𝑺𝑯𝑨𝑫𝑶𝑾 𝑮𝑶𝑫 🩸 ═══╗
        𝑪𝑶𝑴𝑨𝑵𝑫𝑶 𝑪𝑶𝑴𝑷𝑹𝑨
╚════════════════════════╝

👁️ Informe uma quantidade válida.

⚫ Exemplo: .compra 500

🥀 Nenhum pedido foi registado.

— 𝑺𝑨𝑺𝑼𝑲𝑬 𝑽31.2`
                }, { quoted: m });
            }

            const user = m.key.participant || m.key.remoteJid;
            const db = carregar();

            if (!db[from]) db[from] = [];
            
            const pedido = {
                id: `SAS-${Date.now()}`,
                usuario: user,
                quantidade,
                estado: "PENDENTE",
                data: new Date().toISOString()
            };

            db[from].push(pedido);
            guardar(db);

            await reagir("🩸");

            return sock.sendMessage(from, {
                text: `╔═══ 🩸 𝑺𝑯𝑨𝑫𝑶𝑾 𝑮𝑶𝑫 🩸 ═══╗
          𝑷𝑬𝑫𝑰𝑫𝑶 𝑹𝑬𝑮𝑰𝑺𝑻𝑨𝑫𝑶
╚════════════════════════╝

👁️ Código: ${pedido.id}
⚫ Quantidade: ${quantidade}
🥀 Estado: PENDENTE

🩸 O teu pedido foi registado.
Aguarda a confirmação do pagamento.

⚠️ REGISTAR NÃO SIGNIFICA PAGAR.

「 𝑺𝑨𝑺𝑼𝑲𝑬 𝑽31.2 — 𝑪𝑶𝑹𝑬 77 」`
            }, { quoted: m });

        } catch (error) {
            console.error("[SASUKE COMPRA]", error);
            await reagir("❌");
            return sock.sendMessage(from, {
                text: "🩸 Erro ao registar o pedido. Tenta novamente."
            }, { quoted: m });
        }
    }
};