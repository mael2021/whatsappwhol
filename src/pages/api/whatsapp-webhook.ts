import type { NextApiRequest, NextApiResponse } from 'next';
import { sendWhatsAppMessage } from '@/services/whatsappService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Webhook called. Method:', req.method);
    console.log('Query parameters:', req.query);

    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            console.log('Webhook verified');
            return res.status(200).send(challenge);
        } else {
            console.log('Webhook verification failed');
            return res.status(403).json({ error: 'Verification failed' });
        }
    } else if (req.method === 'POST') {
        const body = req.body;

        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry[0];
            const changes = entry.changes[0];
            const value = changes.value;

            if (value.messages && value.messages.length > 0) {
                const message = value.messages[0];
                const from = message.from;
                const messageBody = message.text.body;

                console.log('Message received:', messageBody, 'from:', from);

                // Here you would typically process the message and generate a response
                const response = `Received: ${messageBody}`;

                // Send the response back to WhatsApp
                await sendWhatsAppMessage(process.env.WHATSAPP_PHONE_NUMBER_ID!, process.env.WHATSAPP_ACCESS_TOKEN!, from, response);

                return res.status(200).json({ success: true });
            }
        }

        return res.status(200).json({ success: true });
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}