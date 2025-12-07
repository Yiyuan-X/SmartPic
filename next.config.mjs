import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  experimental: { optimizeCss: true },
};

export default withNextIntl(nextConfig);
