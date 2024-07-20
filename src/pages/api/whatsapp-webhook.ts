import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Esta URL debería apuntar a tu proyecto principal
const MAIN_PROJECT_URL = 'https://tu-proyecto-principal.com/api/process-whatsapp-message';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Webhook called. Method:', req.method);
    console.log('Request body:', req.body);

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
        const incomingMsg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || '';
        const fromNumber = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;

        try {
            // Enviar los datos al proyecto principal para procesamiento
            const response = await axios.post(MAIN_PROJECT_URL, {
                message: incomingMsg,
                from: fromNumber
            });

            const { answer, phoneNumberId, accessToken } = response.data;

            // Enviar respuesta usando la API de WhatsApp
            await sendWhatsAppMessage(phoneNumberId, accessToken, fromNumber, answer);

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error processing webhook:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function sendWhatsAppMessage(phoneNumberId: string, accessToken: string, to: string, message: string) {
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
        console.log('Message sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
}