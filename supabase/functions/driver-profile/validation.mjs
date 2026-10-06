export const GT3_CARS = [
  'Aston Martin V8 Vantage GT3','Audi R8 LMS GT3','Audi R8 LMS GT3 Evo 2',
  'BMW M4 GT3','Ferrari 296 GT3','Ferrari 488 GT3','Ford Mustang GT3',
  'Honda NSX GT3 Evo','Lamborghini Huracán GT3 Evo2','Lexus RC F GT3',
  'McLaren 720S GT3','McLaren 720S GT3 Evo','Mercedes-AMG GT3',
  'Nissan GT-R Nismo GT3 (2018)','Porsche 911 GT3 R (2018)','Porsche 992 GT3 R',
];
export const ACC_CIRCUITS = [
  'barcelona','brands_hatch','cota','donington','hungaroring','imola',
  'indianapolis','kyalami','laguna_seca','misano','monza','mount_panorama',
  'nurburgring','nurburgring_24h','oulton_park','paul_ricard','red_bull_ring',
  'silverstone','snetterton','spa','suzuka','valencia','watkins_glen','zandvoort','zolder',
];
export const RACE_FORMATS = ['sprint_60','sprint_90','endurance'];

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
  const preferredGt3 = text('preferredGt3', 100);
  if (preferredGt3 && !GT3_CARS.includes(preferredGt3) && preferredGt3 !== 'Porsche 911 GT3 R') throw Error('invalid_preferredGt3');
  const circuits = body.favoriteCircuits ?? [];
  if (!Array.isArray(circuits) || circuits.length > 3 || new Set(circuits).size !== circuits.length || circuits.some(c => !ACC_CIRCUITS.includes(c))) throw Error('invalid_favoriteCircuits');
  const format = body.preferredRaceFormat ?? '';
  if (typeof format !== 'string' || (format && !RACE_FORMATS.includes(format))) throw Error('invalid_preferredRaceFormat');
  const displayName = text('displayName', 64, true);
  const social = (key, hosts) => {
    if (body[key] == null) return null;
    const value = text(key, 200);
    if (!value) return null;
    let parsed; try { parsed = new URL(value); } catch { throw Error('invalid_' + key); }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || !hosts.includes(host)) throw Error('invalid_' + key);
    return parsed.href;
  };
  return {
    nickname: text('nickname', 64, true), display_name: displayName, custom_display_name: displayName,
    team_name: text('teamName', 64), car_number: number?.toUpperCase() ?? null,
    preferred_gt3: preferredGt3, favorite_circuits: circuits,
    preferred_race_format: format || null,
    games_played: games('gamesPlayed'), games_to_discover: games('gamesToDiscover'),
    youtube_url: social('youtubeUrl', ['youtube.com','youtu.be']),
    instagram_url: social('instagramUrl', ['instagram.com']),
    twitch_url: social('twitchUrl', ['twitch.tv']),
  };
}
