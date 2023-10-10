export default {
  name: "unsend",
  author: "Kaguya Project",
  cooldowns: 10,
  description: "Gỡ tin nhắn của bot",
  role: "member",
  aliases: ["gỡ"],
  execute: async ({ event }) => {
    if (event?.messageReply?.senderID != api.getCurrentUserID()) {
      return kaguya.reply("Không thể gỡ tin nhắn của người khác!");
    }

    return kaguya.unsend(event.messageReply.messageID, (err) => {
      if (err) {
        return kaguya.reply("Đã xảy ra lỗi, vui lòng thử lại sau!");
      }
    });
  },
};
