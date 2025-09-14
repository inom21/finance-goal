// Инициализация данных
let appData = {
    startDate: null,
    targetDate: null,
    dailyGoal: 0,
    history: [],
    totalCollected: 0
};

// Загрузка данных при запуске
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateUI();
    
    // Установка текущей даты в поле добавления дохода
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('incomeDate').value = today;
    document.getElementById('incomeDate').max = today;
    
    // Установка дат в настройках
    document.getElementById('startDateInput').value = today;
    document.getElementById('startDateInput').max = today;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('endDateInput').min = tomorrow.toISOString().split('T')[0];
    
    // Регистрация Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker зарегистрирован'))
            .catch(err => console.log('Ошибка регистрации Service Worker:', err));
    }
});

// Загрузка данных из localStorage
function loadData() {
    const saved = localStorage.getItem('financeGoalData');
    if (saved) {
        appData = JSON.parse(saved);
    }
}

// Сохранение данных в localStorage
function saveData() {
    localStorage.setItem('financeGoalData', JSON.stringify(appData));
}

// Открытие настроек
function openSettings() {
    document.getElementById('settingsModal').style.display = 'block';
    
    // Заполнение текущими значениями
    if (appData.startDate) {
        document.getElementById('startDateInput').value = appData.startDate;
    }
    if (appData.targetDate) {
        document.getElementById('endDateInput').value = appData.targetDate;
    }
    if (appData.dailyGoal) {
        document.getElementById('dailyGoalInput').value = appData.dailyGoal;
    }
}

// Закрытие настроек
function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

// Сохранение настроек
function saveSettings() {
    const startDate = document.getElementById('startDateInput').value;
    const endDate = document.getElementById('endDateInput').value;
    const dailyGoal = document.getElementById('dailyGoalInput').value;
    
    if (!startDate || !endDate || !dailyGoal) {
        alert('Заполните все поля!');
        return;
    }
    
    // Проверка, что дата окончания позже даты начала
    if (new Date(endDate) <= new Date(startDate)) {
        alert('Дата окончания должна быть позже даты начала!');
        return;
    }
    
    appData.startDate = startDate;
    appData.targetDate = endDate;
    appData.dailyGoal = parseFloat(dailyGoal);
    
    saveData();
    updateUI();
    closeSettings();
}

// Добавление дохода
function addIncome() {
    const amountInput = document.getElementById('amountInput');
    const dateInput = document.getElementById('incomeDate');
    const amount = parseFloat(amountInput.value);
    const incomeDate = dateInput.value;
    
    if (!amount || amount <= 0) {
        alert('Введите корректную сумму!');
        return;
    }
    
    if (!incomeDate) {
        alert('Выберите дату!');
        return;
    }
    
    if (!appData.startDate || !appData.targetDate || !appData.dailyGoal) {
        alert('Сначала настройте цель в настройках!');
        openSettings();
        return;
    }
    
    // Проверка, что дата дохода не раньше начала и не позже конца цели
    const income = new Date(incomeDate);
    const start = new Date(appData.startDate);
    const end = new Date(appData.targetDate);
    
    if (income < start) {
        alert('Дата дохода не может быть раньше начала цели!');
        return;
    }
    
    if (income > end) {
        alert('Дата дохода не может быть позже окончания цели!');
        return;
    }
    
    // Добавление в историю
    const transaction = {
        date: incomeDate,
        amount: amount,
        addedAt: new Date().toISOString()
    };
    
    appData.history.unshift(transaction);
    appData.totalCollected += amount;
    
    // Ограничение истории 50 записями
    if (appData.history.length > 50) {
        appData.history = appData.history.slice(0, 50);
    }
    
    saveData();
    updateUI();
    
    // Очистка поля суммы, но оставляем дату
    amountInput.value = '';
    
    // Анимация добавления
    amountInput.style.transform = 'scale(0.98)';
    setTimeout(() => {
        amountInput.style.transform = 'scale(1)';
    }, 100);
}

// Очистка истории
function clearHistory() {
    if (confirm('Вы уверены, что хотите очистить всю историю и сбросить прогресс?')) {
        appData.history = [];
        appData.totalCollected = 0;
        saveData();
        updateUI();
    }
}

