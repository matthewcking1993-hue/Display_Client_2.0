import { spawn } from 'node:child_process';
import path from 'node:path';

const androidDir = path.resolve(process.cwd(), 'android');
const isWindows = process.platform === 'win32';
const executable = isWindows ? 'gradlew.bat' : './gradlew';

const child = spawn(executable, ['assembleRelease'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWindows
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
