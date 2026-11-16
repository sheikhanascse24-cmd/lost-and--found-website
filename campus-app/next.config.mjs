const config = {
  serverExternalPackages: ['@electric-sql/pglite', 'pg', '@huggingface/transformers', 'onnxruntime-node'],
  outputFileTracingExcludes: {
    '*': ['.data/**', '.env*', 'test-results/**'],
    '/api/**': ['.data/**', '.env*', 'test-results/**', 'node_modules/**/onnxruntime-node/bin/**/darwin/**', 'node_modules/**/onnxruntime-node/bin/**/win32/**', 'node_modules/**/onnxruntime-node/bin/**/linux/arm64/**']
  },
  outputFileTracingIncludes: {
    '/api/**': ['./node_modules/.pnpm/onnxruntime-node@*/node_modules/onnxruntime-node/bin/**/linux/x64/*', './node_modules/.pnpm/onnxruntime-node@*/node_modules/onnxruntime-node/dist/**', './node_modules/.pnpm/onnxruntime-node@*/node_modules/onnxruntime-node/package.json', './node_modules/.pnpm/onnxruntime-common@1.30.0/node_modules/onnxruntime-common/dist/**', './node_modules/.pnpm/onnxruntime-common@1.30.0/node_modules/onnxruntime-common/package.json']
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'" }
    ]}];
  }
};
export default config;
