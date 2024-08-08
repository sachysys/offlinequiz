let questions = [];
let currentQuestionIndex = 0;
let startTime;
let testDuration;
let answers = [];
let timeTaken = [];
let questionStartTime;

const startScreen = document.getElementById('start-screen');
const testScreen = document.getElementById('test-screen');
const resultsScreen = document.getElementById('results-screen');
const questionImage = document.getElementById('question-image');
const timerDisplay = document.getElementById('timer');
const progressBar = document.getElementById('progress');
const questionSelector = document.getElementById('question-selector');
const questionNumber = document.getElementById('question-number');
const answerButtons = document.querySelectorAll('.answer-btn');

document.getElementById('start-test').addEventListener('click', startTest);
document.getElementById('finish-test').addEventListener('click', finishTest);
answerButtons.forEach(btn => btn.addEventListener('click', recordAnswer));
document.getElementById('prev-question').addEventListener('click', () => navigateQuestion(-1));
document.getElementById('next-question').addEventListener('click', () => navigateQuestion(1));
questionSelector.addEventListener('change', (e) => {
    navigateQuestion(parseInt(e.target.value) - currentQuestionIndex - 1);
});
document.getElementById('clear-selection').addEventListener('click', clearSelection);

function startTest() {
    testDuration = parseInt(document.getElementById('test-duration').value) * 60; // Convert to seconds
    const fileInput = document.getElementById('question-folder');
    
    if (fileInput.files.length === 0) {
        alert('Please select a question folder.');
        return;
    }

    questions = Array.from(fileInput.files).filter(file => file.type.startsWith('image/')).sort(() => Math.random() - 0.5);

    if (questions.length === 0) {
        alert('No image files found in the selected folder.');
        return;
    }

    // Initialize timeTaken array with zeros
    timeTaken = new Array(questions.length).fill(0);

    // Initialize answers array with nulls
    answers = new Array(questions.length).fill(null);

    // Populate question selector
    questionSelector.innerHTML = questions.map((_, index) => 
        `<option value="${index + 1}">Question ${index + 1}</option>`
    ).join('');

    startScreen.style.display = 'none';
    testScreen.style.display = 'block';
    startTime = new Date();
    showQuestion();
    updateTimer();
    setInterval(updateTimer, 1000);
}

function showQuestion() {
    const file = questions[currentQuestionIndex];
    questionImage.src = URL.createObjectURL(file);
    questionImage.alt = `Question ${currentQuestionIndex + 1}`;
    questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    questionSelector.value = currentQuestionIndex + 1;
    updateProgressBar();
    questionStartTime = new Date(); // Record the start time for this question
    updateSelectedAnswer();
}

function updateSelectedAnswer() {
    answerButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.choice === answers[currentQuestionIndex]) {
            btn.classList.add('selected');
        }
    });
}

function recordAnswer(event) {
    const choice = event.target.dataset.choice;
    answers[currentQuestionIndex] = choice;
    const timeSpent = (new Date() - questionStartTime) / 1000;
    timeTaken[currentQuestionIndex] += timeSpent; // Add time spent to existing time for this question
    updateSelectedAnswer();
    navigateQuestion(1);
}

function navigateQuestion(direction) {
    // Record time spent on current question before navigating
    if (questionStartTime) {
        const timeSpent = (new Date() - questionStartTime) / 1000;
        timeTaken[currentQuestionIndex] += timeSpent;
    }

    currentQuestionIndex += direction;
    if (currentQuestionIndex < 0) currentQuestionIndex = 0;
    if (currentQuestionIndex >= questions.length) currentQuestionIndex = questions.length - 1;
    showQuestion();
}

function clearSelection() {
    answers[currentQuestionIndex] = null;
    updateSelectedAnswer();
}

function updateTimer() {
    const elapsed = Math.floor((new Date() - startTime) / 1000);
    const remaining = testDuration - elapsed;
    if (remaining <= 0) {
        finishTest();
    } else {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        timerDisplay.textContent = `Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function updateProgressBar() {
    const progress = (currentQuestionIndex + 1) / questions.length * 100;
    progressBar.style.width = `${progress}%`;
}

function finishTest() {
    clearInterval(updateTimer);
    
    // Record time for the last question
    if (questionStartTime) {
        const timeSpent = (new Date() - questionStartTime) / 1000;
        timeTaken[currentQuestionIndex] += timeSpent;
    }

    testScreen.style.display = 'none';
    resultsScreen.style.display = 'block';

    const correctAnswers = answers.filter(answer => answer === 'A').length; // Assuming 'A' is always correct for this example
    document.getElementById('score-display').textContent = `Correct answers: ${correctAnswers}/${questions.length}`;

    generateReport();
}

function generateReport() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Question ID,Time Taken (seconds),Selected Choice\n";

    for (let i = 0; i < questions.length; i++) {
        const questionId = questions[i].name;
        const time = timeTaken[i] ? timeTaken[i].toFixed(2) : '0.00';
        const choice = answers[i] || '';
        csvContent += `${questionId},${time},${choice}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.getElementById('download-report');
    link.href = encodedUri;
}