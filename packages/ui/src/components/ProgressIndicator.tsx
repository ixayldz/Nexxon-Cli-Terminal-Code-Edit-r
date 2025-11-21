import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export interface ProgressIndicatorProps {
    message: string;
    isLoading: boolean;
    spinnerType?: 'dots' | 'line' | 'arc';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    message,
    isLoading,
    spinnerType = 'dots'
}) => {
    if (!isLoading) return null;

    return (
        <Box marginY={1}>
            <Box marginRight={1}>
                <Text color="cyan">
                    <Spinner type={spinnerType} />
                </Text>
            </Box>
            <Text>{message}</Text>
        </Box>
    );
};
