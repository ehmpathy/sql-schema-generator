import { Entity } from '../../../../domain';
import { prop } from '../../../define'; // import from module, since this is what we expose to users

const chat = new Entity({
  name: 'chat',
  properties: {
    room_uuid: prop.UUID(),
  },
  unique: ['room_uuid'],
});
const message = new Entity({
  name: 'message',
  properties: {
    chat_id: prop.REFERENCES(chat),
    content: prop.TEXT(),
    user_uuid: prop.UUID(),
  },
  unique: ['chat_id', 'content', 'user_uuid'],
});
const like = new Entity({
  name: 'like',
  properties: {
    message_id: prop.REFERENCES(message),
    user_uuid: prop.UUID(),
  },
  unique: ['message_id', 'user_uuid'],
});

export const entities = [chat, message, like];
