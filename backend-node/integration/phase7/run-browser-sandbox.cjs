const { spawn } = require('node:child_process');

const allowed = ['PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'COMSPEC', 'PATHEXT', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA'];
const env = Object.fromEntries(allowed.filter(key => process.env[key]).map(key => [key, process.env[key]]));
Object.assign(env, { NODE_ENV: 'test', NODE_OPTIONS: '--max-old-space-size=512 --max-semi-space-size=4', RAYON_NUM_THREADS: '1', PHASE7_BROWSER_APPROVED: 'sandbox' });
const child = spawn(process.execPath, [require.resolve('./browser-sandbox.cjs')], { env, stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true });
const stop = () => { if (child.stdin.writable) child.stdin.end('stop\n'); };
child.stdin.on('error', () => {});
process.stdin.pipe(child.stdin);
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
process.stdin.once('end', stop);
child.on('error', () => { process.exitCode = 1; process.stdin.pause(); });
child.on('exit', code => { process.exitCode = code ?? 1; process.stdin.unpipe(child.stdin); process.stdin.pause(); });
