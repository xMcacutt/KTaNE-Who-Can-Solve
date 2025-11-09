import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#ba4423",
        },
        secondary: {
            main: "#5865F2",
        },
        success: {
            main: "#2e7d32",
        },
        error: {
            main: "#c61212",
        },
        warning: {
            main: "#ed6c02",
        },
        info: {
            main: "#0288d1",
        },
        background: {
            default: "#181818",
            paper: "#1f1f1f",
        },
        text: {
            primary: "#e5e5e5",
            secondary: "#9ca3af",
        },
    },
    typography: {
        fontFamily: '"SpecialElite", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 400 },
        h2: { fontWeight: 400 },
        button:
        {
            fontFamily: '"OstrichSans", "Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: "1.2rem",
        },
        ostrich: {
            fontFamily: '"OstrichSans", "Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: '1rem',
            fontWeight: 400,
        },
        bebas: {
            fontFamily: '"Bebas-Regular", "Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: '1rem',
            fontWeight: 400,
        },
    },
    components: {
        MuiLink: {
            styleOverrides: {
                root: {
                    color: "#e5e5e5",
                    textDecoration: "none",
                },
            }
        },
    },
});

export default theme;