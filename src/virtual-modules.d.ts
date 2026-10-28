declare module 'virtual:responsive-images' {
  // Keyed by the screenshot's path as portfolio.json writes it; paths are base-less.
  const manifest: Record<string, { width: number; variants: { file: string; width: number }[] }>;
  export default manifest;
}
