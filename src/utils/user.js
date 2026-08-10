const NICKNAME_KEY = 'poo_user_nickname';

export function getNickname() {
  return localStorage.getItem(NICKNAME_KEY);
}

export function setNickname(nickname) {
  localStorage.setItem(NICKNAME_KEY, nickname);
}

export function generateNickname() {
  const names = [
    { emoji: '🐻', name: '小熊' },
    { emoji: '🐼', name: '熊猫' },
    { emoji: '🦊', name: '狐狸' },
    { emoji: '🐨', name: '考拉' },
    { emoji: '🦁', name: '狮子' },
    { emoji: '🐯', name: '老虎' },
    { emoji: '🐸', name: '青蛙' },
    { emoji: '🐵', name: '猴子' },
    { emoji: '🦄', name: '独角兽' },
    { emoji: '🐙', name: '章鱼' },
    { emoji: '🦋', name: '蝴蝶' },
    { emoji: '🐰', name: '兔子' },
    { emoji: '🐹', name: '仓鼠' },
    { emoji: '🦉', name: '猫头鹰' },
    { emoji: '🐳', name: '鲸鱼' },
    { emoji: '🌸', name: '樱花' },
    { emoji: '🌻', name: '向日葵' },
    { emoji: '🌵', name: '仙人掌' },
    { emoji: '🍀', name: '幸运草' },
    { emoji: '🌷', name: '郁金香' }
  ];
  const pick = names[Math.floor(Math.random() * names.length)];
  return `${pick.emoji}${pick.name}`;
}

export function ensureNickname() {
  let nickname = getNickname();
  if (!nickname) {
    nickname = generateNickname();
    setNickname(nickname);
  }
  return nickname;
}
