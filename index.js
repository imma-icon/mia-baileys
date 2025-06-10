const { Boom } = require("@hapi/boom");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useSingleFileAuthState } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");

const { state, saveState } = useSingleFileAuthState("./auth_info.json");

async function startMia() {
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: P({ level: "silent" }),
    });

    sock.ev.on("creds.update", saveState);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        // Simple AI reply
        if (text.toLowerCase().includes("hello")) {
            await sock.sendMessage(msg.key.remoteJid, { text: "Hi! I'm Mia 🤖" });
        }
    });

    sock.ev.on("group-participants.update", async (update) => {
        if (update.action === "add") {
            for (let participant of update.participants) {
                await sock.sendMessage(update.id, {
                    text: `👋 Welcome <@${participant.split("@")[0]}>! Please introduce yourself.`,
                    mentions: [participant],
                });
            }
        }
    });
}

startMia();