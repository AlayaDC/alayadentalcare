import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const data = await request.json();

    // 1. Initialize Supabase on the Server
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Save the appointment to the Database FIRST
    const { error: dbError } = await supabase
      .from('appointments')
      .insert([{
        name: data.name,
        phone: data.phone,
        country_code: data.countryCode,
        location: data.location,
        service: data.service,
        date: data.date,
        time: data.time,
        status: 'Pending' // Default status
      }]);

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return NextResponse.json({ error: 'Failed to save appointment to database' }, { status: 500 });
    }

    // 3. Initialize Twilio
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const cleanPhone = data.phone.replace(/[\s\-()]/g, '');
    const fullPhoneNumber = `${data.countryCode}${cleanPhone}`;

    // 4. Send Message to Clinic
    const messageBody = `🦷 *New Appointment Request*\n\n` +
      `*Name:* ${data.name}\n` +
      `*Phone:* ${fullPhoneNumber}\n` +
      `*Location:* ${data.location}\n` +
      `*Service:* ${data.service}\n` +
      `*Date:* ${data.date}\n` +
      `*Time:* ${data.time}\n\n` +
      `👇 *HOW TO CONFIRM* 👇\n` +
      `CONFIRM ${fullPhoneNumber}`;

    await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.CLINIC_WHATSAPP_NUMBER, 
    });

    // 5. Send Auto-Receipt to Patient
    const patientMessageBody = `👋 Hello ${data.name}!\n\n` +
      `We have received your appointment request at *Alaya Dental Care*.\n\n` +
      `*Your Request Details:*\n` +
      `🏥 Location: ${data.location}\n` +
      `✨ Service: ${data.service}\n` +
      `📅 Date: ${data.date}\n` +
      `⏰ Time: ${data.time}\n\n` +
      `_Our team will review this and send you a final confirmation message shortly!_ 🦷`;

    try {
      const formattedPatientPhone = fullPhoneNumber.startsWith('+') ? fullPhoneNumber : `+${fullPhoneNumber}`;
      await client.messages.create({
        body: patientMessageBody,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${formattedPatientPhone}` 
      });
    } catch (patientError) {
      console.error("Sandbox limit hit, but appointment saved:", patientError.message);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 });
  }
}