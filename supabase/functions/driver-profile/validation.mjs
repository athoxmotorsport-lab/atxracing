export function validateProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('invalid_profile');
  const text = (key, max, required = false) => {
    if (typeof body[key] !== 'string') throw Error('invalid_' + key);
    const value = body[key].trim().replace(/\s+/g, ' ');
    if (value.length > max || (required && !value)) throw Error('invalid_' + key);
    return value || null;
  };
  const games = key => {
    if (!Array.isArray(body[key]) || body[key].length > 2 || body[key].some(g => !['acc', 'ace'].includes(g))) throw Error('invalid_' + key);
    return [...new Set(body[key])];
  };
  const number = text('carNumber', 4);
  if (number && !/^[A-Za-z0-9-]{1,4}$/.test(number)) throw Error('invalid_carNumber');
  const displayName = text('displayName', 64, true);
  return {
    nickname: text('nickname', 64, true), display_name: displayName, custom_display_name: displayName,
    team_name: text('teamName', 64), car_number: number?.toUpperCase() ?? null,
    preferred_gt3: text('preferredGt3', 100), games_played: games('gamesPlayed'),
    games_to_discover: games('gamesToDiscover'),
  };
}
