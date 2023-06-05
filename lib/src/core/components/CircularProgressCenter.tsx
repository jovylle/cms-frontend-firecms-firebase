import { Box, CircularProgress, CircularProgressProps } from "@mui/material";
import React from "react";

/**
 *
 * @param props
 * @constructor
 * @ignore
 */
export function CircularProgressCenter(props: CircularProgressProps) {
    return (
        <Box
            className="flex w-full h-screen max-h-full max-w-full">
            <Box m="auto">
                <CircularProgress {...props}/>
            </Box>
        </Box>
    );
}
