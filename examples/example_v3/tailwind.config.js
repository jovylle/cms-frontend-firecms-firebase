/** @type {import("tailwindcss").Config} */
const plugin = require("tailwindcss/plugin")

const fireCMSPlugin = plugin(function ({
                                       matchUtilities,
                                       theme
                                   }) {
    matchUtilities(
        {
            tab: (value) => ({
                tabSize: value
            }),
        },
        { values: theme("tabSize") }
    )
}, {
    darkMode: ["class", "[data-theme=\"dark\"]"],
    theme: {
        tabSize: {
            1: "1",
            2: "2",
            4: "4",
            8: "8",
        }
    }
})

export default {
    darkMode: ["class", "[data-theme=\"dark\"]"],
    mode: "jit",
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "../../node_modules/@firecms/core/src/**/*.{js,ts,jsx,tsx}",
        "../../node_modules/@firecms/firebase/src/**/*.{js,ts,jsx,tsx}", // TODO: make sure this is the right path
        "../../node_modules/@firecms/collection_editor/src/**/*.{js,ts,jsx,tsx}", // TODO: make sure this is the right path
        "../../node_modules/@firecms/data_enhancement/src/**/*.{js,ts,jsx,tsx}", // TODO: make sure this is the right path
    ],
    plugins: [fireCMSPlugin],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    "Rubik",
                    "Roboto",
                    "Helvetica",
                    "Arial",
                    "sans-serif"
                ],
                headers: [
                    "Rubik",
                    "Roboto",
                    "Helvetica",
                    "Arial",
                    "sans-serif"
                ],
                mono: [
                    "IBM Plex Mono",
                    "Space Mono",
                    "Lucida Console",
                    "monospace"
                ]
            },
            colors: {
                primary: "#0070F4",
                secondary: "#ff5064",
                error: "#F44336",
                field: {
                    disabled: "rgb(224 224 226)",
                    "disabled-dark": "rgb(35 35 37)"
                },
                text: {
                    primary: "rgba(0, 0, 0, 0.87)",
                    "primary-dark": "#ffffff",
                    secondary: "rgba(0, 0, 0, 0.6)",
                    "secondary-dark": "rgba(255, 255, 255, 0.7)",
                    disabled: "rgba(0, 0, 0, 0.38)",
                    "disabled-dark": "rgba(255, 255, 255, 0.5)",
                    label: "rgb(131, 131, 131)"
                },
                gray: {
                    50: "#f8f8fc",
                    100: "#E7E7EB",
                    200: "#CFCFD6",
                    300: "#B7B7BF",
                    400: "#A0A0A9",
                    500: "#87878F",
                    600: "#6C6C75",
                    700: "#505058",
                    800: "#35353A",
                    900: "#18181C",
                    950: "#101013"
                }
            }
        }

    },
    variants: {
        extend: {}
    }
};
