// @ts-ignore
import path from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"

const isExternal = (id: string) => !id.startsWith(".") && !path.isAbsolute(id);

export default defineConfig(() => ({
    esbuild: {
        logOverride: { "this-is-undefined-in-esm": "silent" }
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, "src/index.ts"),
            name: "FireCMS",
            fileName: (format) => `index.${format}.js`
        },
        target: "esnext",
        sourcemap: true,
        rollupOptions: {
            external: isExternal
        }
    },
    resolve: {
        alias: {
            firecms: path.resolve(__dirname, "../firecms/src"),
            "@firecms/schema_inference": path.resolve(__dirname, "../schema_inference/src"),
            "@firecms/data_enhancement": path.resolve(__dirname, "../data_enhancement/src"),
            "@firecms/data_import": path.resolve(__dirname, "../data_import/src"),
            "@firecms/collection_editor": path.resolve(__dirname, "../collection_editor/src")
        }
    },
    plugins: [react()]
}));