export enum TranslationEnum {
	// User Api Message
	USER_CREATED_SUCCESSFULLY = "userCreatedVerificationEmailSent",
	USER_VERIFIED_SUCCESSFULLY = "userVerifiedSuccessfully",
	USER_LOGGED_IN_SUCCESSFULLY = "userLoggedInSuccessfully",
	USER_LOGGED_OUT_SUCCESSFULLY = "userLoggedOutSuccessfully",
	OTP_SENT_FOR_PASSWORD_RESET = "otpSentForPasswordReset",
	PASSWORD_UPDATED_SUCCESSFULLY = "passwordUpdatedSuccessfully",
	VERIFICATION_MAIL_SENT = "verificationMailSent",
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

	// User Api Error Message
	EMAIL_IS_REQUIRED = "emailIsRequired",
	INVALID_EMAIL_FORMAT = "invalidEmailFormat",
	USER_ALREADY_EXISTS = "userAlreadyExists",
	USER_CREATED_SUCCESSFULLY = "userCreatedSuccessfully",
	PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS = "passwordMustBeAtLeast8Characters",
	PASSWORD_MUST_CONTAINS_AT_LEAST_ONE_LOWERCASE_LETTER = "passwordMustContainsAtLeastOneLowercaseLetter",
	PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_UPPERCASE_LETTER = "passwordMustContainAtLeastOneUppercaseLetter",
	PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_DIGIT = "passwordMustContainAtLeastOneDigit",
	PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_SPECIAL_CHARACTER = "passwordMustContainAtLeastOneSpecialCharacter",
	USER_DOES_NOT_EXIST = "userDoesNotExist",
	USER_ALREADY_VERIFIED = "userAlreadyVerified",
	USER_NOT_VERIFIED = "userNotVerified",
	INVALID_CREDENTIALS = "invalidCredentials",
}
