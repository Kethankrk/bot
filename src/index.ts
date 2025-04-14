import makeWASocket, { proto, useMultiFileAuthState } from "baileys";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { db } from "./db";
import { messageTable, userTable } from "./db/schema";
import { eq } from "drizzle-orm";

class WhatsAppBot {
  private sock!: ReturnType<typeof makeWASocket>;
  private db: LibSQLDatabase = db;

  constructor() {
    (async () => {
      await this.init();

      this.sock.ev.on("messages.upsert", async ({ messages }) => {
        messages.forEach(async (message) => {
          if (message.key.fromMe) return;
          await this.saveMessage(message);
        });
      });
    })();
  }

  async init(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");

    this.sock = makeWASocket({
      printQRInTerminal: true,
      auth: state,
    });

    this.sock.ev.on("creds.update", saveCreds);
  }

  async saveMessage(message: proto.IWebMessageInfo): Promise<void> {
    try {
      const messageText = message.message?.extendedTextMessage?.text;
      if (!messageText) return;

      let userId: string;
      const [existingUser] = await this.db
        .select()
        .from(userTable)
        .where(eq(userTable.id, message.key.remoteJid!));

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const [user] = await this.db
          .insert(userTable)
          .values({
            id: message.key.remoteJid!,
            phone: message.key.remoteJid?.split("@")[0]!,
          })
          .returning({ id: userTable.id });
        userId = user.id;
      }

      this.db.insert(messageTable).values({
        senderId: userId,
        content: messageText,
      });
      console.log("Message saved successfully");
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }
}

const main = async () => {
  const bot = new WhatsAppBot();
  await bot.init();
};

main();
