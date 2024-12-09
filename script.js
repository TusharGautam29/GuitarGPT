const typingForm = document.querySelector(".typing-form");
const chatlist = document.querySelector(".chat-messages");
const suggestions=document.querySelectorAll(".suggestion-container .suggestion");

let userMessage = null;
const API_KEY = "key"; // Replace with your actual API Key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Create a new message element
const createMessageElement = (content, className) => {
    const div = document.createElement("div");
    div.classList.add("message", className);
    div.innerHTML = content;
    return div;
};

// Show loading animation
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
    const incomingMessagediv = createMessageElement(html, "incoming");
    chatlist.appendChild(incomingMessagediv);
};

// Typing effect for the AI's response
const typeTextEffect = (element, text, speed = 80) => {
    let index = 0;

    const type = () => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
            setTimeout(type, speed);
        }
    };

    type();
};

// Copy functionality for the "Copy" button
const addCopyFunctionality = (button, text) => {
    button.addEventListener("click", () => {
        navigator.clipboard.writeText(text).catch((err) => {
            console.error("Failed to copy text:", err);
        });
    });
};

// Fetch response from API
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
        } else {
            const apiResponse = data?.candidates[0]?.content?.parts[0]?.text;

            // Remove the loading animation
            const loadingContainer = document.querySelector('.loading-container');
            if (loadingContainer) {
                loadingContainer.remove();
            }

            // Create the incoming message container
            const html = `
              <div class="message-content">
                  <img src="images/gpt.jpg" alt="AI" class="avatar">
                  <p class="text"></p>
                  <button class="material-symbols-rounded">content_copy</button>
              </div>
            `;
            const incomingMessagediv = createMessageElement(html, "incoming");
            chatlist.appendChild(incomingMessagediv);

            // Apply the typing effect
            const textElement = incomingMessagediv.querySelector(".text");
            typeTextEffect(textElement, apiResponse);

            // Add copy functionality to the button
            const copyButton = incomingMessagediv.querySelector(".material-symbols-rounded");
            addCopyFunctionality(copyButton, apiResponse);
        }
    } catch (error) {
        console.error('Request Error:', error);
    }
};

// Handle outgoing chat
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;

    if (!userMessage) return;

    // Hide header and show chat container when the user sends the first message
    const header = document.querySelector('header'); // Get header element

    if (header && header.style.display !== 'none') {
        header.style.display = 'none'; // Hide header
    }

    const html = `
      <div class="message-content">
          <img src="images/user.jpg" alt="User Image" class="avatar">
          <p class="text">${userMessage}</p>
      </div>
    `;

    const outgoingMessagediv = createMessageElement(html, "outgoing");
    chatlist.appendChild(outgoingMessagediv);

    typingForm.reset();
    setTimeout(showLoadingAnimation, 500);

    generateAPIresponse();
};
suggestions.forEach(suggestion =>{
    suggestion.addEventListener("click",()=>{
        userMessage=suggestion.querySelector(".text").innerHTML;
        handleOutgoingChat();
    })
})
document.getElementById("delete-button").addEventListener("click", function() {
    // Clear chat messages
    const chatMessages = document.querySelector(".chat-messages");
    chatMessages.innerHTML = "";

    // Show the header again
    const chatContainer = document.querySelector(".chat-container");
    const chatHeader = document.querySelector(".chat-header");
    chatContainer.style.display = "block";  // Ensure the chat container is visible
    chatHeader.style.display = "block";     // Show the header
});


typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});
