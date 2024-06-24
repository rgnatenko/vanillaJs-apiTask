document.addEventListener('DOMContentLoaded', function () {
    const inputField = document.querySelector('.input');
    const searchResultsDiv = document.getElementById('searchResults');
    const searchHistoryDiv = document.getElementById('searchHistory');
    const historyListDiv = document.querySelector('.searchHistory-list');

    let clearButton = null;
    const clearSearchHistoryButton = document.querySelector('.clear-history');
    let debounceTimeout;

    loadSearchHistory();

    clearSearchHistoryButton.addEventListener('click', () => {
        clearSearchHistory();
        historyListDiv.innerHTML = '';
    });

    const observer = new MutationObserver(() => {
        if (!historyListDiv.innerHTML.trim()) {
            clearSearchHistoryButton.disabled = true;
        }
    });

    observer.observe(historyListDiv, { childList: true, subtree: true });

    inputField.addEventListener('input', function () {
        const searchTerm = inputField.value.trim().toLowerCase();

        searchResultsDiv.innerHTML = '<div style="padding: 10px">Loading...</div>';

        clearTimeout(debounceTimeout);

        debounceTimeout = setTimeout(() => {
            if (!searchTerm) {
                searchResultsDiv.innerHTML = '';
                removeClearButton();
                return;
            }

            fetch(`https://devitjobs.com/api/jobsLight`)
                .then(response => response.json())
                .then(data => {
                    const filteredJobs = data.filter(job => {
                        return job.name.toLowerCase().startsWith(searchTerm);
                    });

                    searchResultsDiv.innerHTML = '';

                    filteredJobs.forEach(job => {
                        const jobButton = document.createElement('button');
                        jobButton.classList.add('job');

                        const highlightedName = highlightMatch(job.name, searchTerm);

                        jobButton.innerHTML = `<p>${highlightedName}</p>`;
                        jobButton.addEventListener('click', function () {
                            addToSearchHistory(job.name);
                            inputField.value = '';
                            searchResultsDiv.innerHTML = '';
                            removeClearButton();
                        });
                        searchResultsDiv.appendChild(jobButton);
                    });

                    if (!clearButton) {
                        const searchField = document.querySelector('.input-field');
                        clearButton = document.createElement('button');
                        clearButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="feather feather-x">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                `;
                        clearButton.id = 'clearButton';
                        clearButton.addEventListener('click', function () {
                            inputField.value = '';
                            searchResultsDiv.innerHTML = '';
                            removeClearButton();
                        });
                        searchField.appendChild(clearButton);
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    searchResultsDiv.classList.add('searchResults-error');
                    searchResultsDiv.innerHTML = '<p>Error fetching data, please try again!</p>';
                });
        }, 1000);
    });

    function addHistoryItemToDOM(item) {
        const historyDiv = document.createElement('div');
        historyDiv.classList.add('searchHistory-item');
        historyDiv.innerHTML = `
    <p>${item.title}</p>
    <p>${item.date}</p>
    <button id="searchHistory-clear-item-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="feather feather-x">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    </button/>
    `;
        const clearItemBtn = historyDiv.querySelector('#searchHistory-clear-item-btn');
        clearItemBtn.addEventListener('click', function () {
            removeFromSearchHistory(item.title);
            historyDiv.remove();
        });

        historyListDiv.appendChild(historyDiv);
    }

    function addToSearchHistory(jobTitle) {
        const now = new Date();
        const formattedDate = formatDate(now);

        const historyItem = {
            title: jobTitle,
            date: formattedDate
        };

        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        history.push(historyItem);
        localStorage.setItem('searchHistory', JSON.stringify(history));

        addHistoryItemToDOM(historyItem);
    }

    function removeFromSearchHistory(jobTitle) {
        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        history = history.filter(item => item.title !== jobTitle);
        localStorage.setItem('searchHistory', JSON.stringify(history));
    }

    function clearSearchHistory() {
        localStorage.removeItem('searchHistory');
    }

    function loadSearchHistory() {
        const history = JSON.parse(localStorage.getItem('searchHistory')) || [];

        history.forEach(item => {
            addHistoryItemToDOM(item);
        });
    }

    function removeClearButton() {
        if (clearButton && clearButton.parentNode) {
            clearButton.parentNode.removeChild(clearButton);
            clearButton = null;
        }
    }

    function highlightMatch(text, searchTerm) {
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedSearchTerm, 'gi');

        return text.replace(regex, match => `<span class="highlight">${match}</span>`);
    }

    function formatDate(date) {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }
});