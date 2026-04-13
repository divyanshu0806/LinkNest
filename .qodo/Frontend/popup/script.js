// =========================================
// 1. STATE & PRESETS
// =========================================
const hubState = {
    title: '',
    username: '',
    description: '',
    profileImage: null,
    theme: 'custom',
    accentColor: '#0FFF50',
    backgroundColor: 'black',
    font: 'inter',
    links: []
};

const themePresets = {
    custom: { bg: '#000', text: '#fff', cardBg: '#1f1f22', cardBorder: '1px solid #333', cardText: '#fff', font: 'inter' },
    cleanWhite: { bg: '#fdfbf7', text: '#000', cardBg: '#fff', cardBorder: '2px solid #000', cardText: '#000', font: 'roboto' },
    darkTextured: { bg: 'retro-grid', text: '#fff', cardBg: '#22c55e', cardBorder: 'none', cardText: '#000', font: 'montserrat' },
    pastelGradient: { bg: 'linear-gradient(180deg, #fffbeb 0%, #dcfce7 50%, #dbeafe 100%)', text: '#b45309', cardBg: 'transparent', cardBorder: '2px solid #b45309', cardText: '#b45309', font: 'bellota' },
    mintGreen: { bg: '#c5eadd', text: '#000', cardBg: '#9abfad', cardBorder: 'none', cardText: '#000', font: 'pt-serif' },
    mocha: { bg: '#ccb7a8', text: '#000', cardBg: '#e6dcd3', cardBorder: 'none', cardText: '#000', font: 'pt-serif' },
    deepBlue: { bg: '#0e7490', text: '#fff', cardBg: '#a5f3fc', cardBorder: 'none', cardText: '#000', font: 'courier' },
    cyber: { bg: '#000', text: '#fff', cardBg: '#000', cardBorder: '1px solid #ec4899', cardText: '#22d3ee', font: 'oswald' }
};

// =========================================
// 2. MODAL FUNCTIONS
// =========================================
window.openHubModal = function() {
    const modal = document.getElementById('createHubModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        initializeModalEvents();
    } else {
        console.error("Modal element not found!");
    }
};

function closeHubModal() {
    const modal = document.getElementById('createHubModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        if (window.parent && window.parent !== window) {
            window.parent.postMessage('closeModal', '*');
        }
        resetForm();
    }
}

function resetForm() {
    hubState.title = '';
    hubState.username = '';
    hubState.description = '';
    hubState.profileImage = null;
    hubState.theme = 'custom';
    hubState.accentColor = '#0FFF50';
    hubState.backgroundColor = 'black';
    hubState.font = 'inter';
    hubState.links = [];
    
    const form = document.getElementById('hubForm');
    if(form) form.reset();
    
    const linksContainer = document.getElementById('linksContainer');
    if(linksContainer) linksContainer.innerHTML = '';
    
    const preview = document.getElementById('profilePreview');
    const placeholder = document.getElementById('profilePlaceholder');
    if(preview) { preview.src = ''; preview.classList.add('hidden'); }
    if(placeholder) placeholder.classList.remove('hidden');
    
    const titleError = document.getElementById('titleError');
    const slugError = document.getElementById('slugError');
    const hubTitle = document.getElementById('hubTitle');
    const urlSlug = document.getElementById('urlSlug');
    
    if (titleError) titleError.classList.add('hidden');
    if (slugError) slugError.classList.add('hidden');
    if (hubTitle) hubTitle.classList.remove('border-red-500');
    if (urlSlug) {
        urlSlug.classList.remove('border-red-500');
        delete urlSlug.dataset.manuallyEdited;
    }

    // Reset theme cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.theme === 'custom') {
            card.classList.add('active');
        }
    });

    // Show custom color section
    toggleCustomColorSection(true);

    updateCharCounters();
    updatePreview();
}

