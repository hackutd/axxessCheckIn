// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import qr from 'qrcode';
import { auth, firestore } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';

initializeApi();

const REGISTRATION_COLLECTION = '/registrations';
const db = firestore();

// NOTE: Max 500 emails at once lmao
async function sendEmail(req: NextApiRequest, res: NextApiResponse) {
  // Make sure you set the Content-Type header to application/json
  const { emails } = req.body;

  if (!emails) {
    return res.status(400).send('Invalid email list');
  }
  let batch = db.batch();
  emails.forEach((email) => {
    batch.set(db.collection(REGISTRATION_COLLECTION).doc(email), {});
  });
  await batch.commit();

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
