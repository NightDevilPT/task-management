export const getOtpEmailTemplate = (
	username: string,
	otp: number,
	currentYear: string,
	verificationUrl?: string
) => {
	return `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Verification Code | Mock AI Interview</title>
    <link
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
      rel="stylesheet"
    />
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
        background-color: #f8fafc;
        color: #334155;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      }
      .header {
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        padding: 32px;
        text-align: center;
        color: white;
      }
      .logo {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .content {
        padding: 32px;
      }
      h1 {
        font-size: 24px;
        margin-top: 0;
        margin-bottom: 24px;
        color: #1e293b;
      }
      .otp-container {
        background-color: #f1f5f9;
        border-radius: 8px;
        padding: 24px;
        text-align: center;
        margin: 24px 0;
      }
      .otp-code {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 4px;
        color: #3b82f6;
        margin: 16px 0;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-weight: 600;
        margin: 16px 0;
      }
      .footer {
        padding: 24px;
        text-align: center;
        font-size: 14px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
      }
      .small-text {
        font-size: 14px;
        color: #64748b;
        margin-top: 24px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Mock AI Interview</div>
        <div>Email Verification</div>
      </div>
      
      <div class="content">
        <h1>Hello ${username},</h1>
        
        <p>Thank you for signing up with Mock AI Interview! To complete your registration, please verify your email address using the following One-Time Password (OTP):</p>
        
        <div class="otp-container">
          <div>Your verification code:</div>
          <div class="otp-code">${otp}</div>
          <div>This code will expire in 10 minutes</div>
        </div>
        
        ${
			verificationUrl
				? `
        <p style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </p>
        <p style="text-align: center;">Or copy and paste this link in your browser:<br>
          <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
        </p>
        `
				: ""
		}
        
        <p>If you didn't request this email, you can safely ignore it. Someone might have entered your email address by mistake.</p>
        
        <div class="small-text">
          <p>Need help? Contact our support team at <a href="mailto:support@mockaiinterview.com" style="color: #3b82f6;">support@mockaiinterview.com</a></p>
        </div>
      </div>
      
      <div class="footer">
        &copy; ${currentYear} Mock AI Interview. All rights reserved.<br>
        <div style="margin-top: 8px;">
          <a href="https://mockaiinterview.com/privacy" style="color: #64748b; margin: 0 8px;">Privacy Policy</a>
          <a href="https://mockaiinterview.com/terms" style="color: #64748b; margin: 0 8px;">Terms of Service</a>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
};
