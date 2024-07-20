import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const MAIN_PROJECT_URL = 'https://tu-proyecto-principal.com/api/process-whatsapp-message';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Webhook called. Method:', req.method);
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request query:', JSON.stringify(req.query, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log('Verification attempt:');
        console.log('Mode:', mode);
        console.log('Token received:', token);
        console.log('Expected token:', process.env.WHATSAPP_VERIFY_TOKEN);
        console.log('Challenge:', challenge);

        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            console.log('Webhook verified successfully');
            return res.status(200).send(challenge);
        } else {
            console.log('Webhook verification failed');
            if (mode !== 'subscribe') console.log('Incorrect mode');
            if (token !== process.env.WHATSAPP_VERIFY_TOKEN) console.log('Token mismatch');
            return res.status(403).json({ error: 'Verification failed' });
        }
    } else if (req.method === 'POST') {
        console.log('Processing POST request');
        const incomingMsg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || '';
        const fromNumber = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;

        console.log('Incoming message:', incomingMsg);
        console.log('From number:', fromNumber);

        try {
            console.log('Sending data to main project:', MAIN_PROJECT_URL);
            const response = await axios.post(MAIN_PROJECT_URL, {
                message: incomingMsg,
                from: fromNumber
            });

            console.log('Response from main project:', response.data);

            const { answer, phoneNumberId, accessToken } = response.data;

            console.log('Sending WhatsApp message');
            await sendWhatsAppMessage(phoneNumberId, accessToken, fromNumber, answer);

            console.log('WhatsApp message sent successfully');
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error processing webhook:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        console.log('Method not allowed:', req.method);
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function sendWhatsAppMessage(phoneNumberId: string, accessToken: string, to: string, message: string) {
    console.log('Sending WhatsApp message:');
    console.log('Phone Number ID:', phoneNumberId);
    console.log('To:', to);
    console.log('Message:', message);

    try {
        const response = await axios.post(
            `https://graph.facebook.com/v12.0/${phoneNumberId}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('WhatsApp API response:', response.data);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
}