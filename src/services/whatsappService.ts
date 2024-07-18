import axios from 'axios';

export async function sendWhatsAppMessage(phoneNumberId: string, accessToken: string, to: string, message: string) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
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