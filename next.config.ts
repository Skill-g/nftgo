import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    productionBrowserSourceMaps: true,
    experimental: {
        swcPlugins: [['@lingui/swc-plugin', {}]],
    },
}

export default nextConfig
