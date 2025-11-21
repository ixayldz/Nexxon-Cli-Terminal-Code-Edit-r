import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface ConfirmDialogProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    defaultValue?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    message,
    onConfirm,
    onCancel,
    defaultValue = true
}) => {
    const [selected, setSelected] = useState<boolean>(defaultValue);

    useInput((input, key) => {
        if (key.leftArrow || input === 'h') {
            setSelected(false);
        } else if (key.rightArrow || input === 'l') {
            setSelected(true);
        } else if (key.return) {
            if (selected) {
                onConfirm();
            } else {
                onCancel();
            }
        } else if (input === 'y' || input === 'Y') {
            onConfirm();
        } else if (input === 'n' || input === 'N') {
            onCancel();
        }
    });

    return (
        <Box flexDirection="column" marginY={1}>
            <Box marginBottom={1}>
                <Text>{message}</Text>
            </Box>

            <Box>
                <Box marginRight={2}>
                    <Text
                        color={selected ? 'green' : 'white'}
                        bold={selected}
                        inverse={selected}
                    >
                        {selected ? '▶ Yes' : '  Yes'}
                    </Text>
                </Box>

                <Box>
                    <Text
                        color={!selected ? 'red' : 'white'}
                        bold={!selected}
                        inverse={!selected}
                    >
                        {!selected ? '▶ No' : '  No'}
                    </Text>
                </Box>
            </Box>

            <Box marginTop={1}>
                <Text dimColor>
                    (Use arrow keys, y/n, or Enter to confirm)
                </Text>
            </Box>
        </Box>
    );
};
