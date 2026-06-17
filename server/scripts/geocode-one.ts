import 'dotenv/config';
import { geocode } from '../estimate/measure';
(async () => {
  const { location, formattedAddress } = await geocode('19428 Crestridge Dr, Edmond, OK 73012', process.env.GOOGLE_API_KEY!);
  console.log(JSON.stringify({ ...location, formattedAddress }));
})();
