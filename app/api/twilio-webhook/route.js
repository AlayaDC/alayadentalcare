import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request) {
  try {
    // Twilio sends data as form data, not JSON
    const formData = await request.formData();
    const incomingMessage = formData.get('Body') || ''; // The text the clinic sent
    const sender = formData.get('From'); // The number that sent the message

    console.log(`Received message from ${sender}: ${incomingMessage}`);

    // Check if the clinic replied with our "CONFIRM" command
    if (incomingMessage.trim().toUpperCase().startsWith('CONFIRM')) {
      
      // Extract the customer's phone number from the message
      // E.g., from "CONFIRM +919876543210" it grabs "+919876543210"
      const customerNumber = incomingMessage.replace(/confirm/i, '').trim();

      // Initialize Twilio
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      // Send the confirmation message to the CUSTOMER
      await client.messages.create({
        body: `🎉 *Appointment Confirmed!* 🎉\n\nHello from Alaya Dental Care! We have successfully confirmed your appointment. We can't wait to see your smile! 😁🦷`,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${customerNumber}` // Sending to the extracted number
      });

      console.log(`Confirmation sent to ${customerNumber}`);
    }

    // Twilio requires an XML response to know the webhook was received successfully
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error("Webhook Error:", error);
    return new NextResponse('Error', { status: 500 });
  }
}