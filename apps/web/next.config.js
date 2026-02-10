/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@repo/api", "@repo/ui"],
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'evlusrnimwwdrkwiraoe.supabase.co',
            },
        ],
    },
};

export default nextConfig;
