/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		// TODO: think about this, maybe only our s3 bucket is ok ?
		// what about selfhosted instances ?
		remotePatterns: [{ hostname: "*" }],
	},
	reactCompiler: true,
	experimental: {
		isolatedDevBuild: true,
		turbopackFileSystemCacheForDev: true,
	},
	output: "standalone",
	typescript: {
		ignoreBuildErrors: true,
	},
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
};

export default nextConfig;
