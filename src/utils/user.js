const NICKNAME_KEY = 'poo_user_nickname';

export function getNickname() {
  return localStorage.getItem(NICKNAME_KEY);
}

export function setNickname(nickname) {
  localStorage.setItem(NICKNAME_KEY, nickname);
}

export function generateNickname() {
  const emojis = ['🐻', '🐼', '🦊', '🐨', '🦁', '🐯', '🐸', '🐵', '🦄', '🐙', '🦋', '🌸', '🌈', '⭐'];
  const animals = ['小熊', '熊猫', '狐狸', '考拉', '狮子', '老虎', '青蛙', '猴子', '独角兽', '章鱼'];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  const randomNum = Math.floor(Math.random() * 90 + 10);
  return `${randomEmoji}${randomAnimal}${randomNum}`;
}

export function ensureNickname() {
  let nickname = getNickname();
  if (!nickname) {
    nickname = generateNickname();
    setNickname(nickname);
  }
  return nickname;
}
