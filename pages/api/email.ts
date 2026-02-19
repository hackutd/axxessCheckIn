// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import sendgrid from "@sendgrid/mail";
import qr from "qrcode";
import { firestore } from "firebase-admin";
import initializeApi from "../../lib/admin/init";

if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not set");
}
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

initializeApi();
const db = firestore();
const REGISTRATION_COLLECTION = "registrations";

async function sendEmailsToRegisteredUsers(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        console.log("Fetching emails from Firestore...");

        // **1. Fetch all registered emails from Firestore**
        const snapshot = await db.collection(REGISTRATION_COLLECTION).get();

        if (snapshot.empty) {
            console.error("No registered emails found in Firestore.");
            return res
                .status(400)
                .json({ error: "No registered emails found" });
        }

        // **Extract document IDs (which are emails)**
        const emails = snapshot.docs.map((doc) => doc.id);
        console.log("Emails retrieved from Firestore:", emails);

        // **2. Send emails to all users**
        await Promise.all(
            emails.map(async (email) => {
                try {
                    // Generate QR Code
                    const qrcode = (await qr.toDataURL(email)).replace(
                        "data:image/png;base64,",
                        "",
                    );

                    // Email details
                    const msg: sendgrid.MailDataRequired = {
                        to: email,
                        from: process.env.SENDGRID_SENDER as string,
                        subject: "Axxess Hackathon QR Code",
                        text: `Hello,\n\nThank you for registering for the Axxess Hackathon. Below is your unique QR code for check-in, swag, and food! Check-in is from 9 am to 11 am. We recommend arriving between 9 and 10 am to get in line for check-in. Walk-ins begin at 10 pm so we cannot guarantee you a spot even if you have a QR code. \n\nLocation:\nECSW 1.100 Axxess Atrium\n800 W. Campbell Road, Richardson, Texas 75080\n\nParking passes can be found here:\nhttps://tinyurl.com/axxess-parking\n\nPrint them out and put them on your dashboard. Please also join the Discord to stay up to date with the event:\nhttps://tinyurl.com/axxess-discord\n\nIf you have any questions, please reach out to axxess@acmutd.co.\n\nBest regards,\n\nThe Axxess Hackathon Team`,
                        attachments: [
                            {
                                content: qrcode,
                                filename: "qrcode.png",
                                type: "image/png",
                                disposition: "attachment",
                            },
                        ],
                        trackingSettings: {
                            clickTracking: {
                                enable: false,
                            },
                        },
                    };

                    // Send email
                    await sendgrid.send(msg);
                    console.log(`Email sent`);
                } catch (error) {
                    console.error(
                        `Failed to send email:`,
                        error.response?.body?.errors || error,
                    );
                }
            }),
        );

        res.status(200).json({
            success: true,
            message: "Emails sent successfully",
        });
    } catch (error) {
        console.error(
            "Error retrieving registrations or sending emails:",
            error,
        );
        res.status(500).json({ error: "Internal server error" });
    }
}

// **API Route Handler**
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method === "POST") {
        return sendEmailsToRegisteredUsers(req, res);
    }
    return res.status(405).json({ error: "Method not allowed" });
}

//HOW TO RUN THIS SCRIPT
//GO TO THE TERMINAL AND RUN THE FOLLOWING COMMAND
// curl -X POST http://localhost:3000/api/email -H "Content-Type: application/json"
