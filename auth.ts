import readline from 'readline';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { envApiHash, envApiId } from './config';

const apiId = parseInt(envApiId);
const apiHash = envApiHash;
const stringSession = new StringSession(''); // fill this later with the value from session.save()

export let session: any;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(async () => {
  console.log('Loading interactive example...');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () =>
      new Promise((resolve) =>
        rl.question('Please enter your number: ', resolve)
      ),
    password: async () =>
      new Promise((resolve) =>
        rl.question('Please enter your password: ', resolve)
      ),
    phoneCode: async () =>
      new Promise((resolve) =>
        rl.question('Please enter the code you received: ', resolve)
      ),
    onError: (err) => console.log(err),
  });
  console.log('You should now be connected.');
  session = client.session.save();
  console.log(session); // Save this string to avoid logging in again
  await client.sendMessage('me', { message: 'Hello!' });
})();
