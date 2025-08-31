import { ILoginPayload } from "@/interface/user.interface";
import * as z from "zod"

// Define the form schema using Zod for validation
export const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export interface LoginFormProps
  extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  showFooter?: boolean;
}