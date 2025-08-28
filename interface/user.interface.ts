export interface ISignup {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	username: string;
}

export interface IVerifyUser {
	otp: string;
	email: string;
}

export interface ILoginPayload {
	email: string;
	password: string;
}