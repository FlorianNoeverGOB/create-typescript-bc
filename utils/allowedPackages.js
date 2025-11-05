export const scope = 'Florian-Noever';
export const projectTypes = [
    'typescript-bc',
    'react-ts-bc'
];

export const managers = {
    npm: { check: 'npm --version', install: 'npm install', lock: 'package-lock.json' },
    yarn: { check: 'yarn --version', install: 'yarn install', lock: 'yarn.lock' },
    pnpm: { check: 'pnpm --version', install: 'pnpm install', lock: 'pnpm-lock.yaml' }
};
