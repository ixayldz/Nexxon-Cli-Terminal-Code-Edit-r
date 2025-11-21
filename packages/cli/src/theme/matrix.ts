/**
 * Matrix Theme Configuration
 * Classic green terminal aesthetic
 */

import chalk from 'chalk';
import gradient from 'gradient-string';

export const matrixTheme = {
    // Primary colors
    primary: chalk.hex('#00FF41'),        // Matrix green
    secondary: chalk.hex('#008F11'),      // Dark green
    accent: chalk.hex('#00D832'),         // Bright green
    dim: chalk.hex('#003B00'),            // Very dark green

    // Status colors
    error: chalk.hex('#FF0000'),          // Red
    warning: chalk.hex('#FFFF00'),        // Yellow
    info: chalk.hex('#00FFFF'),           // Cyan
    success: chalk.hex('#00FF00'),        // Green
    muted: chalk.hex('#005500'),          // Muted green

    // Gradient
    gradient: gradient(['#003B00', '#00FF41', '#00D832']),

    // Special effects
    bold: (text: string) => chalk.bold.hex('#00FF41')(text),
    glow: (text: string) => chalk.bold.hex('#00FF41').bgHex('#001100')(` ${text} `),
    prompt: () => chalk.hex('#00FF41')('nexxon> '),

    // Symbols
    symbols: {
        success: chalk.hex('#00FF00')('✓'),
        error: chalk.hex('#FF0000')('✗'),
        warning: chalk.hex('#FFFF00')('⚠'),
        info: chalk.hex('#00FFFF')('ℹ'),
        arrow: chalk.hex('#00FF41')('→'),
        bullet: chalk.hex('#00D832')('•'),
        loading: chalk.hex('#00FF41')('⠿')
    }
};

// Helper functions
export function header(text: string): string {
    return matrixTheme.bold(text);
}

export function highlight(text: string): string {
    return matrixTheme.accent(text);
}

export function dimText(text: string): string {
    return matrixTheme.dim(text);
}

export function successText(text: string): string {
    return matrixTheme.success(text);
}

export function errorText(text: string): string {
    return matrixTheme.error(text);
}