function initializeModalEvents() {
    if(window.modalInitialized) return;
    window.modalInitialized = true;

    document.getElementById('closeModalBtn')?.addEventListener('click', closeHubModal);
    document.getElementById('cancelBtn')?.addEventListener('click', closeHubModal);
    document.getElementById('modalBackdrop')?.addEventListener('click', closeHubModal);
    
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('createHubModal');
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeHubModal();
        }
    });

    document.getElementById('profileInput')?.addEventListener('change', handleProfileUpload);
    
    const titleInput = document.getElementById('hubTitle');
    if(titleInput) {
        titleInput.addEventListener('input', (e) => {
            handleTitleInput(e);
            updateCharCounters();
            
            const urlSlug = document.getElementById('urlSlug');
            if (urlSlug && !urlSlug.dataset.manuallyEdited) {
                const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                urlSlug.value = slug;
                hubState.username = slug;
                const slugPreview = document.getElementById('slugPreview');
                if (slugPreview) slugPreview.textContent = slug || 'yourhandle';
                updatePreview();
            }
        });
    }

    const slugInput = document.getElementById('urlSlug');
    if(slugInput) {
        slugInput.addEventListener('input', (e) => {
            e.target.dataset.manuallyEdited = 'true';
            const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
            e.target.value = slug;
            hubState.username = slug;
            const slugPreview = document.getElementById('slugPreview');
            if (slugPreview) slugPreview.textContent = slug || 'yourhandle';
            updatePreview();
        });
    }

    const descInput = document.getElementById('hubDescription');
    if(descInput) {
        descInput.addEventListener('input', (e) => {
            hubState.description = e.target.value;
            updateCharCounters();
        });
    }
    
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', (e) => handleThemeSelect(e, card.dataset.theme));
    });
    
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', (e) => handleColorSelect(e, swatch.dataset.color));
    });
    
    document.getElementById('customColor')?.addEventListener('input', handleCustomColorInput);
    document.getElementById('colorPicker')?.addEventListener('input', handleColorPickerInput);
    document.getElementById('bgSelect')?.addEventListener('change', handleBackgroundChange);
    document.getElementById('fontSelect')?.addEventListener('change', handleFontChange);
    
    document.getElementById('addLinkBtn')?.addEventListener('click', addLink);
    
    const createBtn = document.getElementById('createBtn');
    if(createBtn) {
        createBtn.addEventListener('click', handleCreateHub);
    }
}

function updateCharCounters() {
    const hubTitle = document.getElementById('hubTitle');
    if (hubTitle) {
        const titleCount = hubTitle.value.length;
        const titleCounter = document.getElementById('titleCounter');
        if (titleCounter) {
            titleCounter.textContent = `${titleCount} / 60`;
            if (titleCount > 50) {
                titleCounter.classList.add('text-orange-500');
                titleCounter.classList.remove('text-gray-500');
            } else {
                titleCounter.classList.remove('text-orange-500');
                titleCounter.classList.add('text-gray-500');
            }
        }
    }
}

// =========================================
// 3. INPUT HANDLERS
// =========================================
function handleProfileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
             alert('File size must be less than 5MB');
             return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            hubState.profileImage = event.target.result;
            const preview = document.getElementById('profilePreview');
            const placeholder = document.getElementById('profilePlaceholder');
            if(preview) { preview.src = event.target.result; preview.classList.remove('hidden'); }
            if(placeholder) placeholder.classList.add('hidden');
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

function handleTitleInput(e) {
    hubState.title = e.target.value;
    updatePreview();
}

// Toggle custom color section visibility
function toggleCustomColorSection(show) {
    const customSection = document.getElementById('customColorSection');
    if (customSection) {
        if (show) {
            customSection.style.display = 'block';
        } else {
            customSection.style.display = 'none';
        }
    }
}

function handleThemeSelect(event, theme) {
    hubState.theme = theme;

    // Update active state
    document.querySelectorAll('.theme-card').forEach(card => card.classList.remove('active'));
    event.target.closest('.theme-card').classList.add('active');

    // Show/hide custom color section based on theme
    if (theme === 'custom') {
        toggleCustomColorSection(true);
        // Keep current custom settings
    } else {
        toggleCustomColorSection(false);
        // Apply preset theme settings
        if (themePresets[theme]) {
            hubState.backgroundColor = themePresets[theme].bg;
            hubState.font = themePresets[theme].font;
            
            // Update font selector to match
            const fontSelect = document.getElementById('fontSelect');
            if (fontSelect) {
                fontSelect.value = themePresets[theme].font;
            }
        }
    }

    updatePreview();
}

