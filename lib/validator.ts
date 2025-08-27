import { TranslationErrorEnum } from "@/interface/translation-enums";

export function validateEmail(email: string): boolean {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email);
}

export function validatePasswordWithErrors(password: string): {
	isValid: boolean;
	error: string;
} {
	let error: string = "";

	if (password.length < 8) {
		error = TranslationErrorEnum.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS;
	}

	if (!/[a-z]/.test(password)) {
		error =
			TranslationErrorEnum.PASSWORD_MUST_CONTAINS_AT_LEAST_ONE_LOWERCASE_LETTER;
	}

	if (!/[A-Z]/.test(password)) {
		error =
			TranslationErrorEnum.PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_UPPERCASE_LETTER;
	}

	if (!/\d/.test(password)) {
		error = TranslationErrorEnum.PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_DIGIT;
	}

	if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]\/+=;']/g.test(password)) {
		error =
			TranslationErrorEnum.PASSWORD_MUST_CONTAIN_AT_LEAST_ONE_SPECIAL_CHARACTER;
	}

	return {
		isValid: error.length === 0,
		error,
	};
}
