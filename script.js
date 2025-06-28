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
        
        // Проверка на дубликат
        const newDep = { determinant: detAttrs, function: funcAttrs };
        if (isDuplicate(newDep)) {
            showError('Такая ФЗ уже существует!', errorElement);
            return;
        }
        
        // Добавляем новую ФЗ
        dependencies.push(newDep);
        renderTable();
        renderGraph();
        
        // Очищаем форму
        form.reset();
        errorElement.style.display = 'none';
    });
    
    function isDuplicate(newDep) {
        return dependencies.some(dep => 
            arraysEqual(dep.determinant, newDep.determinant) && 
            arraysEqual(dep.function, newDep.function)
        );
    }
    
    function arraysEqual(a, b) {
        return a.length === b.length && a.every((val, i) => val === b[i]);
    }
    
    function showError(message, element) {
        element.textContent = message;
        element.style.display = 'block';
    }
    
    function renderTable() {
        results.innerHTML = '';
        
        if (dependencies.length === 0) {
            results.innerHTML = '<p>Нет добавленных зависимостей</p>';
            return;
        }
        
        dependencies.forEach((dep, index) => {
            const row = document.createElement('div');
            row.className = 'fz-row';
            
            const detCell = document.createElement('div');
            detCell.textContent = dep.determinant.join(', ');
            
            const funcCell = document.createElement('div');
            funcCell.textContent = dep.function.join(', ');
            
            const actionCell = document.createElement('div');
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Удалить';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => {
                dependencies.splice(index, 1);
                renderTable();
                renderGraph();
            };
            
            actionCell.appendChild(deleteBtn);
            row.append(detCell, funcCell, actionCell);
            results.appendChild(row);
        });
    }
    
    function renderGraph() {
        graph.innerHTML = '';
        
        if (dependencies.length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '50%');
            text.setAttribute('y', '50%');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#666');
            text.textContent = 'Добавьте ФЗ для отображения графа';
            graph.appendChild(text);
            return;
        }
        
        // Собираем все уникальные атрибуты
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
        
        // Рисуем стрелки
        dependencies.forEach(dep => {
            dep.determinant.forEach(detAttr => {
                dep.function.forEach(funcAttr => {
                    const fromIndex = attrs.indexOf(detAttr);
                    const toIndex = attrs.indexOf(funcAttr);
                    
                    const fromAngle = (fromIndex / attrs.length) * Math.PI * 2 - Math.PI/2;
                    const toAngle = (toIndex / attrs.length) * Math.PI * 2 - Math.PI/2;
                    
                    const x1 = centerX + Math.cos(fromAngle) * radius;
                    const y1 = centerY + Math.sin(fromAngle) * radius;
                    const x2 = centerX + Math.cos(toAngle) * radius;
                    const y2 = centerY + Math.sin(toAngle) * radius;
                    
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    line.setAttribute('stroke', '#ff4444');
                    line.setAttribute('stroke-width', '2');
                    line.setAttribute('marker-end', 'url(#arrowhead)');
                    graph.appendChild(line);
                });
            });
        });
        
        // Добавляем маркер для стрелок
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
        graph.appendChild(defs);
        
        // Рисуем узлы
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
    
    // Инициализация
    renderTable();
    renderGraph();
    window.addEventListener('resize', renderGraph);
});