function handleColorSelect(event, color) {
    hubState.accentColor = color;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    event.target.classList.add('active');
    handleColorUpdate(color);
}

function handleCustomColorInput(e) { handleColorUpdate(e.target.value); }
function handleColorPickerInput(e) { handleColorUpdate(e.target.value); }

function handleColorUpdate(val) {
    let value = val.toUpperCase();
    if (!value.startsWith('#')) value = '#' + value;
    
    if (/^#[0-9A-F]{0,6}$/.test(value)) {
        hubState.accentColor = value;
        
        const customColor = document.getElementById('customColor');
        const colorPicker = document.getElementById('colorPicker');
        const colorPreview = document.getElementById('colorPreview');

        if(customColor) customColor.value = value;
        
        if (value.length === 7) {
             if(colorPicker) colorPicker.value = value;
             if(colorPreview) colorPreview.style.background = value;
             const matchingSwatch = document.querySelector(`.color-swatch[data-color="${value}"]`);
             if(matchingSwatch) {
                 document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                 matchingSwatch.classList.add('active');
             } else {
                 document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
             }
        }
        updatePreview();
    }
}

function handleBackgroundChange(e) { 
    hubState.backgroundColor = e.target.value; 
    updatePreview(); 
}

function handleFontChange(e) { 
    hubState.font = e.target.value; 
    updatePreview(); 
}

// =========================================
// 4. ICON & LINK LOGIC
// =========================================
function getIconClass(iconName) {
    const map = {
        'fa-youtube': 'brand-youtube',
        'fa-instagram': 'brand-instagram',
        'fa-twitter': 'brand-twitter',
        'fa-linkedin': 'brand-linkedin',
        'fa-github': 'brand-github',
        'fa-spotify': 'brand-spotify',
        'fa-facebook': 'brand-facebook',
        'fa-tiktok': 'brand-tiktok'
    };
    return map[iconName] || 'text-gray-400';
}

function getFaPrefix(iconName) {
    const brands = ['fa-instagram', 'fa-twitter', 'fa-facebook', 'fa-linkedin', 'fa-youtube', 'fa-github', 'fa-tiktok', 'fa-spotify'];
    return brands.includes(iconName) ? 'fab' : 'fa-solid';
}

