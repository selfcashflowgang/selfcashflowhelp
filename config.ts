import { StringSession } from 'telegram/sessions';

export const session = new StringSession(process.env.TG_SESSION);
export const envApiId = process.env.API_ID as string;
export const envApiHash = process.env.API_HASH as string;
export const gigaClientId = process.env.CLIENT_ID as string;
export const gigaClientSecret = process.env.CLIENT_SECRET as string;
export const gigaAuth = process.env.GIGA_AUTH as string;
export const gigaScope = 'GIGACHAT_API_PERS';
export const botToken = process.env.TG_BOT_KEY as string;