// Обновление интерфейса
function updateUI() {
    // Если нет цели, показываем прочерки
    if (!appData.startDate || !appData.targetDate || !appData.dailyGoal) {
        document.getElementById('startDate').textContent = '—';
        document.getElementById('targetDate').textContent = 'не установлена';
        document.getElementById('targetAmount').textContent = '0';
        document.getElementById('totalCollected').textContent = '0 ₽';
        document.getElementById('daysLeft').textContent = '—';
        document.getElementById('dailyRequired').textContent = '— ₽';
        document.getElementById('planStatus').textContent = '—';
        document.getElementById('progressBar').style.width = '0%';
        document.getElementById('progressPercent').textContent = '0%';
        updateHistory();
        return;
    }
    
    // Расчет параметров
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(appData.startDate);
    start.setHours(0, 0, 0, 0);
    
    const target = new Date(appData.targetDate);
    target.setHours(0, 0, 0, 0);
    
    // Общее количество дней
    const totalDays = Math.ceil((target - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Прошло дней с начала
    const daysPassed = Math.max(0, Math.ceil((today - start) / (1000 * 60 * 60 * 24)));
    
    // Осталось дней
    const daysLeft = Math.max(0, Math.ceil((target - today) / (1000 * 60 * 60 * 24)) + 1);
    
    // Общая цель
    const totalTarget = appData.dailyGoal * totalDays;
    
    // Должно быть собрано на сегодня
    const shouldHaveToday = appData.dailyGoal * Math.min(daysPassed, totalDays);
    
    // Разница (опережение/отставание)
    const difference = appData.totalCollected - shouldHaveToday;
    
    // Сколько нужно в день с учетом текущего прогресса
    const remainingAmount = Math.max(0, totalTarget - appData.totalCollected);
    const dailyRequired = daysLeft > 0 ? remainingAmount / daysLeft : 0;
    
    // Обновление элементов
    document.getElementById('startDate').textContent = formatDate(appData.startDate);
    document.getElementById('targetDate').textContent = formatDate(appData.targetDate);
    document.getElementById('targetAmount').textContent = formatNumber(totalTarget);
    document.getElementById('totalCollected').textContent = formatNumber(appData.totalCollected) + ' ₽';
    document.getElementById('daysLeft').textContent = daysLeft;
    document.getElementById('dailyRequired').textContent = formatNumber(dailyRequired) + ' ₽';
    
    // Статус плана
    const statusElement = document.getElementById('planStatus');
    if (difference >= 0) {
        statusElement.textContent = '+' + formatNumber(difference) + ' ₽';
        statusElement.className = 'stat-value positive';
    } else {
        statusElement.textContent = formatNumber(difference) + ' ₽';
        statusElement.className = 'stat-value negative';
    }
    
    // Прогресс бар
    const progress = Math.min(100, (appData.totalCollected / totalTarget) * 100);
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressPercent').textContent = progress.toFixed(1) + '%';
    
    // История
    updateHistory();
}

// Обновление истории
function updateHistory() {
    const historyList = document.getElementById('historyList');
    
    if (appData.history.length === 0) {
        historyList.innerHTML = '<div class="empty-state">Нет операций</div>';
        return;
    }
    
    // Сортировка по дате операции (не по времени добавления)
    const sortedHistory = [...appData.history].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    historyList.innerHTML = sortedHistory.map(item => `
        <div class="history-item">
            <div class="history-info">
                <div class="history-date">${formatDateForHistory(item.date)}</div>
            </div>
            <div class="history-amount">+${formatNumber(item.amount)} ₽</div>
        </div>
    `).join('');
}

// Форматирование чисел
function formatNumber(num) {
    return Math.round(num).toLocaleString('ru-RU');
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

// Форматирование даты для истории
function formatDateForHistory(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const operationDate = new Date(date);
    operationDate.setHours(0, 0, 0, 0);
    
    if (operationDate.getTime() === today.getTime()) {
        return 'Сегодня';
    } else if (operationDate.getTime() === yesterday.getTime()) {
        return 'Вчера';
    } else {
        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    }
}

// Обработка Enter в поле ввода
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'amountInput') {
        addIncome();
    }
});

// Закрытие модального окна при клике вне его
document.addEventListener('click', (e) => {
    const modal = document.getElementById('settingsModal');
    if (e.target === modal) {
        closeSettings();
    }
});
