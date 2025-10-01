// admin-dashboard.js - Complete Fixed Version
// Handles all profile fields editable for all users + fixes 404 errors

document.addEventListener('DOMContentLoaded', function() {
    console.log('🧠 MindSpace Admin Dashboard - Initializing...');

    // ==================== CONFIGURATION ====================
    const API_BASE_URL = 'http://localhost:5000/api/admin';
    const token = localStorage.getItem('adminToken');

    // Redirect if no token
    if (!token) {
        console.log('❌ No auth token - redirecting to login');
        window.location.href = 'adminlogin.html';
        return;
    }

    // ==================== USER DATA ====================
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    const firstName = userInfo.firstName || 'Admin';
    const lastName = userInfo.lastName || 'User';
    const fullName = userInfo.fullName || `${firstName} ${lastName}`.trim();
    const role = userInfo.role || 'admin';
    const email = userInfo.email || '';
    const mobile = userInfo.mobile || '';
    const profilePicture = userInfo.profilePicture || '';
    const initials = (firstName.charAt(0) + (lastName ? lastName.charAt(0) : '')).toUpperCase() || 'A';

    console.log('👤 User loaded:', { fullName, role, email, profilePicture: profilePicture ? 'Yes' : 'No' });

    // Role-based access control variables - FIX: Add missing declarations
    const isAdmin = role.toLowerCase() === 'admin';
    const isProfessional = ['counselor', 'therapist'].includes(role.toLowerCase());
    console.log('🔐 Access level:', { isAdmin, isProfessional });

    // Update UI with user info including profile picture
    function updateUserUI() {
        const nameEl = document.querySelector('.user-name');
        const avatarEl = document.querySelector('.user-avatar');
        const roleEl = document.querySelector('.user-role');

        if (nameEl) nameEl.textContent = fullName;
        if (roleEl) roleEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);

        // Update avatar with profile picture or initials
        updateAvatarDisplay(avatarEl, profilePicture, initials);
    }

    // Helper function to update avatar display
    function updateAvatarDisplay(avatarElement, pictureUrl, fallbackInitials) {
        if (!avatarElement) return;

        if (pictureUrl && pictureUrl.trim()) {
            // Show profile picture
            avatarElement.style.backgroundImage = `url(${pictureUrl})`;
            avatarElement.style.backgroundSize = 'cover';
            avatarElement.style.backgroundPosition = 'center';
            avatarElement.style.color = 'transparent';
            avatarElement.textContent = '';
            console.log('🖼️ Profile picture loaded for avatar');
        } else {
            // Show initials
            avatarElement.style.backgroundImage = 'none';
            avatarElement.style.color = 'white';
            avatarElement.textContent = fallbackInitials;
            console.log('🔤 Using initials for avatar:', fallbackInitials);
        }
    }

    // ==================== UTILITY FUNCTIONS ====================

    // Safe DOM access
    function $(selector) { return document.querySelector(selector); }

    function $$(selector) { return document.querySelectorAll(selector); }

    function byId(id) { return document.getElementById(id); }

    // Safe event binding
    function on(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
            return true;
        }
        return false;
    }

    // API wrapper with error handling
    async function api(endpoint, options = {}) {
        try {
            const isFormData = options.body instanceof FormData;
            const headers = {
                'Authorization': `Bearer ${token}`
            };
            if (!isFormData) {
                headers['Content-Type'] = 'application/json';
            }

            const config = {
                headers,
                ...options
            };

            console.log(`🌐 ${config.method || 'GET'} ${endpoint}`, config.body ? 'with data' : 'no data');

            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const contentType = response.headers.get('content-type');

            // Check for HTML error pages
            if (!contentType || !contentType.includes('application/json')) {
                const htmlError = await response.text();
                console.error('🚨 HTML Response (404/500):', htmlError.substring(0, 200));
                throw new Error(`Server Error: ${response.status} - Check if backend is running`);
            }

            const data = await response.json();
            console.log(`📡 ${response.status}:`, data);

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`💥 API Error [${endpoint}]:`, error);

            // User-friendly notifications
            if (error.message.includes('404')) {
                notify('Backend not found! Check if server is running on port 5000', 'error');
            } else if (error.message.includes('Network')) {
                notify('Network error - Check your connection', 'error');
            } else if (error.message.includes('401')) {
                notify('Session expired - Please login again', 'warning');
                localStorage.removeItem('adminToken');
                setTimeout(() => window.location.href = 'adminlogin.html', 2000);
            } else {
                notify(`Request failed: ${error.message}`, 'error');
            }

            throw error;
        }
    }

    // Notification system
    function notify(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Dynamic styles
        const styles = {
            info: { bg: '#2196f3', border: '#1976d2' },
            success: { bg: '#4caf50', border: '#388e3c' },
            warning: { bg: '#ff9800', border: '#f57c00' },
            error: { bg: '#f44336', border: '#d32f2f' }
        };

        const currentStyle = styles[type] || styles.info;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: currentStyle.bg,
            color: 'white',
            padding: '12px 20px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '10000',
            maxWidth: '350px',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '14px',
            borderLeft: `4px solid ${currentStyle.border}`,
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Show field errors
    function showFieldError(fieldId, message) {
        const errorEl = byId(fieldId);
        if (!errorEl) return;

        errorEl.textContent = message;
        errorEl.style.display = 'block';
        Object.assign(errorEl.style, {
            color: '#f44336',
            fontSize: '13px',
            marginTop: '5px',
            fontWeight: '500',
            background: '#ffebee',
            padding: '6px 10px',
            borderRadius: '4px',
            borderLeft: '3px solid #f44336'
        });

        // Scroll to error
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Clear form errors
    function clearErrors(formId) {
        const form = byId(formId);
        if (!form) return;

        form.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
            el.style.background = 'transparent';
            el.style.padding = '0';
            el.style.borderLeft = 'none';
        });
    }

    // Show success message
    function showSuccess(formId, message, type = 'success') {
        const successEl = byId(formId) || formId;
        let targetEl;

        if (typeof successEl === 'string') {
            targetEl = byId(successEl);
        } else {
            targetEl = successEl;
        }

        if (!targetEl) return;

        targetEl.textContent = message;
        targetEl.style.display = 'block';
        Object.assign(targetEl.style, {
            background: type === 'error' ? '#ffebee' : '#e8f5e9',
            color: type === 'error' ? '#d32f2f' : '#388e3c',
            borderLeft: type === 'error' ? '4px solid #f44336' : '4px solid #4caf50',
            padding: '12px 16px',
            borderRadius: '6px',
            marginTop: '14px',
            fontSize: '15px',
            textAlign: 'center',
            fontWeight: '500',
            opacity: '0',
            transform: 'translateY(-10px)',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        });

        requestAnimationFrame(() => {
            targetEl.style.opacity = '1';
            targetEl.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            targetEl.style.opacity = '0';
            targetEl.style.transform = 'translateY(-10px)';
            setTimeout(() => targetEl.style.display = 'none', 300);
        }, 5000);
    }

    // ==================== UI INITIALIZATION ====================

    // Update user UI
    updateUserUI();

    // Role-based menu setup
    function setupMenuAccess() {
        console.log('🔐 Setting up role-based menu access for:', role);

        if (isAdmin) {
            // Admin: Show all menu items
            $$('.admin-only').forEach(el => el.style.display = 'flex');
            $$('.all-roles').forEach(el => el.style.display = 'flex');

            // Set dashboard as default for admin
            $$('.content-section').forEach(section => section.classList.remove('active'));
            $$('.menu-item, .submenu-item').forEach(item => item.classList.remove('active'));

            const dashboardSection = byId('dashboard');
            const dashboardMenu = $('.menu-item[data-section="dashboard"]');
            if (dashboardSection) dashboardSection.classList.add('active');
            if (dashboardMenu) dashboardMenu.classList.add('active');

            console.log('✅ Admin access: All menu items visible, dashboard active');
        } else {
            // Counselor/Therapist: Hide admin-only sections
            $$('.admin-only').forEach(el => el.style.display = 'none');
            $$('.all-roles').forEach(el => el.style.display = 'flex');

            // Set appointments as default for non-admins
            $$('.content-section').forEach(section => section.classList.remove('active'));
            $$('.menu-item, .submenu-item').forEach(item => item.classList.remove('active'));

            const scheduleSection = byId('schedule');
            const appointmentsMenu = $('.menu-item[data-submenu="appointments-menu"]');
            const scheduleMenuItem = $('.submenu-item[data-section="schedule"]');

            if (scheduleSection) scheduleSection.classList.add('active');
            if (appointmentsMenu) {
                appointmentsMenu.classList.add('active');
                const submenu = byId('appointments-menu');
                if (submenu) submenu.classList.add('open');
            }
            if (scheduleMenuItem) scheduleMenuItem.classList.add('active');

            console.log('✅ Counselor/Therapist access: Limited menu items, schedule active');
        }

        // Update page title based on role
        const pageTitle = $('.page-title h1');
        if (pageTitle && !isAdmin) {
            // Will be updated when initSection runs
        }
    }
    setupMenuAccess();

    // Sidebar toggle
    on($('.toggle-sidebar'), 'click', function() {
        const sidebar = $('.sidebar');
        const overlay = $('.sidebar-overlay');
        if (sidebar) sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open');
    });

    on($('.sidebar-overlay'), 'click', function() {
        const sidebar = $('.sidebar');
        if (sidebar) sidebar.classList.remove('open');
        this.classList.remove('open');
    });

    // Submenu toggle
    $$('.menu-item.has-submenu').forEach(item => {
        on(item, 'click', function(e) {
            e.stopPropagation();
            if (this.classList.contains('disabled')) return;

            const submenuId = this.getAttribute('data-submenu');
            const submenu = byId(submenuId);
            const chevron = this.querySelector('.fa-chevron-down');

            if (submenu) submenu.classList.toggle('open');
            if (chevron) chevron.classList.toggle('rotate-180');
        });
    });

    // Navigation handler
    $$('.menu-item, .submenu-item').forEach(link => {
        on(link, 'click', function(e) {
            e.stopPropagation();
            if (this.classList.contains('disabled')) return;

            const sectionId = this.getAttribute('data-section');
            if (!sectionId) return;

            // Role-based access control
            if (!isAdmin && this.classList.contains('admin-only')) {
                notify('Access denied - Admin only section', 'warning');
                return;
            }

            // Switch sections
            $$('.content-section').forEach(section => section.classList.remove('active'));
            const targetSection = byId(sectionId);
            if (targetSection) targetSection.classList.add('active');

            // Update menu highlighting
            $$('.menu-item, .submenu-item').forEach(item => item.classList.remove('active'));
            this.classList.add('active');

            // Handle submenus
            if (!this.classList.contains('submenu-item')) {
                $$('.submenu').forEach(submenu => submenu.classList.remove('open'));
                $$('.menu-item .fa-chevron-down').forEach(chevron => chevron.classList.remove('rotate-180'));
            }

            // Close mobile sidebar
            if (window.innerWidth < 992) {
                const sidebar = $('.sidebar');
                const overlay = $('.sidebar-overlay');
                if (sidebar) sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('open');
            }

            // Initialize section content
            setTimeout(() => initSection(sectionId), 150);
        });
    });

    function initSection(sectionId) {
        console.log(`🔧 Initializing: ${sectionId}`);

        // Update page title based on section and role
        const pageTitle = $('.page-title h1');
        if (pageTitle) {
            const titleMap = {
                'dashboard': 'Dashboard Overview',
                'schedule': isAdmin ? 'Appointment Schedule' : 'My Schedule',
                'profile': 'Profile',
                'settings': 'Settings',
                'all-users': 'User Management',
                'user-roles': 'User Roles',
                'user-activity': 'User Activity',
                'requests': 'Appointment Requests',
                'history': 'Appointment History',
                'videos': 'Video Resources',
                'audio': 'Audio Resources',
                'posters': 'Poster Resources',
                'guides': 'Guide Resources',
                'analytics': 'Analytics'
            };

            if (titleMap[sectionId]) {
                setTimeout(() => {
                    const currentSection = byId(sectionId);
                    const currentPageTitle = currentSection && currentSection.querySelector('.page-title h1');
                    if (currentPageTitle) {
                        currentPageTitle.textContent = titleMap[sectionId];
                    }
                }, 50);
            }
        }

        switch (sectionId) {
            case 'profile':
                loadProfile();
                break;
            case 'schedule':
                updateDateDisplay();
                break;
            case 'all-users':
                if (isAdmin) loadUsers();
                else notify('Access denied - Admin only', 'warning');
                break;
            case 'dashboard':
                if (isAdmin) initCharts();
                else notify('Access denied - Admin only', 'warning');
                break;
            default:
                if (!isAdmin && !['schedule', 'profile', 'settings'].includes(sectionId)) {
                    notify('Access denied - Admin only', 'warning');
                    // Redirect to schedule for non-admins
                    setTimeout(() => {
                        $$('.content-section').forEach(section => section.classList.remove('active'));
                        $$('.menu-item, .submenu-item').forEach(item => item.classList.remove('active'));

                        const scheduleSection = byId('schedule');
                        const scheduleMenuItem = $('.submenu-item[data-section="schedule"]');
                        if (scheduleSection) scheduleSection.classList.add('active');
                        if (scheduleMenuItem) scheduleMenuItem.classList.add('active');

                        updateDateDisplay();
                    }, 1500);
                }
                break;
        }
    }

    // Logout handler
    on(byId('logout-btn'), 'click', function() {
        showLogoutAlert();
    });

    // Custom logout alert functions
    function showLogoutAlert() {
        const overlay = byId('logout-alert-overlay');
        if (overlay) {
            overlay.classList.add('show', 'animate');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    function hideLogoutAlert() {
        const overlay = byId('logout-alert-overlay');
        if (overlay) {
            overlay.classList.remove('show', 'animate');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    function performLogout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userInfo');
        notify('Logging out...', 'info');
        setTimeout(() => {
            window.location.href = 'adminlogin.html';
        }, 1000);
    }

    // Logout alert event handlers
    on(byId('logout-cancel-btn'), 'click', hideLogoutAlert);
    on(byId('logout-confirm-btn'), 'click', function() {
        hideLogoutAlert();
        performLogout();
    });

    // Close alert when clicking outside
    on(byId('logout-alert-overlay'), 'click', function(e) {
        if (e.target === this) {
            hideLogoutAlert();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const overlay = byId('logout-alert-overlay');
            if (overlay && overlay.classList.contains('show')) {
                hideLogoutAlert();
            }
        }
    });

    // ==================== PROFILE MANAGEMENT ====================

    async function loadProfile() {
        try {
            console.log('👤 Loading profile...');
            const data = await api('/profile');

            const profileData = data.admin || data.user;
            if (!profileData) throw new Error('No profile data received');

            console.log('✅ Profile loaded:', profileData.email);
            populateProfile(profileData);

            // Update header avatar with new profile picture if available
            const headerAvatar = document.querySelector('.user-avatar');
            const newInitials = (profileData.firstName.charAt(0) + (profileData.lastName ? profileData.lastName.charAt(0) : '')).toUpperCase();
            updateAvatarDisplay(headerAvatar, profileData.profilePicture, newInitials);

            showSuccess('profile-success-message', 'Profile loaded successfully!');

        } catch (error) {
            console.error('❌ Profile load failed:', error);
            showSuccess('profile-email-error', `Failed to load profile: ${error.message}`, 'error');
        }
    }

    function populateProfile(data) {
        if (!data) {
            console.error('No data to populate');
            return;
        }

        console.log('📝 Populating profile form...');

        // Field mapping
        const fields = {
            // Editable fields
            'profile-first-name': data.firstName || '',
            'profile-last-name': data.lastName || '',
            'profile-email': data.email || '',
            'profile-mobile': data.mobile || '',
            'profile-role': data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : 'Unknown',
            'profile-bio': data.bio || '',
            'profile-specialties': data.specialties || '',
            'profile-experience': data.experience || 0,
            'profile-qualifications': data.qualifications || '',
            'profile-languages': data.languages || ''
        };

        // Populate all fields
        Object.entries(fields).forEach(([id, value]) => {
            const el = byId(id);
            if (el) {
                // Handle number vs string
                el.value = typeof value === 'number' ? value.toString() : value;
                // Enable all fields for editing
                el.disabled = false;
                el.style.backgroundColor = '#fff';
                el.style.color = '#333';
                el.style.cursor = 'text';
            }
        });

        // Show current profile picture if available
        const profilePictureInput = byId('profile-picture');
        if (profilePictureInput && data.profilePicture) {
            // Create a preview element to show current picture
            let previewEl = byId('current-profile-picture-preview');
            if (!previewEl) {
                previewEl = document.createElement('div');
                previewEl.id = 'current-profile-picture-preview';
                previewEl.style.cssText = `
                    margin-top: 10px;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: #f9f9f9;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;
                profilePictureInput.parentNode.appendChild(previewEl);
            }

            previewEl.innerHTML = `
                <img src="${data.profilePicture}" alt="Current profile picture" 
                     style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd;">
                <span style="color: #666; font-size: 14px;">Current profile picture</span>
            `;
        }

        // Show all professional fields
        $$('.professional-field').forEach(field => {
            field.style.display = 'block';
            field.style.opacity = '1';
        });

        console.log('✅ Profile form populated with picture:', data.profilePicture ? 'Yes' : 'No');
    }

    // Profile form submission - ALL FIELDS EDITABLE
    const profileForm = byId('profile-update-form');
    if (profileForm) {
        on(profileForm, 'submit', async e => {
            e.preventDefault();
            console.log('🔄 Updating profile...');

            clearErrors('profile-update-form');
            const successEl = profileForm.querySelector('.success-message');
            if (successEl) successEl.style.display = 'none';

            const submitBtn = profileForm.querySelector('button[type="submit"]');
            const originalText = submitBtn && submitBtn.textContent || 'Update Profile';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
                submitBtn.style.opacity = '0.7';
            }

            try {
                // Collect ALL fields
                const updateData = {
                    firstName: (byId('profile-first-name') && byId('profile-first-name').value.trim()) || '',
                    lastName: (byId('profile-last-name') && byId('profile-last-name').value.trim()) || '',
                    email: (byId('profile-email') && byId('profile-email').value.trim()) || '',
                    mobile: (byId('profile-mobile') && byId('profile-mobile').value.trim()) || '',
                    bio: (byId('profile-bio') && byId('profile-bio').value.trim()) || '',
                    specialties: (byId('profile-specialties') && byId('profile-specialties').value.trim()) || '',
                    experience: parseInt((byId('profile-experience') && byId('profile-experience').value) || '0') || 0,
                    qualifications: (byId('profile-qualifications') && byId('profile-qualifications').value.trim()) || '',
                    languages: (byId('profile-languages') && byId('profile-languages').value.trim()) || ''
                };

                // Validation
                if (!updateData.firstName) {
                    showFieldError('profile-first-name-error', 'First name is required');
                    return;
                }
                if (!updateData.lastName) {
                    showFieldError('profile-last-name-error', 'Last name is required');
                    return;
                }
                if (!updateData.email || !/\S+@\S+\.\S+/.test(updateData.email)) {
                    showFieldError('profile-email-error', 'Valid email is required');
                    return;
                }
                if (!updateData.mobile || !/^\d{10}$/.test(updateData.mobile)) {
                    showFieldError('profile-mobile-error', '10-digit mobile number is required');
                    return;
                }
                if (!updateData.bio.trim()) {
                    showFieldError('profile-bio-error', 'Bio is required');
                    return;
                }
                if (updateData.experience < 0 || isNaN(updateData.experience)) {
                    showFieldError('profile-experience-error', 'Experience must be 0 or greater');
                    return;
                }

                // Prepare payload: if image selected, send FormData (multipart)
                const profilePictureInput = byId('profile-picture');
                const file = profilePictureInput && profilePictureInput.files && profilePictureInput.files[0];
                let payload;
                if (file) {
                    const fd = new FormData();
                    fd.append('profilePicture', file);
                    Object.entries(updateData).forEach(([k, v]) => fd.append(k, v));
                    payload = fd;
                } else {
                    payload = JSON.stringify(updateData);
                }

                console.log('📤 Updating with:', updateData, file ? '(with image)' : '(no image)');

                const data = await api('/profile', {
                    method: 'PUT',
                    body: payload
                });

                console.log('✅ Update response:', data);

                if (data.success) {
                    showSuccess('profile-success-message', 'Profile updated successfully!');

                    // Update localStorage with new profile data including picture
                    const updatedInfo = {...userInfo, ...updateData };
                    if (data.admin && data.admin.profilePicture) {
                        updatedInfo.profilePicture = data.admin.profilePicture;
                    }
                    localStorage.setItem('userInfo', JSON.stringify(updatedInfo));

                    // Update header avatar immediately with new picture
                    const headerAvatar = document.querySelector('.user-avatar');
                    const newInitials = (updateData.firstName.charAt(0) + (updateData.lastName ? updateData.lastName.charAt(0) : '')).toUpperCase();
                    updateAvatarDisplay(headerAvatar, data.admin && data.admin.profilePicture ? data.admin.profilePicture : null, newInitials);

                    // Refresh form
                    if (data.admin) populateProfile(data.admin);

                    notify('Profile saved!', 'success');
                } else {
                    throw new Error(data.message || 'Update failed');
                }

            } catch (error) {
                console.error('❌ Update failed:', error);
                showSuccess('profile-email-error', `Update failed: ${error.message}`, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    submitBtn.style.opacity = '1';
                }
            }
        });

        console.log('✅ Profile form ready - All fields editable!');
    }

    // ==================== USER MANAGEMENT ====================

    async function loadUsers() {
        try {
            console.log('👥 Loading users...');
            const data = await api('/users');

            if (data && data.users) {
                populateUsersTable(data.users);
                console.log(`✅ Loaded ${data.users.length} users`);
            } else {
                populateUsersTable([]);
            }
        } catch (error) {
            console.error('❌ Users load failed:', error);
            populateUsersTable([]);
        }
    }

    function populateUsersTable(users) {
        const tbody = byId('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = users.length ?
            users.map(user => `
                <tr>
                    <td>${(user.firstName || '') + ' ' + (user.lastName || '')}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td><span class="status ${user.role || 'admin'}">${user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}</span></td>
                    <td><span class="status ${user.status || 'active'}">${user.status || 'Active'}</span></td>
                    <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <button class="action-btn view-btn" data-id="${user._id || ''}">View</button>
                        <button class="action-btn edit-btn" data-id="${user._id || ''}">Edit</button>
                        <button class="action-btn delete-btn" data-id="${user._id || ''}">Delete</button>
                    </td>
                </tr>
            `).join('') :
            '<tr><td colspan="6" style="text-align:center;padding:20px;color:#666">No users found</td></tr>';

        // Bind action buttons
        $$('.action-btn').forEach(btn => {
            on(btn, 'click', function() {
                const id = this.dataset.id;
                const action = this.classList.contains('view-btn') ? 'view' :
                    this.classList.contains('edit-btn') ? 'edit' : 'delete';

                handleUserAction(id, action);
            });
        });
    }

    function handleUserAction(id, action) {
        if (!id) return notify('No user selected', 'warning');

        switch (action) {
            case 'view':
                notify(`View user ${id} - Coming soon`, 'info');
                break;
            case 'edit':
                notify(`Edit user ${id} - Coming soon`, 'info');
                break;
            case 'delete':
                if (confirm('Delete this user? This cannot be undone.')) {
                    deleteUser(id);
                }
                break;
        }
    }

    async function deleteUser(id) {
        try {
            const data = await api(`/users/${id}`, { method: 'DELETE' });
            notify('User deleted successfully!', 'success');
            loadUsers();
        } catch (error) {
            notify(`Delete failed: ${error.message}`, 'error');
        }
    }

    // User creation form
    const addUserForm = byId('add-user-form');
    const signupForm = byId('signup-form');

    if (addUserForm && signupForm) {
        on(byId('add-new-user-btn'), 'click', () => {
            addUserForm.classList.toggle('hidden');
            if (!addUserForm.classList.contains('hidden')) {
                signupForm.reset();
                clearErrors('signup-form');
            }
        });

        // Password toggles
        on(byId('toggle-signup-password'), 'click', function() {
            const input = byId('signup-password');
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
                const icon = this.querySelector('i');
                if (icon) icon.classList.toggle('fa-eye-slash');
            }
        });

        on(byId('toggle-confirm-password'), 'click', function() {
            const input = byId('confirm-password');
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
                const icon = this.querySelector('i');
                if (icon) icon.classList.toggle('fa-eye-slash');
            }
        });

        // Form submission
        on(signupForm, 'submit', async e => {
            e.preventDefault();
            clearErrors('signup-form');

            const btn = signupForm.querySelector('button[type="submit"]');
            const originalText = btn && btn.textContent;
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Creating...';
                btn.style.opacity = '0.7';
            }

            try {
                const formData = {
                    firstName: (byId('first-name') && byId('first-name').value.trim()) || '',
                    lastName: (byId('last-name') && byId('last-name').value.trim()) || '',
                    email: (byId('signup-email') && byId('signup-email').value.trim()) || '',
                    mobile: (byId('mobile') && byId('mobile').value.trim()) || '',
                    role: (byId('role') && byId('role').value) || '',
                    password: (byId('signup-password') && byId('signup-password').value) || '',
                    confirmPassword: (byId('confirm-password') && byId('confirm-password').value) || ''
                };

                // Validation
                const errors = [];
                if (!formData.firstName) errors.push(['first-name-error', 'First name required']);
                if (!formData.lastName) errors.push(['last-name-error', 'Last name required']);
                if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) errors.push(['signup-email-error', 'Valid email required']);
                if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) errors.push(['mobile-error', '10-digit mobile required']);
                if (!formData.role) errors.push(['role-error', 'Role required']);
                if (!formData.password || formData.password.length < 6) errors.push(['signup-password-error', 'Password must be 6+ characters']);
                if (formData.password !== formData.confirmPassword) errors.push(['confirm-password-error', 'Passwords must match']);

                if (errors.length) {
                    errors.forEach(([id, msg]) => showFieldError(id, msg));
                    throw new Error('Validation failed');
                }

                const data = await api('/signup', {
                    method: 'POST',
                    body: JSON.stringify({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        mobile: formData.mobile,
                        role: formData.role,
                        password: formData.password
                    })
                });

                // Enhanced success alert at bottom of form
                const successMessage = `✅ Account created successfully for ${formData.firstName} ${formData.lastName}!`;
                showSuccess('signup-success-message', successMessage);

                // Also show global notification
                notify(`New user ${formData.firstName} ${formData.lastName} created successfully!`, 'success');

                // Reset form and hide modal after 2 seconds
                setTimeout(() => {
                    signupForm.reset();
                    addUserForm.classList.add('hidden');
                    if (typeof loadUsers === 'function') loadUsers();
                }, 2000);

            } catch (error) {
                console.error('❌ User creation failed:', error);
                showSuccess('signup-email-error', error.message, 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = originalText;
                    btn.style.opacity = '1';
                }
            }
        });
    }

    // ==================== SCHEDULE MANAGEMENT ====================

    let currentDate = new Date();

    function updateDateDisplay() {
        const dateEl = byId('current-date');
        if (!dateEl) return;

        dateEl.textContent = currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const scheduleSection = byId('schedule');
        if (scheduleSection && scheduleSection.classList.contains('active')) {
            loadSchedule();
        }
    }

    async function loadSchedule() {
        try {
            const data = await api(`/schedule?date=${currentDate.toISOString().split('T')[0]}`);
            populateSchedule(data.appointments || []);
        } catch (error) {
            console.error('Schedule load failed:', error);
            populateSchedule([]);
        }
    }

    function populateSchedule(appointments) {
        const container = byId('schedule-container');
        if (!container) return;

        const timeSlots = [
            { time: '9:00 AM - 10:00 AM', hour: 9 },
            { time: '10:00 AM - 11:00 AM', hour: 10 },
            { time: '11:00 AM - 12:00 PM', hour: 11 },
            { time: '12:00 PM - 1:00 PM', hour: 12 },
            { time: '1:00 PM - 2:00 PM', hour: 13 },
            { time: '2:00 PM - 3:00 PM', hour: 14 },
            { time: '3:00 PM - 4:00 PM', hour: 15 },
            { time: '4:00 PM - 5:00 PM', hour: 16 },
            { time: '5:00 PM - 6:00 PM', hour: 17 },
            { time: '6:00 PM - 7:00 PM', hour: 18 }
        ];

        container.innerHTML = timeSlots.map((slot, i) => {
            const isLunch = slot.hour === 12;
            const appointment = appointments.find(apt => {
                if (!apt || !apt.dateTime) return false;
                const aptDate = new Date(apt.dateTime);
                return aptDate.getHours() === slot.hour &&
                    aptDate.getDate() === currentDate.getDate() &&
                    aptDate.getMonth() === currentDate.getMonth() &&
                    aptDate.getFullYear() === currentDate.getFullYear();
            });

            const status = isLunch ? 'unavailable' :
                appointment ? 'booked' : 'available';

            const statusText = isLunch ? 'Lunch Break' :
                appointment ? 'Booked' : 'Available';

            const patient = (appointment && appointment.patientName) ||
                (appointment && appointment.user ? `${appointment.user.firstName} ${appointment.user.lastName}`.trim() : null);

            const notes = isLunch ? 'Lunch break time' :
                (appointment && appointment.notes) || 'Click to book this slot';

            const actions = isLunch ? '<button class="btn btn-secondary" disabled>Not Available</button>' :
                appointment ? `
                                <button class="btn btn-secondary schedule-action" data-action="view">View</button>
                                <button class="btn btn-primary schedule-action" data-action="reschedule">Reschedule</button>
                            ` :
                '<button class="btn btn-primary schedule-action" data-action="book">Book Appointment</button>';

            return `
                <div class="schedule-card" style="opacity: 0; transform: translateY(20px); transition: all 0.3s ease ${i * 0.05}s">
                    <div class="slot-header">
                        <div class="slot-time">${slot.time}</div>
                        <span class="slot-status slot-${status}">${statusText}</span>
                    </div>
                    <div class="slot-details">
                        <div class="slot-patient">${isLunch ? 'Not available' : (patient || 'No appointment')}</div>
                        <div class="slot-notes">${notes}</div>
                    </div>
                    <div class="slot-actions">${actions}</div>
                </div>
            `;
        }).join('');

        // Animate cards in
        $$('.schedule-card').forEach((card, i) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, i * 50);
        });

        // Bind actions
        $$('.schedule-action').forEach(btn => {
            on(btn, 'click', function() {
                const action = this.dataset.action;
                const card = this.closest('.schedule-card');
                const timeEl = card && card.querySelector('.slot-time');
                const time = timeEl && timeEl.textContent || 'Unknown';

                switch (action) {
                    case 'book':
                        if (confirm(`Book appointment for ${time}?`)) {
                            notify(`Booking ${time} - Coming soon!`, 'info');
                        }
                        break;
                    case 'view':
                        notify(`Viewing ${time} - Coming soon!`, 'info');
                        break;
                    case 'reschedule':
                        if (confirm(`Reschedule ${time}?`)) {
                            notify(`Rescheduling ${time} - Coming soon!`, 'info');
                        }
                        break;
                }
            });
        });
    }

    // Date navigation
    on(byId('prev-date'), 'click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
    });

    on(byId('next-date'), 'click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
    });

    on(byId('today-date'), 'click', () => {
        currentDate = new Date();
        updateDateDisplay();
    });

    // ==================== CHARTS ====================
    function initCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('📊 Chart.js not loaded');
            return;
        }

        // Registration trend
        const regCtx = byId('registration-trend-chart');
        if (regCtx) {
            new Chart(regCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'New Users',
                        data: [65, 59, 80, 81, 56, 55, 40],
                        borderColor: '#4073c0',
                        backgroundColor: 'rgba(64, 115, 192, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        // Appointment status
        const apptCtx = byId('appointment-status-chart');
        if (apptCtx) {
            new Chart(apptCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Confirmed', 'Pending', 'Cancelled'],
                    datasets: [{
                        data: [65, 25, 10],
                        backgroundColor: ['#4caf50', '#ff9800', '#f44336']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        console.log('📊 Charts initialized');
    }

    // ==================== INITIALIZATION ====================
    function initCurrentSection() {
        const activeSection = $('.content-section.active');
        if (activeSection) {
            setTimeout(() => initSection(activeSection.id), 200);
        }
    }

    // Start everything
    // setupMenuAccess(); // Already called earlier

    // Initialize the correct default section
    setTimeout(() => {
        const activeSection = $('.content-section.active');
        if (activeSection) {
            initSection(activeSection.id);
        } else if (!isAdmin) {
            // Fallback for non-admins
            initSection('schedule');
        } else {
            // Fallback for admins
            initSection('dashboard');
        }
    }, 300);

    updateDateDisplay();

    console.log('🚀 Dashboard fully loaded!');
    console.log(`🔑 Role: ${role} | Admin: ${isAdmin} | Professional: ${isProfessional}`);

    const welcomeMessage = isAdmin ?
        `Welcome to SoulSquad Admin Dashboard, ${firstName}!` :
        `Welcome to SoulSquad, ${firstName}! Your appointments are ready.`;

    notify(welcomeMessage, 'success');
});