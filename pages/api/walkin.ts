// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import sendgrid from "@sendgrid/mail";
import qr from "qrcode";
import { auth, firestore } from "firebase-admin";
import initializeApi from "../../lib/admin/init";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY ?? "");

initializeApi();

const REGISTRATION_COLLECTION = "/registrations";
const db = firestore();

async function sendEmail(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send("Invalid email");
  }

  // Make sure user is not already in the collection
  const snapshot = await db
    .collection(REGISTRATION_COLLECTION)
    .doc(email)
    .get();
  if (snapshot.exists) return res.status(400).send("Email already exists");

  // Create user in the collection
  await db.collection(REGISTRATION_COLLECTION).doc(email).set({});

  const qrcode = (await qr.toDataURL(email)).replace(
    "data:image/png;base64,",
    ""
  );
  const msg: sendgrid.MailDataRequired = {
    to: email,
    from: process.env.SENDGRID_SENDER as string,
    subject: "Axxess Hackathon QR Code",
    text: `Hello,\n\nThank you for registering for the Axxess Hackathon. Below is your unique QR code for check-in, swag, and food! \n\nLocation:\nECSW 1.100 Axxess Atrium\n800 W. Campbell Road, Richardson, Texas 75080\n\nParking passes can be found [here](https://drive.google.com/file/d/14RpDz2ZKIBwtDAVdLQ2hJIlNWgeSscwS/view?usp=sharing). Print them out and put them on your dashboard or ask an organizer for one at Check-In. Please also join the Discord to stay up to date with the event: https://discord.gg/U24FB4JYxK \n\nIf you have any questions, please reach out to axxess@acmutd.com.\n\nBest regards,\n\nThe Axxess Hackathon Team`,
    attachments: [
      {
        content: qrcode,
        filename: "qrcode.png",
      },
    ],
  };
  
  try {
    await sendgrid.send(msg);
    console.log(`Email sent successfully to ${email}`);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (err: any) {
    console.error("SendGrid Error:", err.response?.body?.errors || err.message);
    return res.status(500).json({ 
      error: "Failed to send email", 
      details: err.response?.body?.errors || err.message 
    });
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    sendEmail(req, res);
  } else {
    res.status(405).json({});
  }
}
