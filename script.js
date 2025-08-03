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

    generateEmail();
});
