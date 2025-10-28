export interface WelcomeEmailData {
  userName: string
  userEmail: string
  invitedBy: string
  resetLink: string
  companyName: string
}

export function generateWelcomeEmail(data: WelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${data.companyName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333333;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      color: #666666;
      font-size: 16px;
      margin-bottom: 20px;
    }
    .highlight {
      background-color: #f0f4ff;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin: 25px 0;
    }
    .highlight p {
      margin: 0;
      color: #333333;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
      color: #6b7280;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .credentials {
      background-color: #fff9e6;
      border: 1px solid #ffd700;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .credentials h3 {
      margin-top: 0;
      color: #b8860b;
      font-size: 18px;
    }
    .credentials p {
      margin: 10px 0;
      color: #666666;
    }
    .credentials strong {
      color: #333333;
    }
    .icon {
      display: inline-block;
      width: 60px;
      height: 60px;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      line-height: 60px;
      font-size: 30px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🎉</div>
      <h1>Welcome to ${data.companyName}!</h1>
    </div>
    
    <div class="content">
      <h2>Congratulations, ${data.userName}!</h2>
      
      <p>
        Great news! You have been invited by <strong>${data.invitedBy}</strong> to join 
        <strong>${data.companyName}</strong> - our coupon management platform.
      </p>
      
      <div class="highlight">
        <p>
          <strong>🚀 You're all set!</strong> Your account has been created and is ready to use.
        </p>
      </div>
      
      <p>
        To get started, you'll need to set up your password. Simply click the button below 
        to create a secure password for your account.
      </p>
      
      <div class="button-container">
        <a href="${data.resetLink}" class="button">
          Set Up My Password →
        </a>
      </div>
      
      <div class="credentials">
        <h3>📧 Your Login Details</h3>
        <p><strong>Email:</strong> ${data.userEmail}</p>
        <p><strong>Status:</strong> Account Active</p>
        <p style="margin-top: 15px; font-size: 14px; color: #999;">
          You'll create your own password using the button above.
        </p>
      </div>
      
      <p style="color: #999; font-size: 14px; margin-top: 30px;">
        <strong>Note:</strong> This link will expire in 24 hours for security reasons. 
        If the link expires, please contact your administrator for a new invitation.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>${data.companyName}</strong></p>
      <p>Manage and distribute coupons with ease</p>
      <p style="margin-top: 15px;">
        Need help? Contact us at <a href="mailto:support@${data.companyName.toLowerCase().replace(/\s+/g, '')}.com">support@${data.companyName.toLowerCase().replace(/\s+/g, '')}.com</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function generatePlainTextWelcome(data: WelcomeEmailData): string {
  return `
Welcome to ${data.companyName}!

Congratulations, ${data.userName}!

Great news! You have been invited by ${data.invitedBy} to join ${data.companyName} - our coupon management platform.

Your account has been created and is ready to use.

To get started, please set up your password by visiting this link:
${data.resetLink}

Your Login Details:
Email: ${data.userEmail}
Status: Account Active

Note: This link will expire in 24 hours for security reasons.

Need help? Contact us at support@${data.companyName.toLowerCase().replace(/\s+/g, '')}.com

---
${data.companyName}
Manage and distribute coupons with ease
  `.trim()
}

