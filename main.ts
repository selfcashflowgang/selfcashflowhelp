import schedule from 'node-schedule';
import { Telegraf } from 'telegraf';
import { TelegramClient } from 'telegram';
import { botToken, envApiHash, envApiId, session } from './config';
import { giga } from './giga';
import { getDedustPools, getStonFiPools } from './parser';

// const chatId = '391148065';
const chatId = '-1001862002214';

const channelsToWatch = ['ston_fi_ru', 'dedust_ru', 'JVault_ru'];

const bot = new Telegraf(botToken);

const client = new TelegramClient(session, parseInt(envApiId), envApiHash, {});

async function getUnreadMessages(limit = 3) {
  let messagesTexts: string[] = [];

  const dialogs = await client.getDialogs({});
  for await (const channelId of channelsToWatch) {
    const channel = dialogs.find((d: any) => d.entity.username === channelId);

    if (channel) {
      const messages = await client.getMessages(channel.entity, {
        limit,
      });
      messagesTexts.push(
        ...messages.sort((a, b) => a.date - b.date).map((msg) => msg.message)
      );
    } else {
      console.log('Посты не найдены');
    }
  }

  return messagesTexts.join(' ');
}

// This function sends a message to the specified chat ID every 24 hours
async function setupDailyMessage() {
  const messagesString = await getUnreadMessages();
  const trimmedMessages = messagesString
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    )
    .replace('\n', '')
    .replace('  ', '')
    .replace(
      /(\breddit\b)|(\btwitter\b)|(\bchat\b)|(\bru\b)|(\bDYOR\b)|(\btelegram\b)|(\bdex\b)|(\bru\b)|(\breddit\b)|(\bvn\b)|(\bir\b)|(\bblog\b)|(\blinkedIn\b)|(\bdiscord\b)|(\bc уважением,\b)|(\bкоманда Scaleton\b)|(\bПрограмма амбассадоров\b)|(\bБлог\b)|(\bDEX гайд\b)|(\bОбучение работе на DEX \b)|(\bTelegram DEX \b)/gim,
      ''
    );

  const gigaResponse = await giga(
    trimmedMessages,
    'Отвечай как эксперт в децентрализованных финансах. Ты на вход получаешь сообщения от протоколов с новостями. Напиши максимально кратко, только самые важные тезисы по поощрениям, без описаний. На одну сущность - один тезис. Тезисы не должны быть связаны между друг-другом. Текст должен быть коротким, не скопированным и не относиться к одному и тому же событию. Пример тезиса: "- Пулл TON/STON награды 200 000 TON, до 20 апреля.\n"'
  );

  const coinsDataResponse = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false'
  );
  const prices = await coinsDataResponse.json();

  const btc = prices.find(({ id }: any) => id === 'bitcoin');
  const ethereum = prices.find(({ id }: any) => id === 'ethereum');
  const ton = prices.find(({ id }: any) => id === 'the-open-network');
  // console.log(gigaResponse);

  const stonFiPools = await getStonFiPools();
  const dedustPools = await getDedustPools();

  let poolsData = '';

  // добавляем данные о пуллах stonfi в инфо
  if (stonFiPools.length > 0) {
    stonFiPools.slice(0, 6).forEach((pool, index) => {
      if (index === 0) {
        poolsData = `${poolsData}
*STONfi:*`;
      }
      poolsData = `${poolsData}
${pool.pool} - ${pool.farm || pool.apr24h}`;
    });
  }

  // добавляем данные о пуллах dedust в инфо
  if (dedustPools.length > 0) {
    dedustPools.slice(0, 6).forEach((pool, index) => {
      if (index === 0) {
        poolsData = `${poolsData}

*DeDust:*`;
      }
      poolsData = `${poolsData}
${pool.pool} - ${pool.apr24h}`;
    });
  }

  bot.telegram.sendMessage(
    chatId,
    `*BTC:* ${btc.current_price.toFixed(2)}$
*TON:* ${ton.current_price.toFixed(2)}$
*ETH:* ${ethereum.current_price.toFixed(2)}$
${poolsData}

${gigaResponse.replace(' - ', '\n- ')}`,
    { parse_mode: 'Markdown', message_thread_id: 114 }
  );
  // Scheduling the message at 00:00 (midnight) every day
  schedule.scheduleJob('0 0 * * *', () => {
    bot.telegram.sendMessage(chatId, 'Hello! This is your daily message.');
    console.log('Message sent at:', new Date());
  });
}

(async function run() {
  await client.connect();

  bot.launch().then(() => {
    console.log('Bot has been started...');
  });

  setupDailyMessage();

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
})();
