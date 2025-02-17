const fs = require('fs');
const path = require('path');

// Define the file path where the content will be saved
const filePath = path.join(__dirname, 'C:\Users\devin\OneDrive\Desktop\Desktop\Coding\retro-coding-app\localUserData.json');

let currentProblem = null;


// --- Event Listeners and Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    setupProblems();
    setupUI();
});

// --- Problem Loading ---
function setupProblems() {
    const urlParams = new URLSearchParams(window.location.search);
    const problemId = urlParams.get('problem');
    if (problemId) {
        loadProblem(problemId);
    } else {
        loadProblemList();
    }
}


function loadProblemList() {
    fetch('leetcode_problems.json')
        .then(response => response.json())
        .then(problems => displayProblemList(problems))
        .catch(error => console.error('Error loading the problems:', error));
}

function displayProblemList(problems) {
    const list = document.getElementById('problem-list');
    if (!list) {
        console.error("Problem list element not found");
        return;
    }
    list.innerHTML = '';
    problems.forEach(problem => appendProblemListItem(problem));
}

function appendProblemListItem(problem) {
    const item = document.createElement('li');
    item.textContent = `${problem.id}. ${problem.title}`;
    if (problem.difficulty) {
        item.classList.add(problem.difficulty.toLowerCase());
    }
    item.onclick = () => window.location.href = `index.html?problem=${problem.id}`;
    document.getElementById('problem-list').appendChild(item);
}

function loadProblem(problemId) {
    fetch('leetcode_problems.json')
        .then(response => response.json())
        .then(problems => {
            const problem = problems.find(p => p.id.toString() === problemId);
            if (problem) {
                console.log(problem)
                currentProblem = problem;
                document.getElementById('problem-title').textContent = problem.title;
                document.getElementById('problem-description').innerHTML = formatDescription(problem.description);
                setupEditorWithProblem(problem);
            } else {
                console.log('Problem not found');
            }
        })
        .catch(error => console.error('Error loading problem details:', error));
}

// --- Problem Description and Example Extraction ---
function formatDescription(description) {
    // Normalize and clean up the initial description text
    let cleanDescription = description.replace(/`/g, '') // Remove backticks
                                      .replace(/\[(\d+)\]/g, '$1') // Replace brackets around numbers
                                      .replace(/(\*\*|_)/g, '') // Remove markdown bold ** and italic _
                                      .replace(/\\\[/g, '[').replace(/\\\]/g, ']'); // Replace escaped brackets

    // Separate the main description from the examples
    let parts = cleanDescription.split(/Example \d+:/);
    let formattedDescription = parts.shift().trim(); // The first part is the main description

    // Format each example
    let formattedExamples = parts.map((part, index) => {
        // Match details for input, output, and explanation
        let exampleDetail = part.split(/(Input:|Output:|Explanation:|Constraints:)/).filter(text => text.trim() !== '');
        let formattedExample = `<strong>Example ${index + 1}:</strong><br/>`;
        
        exampleDetail.forEach((detail, idx) => {
            if (detail.includes('Input:') || detail.includes('Output:') || detail.includes('Explanation:')) {
                formattedExample += `${detail.trim()} `;
            } else if (detail.includes('Constraints:')) {
                // Ensure constraints are on a new line and separated
                formattedExample += `<br/><strong>${detail.trim()}</strong><br/>`;
            } else {
                formattedExample += `${detail.trim()}<br/>`;
            }
        });

        return formattedExample;
    });

    return `${formattedDescription}<br/><br/>` + formattedExamples.join('<br/><br/>');
}


function numberToWords(number) {
    const numWords = {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'
    };
    return number.toString().split('').map(digit => numWords[digit] || digit).join('');
}

function convertFunctionName(title) {
    return title.replace(/\s+/g, '_').toLowerCase().replace(/\d/g, (digit) => numberToWords(digit));
}

function setupEditorWithProblem(problem) {
    const editor = document.getElementById('editor');

    const previousSubmission = previousAttempt(problem.id);
    if (previousSubmission) {
        console.log('Has attempt.')
        editor.value = previousSubmission;
    } else {
        console.log('No attempt.')
        editor.value = createFunctionDefinition(problem.title, problem.description);
    }
}

function createFunctionDefinition(title, description) {
    const functionName = convertFunctionName(title);  // Using the convertFunctionName to handle numbers
    const params = extractParameters(description);
    return `def ${functionName}(${params.join(', ')}):\n    # Your solution here\n`;
}



// Get the users last ran attempt so if they leave the site, it will display what they last ran through the compiler server.
function previousAttempt(problemId) {
    if(fs.existsSync(filePath)){
        const userData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return userData[problemId] || null;
    }
    return null;
}

function saveSubmission(problemId, submissionContent) {
    let userData = {};
    if (fs.existsSync(filePath)){
        userData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    userData[problemId] = submissionContent;

    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2), 'utf-8');
}

