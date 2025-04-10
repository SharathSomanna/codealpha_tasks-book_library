document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const booksGrid = document.getElementById('booksGrid');
    const addBookBtn = document.getElementById('addBookBtn');
    const addBookModal = document.getElementById('addBookModal');
    const bookDetailsModal = document.getElementById('bookDetailsModal');
    const historyModal = document.getElementById('historyModal');
    const addBookForm = document.getElementById('addBookForm');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryList = document.getElementById('categoryList');
    const newCategory = document.getElementById('newCategory');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const viewHistoryBtn = document.getElementById('viewHistoryBtn');
    const historyFilter = document.getElementById('historyFilter');
    const fullHistoryList = document.getElementById('fullHistoryList');
    
    // Close buttons
    const closeButtons = document.querySelectorAll('.close');
    
    // Initialize library data
    let library = JSON.parse(localStorage.getItem('library')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || ['fiction', 'non-fiction', 'science', 'biography'];
    let currentBookId = null;
    
    // Initialize the app
    init();
    
    function init() {
        renderBooks();
        renderCategories();
        renderFullHistory();
        
        // Set up event listeners
        addBookBtn.addEventListener('click', () => addBookModal.style.display = 'block');
        viewHistoryBtn.addEventListener('click', () => historyModal.style.display = 'block');
        searchBtn.addEventListener('click', filterBooks);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') filterBooks();
        });
        
        addBookForm.addEventListener('submit', handleAddBook);
        addCategoryBtn.addEventListener('click', addNewCategory);
        historyFilter.addEventListener('change', renderFullHistory);
        
        closeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.modal').style.display = 'none';
            });
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    }
    
    // Render all books
    function renderBooks(filteredBooks = null) {
        booksGrid.innerHTML = '';
        const booksToRender = filteredBooks || library;
        
        if (booksToRender.length === 0) {
            booksGrid.innerHTML = '<p class="no-books">No books found. Add some books to your library!</p>';
            return;
        }
        
        booksToRender.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = `book-card ${book.borrowed ? 'borrowed' : ''}`;
            bookCard.dataset.id = book.id;
            bookCard.innerHTML = `
                <h3>${book.title}</h3>
                <p>by ${book.author}</p>
                <p>${book.pages ? book.pages + ' pages' : ''}</p>
                <p>${book.year ? 'Published: ' + book.year : ''}</p>
                <span class="category">${book.category}</span>
                <span class="status">Borrowed</span>
            `;
            bookCard.addEventListener('click', () => showBookDetails(book.id));
            booksGrid.appendChild(bookCard);
        });
    }
    
    // Render categories in sidebar
    function renderCategories() {
        // Clear existing categories except "All Books"
        while (categoryList.children.length > 1) {
            categoryList.removeChild(categoryList.lastChild);
        }
        
        // Add categories from the array
        categories.forEach(category => {
            const li = document.createElement('li');
            li.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            li.dataset.category = category;
            categoryList.appendChild(li);
        });
        
        // Add event listeners to category items
        const categoryItems = categoryList.querySelectorAll('li');
        categoryItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all items
                categoryItems.forEach(i => i.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Filter books by category
                const category = this.dataset.category;
                if (category === 'all') {
                    renderBooks();
                } else {
                    const filteredBooks = library.filter(book => book.category === category);
                    renderBooks(filteredBooks);
                }
            });
        });
    }
    
    // Show book details in modal
    function showBookDetails(bookId) {
        currentBookId = bookId;
        const book = library.find(b => b.id === bookId);
        const bookDetailsContent = document.getElementById('bookDetailsContent');
        const historyList = document.getElementById('historyList');
        const borrowBookBtn = document.getElementById('borrowBookBtn');
        const returnBookBtn = document.getElementById('returnBookBtn');
        
        // Populate book details
        bookDetailsContent.innerHTML = `
            <h2>${book.title}</h2>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Category:</strong> ${book.category}</p>
            ${book.pages ? `<p><strong>Pages:</strong> ${book.pages}</p>` : ''}
            ${book.year ? `<p><strong>Year:</strong> ${book.year}</p>` : ''}
            <p><strong>Status:</strong> ${book.borrowed ? 'Borrowed' : 'Available'}</p>
        `;
        
        // Show/hide borrow/return buttons
        if (book.borrowed) {
            borrowBookBtn.style.display = 'none';
            returnBookBtn.style.display = 'block';
        } else {
            borrowBookBtn.style.display = 'block';
            returnBookBtn.style.display = 'none';
        }
        
        // Populate borrowing history
        historyList.innerHTML = '';
        if (book.history && book.history.length > 0) {
            book.history.forEach(record => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${record.action === 'borrow' ? 'Borrowed' : 'Returned'}</strong>
                    ${record.action === 'borrow' ? 'by ' + record.borrower : ''}
                    on ${new Date(record.date).toLocaleDateString()}
                `;
                historyList.appendChild(li);
            });
        } else {
            historyList.innerHTML = '<li>No borrowing history for this book.</li>';
        }
        
        // Set up event listeners for buttons
        borrowBookBtn.onclick = () => borrowBook(bookId);
        returnBookBtn.onclick = () => returnBook(bookId);
        document.getElementById('deleteBookBtn').onclick = () => deleteBook(bookId);
        
        // Show the modal
        bookDetailsModal.style.display = 'block';
    }
    
    // Handle adding a new book
    function handleAddBook(e) {
        e.preventDefault();
        
        const title = document.getElementById('bookTitle').value;
        const author = document.getElementById('bookAuthor').value;
        const category = document.getElementById('bookCategory').value;
        const pages = document.getElementById('bookPages').value;
        const year = document.getElementById('bookYear').value;
        
        const newBook = {
            id: Date.now().toString(),
            title,
            author,
            category,
            pages: pages || undefined,
            year: year || undefined,
            borrowed: false,
            history: []
        };
        
        library.push(newBook);
        saveLibrary();
        renderBooks();
        
        // Reset form and close modal
        addBookForm.reset();
        addBookModal.style.display = 'none';
    }
    
    // Borrow a book
    function borrowBook(bookId) {
        const borrower = prompt('Enter borrower name:');
        if (!borrower) return;
        
        const book = library.find(b => b.id === bookId);
        book.borrowed = true;
        book.history = book.history || [];
        book.history.push({
            action: 'borrow',
            borrower,
            date: new Date().toISOString()
        });
        
        saveLibrary();
        showBookDetails(bookId);
        renderBooks();
    }
    
    // Return a book
    function returnBook(bookId) {
        const book = library.find(b => b.id === bookId);
        book.borrowed = false;
        book.history.push({
            action: 'return',
            date: new Date().toISOString()
        });
        
        saveLibrary();
        showBookDetails(bookId);
        renderBooks();
    }
    
    // Delete a book
    function deleteBook(bookId) {
        if (confirm('Are you sure you want to delete this book?')) {
            library = library.filter(book => book.id !== bookId);
            saveLibrary();
            bookDetailsModal.style.display = 'none';
            renderBooks();
        }
    }
    
    // Add a new category
    function addNewCategory() {
        const categoryName = newCategory.value.trim().toLowerCase();
        if (!categoryName) return;
        
        if (!categories.includes(categoryName)) {
            categories.push(categoryName);
            saveCategories();
            renderCategories();
            
            // Add the new category to the select in add book modal
            const bookCategorySelect = document.getElementById('bookCategory');
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
            bookCategorySelect.appendChild(option);
            
            newCategory.value = '';
        } else {
            alert('Category already exists!');
        }
    }
    
    // Filter books by search term
    function filterBooks() {
        const searchTerm = searchInput.value.toLowerCase();
        if (!searchTerm) {
            // If search is empty, show books based on selected category
            const activeCategory = document.querySelector('#categoryList li.active');
            if (activeCategory.dataset.category === 'all') {
                renderBooks();
            } else {
                const filteredBooks = library.filter(book => book.category === activeCategory.dataset.category);
                renderBooks(filteredBooks);
            }
            return;
        }
        
        const filteredBooks = library.filter(book => 
            book.title.toLowerCase().includes(searchTerm) || 
            book.author.toLowerCase().includes(searchTerm)
        );
        renderBooks(filteredBooks);
    }
    
    // Render full borrowing history
    function renderFullHistory() {
        fullHistoryList.innerHTML = '';
        
        let allHistory = [];
        library.forEach(book => {
            if (book.history && book.history.length > 0) {
                book.history.forEach(record => {
                    allHistory.push({
                        bookTitle: book.title,
                        action: record.action,
                        borrower: record.borrower || '',
                        date: record.date,
                        returnDate: record.action === 'borrow' ? 
                            (book.history.find(h => h.action === 'return' && h.date > record.date)?.date || '') : ''
                    });
                });
            }
        });
        
        // Sort by date (newest first)
        allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Apply filter
        const filter = historyFilter.value;
        if (filter === 'current') {
            allHistory = allHistory.filter(record => 
                record.action === 'borrow' && !record.returnDate
            );
        } else if (filter === 'past') {
            allHistory = allHistory.filter(record => 
                record.action === 'borrow' && record.returnDate
            );
        }
        
        if (allHistory.length === 0) {
            fullHistoryList.innerHTML = '<tr><td colspan="4">No history records found.</td></tr>';
            return;
        }
        
        allHistory.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.bookTitle}</td>
                <td>${record.borrower}</td>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.returnDate ? new Date(record.returnDate).toLocaleDateString() : ''}</td>
            `;
            fullHistoryList.appendChild(tr);
        });
    }
    
    // Save library to localStorage
    function saveLibrary() {
        localStorage.setItem('library', JSON.stringify(library));
    }
    
    // Save categories to localStorage
    function saveCategories() {
        localStorage.setItem('categories', JSON.stringify(categories));
    }
});