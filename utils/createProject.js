import { managers, scope } from './allowedPackages.js';
import fs from 'fs/promises';
import path from "node:path";
import chalk from 'chalk';
import { execSync } from 'node:child_process';

async function cloneGitRepo(projectType, projectName) {
    const currentDir = process.cwd();
    const destination = path.join(currentDir, projectName);
    const requestedPackage = `${scope}/${projectType}`;
    const fullURL = `https://github.com/${requestedPackage}.git`

    console.log(`Writing in ${destination}...`);
    console.log();

    await fs.mkdir(destination);
    execSync(`git clone --depth 1 ${fullURL} .`, { stdio: "inherit", cwd: destination });
}

async function updatePackageJson(projectPath, projectType, projectName) {
    const packagePath = path.join(projectPath, 'package.json');
    const stat = await fs.lstat(packagePath);

    if (stat.isFile()) {
        const currentPackageJson = await fs.readFile(packagePath, 'utf8');
        const newFileContent = currentPackageJson.replace(projectType, projectName);
        await fs.writeFile(packagePath, newFileContent, 'utf8');
    }
}

async function removeGitFolder(projectPath) {
    const gitFolderPath = path.join(projectPath, '.git');
    const stat = await fs.lstat(gitFolderPath);

    if (stat.isDirectory()) {
        await fs.rm(gitFolderPath, { recursive: true });
    }
}

async function installPkgs(projectPath, packageManager) {
    console.log('Running npm install for you to install the required dependencies.');

    const exists = async (p) => {
        try { await fs.access(p); return true; } catch { return false; }
    };

    // If repo brings a lockfile, prefer that manager to avoid mismatch
    const lockfileOwners = Object.entries(managers)
        .map(([name, info]) => ({ name, path: path.join(projectPath, info.lock) }));

    let inferredManager = null;
    for (const lf of lockfileOwners) {
        if (await exists(lf.path)) {
            inferredManager = lf.name;
            break;
        }
    }

    let chosen = packageManager && managers[packageManager] ? packageManager : 'npm';
    if (inferredManager && inferredManager !== chosen) {
        console.log(chalk.yellow(`Detected ${managers[inferredManager].lock}. Using ${inferredManager} instead of ${chosen} for a consistent install.`));
        chosen = inferredManager;
    }

    // Ensure the selected manager is installed on the system; otherwise fall back to npm
    const verifyOrFallback = (mgr) => {
        try {
            execSync(managers[mgr].check, { stdio: 'ignore' });
            return mgr;
        } catch {
            console.log(chalk.red(`"${mgr}" is not installed or not on PATH.`));
            if (mgr !== 'npm') {
                try {
                    execSync(managers.npm.check, { stdio: 'ignore' });
                    console.log(chalk.yellow('Falling back to "npm".'));
                    return 'npm';
                } catch {
                    // Neither chosen manager nor npm is available
                    return null;
                }
            }
            return null;
        }
    };

    const effective = verifyOrFallback(chosen);
    if (!effective) {
        console.log(chalk.red('Could not find a working package manager (tried selected option and npm). Skipping automatic install.'));
        console.log(`You can install manually later:\n  cd ${path.basename(projectPath)}\n  <your-pm> install`);
        return;
    }

    try {
        execSync(managers[effective].install, { stdio: 'inherit', cwd: projectPath });
    } catch (e) {
        console.log(chalk.red('Package installation failed.'));
        console.log(`Try running manually:\n  cd ${path.basename(projectPath)}\n  ${managers[effective].install}`);
    }
};

export async function init(projectType, projectName, useGit, packageManager) {
    try {
        console.log();

        const currentDir = process.cwd();
        const destination = path.join(currentDir, projectName);

        await cloneGitRepo(projectType, projectName);
        console.log();

        if (useGit === false) {
            await removeGitFolder(destination);
        }

        await updatePackageJson(destination, projectType, projectName);

        await installPkgs(destination, packageManager);
        console.log();

        console.log(chalk.green(`Your project ${projectName} has been created!`));
        console.log();

        return true;
    } catch (error) {
        console.log(chalk.red(error));
        return false;
    }
};