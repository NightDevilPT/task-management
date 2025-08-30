// templates/team-invite.template.ts
export function getTeamInviteEmailTemplate(
	recipientName: string,
	teamName: string,
	projectName: string,
	invitedByName: string,
	inviteLink: string,
	currentYear: string
): string {
	return `
  <!DOCTYPE html>
  <html>
  <head>
	  <meta charset="utf-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Team Invitation - Task Management System</title>
	  <style>
		  body {
			  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
			  line-height: 1.6;
			  color: #333;
			  margin: 0;
			  padding: 0;
			  background-color: #f9fafb;
		  }
		  .container {
			  max-width: 600px;
			  margin: 0 auto;
			  padding: 20px;
			  background-color: #ffffff;
		  }
		  .header {
			  text-align: center;
			  padding: 20px 0;
			  border-bottom: 1px solid #e5e7eb;
		  }
		  .logo {
			  font-size: 24px;
			  font-weight: bold;
			  color: #3b82f6;
		  }
		  .content {
			  padding: 30px 20px;
		  }
		  .button {
			  display: inline-block;
			  padding: 12px 24px;
			  background-color: #3b82f6;
			  color: white;
			  text-decoration: none;
			  border-radius: 6px;
			  font-weight: 600;
			  margin: 20px 0;
		  }
		  .footer {
			  text-align: center;
			  padding: 20px 0;
			  border-top: 1px solid #e5e7eb;
			  color: #6b7280;
			  font-size: 14px;
		  }
		  .info-box {
			  background-color: #f3f4f6;
			  padding: 15px;
			  border-radius: 6px;
			  margin: 15px 0;
		  }
	  </style>
  </head>
  <body>
	  <div class="container">
		  <div class="header">
			  <div class="logo">Task Management System</div>
		  </div>
		  
		  <div class="content">
			  <h2>You've been invited to join a team!</h2>
			  
			  <p>Hello ${recipientName},</p>
			  
			  <p><strong>${invitedByName}</strong> has invited you to join the team <strong>${teamName}</strong> 
			  in the project <strong>${projectName}</strong> on the Task Management System.</p>
			  
			  <div class="info-box">
				  <strong>Team:</strong> ${teamName}<br>
				  <strong>Project:</strong> ${projectName}<br>
				  <strong>Invited by:</strong> ${invitedByName}<br>
				  <strong>Invitation expires:</strong> ${new Date().toLocaleDateString()}
			  </div>
			  
			  <p>Click the button below to accept this invitation and get started:</p>
			  
			  <div style="text-align: center;">
				  <a href="${inviteLink}" class="button">Accept Invitation</a>
			  </div>
			  
			  <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
			  <p style="word-break: break-all; color: #3b82f6;">${inviteLink}</p>
			  
			  <p><strong>Note:</strong> If you don't have an account yet, you'll be prompted to create one 
			  using this email address. Your team membership will be automatically activated once you sign up.</p>
		  </div>
		  
		  <div class="footer">
			  <p>© ${currentYear} Task Management System. All rights reserved.</p>
			  <p>This is an automated message, please do not reply to this email.</p>
		  </div>
	  </div>
  </body>
  </html>
	`;
}
