// Load environment variables
require('dotenv').config();

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'https://jbaidoo.com' // Replace with your domain
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Booking schema
const bookingSchema = new mongoose.Schema({
  service: String,
  date: Date,
  name: String,
  email: String,
  phone: String,
  message: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Booking endpoint
app.post('/api/bookings', async (req, res) => {
  try {
    const { service, date, name, email, phone, message } = req.body;
    
    // Validate input
    if (!service || !date || !name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new booking
    const booking = new Booking({ service, date, name, email, phone, message });
    await booking.save();

    // Send confirmation email
    await transporter.sendMail({
      from: `"JBLC Bookings" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Booking Confirmation',
      html: `<h2>Thank you for your booking, ${name}!</h2>
             <p>Service: ${service}</p>
             <p>Date: ${new Date(date).toLocaleDateString()}</p>
             <p>We'll contact you soon to confirm details.</p>`
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});