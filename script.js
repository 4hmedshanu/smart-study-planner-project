 // Application state
        let tasks = JSON.parse(localStorage.getItem('studyPlannerTasks')) || [];
        let studySessions = JSON.parse(localStorage.getItem('studyPlannerSessions')) || [];
        let subjects = JSON.parse(localStorage.getItem('studyPlannerSubjects')) || [];
        let currentEditingTaskId = null;
        let selectedCalendarDate = null;
        let currentFilter = 'all';
        
        // Timer functionality
        let timerInterval;
        let timerSeconds = 25 * 60; // 25 minutes in seconds
        let isTimerRunning = false;
        
        // Navigation between pages
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all links
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Hide all pages
                document.querySelectorAll('.page').forEach(page => {
                    page.classList.remove('active');
                });
                
                // Show the selected page
                const pageId = this.getAttribute('data-page');
                document.getElementById(pageId).classList.add('active');
                
                // Update specific page content if needed
                if (pageId === 'calendar') {
                    updateCalendarTasks();
                } else if (pageId === 'progress') {
                    updateProgressPage();
                } else if (pageId === 'subjects') {
                    updateSubjectsPage();
                }
            });
        });
        
        // Calendar generation for September 2025
        function generateCalendar() {
            const calendar = document.querySelector('.calendar');
            
            // Clear existing calendar days (except headers)
            while (calendar.children.length > 7) {
                calendar.removeChild(calendar.lastChild);
            }
            
            // September 2025 starts on Monday (1st is Monday)
            // Add empty cells for days before the 1st (Sunday)
            const firstDay = 1; // Monday (0=Sunday, 1=Monday, etc.)
            for (let i = 0; i < firstDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day';
                calendar.appendChild(emptyDay);
            }
            
            // Add days for September (30 days)
            const today = 27; // Today is September 27, 2025
            for (let day = 1; day <= 30; day++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                dayElement.textContent = day;
                dayElement.setAttribute('data-date', `2025-09-${day.toString().padStart(2, '0')}`);
                
                if (day === today) {
                    dayElement.classList.add('current');
                    selectedCalendarDate = `2025-09-${day.toString().padStart(2, '0')}`;
                }
                
                // Add events marker for days with tasks
                const hasTasks = tasks.some(task => task.dueDate === `2025-09-${day.toString().padStart(2, '0')}`);
                if (hasTasks) {
                    dayElement.classList.add('has-events');
                }
                
                dayElement.addEventListener('click', function() {
                    // Remove current class from all days
                    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('current'));
                    // Add current class to clicked day
                    this.classList.add('current');
                    selectedCalendarDate = this.getAttribute('data-date');
                    updateCalendarTasks();
                });
                
                calendar.appendChild(dayElement);
            }
        }
        
        // Update tasks for selected calendar date
        function updateCalendarTasks() {
            const calendarTasksList = document.getElementById('calendar-tasks');
            const calendarTasksMessage = document.getElementById('calendar-tasks-message');
            
            // Clear existing list
            calendarTasksList.innerHTML = '';
            
            if (!selectedCalendarDate) {
                calendarTasksMessage.textContent = 'Select a date to view tasks';
                return;
            }
            
            const dateTasks = tasks.filter(task => task.dueDate === selectedCalendarDate);
            
            if (dateTasks.length === 0) {
                calendarTasksMessage.textContent = 'No tasks scheduled for this date';
                return;
            }
            
            calendarTasksMessage.textContent = `${dateTasks.length} task(s) scheduled for this date`;
            
            dateTasks.forEach(task => {
                const taskItem = createTaskElement(task);
                calendarTasksList.appendChild(taskItem);
            });
        }
        
        // Timer functionality
        function updateTimerDisplay() {
            const minutes = Math.floor(timerSeconds / 60);
            const seconds = timerSeconds % 60;
            document.getElementById('timer-display').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        function startTimer() {
            if (isTimerRunning) return;
            
            isTimerRunning = true;
            document.getElementById('start-timer').disabled = true;
            document.getElementById('pause-timer').disabled = false;
            
            timerInterval = setInterval(() => {
                if (timerSeconds > 0) {
                    timerSeconds--;
                    updateTimerDisplay();
                } else {
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    showToast('Timer completed! Great job!');
                    document.getElementById('start-timer').disabled = false;
                    document.getElementById('pause-timer').disabled = true;
                    
                    // Record the session
                    recordStudySession();
                }
            }, 1000);
        }
        
        function pauseTimer() {
            clearInterval(timerInterval);
            isTimerRunning = false;
            document.getElementById('start-timer').disabled = false;
            document.getElementById('pause-timer').disabled = true;
        }
        
        function resetTimer() {
            clearInterval(timerInterval);
            isTimerRunning = false;
            timerSeconds = 25 * 60;
            updateTimerDisplay();
            document.getElementById('start-timer').disabled = false;
            document.getElementById('pause-timer').disabled = true;
        }
        
        function recordStudySession() {
            const subject = document.getElementById('subject-input').value.trim() || "General Study";
            const notes = document.getElementById('session-notes').value.trim();
            const selectedTaskId = document.getElementById('task-select').value;
            
            const session = {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                duration: 25, // minutes
                subject: subject,
                notes: notes,
                taskId: selectedTaskId !== "No specific task" ? parseInt(selectedTaskId) : null
            };
            
            studySessions.push(session);
            saveData();
            
            // Update study sessions count
            updateDashboardStats();
            
            // Clear the form
            document.getElementById('subject-input').value = '';
            document.getElementById('session-notes').value = '';
            
            // Update progress page if active            document.getElementById('task-select').value = 'No specific task';
        }
        
        // Task management
        function createTaskElement(task) {
            const taskItem = document.createElement('li');
            taskItem.className = 'task-item';
            taskItem.setAttribute('data-id', task.id);
            
            if (task.urgent) {
                taskItem.classList.add('task-urgent');
            }
            
            if (task.completed) {
                taskItem.classList.add('task-completed');
            }
            
            const priorityClass = `priority-${task.priority}`;
            
            taskItem.innerHTML = `
                <div>
                    <div style="display: flex; align-items: center; margin-bottom: 0.25rem;">
                        <span class="priority-indicator ${priorityClass}"></span>
                        <strong>${task.title}</strong>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--gray);">
                        ${task.subject ? `<span class="subject-tag">${task.subject}</span>` : ''}
                        ${task.dueDate ? `Due: ${formatDate(task.dueDate)}` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm ${task.completed ? 'btn-secondary' : 'btn-success'} toggle-complete" 
                            title="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="btn btn-sm btn-primary edit-task" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-task" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            taskItem.querySelector('.toggle-complete').addEventListener('click', () => toggleTaskComplete(task.id));
            taskItem.querySelector('.edit-task').addEventListener('click', () => openEditTaskModal(task.id));
            taskItem.querySelector('.delete-task').addEventListener('click', () => deleteTask(task.id));
            
            return taskItem;
        }
        
        function addTask(title, subject, dueDate, priority, urgent) {
            const task = {
                id: Date.now(),
                title,
                subject,
                dueDate,
                priority,
                urgent,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            tasks.push(task);
            saveData();
            updateTasksList();
            updateDashboardStats();
            updateCalendar();
            
            showToast('Task added successfully!');
        }
        
        function editTask(id, title, subject, dueDate, priority, urgent) {
            const taskIndex = tasks.findIndex(task => task.id === id);
            if (taskIndex !== -1) {
                tasks[taskIndex].title = title;
                tasks[taskIndex].subject = subject;
                tasks[taskIndex].dueDate = dueDate;
                tasks[taskIndex].priority = priority;
                tasks[taskIndex].urgent = urgent;
                
                saveData();
                updateTasksList();
                updateDashboardStats();
                updateCalendar();
                
                showToast('Task updated successfully!');
            }
        }
        
        function toggleTaskComplete(id) {
            const taskIndex = tasks.findIndex(task => task.id === id);
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = !tasks[taskIndex].completed;
                saveData();
                updateTasksList();
                updateDashboardStats();
                
                showToast(`Task marked as ${tasks[taskIndex].completed ? 'complete' : 'incomplete'}!`);
            }
        }
        
        function deleteTask(id) {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(task => task.id !== id);
                saveData();
                updateTasksList();
                updateDashboardStats();
                updateCalendar();
                
                showToast('Task deleted successfully!');
            }
        }
        
        function updateTasksList() {
            const tasksList = document.getElementById('tasks-list');
            const tasksMessage = document.getElementById('tasks-message');
            
            // Clear existing list
            tasksList.innerHTML = '';
            
            // Filter tasks based on current filter
            let filteredTasks = tasks;
            
            if (currentFilter === 'active') {
                filteredTasks = tasks.filter(task => !task.completed);
            } else if (currentFilter === 'completed') {
                filteredTasks = tasks.filter(task => task.completed);
            } else if (currentFilter === 'urgent') {
                filteredTasks = tasks.filter(task => task.urgent && !task.completed);
            }
            
            if (filteredTasks.length === 0) {
                let message = 'No tasks yet. Add your first task to get started!';
                
                if (currentFilter === 'active') {
                    message = 'No active tasks. Great job!';
                } else if (currentFilter === 'completed') {
                    message = 'No completed tasks yet.';
                } else if (currentFilter === 'urgent') {
                    message = 'No urgent tasks.';
                }
                
                tasksMessage.textContent = message;
                return;
            }
            
            tasksMessage.textContent = '';
            
            // Sort tasks: incomplete first, then by due date, then by creation date
            filteredTasks.sort((a, b) => {
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                
                if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate) - new Date(b.dueDate);
                }
                
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            // Add tasks to the list
            filteredTasks.forEach(task => {
                const taskItem = createTaskElement(task);
                tasksList.appendChild(taskItem);
            });
        }
        
        function updateDashboardStats() {
            // Calculate completion rate
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.completed).length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            document.getElementById('completion-rate').textContent = `${completionRate}%`;
            document.getElementById('completion-progress').style.width = `${completionRate}%`;
            document.getElementById('tasks-completed').textContent = `${completedTasks}/${totalTasks}`;
            
            // Calculate today's study time
            const today = new Date().toISOString().split('T')[0];
            const todaySessions = studySessions.filter(session => session.date === today);
            const todayStudyTime = todaySessions.reduce((total, session) => total + session.duration, 0);
            
            const hours = Math.floor(todayStudyTime / 60);
            const minutes = todayStudyTime % 60;
            document.getElementById('today-study-time').textContent = `${hours}h ${minutes}m`;
            
            // Update study sessions count
            document.getElementById('study-sessions').textContent = studySessions.length;
            
            // Update streak
            updateStudyStreak();
            
            // Update welcome message
            updateWelcomeMessage();
        }
        
        function updateStudyStreak() {
            // Simple streak calculation based on consecutive days with study sessions
            let streak = 0;
            const today = new Date();
            let currentDate = new Date(today);
            
            // Check consecutive days from today backwards
            while (true) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const hasSession = studySessions.some(session => session.date === dateStr);
                
                if (hasSession) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break;
                }
            }
            
            document.getElementById('streak-count').textContent = streak;
        }
        
        function updateWelcomeMessage() {
            const welcomeMessage = document.getElementById('welcome-message-text');
            const hour = new Date().getHours();
            const completedTasks = tasks.filter(task => task.completed).length;
            const pendingTasks = tasks.filter(task => !task.completed).length;
            
            let greeting = '';
            if (hour < 12) greeting = 'Good morning';
            else if (hour < 18) greeting = 'Good afternoon';
            else greeting = 'Good evening';
            
            if (pendingTasks === 0 && completedTasks === 0) {
                welcomeMessage.textContent = `${greeting}! Add your first task to get started.`;
            } else if (pendingTasks === 0) {
                welcomeMessage.textContent = `${greeting}! You're all caught up! Great work on staying organized.`;
            } else if (pendingTasks <= 3) {
                welcomeMessage.textContent = `${greeting}! You're doing great with ${pendingTasks} task(s) remaining.`;
            } else {
                welcomeMessage.textContent = `${greeting}! You have ${pendingTasks} task(s) to complete. Let's focus!`;
            }
        }
        
        function updateProgressPage() {
            // Update completion rate
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.completed).length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            document.getElementById('progress-completion-rate').textContent = `${completionRate}%`;
            document.getElementById('progress-tasks-count').textContent = `${completedTasks}/${totalTasks} tasks`;
            
            // Update total study time
            const totalStudyTime = studySessions.reduce((total, session) => total + session.duration, 0);
            document.getElementById('total-study-time').textContent = `${totalStudyTime}m`;
            document.getElementById('total-sessions').textContent = `${studySessions.length} sessions`;
            
            // Update weekly sessions
            const thisWeekSessions = studySessions.filter(session => {
                const sessionDate = new Date(session.date);
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                return sessionDate >= oneWeekAgo;
            });
            
            document.getElementById('week-sessions').textContent = `${thisWeekSessions.length} sessions`;
            
            // Update average session
            const avgSession = studySessions.length > 0 ? Math.round(totalStudyTime / studySessions.length) : 0;
            document.getElementById('avg-session').textContent = `${avgSession}m`;
            
            // Update weekly pattern
            updateWeeklyPattern();
            
            // Update subject stats
            updateSubjectStats();
            
            // Update recent sessions
            updateRecentSessions();
        }
        
        function updateWeeklyPattern() {
            const weeklyPattern = document.getElementById('weekly-pattern');
            weeklyPattern.innerHTML = '';
            
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const today = new Date();
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                const daySessions = studySessions.filter(session => session.date === dateStr);
                const dayStudyTime = daySessions.reduce((total, session) => total + session.duration, 0);
                
                const dayStat = document.createElement('div');
                dayStat.className = 'day-stat';
                dayStat.innerHTML = `
                    <div class="day">${days[date.getDay()]}</div>
                    <div class="time">${dayStudyTime}m</div>
                `;
                
                weeklyPattern.appendChild(dayStat);
            }
        }
        
        function updateSubjectStats() {
            const subjectStats = document.getElementById('subject-stats');
            subjectStats.innerHTML = '';
            
            // Calculate study time by subject
            const subjectTimes = {};
            studySessions.forEach(session => {
                const subject = session.subject || 'General Study';
                if (!subjectTimes[subject]) {
                    subjectTimes[subject] = 0;
                }
                subjectTimes[subject] += session.duration;
            });
            
            // Create subject stat cards
            Object.entries(subjectTimes).forEach(([subject, time]) => {
                const subjectStat = document.createElement('div');
                subjectStat.className = 'subject-stat';
                subjectStat.innerHTML = `
                    <div class="subject-name">${subject}</div>
                    <div class="subject-time">${time}m</div>
                `;
                
                subjectStats.appendChild(subjectStat);
            });
            
            // If no subjects, show message
            if (Object.keys(subjectTimes).length === 0) {
                subjectStats.innerHTML = '<p>No study sessions recorded yet.</p>';
            }
        }
        
        function updateRecentSessions() {
            const recentSessions = document.getElementById('recent-sessions');
            
            if (studySessions.length === 0) {
                recentSessions.innerHTML = '<p>No study sessions recorded yet.</p>';
                return;
            }
            
            // Sort sessions by date (newest first)
            const sortedSessions = [...studySessions].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            let sessionsHTML = '';
            sortedSessions.slice(0, 5).forEach(session => {
                sessionsHTML += `
                    <div class="task-item" style="margin-bottom: 0.5rem;">
                        <div>
                            <div style="display: flex; align-items: center; margin-bottom: 0.25rem;">
                                <strong>${session.subject}</strong>
                            </div>
                            <div style="font-size: 0.9rem; color: var(--gray);">
                                ${formatDate(session.date)} • ${session.duration} minutes
                                ${session.notes ? `• ${session.notes}` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            recentSessions.innerHTML = sessionsHTML;
        }
        
        function updateSubjectsPage() {
            const subjectsList = document.getElementById('subjects-list');
            subjectsList.innerHTML = '';
            
            if (subjects.length === 0) {
                subjectsList.innerHTML = '<p>No subjects added yet. Add your first subject above.</p>';
                return;
            }
            
            subjects.forEach(subject => {
                const subjectElement = document.createElement('div');
                subjectElement.className = 'task-item';
                subjectElement.innerHTML = `
                    <div>
                        <strong>${subject.name}</strong>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-danger delete-subject" data-id="${subject.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                
                subjectsList.appendChild(subjectElement);
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-subject').forEach(button => {
                button.addEventListener('click', function() {
                    const subjectId = parseInt(this.getAttribute('data-id'));
                    deleteSubject(subjectId);
                });
            });
            
            // Update task subject dropdown
            updateTaskSubjectDropdown();
        }
        
        function addSubject(name) {
            const subject = {
                id: Date.now(),
                name: name.trim()
            };
            
            subjects.push(subject);
            saveData();
            updateSubjectsPage();
            showToast('Subject added successfully!');
        }
        
        function deleteSubject(id) {
            if (confirm('Are you sure you want to delete this subject? This will remove it from any tasks using it.')) {
                // Remove subject from tasks
                tasks.forEach(task => {
                    if (task.subject === subjects.find(s => s.id === id)?.name) {
                        task.subject = '';
                    }
                });
                
                subjects = subjects.filter(subject => subject.id !== id);
                saveData();
                updateSubjectsPage();
                updateTasksList();
                
                showToast('Subject deleted successfully!');
            }
        }
        
        function updateTaskSubjectDropdown() {
            const taskSubjectDropdown = document.getElementById('task-subject');
            
            // Clear existing options except the first one
            while (taskSubjectDropdown.children.length > 1) {
                taskSubjectDropdown.removeChild(taskSubjectDropdown.lastChild);
            }
            
            // Add subjects to dropdown
            subjects.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.name;
                option.textContent = subject.name;
                taskSubjectDropdown.appendChild(option);
            });
        }
        
        function updateTimerTaskDropdown() {
            const timerTaskDropdown = document.getElementById('task-select');
            
            // Clear existing options except the first one
            while (timerTaskDropdown.children.length > 1) {
                timerTaskDropdown.removeChild(timerTaskDropdown.lastChild);
            }
            
            // Add active tasks to dropdown
            const activeTasks = tasks.filter(task => !task.completed);
            activeTasks.forEach(task => {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.title;
                timerTaskDropdown.appendChild(option);
            });
        }
        
        // Utility functions
        function formatDate(dateString) {
            if (!dateString) return '';
            
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        
        function showToast(message, isError = false) {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toast-message');
            
            toastMessage.textContent = message;
            
            if (isError) {
                toast.classList.add('error');
            } else {
                toast.classList.remove('error');
            }
            
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
        
        function saveData() {
            localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
            localStorage.setItem('studyPlannerSessions', JSON.stringify(studySessions));
            localStorage.setItem('studyPlannerSubjects', JSON.stringify(subjects));
        }
        
        function openAddTaskModal() {
            currentEditingTaskId = null;
            document.getElementById('modal-title').textContent = 'Add New Task';
            document.getElementById('task-title').value = '';
            document.getElementById('task-subject').value = '';
            document.getElementById('task-due-date').value = '';
            document.getElementById('task-priority').value = 'medium';
            document.getElementById('task-urgent').checked = false;
            document.getElementById('task-modal').style.display = 'flex';
        }
        
        function openEditTaskModal(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;
            
            currentEditingTaskId = taskId;
            document.getElementById('modal-title').textContent = 'Edit Task';
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-subject').value = task.subject || '';
            document.getElementById('task-due-date').value = task.dueDate || '';
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-urgent').checked = task.urgent;
            document.getElementById('task-modal').style.display = 'flex';
        }
        
        function closeTaskModal() {
            document.getElementById('task-modal').style.display = 'none';
        }
        
        function saveTaskFromModal() {
            const title = document.getElementById('task-title').value.trim();
            const subject = document.getElementById('task-subject').value;
            const dueDate = document.getElementById('task-due-date').value;
            const priority = document.getElementById('task-priority').value;
            const urgent = document.getElementById('task-urgent').checked;
            
            if (!title) {
                showToast('Please enter a task title', true);
                return;
            }
            
            if (currentEditingTaskId) {
                editTask(currentEditingTaskId, title, subject, dueDate, priority, urgent);
            } else {
                addTask(title, subject, dueDate, priority, urgent);
            }
            
            closeTaskModal();
        }
        
        function updateCalendar() {
            generateCalendar();
            updateCalendarTasks();
        }
        
        // Initialize the application
        function init() {
            // Generate calendar
            generateCalendar();
            
            // Update current date
            document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            // Update dashboard stats
            updateDashboardStats();
            
            // Update tasks list
            updateTasksList();
            
            // Update subjects page
            updateSubjectsPage();
            
            // Update timer task dropdown
            updateTimerTaskDropdown();
            
            // Set up timer presets
            document.querySelectorAll('.timer-preset').forEach(preset => {
                preset.addEventListener('click', function() {
                    document.querySelectorAll('.timer-preset').forEach(p => p.classList.remove('active'));
                    this.classList.add('active');
                    
                    const minutes = parseInt(this.getAttribute('data-minutes'));
                    timerSeconds = minutes * 60;
                    updateTimerDisplay();
                });
            });
            
            // Set up filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    currentFilter = this.getAttribute('data-filter');
                    updateTasksList();
                });
            });
            
            // Set up modal functionality
            document.getElementById('open-task-modal').addEventListener('click', openAddTaskModal);
            document.getElementById('cancel-task').addEventListener('click', closeTaskModal);
            document.getElementById('save-task').addEventListener('click', saveTaskFromModal);
            document.querySelector('.close-modal').addEventListener('click', closeTaskModal);
            
            // Close modal when clicking outside
            document.getElementById('task-modal').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeTaskModal();
                }
            });
            
            // Set up timer controls
            document.getElementById('start-timer').addEventListener('click', startTimer);
            document.getElementById('pause-timer').addEventListener('click', pauseTimer);
            document.getElementById('reset-timer').addEventListener('click', resetTimer);
            
            // Set up subject addition
            document.getElementById('add-subject').addEventListener('click', function() {
                const subjectInput = document.getElementById('new-subject');
                const subjectName = subjectInput.value.trim();
                
                if (!subjectName) {
                    showToast('Please enter a subject name', true);
                    return;
                }
                
                addSubject(subjectName);
                subjectInput.value = '';
            });
            
            // Allow Enter key to add subject
            document.getElementById('new-subject').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    document.getElementById('add-subject').click();
                }
            });
            
            // Initialize timer display
            updateTimerDisplay();
        }
        
        // Start the application when the DOM is loaded
        document.addEventListener('DOMContentLoaded', init);