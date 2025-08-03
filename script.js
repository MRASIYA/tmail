document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('tempEmail');
    const copyBtn = document.getElementById('copyBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const qrBtn = document.getElementById('qrBtn');
    const qrModal = document.getElementById('qrModal');
    const emailModal = document.getElementById('emailModal');
    const closeModal = document.getElementsByClassName('close');
    const countdown = document.getElementById('countdown');
    const emailList = document.getElementById('emailList');
    const refreshInboxBtn = document.getElementById('refreshInbox');
    const sendTestBtn = document.getElementById('sendTestBtn');
    const testResult = document.getElementById('testResult');
    
    let timer;
    let currentEmail = '';
    let emailStorage = [];
    
    // Generate a random email address
    function generateRandomEmail() {
        const randomString = Math.random().toString(36).substring(2, 12);
        const timestamp = Date.now().toString().slice(-4);
        return `${randomString}${timestamp}@tempmail.dev`;
    }

    // Generate new temporary email
    function generateEmail() {
        currentEmail = generateRandomEmail();
        emailInput.value = currentEmail;
        emailStorage = []; // Clear inbox when generating new email
        startTimer();
        displayEmails([]);
    }

    // Start countdown timer
    function startTimer() {
        let time = 600; // 10 minutes
        clearInterval(timer);
        timer = setInterval(() => {
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            countdown.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            if (time-- === 0) {
                clearInterval(timer);
                generateEmail();
            }
        }, 1000);
    }

    // Copy email to clipboard
    copyBtn.addEventListener('click', () => {
        emailInput.select();
        emailInput.setSelectionRange(0, 99999); // For mobile devices
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(emailInput.value).then(() => {
                alert('Email copied to clipboard!');
            });
        } else {
            document.execCommand('copy');
            alert('Email copied to clipboard!');
        }
    });

    // Generate new email
    refreshBtn.addEventListener('click', generateEmail);

    // Show QR Code
    qrBtn.addEventListener('click', () => {
        qrModal.style.display = 'block';
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, emailInput.value);
        } else {
            qrContainer.innerHTML = '<p>QR Code library not loaded</p>';
        }
    });

    // Close modals
    Array.from(closeModal).forEach(element => {
        element.onclick = () => {
            qrModal.style.display = 'none';
            emailModal.style.display = 'none';
        };
    });

    window.onclick = event => {
        if (event.target === qrModal || event.target === emailModal) {
            qrModal.style.display = 'none';
            emailModal.style.display = 'none';
        }
    };

    // Display emails in inbox
    function displayEmails(emails) {
        if (!emails || emails.length === 0) {
            emailList.innerHTML = `
                <div class="empty-inbox">
                    <i class="fas fa-inbox empty-icon"></i>
                    <p>Your inbox is empty</p>
                    <small>Waiting for incoming emails...</small>
                </div>
            `;
        } else {
            emailList.innerHTML = emails.map(email => `
                <div class="email-item" onclick="viewEmail('${email.id}')">
                    <div class="email-header">
                        <strong class="email-from">${email.from}</strong>
                        <span class="email-time">${formatTime(email.timestamp)}</span>
                    </div>
                    <div class="email-subject">${email.subject}</div>
                    <div class="email-preview">${email.body.substring(0, 100)}...</div>
                </div>
            `).join('');
        }
    }

    // View email details
    function viewEmail(emailId) {
        const email = emailStorage.find(e => e.id === emailId);
        if (email) {
            document.getElementById('emailDetail').innerHTML = `
                <h3>${email.subject}</h3>
                <p><strong>From:</strong> ${email.from}</p>
                <p><strong>Time:</strong> ${formatTime(email.timestamp)}</p>
                <hr>
                <div class="email-body">${email.body}</div>
            `;
            emailModal.style.display = 'block';
            email.read = true;
            displayEmails(emailStorage);
        }
    }

    // Format timestamp
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    // Refresh inbox
    refreshInboxBtn.addEventListener('click', () => {
        displayEmails(emailStorage);
    });

    // Send test email
    sendTestBtn.addEventListener('click', () => {
        const testFrom = document.getElementById('testFrom').value;
        const testSubject = document.getElementById('testSubject').value;
        const testMessage = document.getElementById('testMessage').value;

        if (!testFrom || !testSubject || !testMessage) {
            testResult.textContent = '❌ Please fill in all fields.';
            testResult.className = 'test-result error';
            return;
        }

        // Create test email object
        const newEmail = {
            id: 'email_' + Date.now(),
            from: testFrom,
            subject: testSubject,
            body: testMessage,
            timestamp: Date.now(),
            read: false
        };

        // Add to inbox
        emailStorage.push(newEmail);
        displayEmails(emailStorage);

        // Show success message
        testResult.textContent = '✅ Test email sent successfully!';
        testResult.className = 'test-result success';

        // Clear result after 3 seconds
        setTimeout(() => {
            testResult.textContent = '';
            testResult.className = 'test-result';
        }, 3000);
    });

    // Auto-refresh every 10 seconds
    setInterval(() => {
        if (currentEmail) {
            displayEmails(emailStorage);
        }
    }, 10000);

    // Make viewEmail globally accessible
    window.viewEmail = viewEmail;

    // Initialize
    generateEmail();
});
