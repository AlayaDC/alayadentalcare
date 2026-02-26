import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request) {
  try {
    const data = await request.json();

    // Initialize Twilio using Environment Variables
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // 1. Clean the user input: remove spaces, dashes, and parentheses
    const cleanPhone = data.phone.replace(/[\s\-()]/g, '');
    
    // 2. Combine the country code and cleaned phone number without gaps
    const fullPhoneNumber = `${data.countryCode}${cleanPhone}`;

    // ==========================================
    // 1. MESSAGE TO THE CLINIC
    // ==========================================
    const messageBody = `🦷 *New Appointment Request*\n\n` +
      `*Name:* ${data.name}\n` +
      `*Phone:* ${fullPhoneNumber}\n` + // <-- Now using the combined number
      `*Location:* ${data.location}\n` +
      `*Service:* ${data.service}\n` +
      `*Date:* ${data.date}\n` +
      `*Time:* ${data.time}\n\n` +
      `👇 *HOW TO CONFIRM* 👇\n` +
      `Copy and reply with the exact text below to notify the patient:\n\n` +
      `CONFIRM ${fullPhoneNumber}`; // <-- Magic trigger uses the full number

    // Send the message to the clinic
    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.CLINIC_WHATSAPP_NUMBER, 
    });

    console.log("Success! Clinic Notified SID:", message.sid);

    // ==========================================
    // 2. IMMEDIATE AUTO-RECEIPT TO THE PATIENT
    // ==========================================
    const patientMessageBody = `👋 Hello ${data.name}!\n\n` +
      `We have received your appointment request at *Alaya Dental Care*.\n\n` +
      `*Your Request Details:*\n` +
      `🏥 Location: ${data.location}\n` +
      `✨ Service: ${data.service}\n` +
      `📅 Date: ${data.date}\n` +
      `⏰ Time: ${data.time}\n\n` +
      `_Our team will review this and send you a final confirmation message shortly!_ 🦷`;

    try {
      // Basic check to ensure the phone number has a '+' for Twilio formatting
      const formattedPatientPhone = fullPhoneNumber.startsWith('+') ? fullPhoneNumber : `+${fullPhoneNumber}`;
      
      // Send the auto-receipt to the patient
      await client.messages.create({
        body: patientMessageBody,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${formattedPatientPhone}` 
      });
      
      console.log("Success! Auto-receipt sent to patient.");

    } catch (patientError) {
      // Wrapping this in a try/catch ensures that if the patient hasn't 
      // joined the sandbox yet, it doesn't break the whole app.
      console.error("Could not send auto-receipt to patient (Likely Sandbox limitation):", patientError.message);
    }

    // Finally, tell the frontend everything was successful
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Twilio Error:", error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' }, 
      { status: 500 }
    );
  }
}