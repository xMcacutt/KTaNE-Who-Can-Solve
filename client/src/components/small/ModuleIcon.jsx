import React from "react";
import { Box } from "@mui/material";

function ModuleIcon({
    iconFileName,
    size,
    style
}) {
    const imageUrl = `https://raw.githubusercontent.com/Timwi/KtaneContent/refs/heads/master/Icons/${iconFileName}.png`;
    const localImageUrl = `/icons/${iconFileName}.png`;

    const handleImageError = e => {
        const currentSrc = e.target.src;
        if (currentSrc.includes("raw.githubusercontent.com")) e.target.src = localImageUrl;
        else {
            e.target.src = "/icons/Unknown Module.png";
            e.target.onerror = null;
        }
    };

    return (
        <Box
            component="img"
            src={imageUrl}
            alt={iconFileName}
            width={size}
            height={size}
            sx={style ? style : {
                imageRendering: 'pixelated',
            }}
            onError={(e) => handleImageError(e)}
        />
    );
}

export default React.memo(ModuleIcon);