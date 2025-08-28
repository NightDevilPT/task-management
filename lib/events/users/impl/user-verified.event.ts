// lib/events/users/impl/user-verified.event.ts
import { Event, CQRS_ENUMS } from "@/interface/cqrs.interface";

export class UserVerifiedEvent implements Event {
  readonly type = CQRS_ENUMS.USER_VERIFIED_EVENT;

  constructor(
    public readonly payload: {
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
    },
    public readonly metadata?: {
      correlationId?: string;
      timestamp?: Date;
    }
  ) {}
}