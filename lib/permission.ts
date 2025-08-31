export enum ResourceType {
	PROJECT = "PROJECT",
	TEAM = "TEAM",
	TASK = "TASK",
	COMMENT = "COMMENT",
	ATTACHMENT = "ATTACHMENT",
	USER = "USER",
}

export enum Action {
	CREATE = "CREATE",
	READ = "READ",
	UPDATE = "UPDATE",
	DELETE = "DELETE",
	MANAGE = "MANAGE",
}

export enum TeamRole {
	ADMIN = "ADMIN",
	MANAGER = "MANAGER",
	MEMBER = "MEMBER",
}

// Interface for user context
export interface UserContext {
	id: string;
	role: TeamRole;
	// Add other user properties if needed for permission checks
}

// Interface for resource context (optional, for ownership checks)
export interface ResourceContext {
	ownerId?: string;
	teamId?: string;
	projectId?: string;
	// Add other resource-specific properties
}

// Permission matrix defining what each role can do
const permissionMatrix: Record<TeamRole, Record<ResourceType, Action[]>> = {
	[TeamRole.ADMIN]: {
		[ResourceType.PROJECT]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
			Action.MANAGE,
		],
		[ResourceType.TEAM]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
			Action.MANAGE,
		],
		[ResourceType.TASK]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
			Action.MANAGE,
		],
		[ResourceType.COMMENT]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
		],
		[ResourceType.ATTACHMENT]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
		],
		[ResourceType.USER]: [Action.READ, Action.MANAGE], // Admins can manage users within their scope
	},
	[TeamRole.MANAGER]: {
		[ResourceType.PROJECT]: [Action.READ], // Only read connected projects
		[ResourceType.TEAM]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
			Action.MANAGE,
		],
		[ResourceType.TASK]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
			Action.MANAGE,
		],
		[ResourceType.COMMENT]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
		],
		[ResourceType.ATTACHMENT]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
		],
		[ResourceType.USER]: [Action.READ],
	},
	[TeamRole.MEMBER]: {
		[ResourceType.PROJECT]: [Action.READ], // Only read connected projects
		[ResourceType.TEAM]: [Action.READ], // Only read connected teams
		[ResourceType.TASK]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
		],
		[ResourceType.COMMENT]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
		],
		[ResourceType.ATTACHMENT]: [
			Action.CREATE,
			Action.READ,
			Action.UPDATE,
			Action.DELETE,
		],
		[ResourceType.USER]: [Action.READ],
	},
};

// Additional ownership-based permissions
const ownershipPermissions: Partial<Record<ResourceType, Action[]>> = {
	[ResourceType.PROJECT]: [Action.UPDATE, Action.DELETE, Action.MANAGE],
	[ResourceType.TASK]: [Action.UPDATE, Action.DELETE],
	[ResourceType.COMMENT]: [Action.UPDATE, Action.DELETE],
	[ResourceType.ATTACHMENT]: [Action.UPDATE, Action.DELETE],
};

export class PermissionService {
	/**
	 * Check if a user has permission to perform an action on a resource
	 */
	static hasPermission(
		user: UserContext,
		action: Action,
		resourceType: ResourceType,
		resourceContext?: ResourceContext
	): boolean {
		// Get base permissions for the user's role
		const rolePermissions =
			permissionMatrix[user.role]?.[resourceType] || [];

		// Check if action is allowed by role
		if (rolePermissions.includes(action)) {
			return true;
		}

		// Check ownership-based permissions
		if (resourceContext?.ownerId && user.id === resourceContext.ownerId) {
			const ownerPermissions = ownershipPermissions[resourceType] || [];
			if (ownerPermissions.includes(action)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if user can access a specific resource based on ownership/association
	 */
	static canAccessResource(
		user: UserContext,
		resourceType: ResourceType,
		resourceContext: ResourceContext
	): boolean {
		// Owners can always access their resources
		if (resourceContext.ownerId && user.id === resourceContext.ownerId) {
			return true;
		}

		// Additional access logic based on resource type and user role
		switch (resourceType) {
			case ResourceType.PROJECT:
				// For projects, check if user is member of any team in the project
				// This would require additional service calls in real implementation
				return user.role === TeamRole.ADMIN;

			case ResourceType.TEAM:
				// For teams, check if user is a member
				// This would require checking team membership
				return user.role === TeamRole.ADMIN;

			case ResourceType.TASK:
				// For tasks, check if user is assigned or in the team
				return user.role !== TeamRole.MEMBER; // Simplified for example

			default:
				return true;
		}
	}

	/**
	 * Filter resources based on user permissions
	 */
	static filterResources<T extends ResourceContext>(
		user: UserContext,
		resources: T[],
		resourceType: ResourceType
	): T[] {
		return resources.filter((resource) =>
			this.canAccessResource(user, resourceType, resource)
		);
	}

	/**
	 * Check multiple permissions at once (useful for complex operations)
	 */
	static hasPermissions(
		user: UserContext,
		permissions: Array<{
			action: Action;
			resourceType: ResourceType;
			resourceContext?: ResourceContext;
		}>
	): boolean {
		return permissions.every((permission) =>
			this.hasPermission(
				user,
				permission.action,
				permission.resourceType,
				permission.resourceContext
			)
		);
	}
}

// Utility functions for common permission checks
export const PermissionChecks = {
	// Project permissions
	canCreateProject: (user: UserContext) =>
		PermissionService.hasPermission(
			user,
			Action.CREATE,
			ResourceType.PROJECT
		),

	canViewProject: (user: UserContext, project?: ResourceContext) =>
		PermissionService.hasPermission(
			user,
			Action.READ,
			ResourceType.PROJECT,
			project
		),

	canEditProject: (user: UserContext, project: ResourceContext) =>
		PermissionService.hasPermission(
			user,
			Action.UPDATE,
			ResourceType.PROJECT,
			project
		),

	canDeleteProject: (user: UserContext, project: ResourceContext) =>
		PermissionService.hasPermission(
			user,
			Action.DELETE,
			ResourceType.PROJECT,
			project
		),

	// Team permissions
	canCreateTeam: (user: UserContext) =>
		PermissionService.hasPermission(user, Action.CREATE, ResourceType.TEAM),

	canViewTeam: (user: UserContext, team?: ResourceContext) =>
		PermissionService.hasPermission(
			user,
			Action.READ,
			ResourceType.TEAM,
			team
		),

	canEditTeam: (user: UserContext, team: ResourceContext) =>
		PermissionService.hasPermission(
			user,
			Action.UPDATE,
			ResourceType.TEAM,
			team
		),

	canDeleteTeam: (user: UserContext, team: ResourceContext) =>
		PermissionService.hasPermission(
			user,
			Action.DELETE,
			ResourceType.TEAM,
			team
		),

	// Task permissions
	canCreateTask: (user: UserContext) =>
		PermissionService.hasPermission(user, Action.CREATE, ResourceType.TASK),

	canViewTask: (user: UserContext, task?: ResourceContext) =>
		PermissionService.hasPermission(
			user,
			Action.READ,
			ResourceType.TASK,
			task
		),

	canEditTask: (user: UserContext, task: ResourceContext) =>
		PermissionService.hasPermission(
			user,
			Action.UPDATE,
			ResourceType.TASK,
			task
		),

	canDeleteTask: (user: UserContext, task: ResourceContext) =>
		PermissionService.hasPermission(
			user,
			Action.DELETE,
			ResourceType.TASK,
			task
		),
};
