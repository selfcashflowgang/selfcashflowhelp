import axios from 'axios';
import qs from 'qs';
import { v4 as uuidv4 } from 'uuid';
import { gigaAuth, gigaScope } from './config';

async function getToken() {
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: uuidv4(),
      Authorization: `Basic ${gigaAuth}`,
    },
    data: qs.stringify({
      scope: gigaScope,
    }),
  };

  try {
    const response = await axios(config);
    const { access_token: accessToken, expires_at: expiresAt } = response.data;

    return { accessToken, expiresAt };
  } catch (error) {
    console.log(error);
  }
}

export async function giga(content = '', system = '') {
  if (!content) return;

  const token = await getToken();
  // console.log('TOKEN_GIGACHAT', token);

  const messages = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }

  const data = JSON.stringify({
    model: 'GigaChat',
    messages: messages.concat([
      {
        role: 'user',
        content,
      },
    ]),
    temperature: 1,
    top_p: 0.8,
    n: 1,
    stream: false,
    max_tokens: 256,
    repetition_penalty: 1,
    update_interval: 0,
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token?.accessToken}`,
    },
    data,
  };

  try {
    const response = await axios(config);
    const message = response.data.choices[0].message;
    return message.content;
  } catch (e) {
    console.log(e);
  }
}
