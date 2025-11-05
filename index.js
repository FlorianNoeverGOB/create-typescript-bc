#!/usr/bin/env node

import { init } from './utils/createProject.js';
import { projectTypes, scope } from './utils/allowedPackages.js';
import { execSync } from 'node:child_process';
import inquirer from 'inquirer';
import path from "node:path";
import chalk from 'chalk';

(async () => {
    console.log(chalk.yellow('Welcome to Typescript-BC Project Generator!'))

    try {
        execSync('git --version', { stdio: 'ignore' });
    } catch {
        console.log(chalk.red('Install Git to use Typescript-BC Project Generator'));
        return;
    }

    const answers = await inquirer.prompt([
        {
            type: "list",
            name: "projectType",
            message: "What type of project do you want to create?",
            choices: [...projectTypes]
        },
        {
            type: "input",
            name: "projectName",
            message: "What's the name of your project?",
            default: "typescript-bc"
        },
        {
            type: "confirm",
            name: "projectUseGit",
            message: "Initialize a git repository?",
            default: false
        },
        {
            type: "list",
            name: "packageManager",
            message: "Which package manager to use?",
            choices: ["npm", "yarn", "pnpm"]
        }
    ]);

    if (!projectTypes.includes(answers.projectType)) {
        throw new Error("Invalid package type");
    }

    const success = await init(answers.projectType, answers.projectName, answers.projectUseGit, answers.packageManager);
    if (!success) {
        return;
    }

    const vscodeAnswers = await inquirer.prompt([
        {
            type: "list",
            name: "openWithCode",
            message: "Do you want to open the new folder with Visual Studio Code?",
            choices: ["Open with `code`", "Skip"],
            default: false
        }
    ]);

    if (vscodeAnswers.openWithCode === 'Open with `code`') {
        try {
            const currentDir = process.cwd();
            const destination = path.join(currentDir, answers.projectName);

            execSync(`code "${destination}"`, { stdio: 'ignore' });
            console.log(chalk.green('Opened project in VS Code.'));
        } catch (ex) {
            console.log(chalk.red("Couldn't find the VS Code CLI (`code`). In VS Code, run “Shell Command: Install 'code' command in PATH”, then try again."));
        }
    }
})();