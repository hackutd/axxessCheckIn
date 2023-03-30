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
    text: "Hello,\n\nThank you for registering for the Axxess Hackathon. Below is your unique QR-code for check-in, swag, and food! We recommend arriving at 8:45am to get in line for check-in as space is limited.\n\nYou'll recieve an email in a few days (Wednesday or Thursday) with all the Axxess Hackathon event details.\n\nHackathon check-in begins at April 1st, 9 a.m. CDT.\n\nLocation:\nECSW 1.100 Axxess Atrium\n800 W. Campbell Road, Richardson, Texas 75080\n\nIf you have any questions or concerns, please don't hesitate to reach out to us at hackathon@axxess.com.\n\nThank you again for registering for the Axxess Hackathon. We can't wait to see you there!\n\nBest regards,\n\nThe Axxess Hackathon Team",
    attachments: [
      {
        content: qrcode,
        filename: "qrcode.png",
      },
    ],
  };
  sendgrid.send(msg).catch((err) => console.log(err.response.body.errors));
  res.status(200).json({});
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    sendEmail(req, res);
  } else {
    res.status(405).json({});
  }
}
