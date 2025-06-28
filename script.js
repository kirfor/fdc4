// ... предыдущий код остается без изменений до момента добавления новой ФЗ ...

    // Добавляем новую ФЗ
    const row = document.createElement('div');
    row.className = 'fz-row';
    
    const detCell = document.createElement('div');
    detCell.textContent = validationDet.strings.join(', ');
    row.appendChild(detCell);
    
    const funcCell = document.createElement('div');
    funcCell.textContent = validationFunc.strings.join(', ');
    row.appendChild(funcCell);
    
    const actionCell = document.createElement('div');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Удалить';
    deleteBtn.addEventListener('click', function() {
        row.remove();
        updateDependencyGraph();
    });
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);
    
    // Добавляем в начало таблицы
    resultsBody.insertBefore(row, resultsBody.firstChild);
    
    // Очищаем поля ввода
    determinant.value = '';
    func.value = '';

    // Обновляем граф зависимостей
    updateDependencyGraph();
});

// Функция для обновления графа зависимостей
function updateDependencyGraph() {
    const svg = document.getElementById('dependency-graph');
    svg.innerHTML = '';
    
    // Добавляем marker для стрелок
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#ff4444');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);
    
    // Собираем все атрибуты и зависимости
    const allAttributes = new Set();
    const dependencies = [];
    
    document.querySelectorAll('.fz-row').forEach(row => {
        const cells = row.querySelectorAll('div');
        const det = cells[0].textContent.split(',').map(s => s.trim());
        const func = cells[1].textContent.split(',').map(s => s.trim());
        
        det.forEach(attr => allAttributes.add(attr));
        func.forEach(attr => allAttributes.add(attr));
        
        det.forEach(d => {
            func.forEach(f => {
                dependencies.push({ source: d, target: f });
            });
        });
    });
    
    const attributes = Array.from(allAttributes);
    if (attributes.length === 0) return;
    
    // Распределяем узлы по окружности
    const centerX = svg.clientWidth / 2;
    const centerY = svg.clientHeight / 2;
    const radius = Math.min(svg.clientWidth, svg.clientHeight) * 0.4;
    
    // Рисуем связи
    dependencies.forEach(dep => {
        const sourceIndex = attributes.indexOf(dep.source);
        const targetIndex = attributes.indexOf(dep.target);
        
        const sourceAngle = (sourceIndex / attributes.length) * Math.PI * 2;
        const targetAngle = (targetIndex / attributes.length) * Math.PI * 2;
        
        const x1 = centerX + Math.cos(sourceAngle) * radius;
        const y1 = centerY + Math.sin(sourceAngle) * radius;
        const x2 = centerX + Math.cos(targetAngle) * radius;
        const y2 = centerY + Math.sin(targetAngle) * radius;
        
        // Корректируем конечную точку, чтобы стрелка не перекрывала узел
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const ratio = (length - 10) / length;
        const adjustedX2 = x1 + dx * ratio;
        const adjustedY2 = y1 + dy * ratio;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'link');
        path.setAttribute('d', `M${x1},${y1} L${adjustedX2},${adjustedY2}`);
        svg.appendChild(path);
    });
    
    // Рисуем узлы
    attributes.forEach((attr, index) => {
        const angle = (index / attributes.length) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'node');
        circle.setAttribute('r', 15);
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        svg.appendChild(circle);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'attribute-label');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 5);
        text.textContent = attr;
        svg.appendChild(text);
    });
}

// Инициализация графа при загрузке
window.addEventListener('load', updateDependencyGraph);
window.addEventListener('resize', updateDependencyGraph);