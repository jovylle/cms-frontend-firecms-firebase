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
            name: "FireCMS collection editor",
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
            "@firecms/core": path.resolve(__dirname, "../firecms_core/src"),
            "@firecms/ui": path.resolve(__dirname, "../ui/src"),
            "@firecms/formex": path.resolve(__dirname, "../formex/src"),
            "@firecms/schema_inference": path.resolve(__dirname, "../schema_inference/src"),
            "@firecms/data_import_export": path.resolve(__dirname, "../data_import_export/src"),
        }
    },
    plugins: [react({})]
}));
