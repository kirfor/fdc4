document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('textForm');
    const results = document.getElementById('results');
    const graph = document.getElementById('dependency-graph');
    
    // Хранилище для ФЗ
    let dependencies = [];
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const determinant = document.getElementById('determinant').value.trim();
        const func = document.getElementById('function').value.trim();
        const errorElement = document.getElementById('error-message');
        
        // Валидация
        if (!determinant || !func) {
            showError('Оба поля должны быть заполнены!', errorElement);
            return;
        }
        
        const detAttrs = determinant.split(',').map(s => s.trim()).filter(Boolean);
        const funcAttrs = func.split(',').map(s => s.trim()).filter(Boolean);
        
        if (detAttrs.length === 0 || funcAttrs.length === 0) {
            showError('Введите хотя бы один атрибут в каждом поле!', errorElement);
            return;
        }
        
        // Проверка на тривиальную зависимость
        for (const attr of funcAttrs) {
            if (detAttrs.includes(attr)) {
                showError(`Тривиальная зависимость: ${attr} содержится в детерминанте!`, errorElement);
                return;
            }
        }
        
        // Добавляем новую ФЗ
        dependencies.push({
            determinant: detAttrs,
            function: funcAttrs,
            isComposite: detAttrs.length > 1 // Флаг составной детерминанты
        });
        
        renderTable();
        renderGraph();
        
        // Очищаем форму
        form.reset();
        errorElement.style.display = 'none';
    });
    
    function showError(message, element) {
        element.textContent = message;
        element.style.display = 'block';
    }
    
    function renderTable() {
        results.innerHTML = dependencies.map(dep => `
            <div class="fz-row">
                <div>${dep.determinant.join(', ')}</div>
                <div>${dep.function.join(', ')}</div>
                <div>
                    <button class="delete-btn" data-index="${dependencies.indexOf(dep)}">×</button>
                </div>
            </div>
        `).join('') || '<p>Нет добавленных зависимостей</p>';
        
        // Назначаем обработчики удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                dependencies.splice(parseInt(this.dataset.index), 1);
                renderTable();
                renderGraph();
            });
        });
    }
    
    function renderGraph() {
        graph.innerHTML = '';
        
        if (dependencies.length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '50%');
            text.setAttribute('y', '50%');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = 'Добавьте ФЗ для отображения графа';
            graph.appendChild(text);
            return;
        }
        
        // Собираем все атрибуты
        const allAttrs = new Set();
        dependencies.forEach(dep => {
            dep.determinant.forEach(attr => allAttrs.add(attr));
            dep.function.forEach(attr => allAttrs.add(attr));
        });
        
        const attrs = Array.from(allAttrs);
        const width = graph.clientWidth;
        const height = graph.clientHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;
        
        // Создаем группы для составных детерминант
        const compositeGroups = dependencies
            .filter(dep => dep.isComposite)
            .map(dep => dep.determinant);
        
        // Рисуем составные детерминанты (контуры)
        compositeGroups.forEach(group => {
            if (group.length < 2) return;
            
            const groupAttrs = group.filter(attr => attrs.includes(attr));
            if (groupAttrs.length < 2) return;
            
            // Вычисляем центр группы
            const center = groupAttrs.reduce((acc, attr) => {
                const index = attrs.indexOf(attr);
                const angle = (index / attrs.length) * Math.PI * 2 - Math.PI/2;
                return {
                    x: acc.x + Math.cos(angle),
                    y: acc.y + Math.sin(angle)
                };
            }, {x: 0, y: 0});
            
            center.x = centerX + (center.x / groupAttrs.length) * radius * 0.7;
            center.y = centerY + (center.y / groupAttrs.length) * radius * 0.7;
            
            // Рисуем контур
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', center.x);
            circle.setAttribute('cy', center.y);
            circle.setAttribute('r', groupAttrs.length * 10 + 15);
            circle.setAttribute('class', 'group-circle');
            graph.appendChild(circle);
            
            // Подпись группы
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', center.x);
            label.setAttribute('y', center.y - groupAttrs.length * 10 - 10);
            label.setAttribute('class', 'group-label');
            label.textContent = group.join(',');
            graph.appendChild(label);
        });
        
        // Рисуем стрелки зависимостей
        dependencies.forEach(dep => {
            dep.function.forEach(funcAttr => {
                if (dep.isComposite) {
                    // Для составной детерминанты рисуем стрелки от контура
                    const groupCenter = getGroupCenter(dep.determinant, attrs, centerX, centerY, radius);
                    const funcIndex = attrs.indexOf(funcAttr);
                    const funcAngle = (funcIndex / attrs.length) * Math.PI * 2 - Math.PI/2;
                    const x2 = centerX + Math.cos(funcAngle) * radius;
                    const y2 = centerY + Math.sin(funcAngle) * radius;
                    
                    drawArrow(graph, groupCenter.x, groupCenter.y, x2, y2);
                } else {
                    // Для простой детерминанты рисуем обычную стрелку
                    const detIndex = attrs.indexOf(dep.determinant[0]);
                    const funcIndex = attrs.indexOf(funcAttr);
                    const detAngle = (detIndex / attrs.length) * Math.PI * 2 - Math.PI/2;
                    const funcAngle = (funcIndex / attrs.length) * Math.PI * 2 - Math.PI/2;
                    
                    const x1 = centerX + Math.cos(detAngle) * radius;
                    const y1 = centerY + Math.sin(detAngle) * radius;
                    const x2 = centerX + Math.cos(funcAngle) * radius;
                    const y2 = centerY + Math.sin(funcAngle) * radius;
                    
                    drawArrow(graph, x1, y1, x2, y2);
                }
            });
        });
        
        // Рисуем узлы (атрибуты)
        attrs.forEach((attr, index) => {
            const angle = (index / attrs.length) * Math.PI * 2 - Math.PI/2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 15);
            circle.setAttribute('fill', '#35424a');
            graph.appendChild(circle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'white');
            text.textContent = attr;
            graph.appendChild(text);
        });
    }
    
    function getGroupCenter(groupAttrs, allAttrs, centerX, centerY, radius) {
        const validAttrs = groupAttrs.filter(attr => allAttrs.includes(attr));
        
        const center = validAttrs.reduce((acc, attr) => {
            const index = allAttrs.indexOf(attr);
            const angle = (index / allAttrs.length) * Math.PI * 2 - Math.PI/2;
            return {
                x: acc.x + Math.cos(angle),
                y: acc.y + Math.sin(angle)
            };
        }, {x: 0, y: 0});
        
        return {
            x: centerX + (center.x / validAttrs.length) * radius * 0.7,
            y: centerY + (center.y / validAttrs.length) * radius * 0.7
        };
    }
    
    function drawArrow(svg, x1, y1, x2, y2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#ff4444');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        svg.appendChild(line);
        
        // Добавляем маркер для стрелок (если еще нет)
        if (!svg.querySelector('defs')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arrow.setAttribute('d', 'M0,0 L10,3.5 L0,7 Z');
            arrow.setAttribute('fill', '#ff4444');
            marker.appendChild(arrow);
            defs.appendChild(marker);
            svg.appendChild(defs);
        }
    }
    
    // Инициализация
    renderTable();
    renderGraph();
    window.addEventListener('resize', renderGraph);
});