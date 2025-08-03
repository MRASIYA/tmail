const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (adjust for production)
app.use(cors());
app.use(express.json());

// In-memory storage for emails (use Redis in production)
const emailStorage = new Map();
const emailInboxes = new Map();

// Domain for temporary emails
const TEMP_DOMAIN = 'tempmail.dev';

// Generate random email address
function generateRandomEmail() {
    const randomString = Math.random().toString(36).substring(2, 12);
    const timestamp = Date.now().toString().substring(-4);
    return `${randomString}${timestamp}@${TEMP_DOMAIN}`;
}

// Clean up expired emails (older than 10 minutes)
function cleanupExpiredEmails() {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    
    for (const [email, data] of emailStorage) {
        if (now - data.createdAt > tenMinutes) {
            emailStorage.delete(email);
            emailInboxes.delete(email);
        }
    }
}

// Run cleanup every minute
setInterval(cleanupExpiredEmails, 60000);

// Routes

// Generate new temporary email
app.post('/api/generate-email', (req, res) => {
    const email = generateRandomEmail();
    const emailData = {
        email: email,
        createdAt: Date.now(),
        expiresAt: Date.now() + (10 * 60 * 1000) // 10 minutes
    };
    
    emailStorage.set(email, emailData);
    emailInboxes.set(email, []); // Initialize empty inbox
    
    res.json({
        success: true,
        email: email,
        expiresAt: emailData.expiresAt
    });
});

// Get inbox for an email
app.get('/api/inbox/:email', (req, res) => {
    const email = req.params.email;
    
    if (!emailStorage.has(email)) {
        return res.status(404).json({
            success: false,
            message: 'Email not found or expired'
        });
    }
    
    const inbox = emailInboxes.get(email) || [];
    res.json({
        success: true,
        emails: inbox
    });
});

// Simulate receiving an email (webhook endpoint)
app.post('/api/webhook/email', (req, res) => {
    const { to, from, subject, body, timestamp } = req.body;
    
    if (emailInboxes.has(to)) {
        const emailMessage = {
            id: uuidv4(),
            from: from,
            subject: subject,
            body: body,
            timestamp: timestamp || Date.now(),
            read: false
        };
        
        const inbox = emailInboxes.get(to);
        inbox.push(emailMessage);
        emailInboxes.set(to, inbox);
        
        res.json({ success: true, message: 'Email received' });
    } else {
        res.status(404).json({ success: false, message: 'Email address not found' });
    }
});

// Get specific email
app.get('/api/email/:emailId', (req, res) => {
    const emailId = req.params.emailId;
    
    // Search through all inboxes for the email
    for (const inbox of emailInboxes.values()) {
        const email = inbox.find(e => e.id === emailId);
        if (email) {
            email.read = true; // Mark as read
            return res.json({
                success: true,
                email: email
            });
        }
    }
    
    res.status(404).json({
        success: false,
        message: 'Email not found'
    });
});

// Delete an email
app.delete('/api/email/:emailId', (req, res) => {
    const emailId = req.params.emailId;
    
    for (const [emailAddress, inbox] of emailInboxes.entries()) {
        const emailIndex = inbox.findIndex(e => e.id === emailId);
        if (emailIndex !== -1) {
            inbox.splice(emailIndex, 1);
            emailInboxes.set(emailAddress, inbox);
            return res.json({
                success: true,
                message: 'Email deleted'
            });
        }
    }
    
    res.status(404).json({
        success: false,
        message: 'Email not found'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: Date.now()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Temp Mail server running on port ${PORT}`);
});

module.exports = app;
