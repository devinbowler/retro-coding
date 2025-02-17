let currentPage = 1;
const itemsPerPage = 50;
let problems = [];

document.addEventListener('DOMContentLoaded', () => {
    fetch('leetcode_problems.json')
        .then(response => response.json())
        .then(data => {
            problems = data; // Store the fetched problems
            displayProblems(currentPage);
        });
    document.getElementById('next-btn').addEventListener('click', () => changePage(1));
    document.getElementById('prev-btn').addEventListener('click', () => changePage(-1));
});

function displayProblems(page) {
    const list = document.getElementById('problem-list');
    list.innerHTML = '';
    const startIndex = (currentPage - 1) * itemsPerPage;
    console.log(`Current Page: ${currentPage}, Start Index: ${startIndex}`);
    const endIndex = startIndex + itemsPerPage;
    const pageItems = problems.slice(startIndex, endIndex);
    pageItems.forEach((problem, index) => {
        const item = document.createElement('li');
        item.textContent = `${startIndex + index + 1}. ${problem.title}`;
        item.onclick = () => {
            window.location.href = `index.html?problem=${problem.id}`;
        };
        list.appendChild(item);
    });

    // Scroll to the top of the list or container
    document.documentElement.scrollTop = 0; // For the entire page
    // list.scrollTop = 0; // For the specific element, if it has overflow
}

function changePage(change) {
    const newPage = currentPage + change;
    const totalItems = problems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (newPage > 0 && newPage <= totalPages) {
        currentPage = newPage;
        displayProblems(currentPage);
    }
}
