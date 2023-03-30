// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import sendgrid from '@sendgrid/mail';
import qr from 'qrcode';
import { auth, firestore } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY ?? '');

initializeApi();

const REGISTRATION_COLLECTION = '/registrations';
const db = firestore();

async function sendEmail(req: NextApiRequest, res: NextApiResponse) {
  // Make sure you set the Content-Type header to application/json
  const { emails } = req.body;

  if (!emails) {
    return res.status(400).send('Invalid email list');
  }
  emails.forEach(async (email) => {
    const qrcode = (await qr.toDataURL(email)).replace(
      'data:image/png;base64,',
      ''
    );
    const msg: sendgrid.MailDataRequired = {
      to: email,
      from: process.env.SENDGRID_SENDER as string,
      subject: 'Axxess Hackathon QR Code',
      text: "Hello,\n\nThank you for registering for the Axxess Hackathon. Below is your unique QR-code for check-in, swag, and food! We recommend arriving at 8:45am to get in line for check-in as space is limited.\n\nYou'll recieve an email soon (Wednesday or Thursday) with all the Axxess Hackathon event details.\n\nHackathon check-in begins at April 1st, 9 a.m. CDT.\n\nLocation:\nECSW 1.100 Axxess Atrium\n800 W. Campbell Road, Richardson, Texas 75080\n\nIf you have any questions or concerns, please don't hesitate to reach out to us at hackathon@axxess.com.\n\nThank you again for registering for the Axxess Hackathon. We can't wait to see you there!\n\nBest regards,\n\nThe Axxess Hackathon Team",
      attachments: [
        {
          content: qrcode,
          filename: 'qrcode.png',
        },
      ],
    };
    sendgrid.send(msg).catch((err) => {
      console.log(email);
      console.log(err.response.body.errors);
    });
  });
  res.status(200).json({});
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    await sendEmail(req, res);
  } else {
    res.status(405).json({});
  }
}
