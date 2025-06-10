// Music theory data
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const ENHARMONIC_MAP = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
};
const TUNINGS = {
    'standard': ['E', 'A', 'D', 'G', 'B', 'E'],
    'drop-d': ['D', 'A', 'D', 'G', 'B', 'E'],
    'open-g': ['D', 'G', 'D', 'G', 'B', 'D'],
    'dadgad': ['D', 'A', 'D', 'G', 'A', 'D']
};
const CHORD_PATTERNS = {
    // Major chords
    '': [0, 4, 7],
    'maj': [0, 4, 7],
    'major': [0, 4, 7],
    'M': [0, 4, 7],
    // Minor chords
    'm': [0, 3, 7],
    'min': [0, 3, 7],
    'minor': [0, 3, 7],
    '-': [0, 3, 7],
    // Seventh chords
    '7': [0, 4, 7, 10],
    'maj7': [0, 4, 7, 11],
    'M7': [0, 4, 7, 11],
    'm7': [0, 3, 7, 10],
    'min7': [0, 3, 7, 10],
    'dim7': [0, 3, 6, 9],
    'mM7': [0, 3, 7, 11],
    // Extended chords
    '9': [0, 4, 7, 10, 14],
    'maj9': [0, 4, 7, 11, 14],
    'm9': [0, 3, 7, 10, 14],
    'add9': [0, 4, 7, 14],
    '11': [0, 4, 7, 10, 14, 17],
    '13': [0, 4, 7, 10, 14, 21],
    // Suspended chords
    'sus2': [0, 2, 7],
    'sus4': [0, 5, 7],
    // Diminished and augmented
    'dim': [0, 3, 6],
    'aug': [0, 4, 8],
    '+': [0, 4, 8],
    // Sixth chords
    '6': [0, 4, 7, 9],
    'm6': [0, 3, 7, 9]
};
const SCALE_PATTERNS = {
    'major': [0, 2, 4, 5, 7, 9, 11],
    'minor': [0, 2, 3, 5, 7, 8, 10],
    'natural minor': [0, 2, 3, 5, 7, 8, 10],
    'harmonic minor': [0, 2, 3, 5, 7, 8, 11],
    'melodic minor': [0, 2, 3, 5, 7, 9, 11],
    'pentatonic major': [0, 2, 4, 7, 9],
    'pentatonic minor': [0, 3, 5, 7, 10],
    'blues': [0, 3, 5, 6, 7, 10],
    'dorian': [0, 2, 3, 5, 7, 9, 10],
    'phrygian': [0, 1, 3, 5, 7, 8, 10],
    'lydian': [0, 2, 4, 6, 7, 9, 11],
    'mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'locrian': [0, 1, 3, 5, 6, 8, 10]
};

// Global variables
let currentTuning = TUNINGS.standard;
let currentFretRange = 12;
// Get API key from config
let apiKey = config.apiKey;

document.addEventListener('DOMContentLoaded', async function() {
    initializeEventListeners();
    generateFretboard();
    
    const isValid = await testApiKey();
    if (!isValid) {
        addMessage('System', 'Invalid API key. Please check your API key configuration.', 'bot');
    }
});
let currentVisualization = null;

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const visualizerSection = document.getElementById('visualizerSection');
const closeVisualizerBtn = document.getElementById('closeVisualizer');
const tuningSelect = document.getElementById('tuningSelect');
const customTuningGroup = document.getElementById('customTuningGroup');
const customTuningInput = document.getElementById('customTuning');
const fretRangeSelect = document.getElementById('fretRange');
const tuningDisplay = document.getElementById('tuningDisplay');
const fretboard = document.getElementById('fretboard');
const chordInfo = document.getElementById('chordInfo');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    initializeEventListeners();
    generateFretboard();
    
    // Validate API key on startup
    const isValid = await testApiKey();
    if (!isValid) {
        addMessage('System', 'Invalid API key. Please check your API key configuration.', 'bot');
    }
});


function initializeEventListeners() {
    // Chat functionality
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Visualizer controls
    closeVisualizerBtn.addEventListener('click', closeVisualizer);
    tuningSelect.addEventListener('change', handleTuningChange);
    customTuningInput.addEventListener('input', handleCustomTuning);
    fretRangeSelect.addEventListener('change', handleFretRangeChange);
}

