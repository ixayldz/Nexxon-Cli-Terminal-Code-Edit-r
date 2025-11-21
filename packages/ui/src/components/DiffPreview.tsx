import React from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

export interface DiffLine {
    type: 'add' | 'remove' | 'context' | 'header';
    content: string;
}

export interface DiffPreviewProps {
    patch: string;
    fileName?: string;
}

export const DiffPreview: React.FC<DiffPreviewProps> = ({ patch, fileName }) => {
    const lines = patch.split('\n');

    const parseLine = (line: string): DiffLine => {
        if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('@@')) {
            return { type: 'header', content: line };
        } else if (line.startsWith('+')) {
            return { type: 'add', content: line };
        } else if (line.startsWith('-')) {
            return { type: 'remove', content: line };
        }
        return { type: 'context', content: line };
    };

    const getLineColor = (type: DiffLine['type']): string => {
        switch (type) {
            case 'add': return 'green';
            case 'remove': return 'red';
            case 'header': return 'cyan';
            default: return 'white';
        }
    };

    return (
        <Box flexDirection="column" marginY={1}>
            {fileName && (
                <Box marginBottom={1}>
                    <Text bold color="yellow">📄 {fileName}</Text>
                </Box>
            )}

            <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
                {lines.map((line, index) => {
                    const parsed = parseLine(line);
                    const color = getLineColor(parsed.type);

                    return (
                        <Text key={index} color={color}>
                            {parsed.content}
                        </Text>
                    );
                })}
            </Box>
        </Box>
    );
};
