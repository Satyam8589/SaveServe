// Simple email test endpoint
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // Test nodemailer import
    console.log('Nodemailer imported:', typeof nodemailer);
    console.log('createTransport method:', typeof nodemailer.createTransport);
    
    // Test environment variables
    const envCheck = {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS,
      SMTP_PORT: !!process.env.SMTP_PORT,
    };
    
    // Try to create transporter
    let transporterStatus = 'not_created';
    let transporter = null;
    
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        transporterStatus = 'created_successfully';
        
        // Test connection
        await transporter.verify();
        transporterStatus = 'verified_successfully';
        
      } catch (error) {
        transporterStatus = `error: ${error.message}`;
      }
    } else {
      transporterStatus = 'missing_env_vars';
    }
    
    return NextResponse.json({
      success: true,
      nodemailer: {
        imported: typeof nodemailer,
        createTransport: typeof nodemailer.createTransport,
      },
      environment: envCheck,
      transporter: transporterStatus,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Simple email test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 });
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    // Send simple test email
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'SaveServe Email Test',
      html: `
        <h2>🎉 Email Test Successful!</h2>
        <p>This is a simple test email from your SaveServe reporting system.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>SMTP Host: ${process.env.SMTP_HOST}</li>
          <li>From Email: ${process.env.FROM_EMAIL || process.env.SMTP_USER}</li>
        </ul>
        <p>If you received this email, your email configuration is working correctly! ✅</p>
      `,
      text: `
        Email Test Successful!
        
        This is a simple test email from your SaveServe reporting system.
        Sent at: ${new Date().toLocaleString()}
        
        If you received this email, your email configuration is working correctly!
      `,
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      email: email,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
