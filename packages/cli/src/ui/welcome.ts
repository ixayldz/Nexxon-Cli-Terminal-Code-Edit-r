/**
 * Welcome Screen
 * Displays branded ASCII art banner and system status
 */

import figlet from 'figlet';
import boxen from 'boxen';
import { matrixTheme } from '../theme/matrix.js';

export async function showWelcomeScreen(): Promise<void> {
    console.clear();

    // Create ASCII art banner
    const banner = figlet.textSync('NEXXON', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default'
    });

    // Apply matrix green color
    const coloredBanner = matrixTheme.gradient.multiline(banner);

    // System info
    const subtitle = matrixTheme.dim('AI-Powered Coding Assistant');
    const providers = matrixTheme.primary('🤖 GPT-5.1 • Claude 4.5 • Gemini 3.0');
    const status = matrixTheme.success('⚡ Ready to code');

    // Create boxed welcome message
    const welcomeContent = `
${coloredBanner}

${subtitle}
${providers}
${status}

${matrixTheme.muted('Type')} ${matrixTheme.accent('/help')} ${matrixTheme.muted('for commands or start chatting naturally')}
${matrixTheme.muted('Press')} ${matrixTheme.accent('Ctrl+C')} ${matrixTheme.muted('to exit')}
    `.trim();

    const boxed = boxen(welcomeContent, {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'green',
        backgroundColor: '#001100'
    });

    console.log(boxed);
    console.log('');
}

export function showShortWelcome(): void {
    console.log(matrixTheme.gradient('\n╔══════════════════════════════════════╗'));
    console.log(matrixTheme.gradient('║          NEXXON CLI v1.0.0          ║'));
    console.log(matrixTheme.gradient('╚══════════════════════════════════════╝\n'));
}
