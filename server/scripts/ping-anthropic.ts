/** ping-anthropic.ts — confirm the ANTHROPIC_API_KEY in .env authenticates (cheap haiku call). */
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

async function main() {
  const key = process.env.ANTHROPIC_API_KEY || '';
  console.log('ANTHROPIC_API_KEY present:', !!key, '| prefix:', key.slice(0, 10), '| length:', key.length);
  if (!key) { console.log('NOT SET — check .env'); return; }
  try {
    const res = await new Anthropic().messages.create({
      model: 'claude-haiku-4-5', max_tokens: 5, messages: [{ role: 'user', content: 'Reply with just: OK' }],
    });
    const txt = res.content.find((b: any) => b.type === 'text')?.text?.trim();
    console.log('✅ Key works. Reply:', txt, '| served by:', res.model);
  } catch (e: any) {
    console.log('✗ API error', e?.status || '', '-', e?.message || e);
  }
}
main();
