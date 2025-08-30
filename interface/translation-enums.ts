export enum TranslationEnum {
	// User Api Message
	USER_CREATED_SUCCESSFULLY = "userCreatedVerificationEmailSent",
	USER_VERIFIED_SUCCESSFULLY = "userVerifiedSuccessfully",
	USER_LOGGED_IN_SUCCESSFULLY = "userLoggedInSuccessfully",
	USER_LOGGED_OUT_SUCCESSFULLY = "userLoggedOutSuccessfully",
	OTP_SENT_FOR_PASSWORD_RESET = "otpSentForPasswordReset",
	PASSWORD_UPDATED_SUCCESSFULLY = "passwordUpdatedSuccessfully",
	VERIFICATION_MAIL_SENT = "verificationMailSent",
	LOGIN_SUCCESSFUL = "loginSuccessful",
	LOGOUT_SUCCESSFUL = "logoutSuccessful",
	USER_PROFILE_RETRIEVED = "userProfileRetrieved",
	PASSWORD_RESET_EMAIL_SENT = "passwordResetEmailSent",
	PASSWORD_RESET_SUCCESSFUL = "passwordResetSuccessful",
	USER_PROFILE_UPDATED = "userProfileUpdated",
	PROJECT_CREATED_SUCCESSFULLY = "projectCreatedSuccessfully",
	PROJECTS_RETRIEVED_SUCCESSFULLY = "projectsRetrievedSuccessfully",
	PROJECT_UPDATED_SUCCESSFULLY = "projectUpdatedSuccessfully",

	TEAM_CREATED_SUCCESSFULLY = "teamCreatedSuccessfully",
	TEAMS_RETRIEVED_SUCCESSFULLY = "teamsRetrievedSuccessfully",
	TEAM_UPDATED_SUCCESSFULLY = "teamUpdatedSuccessfully",
	INVITE_SENT_SUCCESSFULLY = "inviteSentSuccessfully",

	TASK_CREATED_SUCCESSFULLY = "taskCreatedSuccessfully",
}

export enum TranslationErrorEnum {
	// General Api Error Message
	INTERNAL_SERVER_ERROR = "internalServerError",
	ALL_FIELDS_ARE_REQUIRED = "allFieldsAreRequired",
	INVALID_OTP = "invalidOtp",
	OTP_EXPIRED = "otpExpired",
	SESSION_EXPIRED = "sessionExpired",
	UNAUTHORIZED = "unauthorized",
	INVALID_INPUT = "invalidInput",
	FORBIDDEN = "forbidden",

	// User Api Error Message
	EMAIL_IS_REQUIRED = "emailIsRequired",
	INVALID_EMAIL_FORMAT = "invalidEmailFormat",
	USER_ALREADY_EXISTS = "userAlreadyExists",
	USER_CREATED_SUCCESSFULLY = "userCreatedSuccessfully",
	PASSWORD_TOO_WEAK = "passwordTooWeak",
	PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS = "passwordMustBeAtLeast8Characters",
	PASSWORD_MUST_CONTAINS_AT_LEAST_ONE_LOWERCASE_LETTER = "passwordMustContainsAtLeastOneLowercaseLetter",
	PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_UPPERCASE_LETTER = "passwordMustContainAtLeastOneUppercaseLetter",
	PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_DIGIT = "passwordMustContainAtLeastOneDigit",
	PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_SPECIAL_CHARACTER = "passwordMustContainAtLeastOneSpecialCharacter",
	USER_DOES_NOT_EXIST = "userDoesNotExist",
	USER_ALREADY_VERIFIED = "userAlreadyVerified",
	USER_NOT_VERIFIED = "userNotVerified",
	INVALID_CREDENTIALS = "invalidCredentials",
	INVALID_OR_EXPIRED_OTP = "invalidOrExpiredOtp",
	USER_DEACTIVATED = "userDeactivated",
	INVALID_CURRENT_PASSWORD = "invalidCurrentPassword",
	CURRENT_PASSWORD_REQUIRED = "currentPasswordRequired",
	EMAIL_ALREADY_EXISTS = "emailAlreadyExists",
	USERNAME_ALREADY_EXISTS = "usernameAlreadyExists",

	// Project Api Error Message
	PROJECT_NOT_FOUND = "projectNotFound",

	// Team Api Error Message
	TEAM_NAME_ALREADY_EXISTS_IN_PROJECT = "teamNameAlreadyExistsInProject",
	TEAM_NOT_FOUND = "teamsNotFound",
	TEAM_ACCESS_DENIED = "youDoNotHaveAccessToThisTeam",
	TEAM_NAME_MIN_LENGTH = "teamNameMinLength",
	UNAUTHORIZED_TEAM_ACCESS = "unauthorizedTeamAccess",
	INVITE_ALREADY_SENT = "inviteAlreadySent",
	USER_ALREADY_TEAM_MEMBER = "userAlreadyTeamMember",
	INVALID_ROLE = "invalidRole",
	INVALID_INVITE_TOKEN = "invalidInviteToken",
	EMAIL_MISMATCH_INVITE = "emailMismatchInvite",
	INVITE_NOT_FOUND_OR_EXPIRED = "inviteNotFoundOrExpired",
	TEAM_NOT_FOUND_OR_ACCESS_DENIED = "teamNotFoundOrAccessDenied",

	// Task Api Error Message
	TASK_TITLE_TOO_SHORT = "taskTitleTooShort",
	TEAM_ID_REQUIRED_FOR_NON_OWNERS = "teamIdRequiredForNonOwners",
	YOU_DO_NOT_HAVE_ACCESS_TO_THIS_TEAM = "youDoNotHaveAccessToThisTeam",
	NO_TEAM_AVAILABLE_IN_THIS_PROJECT_TO_ASSIGN_TASK = "noTeamAvailableInThisProjectToAssignTask",
	ASSIGNED_USER_NOT_FOUND = "assignedUserNotFound",
	ASSIGNED_USER_NOT_A_PART_OF_TEAM = "assignedUserNotAPartOfTeam",
	INVALID_TASK_STATUS = "invalidTaskStatus",
	INVALID_TASK_PRIORITY = "invalidTaskPriority",
	TASK_DUE_DATE_BE_IN_FUTURE = "taskDueDateBeInFuture",
	INVALID_DUE_DATE = "invalidDueDate",
}
