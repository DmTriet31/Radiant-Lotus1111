// commands/start-server.js
const puppeteer = require('puppeteer');

const USERNAME = 'MinhTriet06';
const PASSWORD = 'DmTriet@31';

module.exports = {
  name: 'start-server',
  description: 'Bật server Aternos!',
  async execute(message, args) {
    try {
      await message.reply('Đang khởi động server Aternos...');

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();

      await page.goto('https://aternos.org/go/');
      await page.type('#user', USERNAME);
      await page.type('#password', PASSWORD);
      await page.click('#login');
      await page.waitForNavigation();

      await page.goto('https://aternos.org/server/');
      await page.waitForSelector('#start');
      await page.click('#start');

      await message.channel.send('Đã gửi yêu cầu bật server!');

      await browser.close();
    } catch (err) {
      console.error(err);
      await message.channel.send('Lỗi khi bật server.');
    }
  },
};