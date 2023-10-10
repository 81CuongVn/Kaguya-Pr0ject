import usersController from "./users.controllers.js";

export default function ({ api, event }) {
  var formatCurrency = (number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 9 }).format(number);
  var performTransaction = async ({ action, uid, coins }) => {
    try {
      const data = usersController({ api });

      const user = await data.find(uid);
      const sender = await data.find(event.senderID);
      const actionMessage = action === "increase" ? "cộng" : action === "decrease" ? "trừ" : "chuyển";
      if (!user.status) return { status: false, data: `Không tìm thấy thông tin của người dùng bạn cần ${actionMessage} trong database` };
      if (!sender.status) return { status: false, data: `Không tìm thấy thông tin của bạn trong database` };
      const isInvalidCoins = !coins || isNaN(coins) || coins <= 0;
      const notEnoughCoins = action === "pay" && sender.data.data.money < coins;
      const negativeTotal = (action === "increase" || action === "pay") && user.data.data.money + coins < 0;

      if (isInvalidCoins) return { status: false, data: `Số coins muốn ${actionMessage} không hợp lệ` };
      if (notEnoughCoins) return { status: false, data: `Bạn không đủ số coins để ${actionMessage}` };
      if (negativeTotal) return { status: false, data: `Số coins của bạn không đủ để ${actionMessage} coins` };

      if (!user.status) {
        return {
          status: false,
          data: "Không tìm thấy người dùng trong database",
        };
      }

      const total = action === "increase" || action === "pay" ? user.data.data.money + coins : user.data.data.money - coins;
      const senderMoney = sender.data.data.money;

      await data.update(event.senderID, {
        money: action === "pay" ? senderMoney - coins : senderMoney,
      });
      await data.update(uid, { money: total });
      return {
        status: true,
        data: `Đã ${actionMessage} thành công ${formatCurrency(coins)} vào người dùng: ${user.data.data.name}`,
      };
    } catch (err) {
      console.log(err);
      return {
        status: false,
        data: "Đã xảy ra lỗi tại controllers economy",
      };
    }
  };

  var increase = async (coins, uid) => {
    return performTransaction({ action: "increase", uid, coins });
  };

  var decrease = async (coins, uid) => {
    return performTransaction({ action: "decrease", uid, coins });
  };

  var pay = async (coins, uid) => {
    return performTransaction({ action: "pay", uid, coins });
  };

  var getBalance = async (uid) => {
    try {
      const data = usersController({ api });
      const user = await data.find(uid);

      if (!user.status) {
        return {
          status: false,
          data: "Không tìm thấy người dùng trong database",
        };
      }

      return {
        status: true,
        data: user.data.data.money,
      };
    } catch (err) {
      console.log(err);
      return {
        status: false,
        data: "Đã xảy ra lỗi tại controllers economy",
      };
    }
  };

  return {
    performTransaction,
    increase,
    decrease,
    pay,
    getBalance,
  };
}