// Chat functionality
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage('You', message, 'user');
    chatInput.value = '';
    
    // Show loading
    showLoading();
    
    try {
        // Validate API key before proceeding
        const isValid = await testApiKey();
        if (!isValid) {
            throw new Error('Invalid API key');
        }
        
        // Check if message contains chord or scale references
        const musicElements = extractMusicElements(message);
        
        // Get AI response
        const response = await getGeminiResponse(message);
        
        // Add AI response
        addMessage('Guitar AI', response, 'bot');
        
        // Show visualizer if music elements found
        if (musicElements.length > 0) {
            showVisualizerWithElements(musicElements);
        }
        
    } catch (error) {
        console.error('Error:', error);
        addMessage('System', 'Sorry, there was an error processing your request. Please check your API key and try again.', 'bot');
    } finally {
        hideLoading();
    }
}

function addMessage(sender, text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${type}-avatar`;
    avatar.textContent = type === 'bot' ? '🤖' : '👤';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    // Format the text into paragraphs if it's from the bot
    if (type === 'bot') {
        // Split by double newlines first (for existing paragraph breaks)
        const paragraphs = text.split(/\n\s*\n/);
        
        // Then split long paragraphs (more than 150 chars without breaks)
        const formattedParagraphs = paragraphs.map(para => {
            if (para.length > 150 && !para.includes('\n')) {
                // Split into sentences and group them into reasonable paragraphs
                const sentences = para.match(/[^.!?]+[.!?]+/g) || [para];
                let result = '';
                let currentParagraph = '';
                
                sentences.forEach(sentence => {
                    if (currentParagraph.length + sentence.length > 150) {
                        result += currentParagraph + '<br><br>';
                        currentParagraph = sentence.trim();
                    } else {
                        currentParagraph += sentence;
                    }
                });
                
                if (currentParagraph) {
                    result += currentParagraph;
                }
                
                return result;
            }
            return para;
        });
        
        messageText.innerHTML = formattedParagraphs.join('<br><br>');
    } else {
        // For user messages, keep as is
        messageText.textContent = text;
    }
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    content.appendChild(messageText);
    content.appendChild(messageTime);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function getGeminiResponse(message) {
    const prompt = `You are an expert guitar instructor and music theory teacher. Please provide helpful, accurate, and engaging responses about guitar playing, music theory, chords, scales, techniques, and anything related to guitar.

User question: ${message}

Please provide a clear, informative response. If the user asks about specific chords or scales, mention them clearly in your response so they can be visualized.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        })
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// Music element extraction
function extractMusicElements(text) {
    const elements = [];
    const normalizedText = text.toLowerCase();
    
    // Extract chords
    const chordMatches = extractChords(text);
    elements.push(...chordMatches);
    
    // Extract scales
    const scaleMatches = extractScales(text);
    elements.push(...scaleMatches);
    
    return elements;
}