function extractParameters(description) {
    const inputMatch = description.match(/Input:.*?\n(.*?)\nOutput:/s);
    if (!inputMatch) return [];

    const inputParams = inputMatch[1];
    return inputParams.split(',')
        .map(part => part.trim().split('=')[0].trim()) // Extracting parameter names before '='
        .filter(param => param.includes(' ')).map(param => param.split(' ')[1]); // Filtering and extracting clean parameter names
}

// --- UI Interactions ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('open-btn');
    sidebar.classList.toggle('open');
    openBtn.style.display = sidebar.classList.contains('open') ? 'none' : 'block';
}

function goHome() {
    window.location.href = 'home.html';
}

function setupUI() {
    document.getElementById('editor').addEventListener('keydown', interceptTabPress);
    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'toggle-console';
    toggleBtn.textContent = '^';
    document.body.appendChild(toggleBtn);
    setupConsoleToggle(toggleBtn);
}

function interceptTabPress(e) {
    if (e.key === 'Tab') {
        e.preventDefault(); // Prevent the default tab key behavior
        let start = e.target.selectionStart;
        let end = e.target.selectionEnd;
        const spaces = "    "; // Four spaces
        e.target.value = e.target.value.substring(0, start) + spaces + e.target.value.substring(end);
        e.target.selectionStart = e.target.selectionEnd = start + spaces.length; // Move cursor after the spaces
    }
}


function setupConsoleToggle(button) {
    const consoleContainer = document.getElementById('console-container');
    button.onclick = () => {
        const isOpen = consoleContainer.style.transform === 'translateY(0)';
        consoleContainer.style.transform = isOpen ? 'translateY(100%)' : 'translateY(0)';
        button.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    };
}

// --- Code Execution ---
document.getElementById('console').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        processCommand(this.value.split('User> ').pop().trim(), this);
    }
});

function processCommand(command, consoleElement) {
    switch (command) {
        case 'run': 
            consoleElement.value += '\n'; // Ensure there is a newline after 'User> run'
            runPythonCode(document.getElementById('editor').value, consoleElement);

            if (currentProblem){
                const currentEditor = document.getElementById('editor').value;
                saveSubmission(currentProblem.id, currentEditor);
                console.log('Submission Saved!')
            }
            break;

        case 'solution':
            if (currentProblem && currentProblem.python_solution) {
                consoleElement.value += `\nA possible solution:\n${currentProblem.python_solution}\nUser> `;
            } else {
                consoleElement.value += '\nNo solution available for this problem.\nUser> ';
            }
            break;

        case 'fullscreen':
            document.getElementById('console-container').classList.add('fullscreen');
            consoleElement.value += '\nConsole is now full screen.\nUser> ';
            break;

        case 'close':
            document.getElementById('console-container').classList.remove('fullscreen');
            consoleElement.value += '\nConsole has been minimized.\nUser> ';
            break;

        case 'submit':
            consoleElement.value += '\nSubmitting your code...\nUser> ';
            break;

        case 'help':
            consoleElement.value += '\nThe available commands: run | solution | fullscreen | close | submit | help\nUser> ';
            break;

        default:
            consoleElement.value += `\nUnknown command (Type 'help' for a list of commands): ${command}\nUser> `;
            break;
    } 
}

function runPythonCode(code, consoleElement) {
    fetch('http://localhost:3000/run-python', {
        method: 'POST',
        body: code,
        headers: { 'Content-Type': 'text/plain' }
    })
    .then(response => response.text())
    .then(data => {
        // Directly append the data without adding an extra newline
        consoleElement.value += data + 'User> '; // Append 'User>' directly after output
    })
    .catch(error => {
        consoleElement.value += `Error: ${error.message}User> `;
    });
}
