document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("tempEmail");
    const copyBtn = document.getElementById("copyBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const qrBtn = document.getElementById("qrBtn");
    const qrModal = document.getElementById("qrModal");
    const emailModal = document.getElementById("emailModal");
    const closeModal = document.getElementsByClassName("close");
    const countdown = document.getElementById("countdown");
    const emailList = document.getElementById("emailList");
    const refreshInboxBtn = document.getElementById("refreshInbox");
    
    let timer;
    let currentEmail = "";
    const API_BASE = "http://localhost:3001/api";

    async function generateEmail() {
        try {
            const response = await fetch(`${API_BASE}/generate-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentEmail = data.email;
                emailInput.value = currentEmail;
                startTimer();
                loadInbox();
            } else {
                // Fallback to local generation
                currentEmail = `user${Math.floor(Math.random() * 10000)}@tempmail.dev`;
                emailInput.value = currentEmail;
                startTimer();
            }
        } catch (error) {
            console.error('Error generating email:', error);
            // Fallback to local generation
            currentEmail = `user${Math.floor(Math.random() * 10000)}@tempmail.dev`;
            emailInput.value = currentEmail;
            startTimer();
        }
    }

    function startTimer() {
        let time = 600;
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

    copyBtn.addEventListener("click", () => {
        emailInput.select();
        document.execCommand("copy");
        alert("Email copied to clipboard!");
    });

    refreshBtn.addEventListener("click", () => {
        generateEmail();
    });

    qrBtn.addEventListener("click", () => {
        qrModal.style.display = "block";
        const qrContainer = document.getElementById("qrcode");
        qrContainer.innerHTML = "";
        new QRCode(qrContainer, emailInput.value);
    });

    Array.from(closeModal).forEach(element => {
        element.onclick = () => {
            qrModal.style.display = "none";
            emailModal.style.display = "none";
        };
    });

    window.onclick = event => {
        if (event.target == qrModal) {
            qrModal.style.display = "none";
        }
    };

    async function loadInbox() {
        if (!currentEmail) return;
        
        try {
            const response = await fetch(`${API_BASE}/inbox/${encodeURIComponent(currentEmail)}`);
            
            if (response.ok) {
                const data = await response.json();
                displayEmails(data.emails);
            } else {
                console.error('Failed to load inbox');
            }
        } catch (error) {
            console.error('Error loading inbox:', error);
        }
    }
    
    function displayEmails(emails) {
        if (emails.length === 0) {
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
    
    async function viewEmail(emailId) {
        try {
            const response = await fetch(`${API_BASE}/email/${emailId}`);
            
            if (response.ok) {
                const data = await response.json();
                const email = data.email;
                
                document.getElementById('emailDetail').innerHTML = `
                    <h3>${email.subject}</h3>
                    <p><strong>From:</strong> ${email.from}</p>
                    <p><strong>Time:</strong> ${formatTime(email.timestamp)}</p>
                    <hr>
                    <div class="email-body">${email.body}</div>
                `;
                
                emailModal.style.display = "block";
                loadInbox(); // Refresh inbox to show as read
            }
        } catch (error) {
            console.error('Error viewing email:', error);
        }
    }
    
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }
    
    // Refresh inbox button
    refreshInboxBtn.addEventListener('click', () => {
        loadInbox();
    });
    
    // Auto-refresh inbox every 10 seconds
    setInterval(() => {
        if (currentEmail) {
            loadInbox();
        }
    }, 10000);
    
    // Make viewEmail globally accessible
    window.viewEmail = viewEmail;

    generateEmail();
});