function extractChords(text) {
    const chords = [];
    const chordRegex = /([A-G][#b]?)(maj7|min7|dim7|mM7|maj9|add9|sus2|sus4|maj|min|dim|aug|M7|m7|m9|11|13|m6|\+|m|-|M|7|9|6)?/gi;
    
    let match;
    while ((match = chordRegex.exec(text)) !== null) {
        const root = normalizeNote(match[1]);
        const quality = match[2] || '';
        
        if (NOTES.includes(root) && (quality in CHORD_PATTERNS || quality === '')) {
            chords.push({
                type: 'chord',
                root: root,
                quality: quality,
                fullName: root + quality
            });
        }
    }
    
    return chords;
}

function extractScales(text) {
    const scales = [];
    const scaleKeywords = Object.keys(SCALE_PATTERNS);
    
    for (const scale of scaleKeywords) {
        const regex = new RegExp(`([A-G][#b]?)\\s+(${scale})`, 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const root = normalizeNote(match[1]);
            if (NOTES.includes(root)) {
                scales.push({
                    type: 'scale',
                    root: root,
                    scale: scale,
                    fullName: root + ' ' + scale
                });
            }
        }
    }
    
    return scales;
}

function normalizeNote(note) {
    const normalized = note.charAt(0).toUpperCase() + note.slice(1).toLowerCase();
    return ENHARMONIC_MAP[normalized] || normalized;
}

// Visualizer functionality
function showVisualizerWithElements(elements) {
    visualizerSection.style.display = 'block';
    
    if (elements.length > 0) {
        currentVisualization = elements[0]; // Show first element found
        visualizeElement(currentVisualization);
    }
}

function visualizeElement(element) {
    clearFretboard();
    
    if (element.type === 'chord') {
        visualizeChord(element.root, element.quality);
    } else if (element.type === 'scale') {
        visualizeScale(element.root, element.scale);
    }
}

function visualizeChord(root, quality) {
    const pattern = CHORD_PATTERNS[quality] || CHORD_PATTERNS[''];
    const rootIndex = NOTES.indexOf(root);
    const chordNotes = pattern.map(interval => NOTES[(rootIndex + interval) % 12]);
    
    markNotesOnFretboard(chordNotes, root);
    showChordInfo(root, quality, chordNotes, pattern);
}

function visualizeScale(root, scaleName) {
    const pattern = SCALE_PATTERNS[scaleName];
    if (!pattern) return;
    
    const rootIndex = NOTES.indexOf(root);
    const scaleNotes = pattern.map(interval => NOTES[(rootIndex + interval) % 12]);
    
    markNotesOnFretboard(scaleNotes, root, true);
    showScaleInfo(root, scaleName, scaleNotes);
}

function markNotesOnFretboard(notes, root, isScale = false) {
    const fretMarkers = document.querySelectorAll('.fret-marker');
    
    fretMarkers.forEach(marker => {
        const note = marker.dataset.note;
        marker.className = 'fret-marker';
        marker.textContent = '';
        
        if (notes.includes(note)) {
            if (note === root) {
                marker.classList.add('root');
                marker.textContent = 'R';
            } else if (isScale) {
                marker.classList.add('scale-tone');
                marker.textContent = note;
            } else {
                marker.classList.add('chord-tone');
                marker.textContent = note;
            }
        }
    });
}

function showChordInfo(root, quality, notes, intervals) {
    const notesInfo = document.getElementById('notesInfo');
    const intervalsInfo = document.getElementById('intervalsInfo');
    const typeInfo = document.getElementById('typeInfo');
    
    notesInfo.textContent = notes.join(' - ');
    intervalsInfo.textContent = intervals.map(i => getIntervalName(i)).join(' - ');
    typeInfo.textContent = getChordType(quality);
    
    chordInfo.style.display = 'block';
}

function showScaleInfo(root, scaleName, notes) {
    const notesInfo = document.getElementById('notesInfo');
    const intervalsInfo = document.getElementById('intervalsInfo');
    const typeInfo = document.getElementById('typeInfo');
    
    notesInfo.textContent = notes.join(' - ');
    intervalsInfo.textContent = SCALE_PATTERNS[scaleName].map(i => getIntervalName(i)).join(' - ');
    typeInfo.textContent = scaleName.charAt(0).toUpperCase() + scaleName.slice(1) + ' Scale';
    
    chordInfo.style.display = 'block';
}

function getIntervalName(semitones) {
    const intervalNames = {
        0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5',
        7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7', 12: 'R',
        13: 'b9', 14: '9', 15: 'b10', 16: '10', 17: '11', 18: 'b12',
        19: '12', 20: 'b13', 21: '13'
    };
    return intervalNames[semitones] || semitones.toString();
}

function getChordType(quality) {
    const types = {
        '': 'Major Triad', 'maj': 'Major Triad', 'major': 'Major Triad', 'M': 'Major Triad',
        'm': 'Minor Triad', 'min': 'Minor Triad', 'minor': 'Minor Triad', '-': 'Minor Triad',
        '7': 'Dominant 7th', 'maj7': 'Major 7th', 'M7': 'Major 7th',
        'm7': 'Minor 7th', 'min7': 'Minor 7th', 'dim7': 'Diminished 7th',
        'sus2': 'Suspended 2nd', 'sus4': 'Suspended 4th',
        'dim': 'Diminished', 'aug': 'Augmented', '+': 'Augmented',
        '6': 'Major 6th', 'm6': 'Minor 6th'
    };
    return types[quality] || 'Extended Chord';
}

function clearFretboard() {
    const fretMarkers = document.querySelectorAll('.fret-marker');
    fretMarkers.forEach(marker => {
        marker.className = 'fret-marker';
        marker.textContent = '';
    });
    chordInfo.style.display = 'none';
}

function closeVisualizer() {
    visualizerSection.style.display = 'none';
    clearFretboard();
    currentVisualization = null;
}

// Fretboard generation
function generateFretboard() {
    fretboard.innerHTML = '';
    
    // Generate fretboard for each string
    for (let stringIndex = 0; stringIndex < currentTuning.length; stringIndex++) {
        const stringContainer = document.createElement('div');
        stringContainer.className = 'string-container';
        
        // String label
        const stringLabel = document.createElement('div');
        stringLabel.className = 'string-label';
        stringLabel.textContent = currentTuning[stringIndex];
        stringContainer.appendChild(stringLabel);
        
        // String line
        const stringLine = document.createElement('div');
        stringLine.className = 'string';
        
        // Add fret markers
        const openNoteIndex = NOTES.indexOf(currentTuning[stringIndex]);
        for (let fret = 0; fret <= currentFretRange; fret++) {
            const noteIndex = (openNoteIndex + fret) % 12;
            const note = NOTES[noteIndex];
            
            const fretMarker = document.createElement('div');
            fretMarker.className = 'fret-marker';
            fretMarker.dataset.note = note;
            fretMarker.dataset.fret = fret;
            fretMarker.dataset.string = stringIndex;
            fretMarker.style.left = `${(fret / currentFretRange) * 100}%`;
            
            stringLine.appendChild(fretMarker);
        }
        
        stringContainer.appendChild(stringLine);
        fretboard.appendChild(stringContainer);
    }
    
    // Add fret numbers
    const fretNumbers = document.createElement('div');
    fretNumbers.className = 'fret-numbers';
    for (let fret = 0; fret <= currentFretRange; fret++) {
        const fretNumber = document.createElement('div');
        fretNumber.className = 'fret-number';
        fretNumber.textContent = fret;
        fretNumbers.appendChild(fretNumber);
    }
    fretboard.appendChild(fretNumbers);
    
    updateTuningDisplay();
}

// Control handlers
function handleTuningChange() {
    const selectedTuning = tuningSelect.value;
    
    if (selectedTuning === 'custom') {
        customTuningGroup.style.display = 'block';
    } else {
        customTuningGroup.style.display = 'none';
        currentTuning = TUNINGS[selectedTuning];
        generateFretboard();
    }
}

function handleCustomTuning() {
    const customTuningStr = customTuningInput.value.trim();
    if (customTuningStr) {
        const tuningNotes = customTuningStr.split('-').map(note => normalizeNote(note.trim()));
        if (tuningNotes.length === 6 && tuningNotes.every(note => NOTES.includes(note))) {
            currentTuning = tuningNotes;
            generateFretboard();
        }
    }
}

function handleFretRangeChange() {
    currentFretRange = parseInt(fretRangeSelect.value);
    generateFretboard();
}

function updateTuningDisplay() {
    const tuningName = getTuningName();
    const tuningNotes = currentTuning.join('-');
    tuningDisplay.textContent = `Current Tuning: ${tuningName} (${tuningNotes})`;
}

function getTuningName() {
    for (const [name, tuning] of Object.entries(TUNINGS)) {
        if (JSON.stringify(tuning) === JSON.stringify(currentTuning)) {
            return name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
        }
    }
    return 'Custom';
}

// Utility functions
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

async function testApiKey() {
    try {
        const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Hello"
                    }]
                }]
            })
        });
        
        if (!testResponse.ok) {
            const errorData = await testResponse.json();
            console.error('API Key Test Failed:', errorData);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('API Key Test Error:', error);
        return false;
    }
}
testApiKey().then(isValid => {
    if (isValid) {
        console.log('API key is valid!');
    } else {
        console.log('API key is invalid!');
    }
});