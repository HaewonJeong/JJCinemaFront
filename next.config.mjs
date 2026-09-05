/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.BACKEND_ORIGIN || 'http://localhost:8080'}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
