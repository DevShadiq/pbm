import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCommand = 'npm';
const includeApi = process.argv.includes('--api');
const workspaces = ['@pbm/website'];

if (includeApi) {
  workspaces.push('@pbm/api');
}

const children = workspaces.map((workspace) => {
  const child = spawn(
    npmCommand,
    ['run', 'dev', '--workspace', workspace],
    { stdio: 'inherit', shell: isWindows }
  );

  child.on('error', (error) => {
    console.error(`[dev] Failed to start ${workspace}: ${error.message}`);
  });

  return child;
});

let stopping = false;

function stopChildren(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;

  children.forEach((child) => {
    if (!child.killed) child.kill(signal);
  });
}

children.forEach((child) => {
  child.on('exit', (code) => {
    if (stopping) return;
    stopChildren();
    process.exitCode = code ?? 1;
  });
});

process.on('SIGINT', () => stopChildren('SIGINT'));
process.on('SIGTERM', () => stopChildren('SIGTERM'));
