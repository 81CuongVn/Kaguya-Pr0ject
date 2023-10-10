import login from "./helper/fca/index.js";
import fs from "fs-extra";
import config from "./setup/config.js";
import { listen } from "./listen/listen.js";
import { commandMiddleware, eventMiddleware } from "./middleware/index.js";
import sleep from "time-sleep";
import { log, notifer } from "./logger/index.js";
import path from "path";
import gradient from "gradient-string";
import('./middleware/database.middleware.js')
import('./app.js')

const credentials = fs.readFileSync("./setup/credentials.json");

if (!Array.isArray(JSON.parse(credentials)) || !JSON.parse(credentials).length) {
  log([
    {
      message: "[ APPSTATE ]: ",
      color: "red",
    },
    {
      message: `Vui lòng đến thư mục setup/credentials.json và điền appstate vào trong!`,
      color: "white",
    },
  ]);
  process.exit(0)
}

setInterval(() => {
  const t = process.uptime();
  const [i, a, m] = [Math.floor(t / 3600), Math.floor((t % 3600) / 60), Math.floor(t % 60)].map((num) => (num < 10 ? "0" + num : num));
  const formatMemoryUsage = (data) => `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;
  const memoryData = process.memoryUsage();
  process.title = `Kaguya Project - Author: Thiệu Trung Kiên - ${i}:${a}:${m} - External: ${formatMemoryUsage(memoryData.external)}`;
}, 1000);

(async () => {
  global.client = {
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    aliases: new Map(),
    handler: {
      reply: new Map(),
      reactions: new Map(),
    },
    config: config
  };
  
  await commandMiddleware();
  await eventMiddleware();
  login({ appState: JSON.parse(credentials) }, async (err, api) => {
    if (err) {
      throw new Error(err);
    }

    api.setOptions(config.options);
    const redToGreen = gradient("white", "green");
    console.log(redToGreen("■".repeat(50), { interpolation: "hsv" }));
    console.log("KAGUYA BOT - MADE BY : THIỆU TRUNG KIÊN");
    console.log(redToGreen("■".repeat(50), { interpolation: "hsv" }));
    notifer("Login", "Đăng nhập thành công!");
    const listenMqtt = async () => {
      try {
        if (!listenMqtt.isListening) {
          listenMqtt.isListening = true;
          const mqtt = await api.listenMqtt(async (err, event) => {
            if (err) {
              throw err;
            }
            await listen({ api, event, client: global.client });
          });
          await sleep(config.mqtt_refresh);
          notifer("[ MQTT ]", "Đang tiến hành refresh mqtt !");
          log([
            {
              message: "[ MQTT ]: ",
              color: "yellow",
            },
            {
              message: `Đang tiến hành refresh mqtt !`,
              color: "white",
            },
          ]);
          await mqtt.stopListening();
          await sleep(5000);
          notifer("[ MQTT ]", "Refresh thành công!");
          log([
            {
              message: "[ MQTT ]: ",
              color: "green",
            },
            {
              message: `Refresh thành công!`,
              color: "white",
            },
          ]);
          listenMqtt.isListening = false;
        }
        listenMqtt();
      } catch (error) {
        console.log("Error occurred during listening: ", error);
      }
    };

    listenMqtt.isListening = false;
    listenMqtt();
  });
})();
