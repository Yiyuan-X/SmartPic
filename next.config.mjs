// next.config.mjs
import withNextIntl from 'next-intl/plugin';

const withIntl = withNextIntl('./app/i18n.ts');

const nextConfig = {
  reactStrictMode: true,
  output: 'export', // ✅ 静态导出模式，取代 next export
  experimental: {
    optimizeCss: true
  }
};

export default withIntl(nextConfig);
