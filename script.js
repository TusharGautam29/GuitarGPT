const typingForm = document.querySelector(".typing-form");
const chatlist = document.querySelector(".chat-messages");

let userMessage = null;
const API_KEY = "AIzaSyB7PVJ4_ZoipebC4_qKVxkyOzZ3XLi4weg";  // Replace with your actual API Key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Create a new message element
const createMessageElement = (content, className) => {
    const div = document.createElement("div");
    div.classList.add("message", className);
    div.innerHTML = content;
    return div;
};

const showLoadingAnimation = () => {
    const html = `
      <div class="message-content">
                    <div class="loading-container">
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                    </div>                    
                </div>
    `;
    const incomingMessagediv = createMessageElement(html, "incoming", "loading");
    chatlist.appendChild(incomingMessagediv);
};

// Fetch response from API based on user message
const generateAPIresponse = async () => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "contents": [{
                    "parts": [{
                        "text": userMessage
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('API error:', data.error.message);
            alert("API Error: " + data.error.message);  // Show alert in case of error
        } else {
            const apiResponse = data?.candidates[0]?.content?.parts[0]?.text;
            console.log(apiResponse);  // Output the API response
            
            // Corrected: Remove the loading animation after response is received (target by class)
            const loadingContainer = document.querySelector('.loading-container');
            if (loadingContainer) {
                loadingContainer.remove();  // Remove the loading container element
            }

            // Append the response to the chat list
            const html = `
              <div class="message-content">
                <img src="images/gpt.jpg" alt="AI" class="avatar">
                <p class="text">${apiResponse}</p>
              </div>
            `;
            const incomingMessagediv = createMessageElement(html, "incoming");
            chatlist.appendChild(incomingMessagediv);
        }
    } catch (error) {
        console.error('Request Error:', error);
        alert("Request Error: " + error);  // Show alert in case of a request error
    }
};




// Handle outgoing chat
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim();  // Assign to global userMessage
  
    if (!userMessage) {
        return; // Exit if there is no message
    }
  
    const html = `
      <div class="message-content">
        <img src="images/user.jpg" alt="User Image" class="avatar">
        <p class="text">${userMessage}</p>
      </div>
    `;
  
    const outgoingMessagediv = createMessageElement(html, "outgoing");
    outgoingMessagediv.querySelector(".text").innerText = userMessage;
    chatlist.appendChild(outgoingMessagediv);

    typingForm.reset();  // Clear input
    setTimeout(showLoadingAnimation, 500); // Show loading animation

    generateAPIresponse(userMessage);  // Pass the userMessage correctly
};

typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});