let linkCounter = 0;
function addLink() {
    linkCounter++;
    const linkId = `link-${linkCounter}`;
    const linkData = { id: linkId, title: 'New Link', url: '', icon: 'fa-link', rules: [] };
    hubState.links.push(linkData);
    
    const linkHTML = `
        <div class="link-item" data-link-id="${linkId}">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-grip-vertical drag-handle text-gray-600 cursor-move"></i>
                    <span class="text-sm font-medium text-white">Link ${linkCounter}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" class="toggle-link-btn text-gray-400 hover:text-white" onclick="toggleLinkCollapse('${linkId}')"><i class="fa-solid fa-chevron-up"></i></button>
                    <button type="button" class="text-red-400 hover:text-red-500" onclick="removeLink('${linkId}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="link-content space-y-3">
                <div><label class="block text-xs text-gray-400 mb-1">Title</label><input type="text" placeholder="Link Title" class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-green-500" onchange="updateLinkData('${linkId}', 'title', this.value)"></div>
                <div><label class="block text-xs text-gray-400 mb-1">URL</label><input type="url" placeholder="https://..." class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-green-500" onchange="updateLinkData('${linkId}', 'url', this.value)"></div>
                <div>
                    <label class="block text-xs text-gray-400 mb-1">Icon</label>
                    <select class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" onchange="updateLinkData('${linkId}', 'icon', this.value)">
                        <option value="fa-link">Link</option>
                        <option value="fa-globe">Globe</option>
                        <option value="fa-envelope">Email</option>
                        <option value="fa-phone">Phone</option>
                        <option value="fa-instagram">Instagram</option>
                        <option value="fa-twitter">Twitter</option>
                        <option value="fa-facebook">Facebook</option>
                        <option value="fa-linkedin">LinkedIn</option>
                        <option value="fa-youtube">YouTube</option>
                        <option value="fa-github">GitHub</option>
                        <option value="fa-tiktok">TikTok</option>
                        <option value="fa-spotify">Spotify</option>
                    </select>
                </div>
                
                <div class="mt-3 ml-2 border-t border-zinc-800 pt-3 text-gray-500">
                    <h5>Add Rules in Edit Hub Settings</h5>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('linksContainer').insertAdjacentHTML('beforeend', linkHTML);
    updateLinkCount();
    updatePreview();
}

window.toggleLinkCollapse = function(id) { 
    document.querySelector(`[data-link-id="${id}"]`).classList.toggle('collapsed'); 
};

window.removeLink = function(id) {
    hubState.links = hubState.links.filter(l => l.id !== id);
    const el = document.querySelector(`[data-link-id="${id}"]`);
    if(el) el.remove();
    updateLinkCount();
    updatePreview();
};

window.updateLinkData = function(id, field, val) {
    const link = hubState.links.find(l => l.id === id);
    if(link) { link[field] = val; updatePreview(); }
};

function updateLinkCount() {
    const countEl = document.getElementById('linkCount');
    if(countEl) countEl.textContent = `${hubState.links.length} links`;
}

// =========================================
// 5. PREVIEW LOGIC
// =========================================
function updatePreview() {
    const preview = document.getElementById('previewContent');
    if(!preview) return;

    let theme = themePresets[hubState.theme] || themePresets.custom;
    
    // Background Logic - FIXED FOR CUSTOM THEME
    if (hubState.theme === 'custom') {
        // Use the backgroundColor from state for custom theme
        switch(hubState.backgroundColor) {
            case 'black': 
                preview.style.background = '#000'; 
                preview.style.backgroundImage = '';
                break;
            case 'dark-grey': 
                preview.style.background = '#1e293b'; 
                preview.style.backgroundImage = '';
                break;
            case 'deep-blue': 
                preview.style.background = '#0f172a'; 
                preview.style.backgroundImage = '';
                break;
            case 'gradient': 
                preview.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'; 
                preview.style.backgroundImage = '';
                break;
            default: 
                preview.style.background = '#000';
                preview.style.backgroundImage = '';
        }
    } else {
        // Use preset theme background
        if (theme.bg === 'retro-grid') {
            preview.style.backgroundColor = '#1a1a1a';
            preview.style.backgroundImage = `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`;
            preview.style.backgroundSize = '20px 20px';
        } else {
            preview.style.background = theme.bg;
            preview.style.backgroundImage = theme.bg.includes('gradient') ? theme.bg : '';
            preview.style.backgroundSize = '';
        }
    }
    
    preview.className = `w-full h-full overflow-y-auto custom-scrollbar font-${hubState.font}`;
    
    // Text colors based on theme
    const titleColor = hubState.theme === 'custom' ? '#fff' : theme.text;
    const previewTitle = document.getElementById('previewTitle');
    if(previewTitle) {
        previewTitle.textContent = hubState.title || 'Your Name';
        previewTitle.style.color = titleColor;
    }
    
    const userEl = document.getElementById('previewUsername');
    if(userEl) {
        userEl.textContent = `@${hubState.username || 'yourhandle'}`;
        userEl.style.color = titleColor;
        userEl.style.opacity = '0.8';
    }
    
    // Profile image
    const pProfile = document.getElementById('previewProfile');
    if(pProfile) {
        if (hubState.profileImage) {
            pProfile.innerHTML = `<img src="${hubState.profileImage}" class="w-full h-full object-cover" />`;
        } else {
            pProfile.innerHTML = `<i class="fa-solid fa-user text-3xl" style="color: ${titleColor}"></i>`;
        }
    }

    // Links preview
    const previewLinks = document.getElementById('previewLinks');
    if(previewLinks) {
        // For custom theme, use custom accent color
        let cardBg = hubState.theme === 'custom' ? hubState.accentColor : theme.cardBg;
        let cardBorder = hubState.theme === 'custom' ? 'none' : theme.cardBorder;
        let cardText = hubState.theme === 'custom' ? '#000' : theme.cardText;
        
        if (hubState.links.length === 0) {
            previewLinks.innerHTML = `
                <div class="link-card" style="background: ${cardBg}; border: ${cardBorder};">
                    <div class="link-info">
                        <div class="link-icon-box ${getIconClass('fa-link')}">
                            <i class="fa-solid fa-link" style="color: ${cardText}"></i>
                        </div>
                        <span class="link-text" style="color: ${cardText}">Example Link</span>
                    </div>
                    <div class="link-actions" style="opacity: 1">
                        <div class="action-btn" title="QR Code" style="color: ${cardText}"><i class="fa-solid fa-qrcode"></i></div>
                        <div class="action-btn" title="Open" style="color: ${cardText}"><i class="fa-solid fa-arrow-up-right-from-square"></i></div>
                    </div>
                </div>`;
        } else {
            previewLinks.innerHTML = hubState.links.map(link => {
                const prefix = getFaPrefix(link.icon);
                const brandClass = getIconClass(link.icon);
                const iconColor = hubState.theme === 'custom' ? cardText : (brandClass.startsWith('brand-') ? '' : cardText);
                return `
                    <div class="link-card" style="background: ${cardBg}; border: ${cardBorder};">
                        <div class="link-info">
                            <div class="link-icon-box ${brandClass}">
                                <i class="${prefix} ${link.icon}" style="color: ${iconColor}"></i>
                            </div>
                            <span class="link-text" style="color: ${cardText}">${link.title || 'New Link'}</span>
                        </div>
                        <div class="link-actions">
                            <div class="action-btn" title="QR Code" style="color: ${cardText}"><i class="fa-solid fa-qrcode"></i></div>
                            <div class="action-btn" title="Open" style="color: ${cardText}"><i class="fa-solid fa-arrow-up-right-from-square"></i></div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// =========================================
// 6. CREATE HUB
// =========================================
function handleCreateHub() {
    const hubTitle = document.getElementById('hubTitle');
    const titleError = document.getElementById('titleError');
    const urlSlug = document.getElementById('urlSlug');
    const slugError = document.getElementById('slugError');
    
    let isValid = true;

    if (!hubState.title.trim()) {
        if(hubTitle) hubTitle.classList.add('border-red-500');
        if (titleError) {
            titleError.textContent = 'Title is required';
            titleError.classList.remove('hidden');
        }
        isValid = false;
    } else {
        if(hubTitle) hubTitle.classList.remove('border-red-500');
        if (titleError) titleError.classList.add('hidden');
    }

    if (!hubState.username.trim()) {
        if(urlSlug) urlSlug.classList.add('border-red-500');
        if (slugError) {
            slugError.textContent = 'URL slug is required';
            slugError.classList.remove('hidden');
        }
        isValid = false;
    } else {
        if(urlSlug) urlSlug.classList.remove('border-red-500');
        if (slugError) slugError.classList.add('hidden');
    }

    if (!isValid) return;

    let userEmail = localStorage.getItem("user_email");
    if (!userEmail) {
        console.warn("No user email found in localStorage. Using fallback for testing.");
        userEmail = "test-user@example.com"; 
    }

    const formData = {
        user_email: userEmail,
        title: hubState.title,
        description: hubState.description,
        slug: hubState.username,
        accentColor: hubState.accentColor,
        background: hubState.backgroundColor,
        theme: hubState.theme,
        font: hubState.font,
        textColor: hubState.theme === "custom" ? "#ffffff" : "#000000",
        links: hubState.links
            .filter(link => link.title || link.url)
            .map(link => ({
                ...link,
                rules: link.rules || []
            }))
    };

    console.log("Sending Data:", formData); 

    fetch("http://127.0.0.1:8000/api/hubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to create hub");
        return data;
    })
    .then(data => {
        console.log("Success:", data); 
        alert("Hub created successfully!");
        closeHubModal();
    })
    .catch(err => {
        console.error("Fetch Error:", err); 
        alert("Error creating hub: " + (err.message || "Server not responding"));
    });
}