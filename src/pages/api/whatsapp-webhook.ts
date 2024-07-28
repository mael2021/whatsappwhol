//whatsapp-webjook
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const MAIN_PROJECT_URL = 'https://orange-olives-stay.loca.lt/api/process-whatsapp-message';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log('Webhook called. Method:', req.method);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (req.method === 'GET') {
        return handleVerification(req, res);
    } else if (req.method === 'POST') {
        return handleWebhookEvent(req, res);
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

function handleVerification(req: NextApiRequest, res: NextApiResponse) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Verification attempt:');
    console.log('Mode:', mode);
    console.log('Token:', token);
    console.log('Challenge:', challenge);

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('Webhook verified successfully');
        return res.status(200).send(challenge);
    } else {
        console.log('Webhook verification failed');
        return res.status(403).json({ error: 'Verification failed' });
    }
}

async function handleWebhookEvent(req: NextApiRequest, res: NextApiResponse) {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                const value = change.value;

                if (value.messages && value.messages.length > 0) {
                    await handleIncomingMessage(value.messages[0], value.metadata);
                }

                if (value.statuses && value.statuses.length > 0) {
                    handleMessageStatus(value.statuses[0], value.metadata);
                }
            }
        }

        return res.status(200).json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
}

async function handleIncomingMessage(message: any, metadata: any) {
    console.log('Received message:', message);
    try {
        console.log('Attempting to forward message to:', MAIN_PROJECT_URL);
        const response = await axios.post(MAIN_PROJECT_URL, {
            type: 'incoming_message',
            message: message,
            metadata: metadata
        }, {
            timeout: 10000 // 10 segundos de timeout
        });
        console.log('Main project response:', response.data);
    } catch (error: any) {
        console.error('Error forwarding message to main project:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
    }
}

function handleMessageStatus(status: any, metadata: any) {
    console.log('Message status update:', status);
    // Aquí puedes agregar lógica para manejar actualizaciones de estado de mensajes
}

console.log('Webhook handler initialized');
console.log('WHATSAPP_VERIFY_TOKEN set:', !!process.env.WHATSAPP_VERIFY_TOKEN);