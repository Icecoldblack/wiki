import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react"; // added to support React components in /courses

export default defineConfig({
  integrations: [tailwind(), mdx(), react()],
});
