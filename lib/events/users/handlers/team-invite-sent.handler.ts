// lib/events/teams/team-invite-sent.handler.ts
import { EventHandler } from "@/interface/cqrs.interface";
import { config } from "@/config/config";
import { getTeamInviteEmailTemplate } from "@/templates/team-invite.template";
import { emailProviderFactory } from "@/services/email-provider.service";
import { TeamInviteSentEvent } from "../impl/team-invite-sent.event";

export class TeamInviteSentEventHandler implements EventHandler<TeamInviteSentEvent> {
  async handle(event: TeamInviteSentEvent): Promise<void> {
    const {
      email,
      teamName,
      projectName,
      invitedByName,
      token
    } = event.payload;

    try {
      // Generate the invite link
      const inviteLink = `${config.origin}/invite/accept?token=${encodeURIComponent(token)}`;
      
      // Get current year for footer
      const currentYear = new Date().getFullYear().toString();

      // Create email subject and body
      const subject = `Invitation to join ${teamName} team - Task Management System`;
      const html = getTeamInviteEmailTemplate(
        email, // Using email as recipient name since we don't have their name yet
        teamName,
        projectName,
        invitedByName,
        inviteLink,
        currentYear
      );

      // Send email
      const transporter = emailProviderFactory("gmail");
      const emailOptions = {
        from: config.emailId,
        to: email,
        subject: subject,
        html: html,
      };

      await transporter.sendMail(emailOptions);

      console.log(`Team invitation email sent successfully to ${email}`);
      
    } catch (error) {
      console.error("Error sending team invitation email:", error);
      // We don't throw errors in event handlers to avoid breaking the command flow
      // You might want to log this to a monitoring service
    }
  }
}