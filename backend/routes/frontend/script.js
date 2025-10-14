/**
 * Countries App - Main Application Class
 * Управляет всем функционалом приложения "Мир стран"
 */
class CountriesApp {
    constructor() {
        this.currentUser = { id: 1, username: 'demo' }; // Demo user
        this.countries = [];
        this.wishlist = [];
        this.currentSection = 'search';
        
        this.initializeApp();
    }

    /**
     * Инициализация приложения
     */
    initializeApp() {
        this.setupEventListeners();
        this.loadUserProfile();
        this.showSection('search');
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Search functionality
        document.getElementById('search-btn').addEventListener('click', () => this.searchCountries());
        document.getElementById('load-all-btn').addEventListener('click', () => this.loadAllCountries());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCountries();
        });

        // Filters
        document.getElementById('region-filter').addEventListener('change', () => this.searchCountries());
        document.getElementById('sort-by').addEventListener('change', () => {
            if (this.countries.length > 0) this.renderCountries(this.countries);
        });

        // Wishlist controls
        document.getElementById('wishlist-sort').addEventListener('change', () => this.renderWishlist());
        document.getElementById('wishlist-search').addEventListener('input', () => this.renderWishlist());

        // Modal controls
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => this.closeModals());
        });

        // Wishlist form
        document.getElementById('wishlist-form').addEventListener('submit', (e) => this.saveWishlistItem(e));

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModals();
            }
        });
    }

    /**
     * Загрузка профиля пользователя
     */
    async loadUserProfile() {
        try {
            const response = await fetch(`/api/users/${this.currentUser.id}`);
            const user = await response.json();
            if (user.id) {
                this.currentUser = user;
                this.renderProfile();
                this.loadWishlist();
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    /**
     * Переключение между секциями приложения
     * @param {string} sectionName - Название секции
     */
    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionName);
        });

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.toggle('active', section.id === `${sectionName}-section`);
        });

        this.currentSection = sectionName;

        // Load section-specific data
        if (sectionName === 'wishlist') {
            this.loadWishlist();
        } else if (sectionName === 'search' && this.countries.length === 0) {
            this.loadAllCountries();
        }
    }

    /**
     * Загрузка всех стран
     */
    async loadAllCountries() {
        this.showLoading('countries-container', '🔄 Загружаем все страны...');
        
        try {
            const response = await fetch('/api/countries');
            if (!response.ok) throw new Error('Network response was not ok');
            
            this.countries = await response.json();
            this.renderCountries(this.countries);
        } catch (error) {
            console.error('Error loading countries:', error);
            this.showError('countries-container', '❌ Ошибка загрузки стран. Проверьте подключение к интернету.');
        }
    }

    /**
     * Поиск стран по различным параметрам
     */
    async searchCountries() {
        const searchTerm = document.getElementById('search-input').value.trim();
        const region = document.getElementById('region-filter').value;
        
        if (!searchTerm && !region) {
            this.loadAllCountries();
            return;
        }

        this.showLoading('countries-container', '🔍 Ищем страны...');

        try {
            let url = '/api/countries';
            if (searchTerm) {
                url = `/api/countries/search/${encodeURIComponent(searchTerm)}`;
            } else if (region) {
                url = `/api/countries/region/${region}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Search failed');
            
            let countries = await response.json();
            
            // Additional client-side filtering for better search
            if (searchTerm && Array.isArray(countries)) {
                const term = searchTerm.toLowerCase();
                countries = countries.filter(country => {
                    const name = country.name?.common?.toLowerCase() || '';
                    const capital = country.capital?.[0]?.toLowerCase() || '';
                    const languages = country.languages ? Object.values(country.languages).map(lang => lang.toLowerCase()) : [];
                    
                    return name.includes(term) || 
                           capital.includes(term) ||
                           languages.some(lang => lang.includes(term));
                });
            }

            this.renderCountries(countries);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('countries-container', '😔 Страны не найдены. Попробуйте другой запрос.');
        }
    }

    /**
     * Отображение списка стран
     * @param {Array} countries - Массив стран для отображения
     */
    renderCountries(countries) {
        const container = document.getElementById('countries-container');
        const sortBy = document.getElementById('sort-by').value;

        if (!countries || countries.length === 0) {
            container.innerHTML = '<p class="error">😔 Страны не найдены</p>';
            return;
        }

        // Sort countries
        const sortedCountries = [...countries].sort((a, b) => {
            switch (sortBy) {
                case 'population':
                    return (b.population || 0) - (a.population || 0);
                case 'area':
                    return (b.area || 0) - (a.area || 0);
                default:
                    return (a.name?.common || '').localeCompare(b.name?.common || '');
            }
        });

        container.innerHTML = `
            <div class="results-info">
                <p>📊 Найдено стран: ${sortedCountries.length}</p>
            </div>
            <div class="countries-grid">
                ${sortedCountries.map(country => this.createCountryCard(country)).join('')}
            </div>
        `;

        // Add event listeners to country cards
        container.querySelectorAll('.country-card').forEach((card, index) => {
            card.addEventListener('click', () => this.showCountryModal(sortedCountries[index]));
        });
    }

    /**
     * Создание карточки страны
     * @param {Object} country - Данные страны
     * @returns {string} HTML разметка карточки
     */
    createCountryCard(country) {
        const isInWishlist = this.wishlist.some(item => item.country_code === country.cca2);
        const safeName = this.escapeHtml(country.name?.common || 'Неизвестная страна');
        
        return `
            <div class="country-card" data-code="${country.cca2}">
                ${country.flags?.png ? `
                    <img src="${country.flags.png}" 
                         alt="Флаг ${safeName}" 
                         class="country-flag"
                         onerror="this.style.display='none'">
                ` : ''}
                <h3>${safeName}</h3>
                <div class="country-info">
                    <p><strong>Столица:</strong> ${country.capital?.[0] || 'Не указана'}</p>
                    <p><strong>Население:</strong> ${(country.population || 0).toLocaleString()}</p>
                    <p><strong>Регион:</strong> ${country.region || 'Не указан'}</p>
                    <p><strong>Языки:</strong> ${country.languages ? Object.values(country.languages).slice(0, 2).join(', ') : 'Не указаны'}</p>
                </div>
                <button class="wishlist-btn ${isInWishlist ? 'added' : ''}" 
                        onclick="event.stopPropagation(); app.${isInWishlist ? 'removeFromWishlist' : 'showWishlistModal'}('${country.cca2}', '${safeName.replace(/'/g, "\\'")}')">
                    ${isInWishlist ? '❤️ В вишлисте' : '❤️ В вишлист'}
                </button>
            </div>
        `;
    }

    /**
     * Показ модального окна с детальной информацией о стране
     * @param {Object} country - Данные страны
     */
    showCountryModal(country) {
        const modal = document.getElementById('country-modal');
        const body = document.getElementById('modal-body');
        const safeName = this.escapeHtml(country.name?.common || 'Неизвестная страна');
        
        body.innerHTML = `
            <div class="country-modal-content">
                <h2>${safeName}</h2>
                ${country.flags?.png ? `
                    <img src="${country.flags.png}" 
                         alt="Флаг ${safeName}" 
                         style="max-width: 300px; margin: 15px 0; border-radius: 8px;">
                ` : ''}
                
                <div class="country-details">
                    <p><strong>Официальное название:</strong> ${this.escapeHtml(country.name?.official || 'Не указано')}</p>
                    <p><strong>Столица:</strong> ${country.capital?.[0] || 'Не указана'}</p>
                    <p><strong>Население:</strong> ${(country.population || 0).toLocaleString()}</p>
                    <p><strong>Площадь:</strong> ${(country.area || 0).toLocaleString()} км²</p>
                    <p><strong>Регион:</strong> ${country.region || 'Не указан'}</p>
                    <p><strong>Субрегион:</strong> ${country.subregion || 'Не указан'}</p>
                    <p><strong>Языки:</strong> ${country.languages ? Object.values(country.languages).join(', ') : 'Не указаны'}</p>
                    <p><strong>Валюта:</strong> ${country.currencies ? Object.values(country.currencies).map(c => c.name).join(', ') : 'Не указана'}</p>
                    <p><strong>Часовой пояс:</strong> ${country.timezones?.[0] || 'Не указан'}</p>
                </div>
                
                <button class="wishlist-btn" 
                        onclick="app.showWishlistModal('${country.cca2}', '${safeName.replace(/'/g, "\\'")}')">
                    ❤️ Добавить в вишлист
                </button>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    /**
     * Показ модального окна для добавления/редактирования вишлиста
     * @param {string} countryCode - Код страны
     * @param {string} countryName - Название страны
     */
    showWishlistModal(countryCode, countryName) {
        const modal = document.getElementById('wishlist-modal');
        const existingItem = this.wishlist.find(item => item.country_code === countryCode);
        
        document.getElementById('wishlist-country-code').value = countryCode;
        document.getElementById('wishlist-country-name').value = countryName;
        
        if (existingItem) {
            document.getElementById('wishlist-rating-input').value = existingItem.rating;
            document.getElementById('wishlist-notes').value = existingItem.notes || '';
        } else {
            document.getElementById('wishlist-rating-input').value = '0';
            document.getElementById('wishlist-notes').value = '';
        }
        
        modal.style.display = 'block';
    }

    /**
     * Сохранение элемента вишлиста
     * @param {Event} e - Событие формы
     */
    async saveWishlistItem(e) {
        e.preventDefault();
        
        const countryCode = document.getElementById('wishlist-country-code').value;
        const countryName = document.getElementById('wishlist-country-name').value;
        const rating = parseInt(document.getElementById('wishlist-rating-input').value);
        const notes = document.getElementById('wishlist-notes').value;

        if (!countryCode) {
            alert('Ошибка: код страны не указан');
            return;
        }

        try {
            const existingItem = this.wishlist.find(item => item.country_code === countryCode);
            
            let response;
            if (existingItem) {
                // Update existing item
                response = await fetch(`/api/wishlist/${this.currentUser.id}/${countryCode}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating, notes })
                });
            } else {
                // Add new item
                response = await fetch(`/api/wishlist/${this.currentUser.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country_code: countryCode, country_name: countryName, rating, notes })
                });
            }

            if (response.ok) {
                this.closeModals();
                this.loadWishlist();
                
                // Update country cards if we're in search section
                if (this.currentSection === 'search') {
                    this.renderCountries(this.countries);
                }
                
                alert(`✅ ${countryName} ${existingItem ? 'обновлен' : 'добавлен'} в вишлист!`);
            }
        } catch (error) {
            console.error('Error saving wishlist item:', error);
            alert('❌ Ошибка при сохранении в вишлист');
        }
    }

    /**
     * Загрузка вишлиста пользователя
     */
    async loadWishlist() {
        try {
            const response = await fetch(`/api/wishlist/${this.currentUser.id}`);
            this.wishlist = await response.json();
            this.renderWishlist();
            this.updateWishlistStats();
        } catch (error) {
            console.error('Error loading wishlist:', error);
        }
    }

    /**
     * Отображение вишлиста
     */
    renderWishlist() {
        const container = document.getElementById('wishlist-container');
        const sortBy = document.getElementById('wishlist-sort').value;
        const searchTerm = document.getElementById('wishlist-search').value.toLowerCase();

        let filteredWishlist = this.wishlist.filter(item => 
            item.country_name.toLowerCase().includes(searchTerm)
        );

        // Sort wishlist
        filteredWishlist.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return b.rating - a.rating;
                case 'name':
                    return a.country_name.localeCompare(b.country_name);
                default:
                    return new Date(b.added_date) - new Date(a.added_date);
            }
        });

        if (filteredWishlist.length === 0) {
            container.innerHTML = '<p class="error">😔 Совпадений не найдено</p>';
            return;
        }

        container.innerHTML = filteredWishlist.map(item => `
            <div class="wishlist-item">
                <div class="wishlist-item-header">
                    <h3>${item.country_name}</h3>
                    <span class="rating">${'⭐'.repeat(item.rating)}${item.rating === 0 ? 'Без оценки' : ''}</span>
                </div>
                <p><strong>Добавлено:</strong> ${new Date(item.added_date).toLocaleDateString('ru-RU')}</p>
                ${item.notes ? `<div class="wishlist-notes"><strong>Заметки:</strong> ${item.notes}</div>` : ''}
                <div class="wishlist-actions">
                    <button class="btn-edit" onclick="app.showWishlistModal('${item.country_code}', '${item.country_name.replace(/'/g, "\\'")}')">
                        ✏️ Редактировать
                    </button>
                    <button class="btn-delete" onclick="app.removeFromWishlist('${item.country_code}', '${item.country_name.replace(/'/g, "\\'")}')">
                        ❌ Удалить
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Удаление страны из вишлиста
     * @param {string} countryCode - Код страны
     * @param {string} countryName - Название страны
     */
    async removeFromWishlist(countryCode, countryName) {
        if (!confirm(`Удалить ${countryName} из вишлиста?`)) return;

        try {
            const response = await fetch(`/api/wishlist/${this.currentUser.id}/${countryCode}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.loadWishlist();
                
                // Update country cards if we're in search section
                if (this.currentSection === 'search') {
                    this.renderCountries(this.countries);
                }
                
                alert(`✅ ${countryName} удален из вишлиста`);
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            alert('❌ Ошибка при удалении из вишлиста');
        }
    }

    /**
     * Обновление статистики вишлиста
     */
    updateWishlistStats() {
        const count = this.wishlist.length;
        const avgRating = count > 0 
            ? (this.wishlist.reduce((sum, item) => sum + item.rating, 0) / count).toFixed(1)
            : 0;

        document.getElementById('wishlist-count').textContent = `Стран: ${count}`;
        document.getElementById('wishlist-rating').textContent = `Средняя оценка: ${avgRating}`;
    }

    /**
     * Отображение профиля пользователя
     */
    renderProfile() {
        const container = document.getElementById('profile-info');
        container.innerHTML = `
            <div class="profile-details">
                <p><strong>Имя пользователя:</strong> ${this.currentUser.username}</p>
                <p><strong>Email:</strong> ${this.currentUser.email || 'Не указан'}</p>
                <p><strong>Дата регистрации:</strong> ${this.currentUser.created_at ? new Date(this.currentUser.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}</p>
                <p><strong>Стран в вишлисте:</strong> ${this.wishlist.length}</p>
            </div>
        `;
    }

    /**
     * Закрытие всех модальных окон
     */
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    /**
     * Экранирование HTML для безопасности
     * @param {string} text - Текст для экранирования
     * @returns {string} Экранированный текст
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Показ загрузки
     * @param {string} containerId - ID контейнера
     * @param {string} message - Сообщение
     */
    showLoading(containerId, message = 'Загрузка...') {
        document.getElementById(containerId).innerHTML = `
            <div class="loading">
                <p>${message}</p>
            </div>
        `;
    }

    /**
     * Показ ошибки
     * @param {string} containerId - ID контейнера
     * @param {string} message - Сообщение об ошибке
     */
    showError(containerId, message = 'Произошла ошибка') {
        document.getElementById(containerId).innerHTML = `
            <div class="error">
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CountriesApp();
});