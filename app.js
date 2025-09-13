// Инициализация данных
let appData = {
    targetDate: null,
    dailyGoal: 0,
    history: [],
    totalCollected: 0
};

// Загрузка данных при запуске
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateUI();
    
    // Установка минимальной даты на завтра
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
    const endDate = document.getElementById('endDateInput').value;
    const dailyGoal = document.getElementById('dailyGoalInput').value;
    
    if (!endDate || !dailyGoal) {
        alert('Заполните все поля!');
        return;
    }
    
    appData.targetDate = endDate;
    appData.dailyGoal = parseFloat(dailyGoal);
    
    saveData();
    updateUI();
    closeSettings();
}

// Добавление дохода
function addIncome() {
    const input = document.getElementById('amountInput');
    const amount = parseFloat(input.value);
    
    if (!amount || amount <= 0) {
        alert('Введите корректную сумму!');
        return;
    }
    
    if (!appData.targetDate || !appData.dailyGoal) {
        alert('Сначала настройте цель в настройках!');
        openSettings();
        return;
    }
    
    // Добавление в историю
    const transaction = {
        date: new Date().toISOString(),
        amount: amount
    };
    
    appData.history.unshift(transaction);
    appData.totalCollected += amount;
    
    // Ограничение истории 50 записями
    if (appData.history.length > 50) {
        appData.history = appData.history.slice(0, 50);
    }
    
    saveData();
    updateUI();
    
    // Очистка поля
    input.value = '';
    
    // Анимация добавления
    input.style.transform = 'scale(0.98)';
    setTimeout(() => {
        input.style.transform = 'scale(1)';
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
    if (!appData.targetDate || !appData.dailyGoal) {
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
    
    const target = new Date(appData.targetDate);
    target.setHours(0, 0, 0, 0);
    
    const totalDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    const daysLeft = totalDays > 0 ? totalDays : 0;
    
    const totalTarget = appData.dailyGoal * totalDays;
    const shouldHaveToday = appData.dailyGoal * (totalDays - daysLeft);
    const difference = appData.totalCollected - shouldHaveToday;
    
    // Сколько нужно в день с учетом текущего прогресса
    const remainingAmount = totalTarget - appData.totalCollected;
    const dailyRequired = daysLeft > 0 ? Math.max(0, remainingAmount / daysLeft) : 0;
    
    // Обновление элементов
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
    
    historyList.innerHTML = appData.history.map(item => `
        <div class="history-item">
            <div>
                <div class="history-date">${formatDateTime(item.date)}</div>
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
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Форматирование даты и времени
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    
    const isToday = date.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    if (isToday) {
        return `Сегодня, ${time}`;
    } else if (isYesterday) {
        return `Вчера, ${time}`;
    } else {
        return `${formatDate(dateString)}, ${time}`;
    }
}

// Обработка Enter в поле ввода
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'amountInput') {
        addIncome();
    }
});
