const puppeteer = require('puppeteer');

const USERNAME = 'MinhTriet06';
const PASSWORD = 'DmTriet@31';

module.exports = {
  name: 'start-server',
  description: 'Bật server Aternos!',
  async execute(message, args) {
    try {
      await message.reply('Đang khởi động server Aternos...');

      const browser = await puppeteer.launch({ headless: true });  // Bạn có thể đổi thành false khi muốn xem
      const page = await browser.newPage();

      await page.goto('https://aternos.org/go/');
      await page.waitForSelector('#user');  // Đảm bảo form đăng nhập đã tải
      await page.type('#user', USERNAME);
      await page.type('#password', PASSWORD);
      await page.click('#login');
      await page.waitForNavigation();

      await page.goto('https://aternos.org/server/');
      await page.waitForSelector('#start');  // Đảm bảo nút start đã sẵn sàng
      await page.click('#start');

      await message.channel.send('Đã gửi yêu cầu bật server!');

      await browser.close();
    } catch (err) {
      console.error(err);
      await message.channel.send('Lỗi khi bật server.');
    }
  },
};