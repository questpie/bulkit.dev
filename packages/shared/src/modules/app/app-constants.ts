export const DEPLOYMENT_TYPES = ['cloud', 'self-hosted'] as const
export type DeploymentType = (typeof DEPLOYMENT_TYPES)[number]
