import { exec } from 'child_process';
import * as path from 'path';

export const runRubyScript = async (
  email,
  password,
  script,
) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', '', script);
    exec(`ruby ${scriptPath} ${email} ${password}`, (error, stdout, stderr) => {
      console.log('callback');
      if (error) {
        reject(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
};