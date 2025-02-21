// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import sendgrid from '@sendgrid/mail';
import qr from 'qrcode';
import { firestore } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set');
}
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

initializeApi();
const db = firestore();
const REGISTRATION_COLLECTION = 'registrations'; 

async function sendEmailsToRegisteredUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log("Fetching emails from Firestore...");

    // **1. Fetch all registered emails from Firestore**
    const snapshot = await db.collection(REGISTRATION_COLLECTION).get();
    
    if (snapshot.empty) {
      console.error("No registered emails found in Firestore.");
      return res.status(400).json({ error: "No registered emails found" });
    }

    // **Extract document IDs (which are emails)**
    const emails = snapshot.docs.map((doc) => doc.id);
    console.log("Emails retrieved from Firestore:", emails);

    // **2. Send emails to all users**
    await Promise.all(
      emails.map(async (email) => {
        try {
          // Generate QR Code
          const qrcode = (await qr.toDataURL(email)).replace('data:image/png;base64,', '');

          // Email details
          const msg: sendgrid.MailDataRequired = {
            to: email,
            from: process.env.SENDGRID_SENDER as string,
            subject: 'Axxess Hackathon QR Code',
            text: `Hello,\n\nThank you for registering for the Axxess Hackathon. Below is your unique QR code for check-in, swag, and food! We recommend arriving at 8:30am to get in line for check-in as space is limited.\n\nHackathon check-in begins on February 22nd, 9 a.m. CDT.\n\nLocation:\nECSW 1.100 Axxess Atrium\n800 W. Campbell Road, Richardson, Texas 75080\n\nPlease also join the Discord to stay up to date with the event: https://discord.gg/mcsgb4Vj \n\nIf you have any questions, please reach out to hackathon@axxess.com.\n\nBest regards,\n\nThe Axxess Hackathon Team`,
            attachments: [
              {
                content: qrcode,
                filename: 'qrcode.png',
                type: 'image/png',
                disposition: 'attachment',
              },
            ],
          };

          // Send email
          await sendgrid.send(msg);
          console.log(`Email sent`);
        } catch (error) {
          console.error(`Failed to send email:`, error.response?.body?.errors || error);
        }
      })
    );

    res.status(200).json({ success: true, message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error retrieving registrations or sending emails:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// **API Route Handler**
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return sendEmailsToRegisteredUsers(req, res);
  }
  return res.status(405).json({ error: "Method not allowed" });
}

//HOW TO RUN THIS SCRIPT
//GO TO THE TERMINAL AND RUN THE FOLLOWING COMMAND
// curl -X POST http://localhost:3000/api/email -H "Content-Type: application/json"
