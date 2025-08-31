import * as z from "zod";

// Define the form schema using Zod for validation
export const formSchema = z.object({
	firstName: z.string().min(2, {
		message: "First name must be at least 2 characters.",
	}),
	lastName: z.string().min(2, {
		message: "Last name must be at least 2 characters.",
	}),
	email: z.string().email({
		message: "Please enter a valid email address.",
	}),
	password: z.string().min(8, {
		message: "Password must be at least 8 characters.",
	}),
	username: z.string().min(3, {
		message: "Username must be at least 3 characters.",
	}),
});

export interface SignupFormProps
	extends Omit<React.ComponentProps<"div">, "onSubmit"> {
	showFooter?: boolean;
}
