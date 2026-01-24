/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/api", "@repo/ui"],
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
