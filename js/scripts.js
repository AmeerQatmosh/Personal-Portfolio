// ==========================
// Global Constants
// ==========================
const DEFAULT_CARD_IMAGE = "./images/card_placeholder_bg.webp";
const DEFAULT_SPOTLIGHT_IMAGE = "./images/spotlight_placeholder_bg.webp";
const MAX_MESSAGE_LENGTH = 300;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ILLEGAL_CHAR_EMAIL = /[^a-zA-Z0-9@._-]/;
const ILLEGAL_CHAR_MESSAGE = /[^a-zA-Z0-9@._\-\s]/;

let projectsData = [];

// Cached DOM
const aboutMeContainer = document.getElementById('aboutMe');
const projectList = document.getElementById('projectList');
const projectSpotlight = document.getElementById('projectSpotlight');
const spotlightTitles = document.getElementById('spotlightTitles');
const arrowLeft = document.querySelector('.arrow-left');
const arrowRight = document.querySelector('.arrow-right');
const form = document.getElementById('formSection');
const emailInput = document.getElementById('contactEmail');
const messageInput = document.getElementById('contactMessage');
const emailErrorDiv = document.getElementById('emailError');
const messageErrorDiv = document.getElementById('messageError');
const charactersLeftDiv = document.getElementById('charactersLeft');
const projectSection = document.getElementById('projectSection');

// ==========================
// Loading Elements
// ==========================
const loadingAbout = document.createElement('div');
loadingAbout.textContent = "Loading About Me...";
loadingAbout.id = "loadingAbout";
aboutMeContainer.appendChild(loadingAbout);

const loadingProjects = document.createElement('div');
loadingProjects.textContent = "Loading Projects...";
loadingProjects.id = "loadingProjects";
projectList.appendChild(loadingProjects);

// ==========================
// Helpers
// ==========================
const isDesktop = () => window.matchMedia('(min-width:1024px)').matches;


// ==========================
// Section 1: About Me
// ==========================
async function loadAboutMe() {
    try {
        const res = await fetch('./data/aboutMeData.json');
        if (!res.ok) throw new Error("Failed to fetch aboutMeData.json");
        const data = await res.json();

        aboutMeContainer.innerHTML = '';
        const frag = document.createDocumentFragment();

        const p = document.createElement('p');
        p.textContent = data.aboutMe || "About me info missing.";
        frag.appendChild(p);

        const headshotDiv = document.createElement('div');
        headshotDiv.className = "headshotContainer";
        headshotDiv.style.padding = "0.5rem";

        const img = document.createElement('img');
        img.src = data.headshot || "./images/headshot.webp";
        img.alt = "Headshot";
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.objectFit = "cover";

        headshotDiv.appendChild(img);
        frag.appendChild(headshotDiv);

        aboutMeContainer.appendChild(frag);
    } catch (err) {
        console.error(err);
        aboutMeContainer.textContent = "Failed to load About Me section.";
    }
}

// ==========================
// Section 2: Projects
// ==========================
async function loadProjects() {
    try {
        const res = await fetch('./data/projectsData.json');
        if (!res.ok) throw new Error("Failed to fetch projectsData.json");
        projectsData = await res.json();

        rebuildProjectList();
        setSpotlight(projectsData[0] || null);
        setupProjectCardListeners();
        setupProjectArrowScroll();

        // ensure layout updates correctly
        requestAnimationFrame(() => adjustProjectListLayout());
    } catch (err) {
        console.error(err);
        projectList.textContent = "Failed to load Projects.";
    }
}

function rebuildProjectList() {
    projectList.innerHTML = '';
    const frag = document.createDocumentFragment();

    projectsData.forEach(project => {
        const card = document.createElement('div');
        card.className = 'projectCard';
        card.id = project.project_id;
        card.style.backgroundImage = `url(${project.card_image || DEFAULT_CARD_IMAGE})`;

        const h4 = document.createElement('h4');
        h4.textContent = project.project_name || "Untitled Project";

        const p = document.createElement('p');
        p.textContent = project.short_description || "No description available.";

        card.append(h4, p);
        frag.appendChild(card);
    });

    projectList.appendChild(frag);
    adjustProjectListLayout();
}


// Adjust layout of projectList & cards
function adjustProjectListLayout() {
    
    if (!projectList) return;

    // Clear any previous inline styles
    projectList.style.display = '';
    projectList.style.flexDirection = '';
    projectList.style.height = '';
    projectList.style.overflowX = '';
    projectList.style.overflowY = '';
    projectList.style.marginTop = '';

    document.querySelectorAll('.projectCard').forEach(card => {
        card.style.width = '';
        card.style.height = '';
        card.style.flex = '';
    });

    // Dynamically add spacing below <h2> to prevent overlap
    const projectsHeading = document.querySelector('#projectsContainer > h2');
    if (projectsHeading && projectList.parentElement) {
        const headingHeight = projectsHeading.getBoundingClientRect().height;
        const buffer = 12; // optional extra spacing
        projectList.parentElement.style.marginTop = `${headingHeight + buffer}px`;
    }

    if (isDesktop()) {
        // Desktop: vertical column, 3 cards visible
        projectList.style.display = 'flex';
        projectList.style.flexDirection = 'column';
        projectList.style.gap = '12px';
        projectList.style.overflowY = 'auto';
        projectList.style.overflowX = 'hidden';

        const spotlightRect = projectSpotlight.getBoundingClientRect();
        const desiredHeight = spotlightRect.height > 0 ? spotlightRect.height : (window.innerHeight * 0.5);
        projectList.style.height = `${Math.round(desiredHeight)}px`;

        const gapPx = 12;
        const visibleCount = 3;
        const totalGaps = (visibleCount - 1) * gapPx;
        const perCardHeight = Math.floor((desiredHeight - totalGaps) / visibleCount);

        document.querySelectorAll('.projectCard').forEach(card => {
            card.style.height = `${perCardHeight}px`;
            card.style.width = '100%';
            card.style.flex = '0 0 auto';
        });
    } else {
        // Mobile/tablet: horizontal scroll
        projectList.style.display = 'flex';
        projectList.style.flexDirection = 'row';
        projectList.style.gap = '12px';
        projectList.style.overflowX = 'auto';
        projectList.style.overflowY = 'hidden';
        projectList.style.height = '';

        document.querySelectorAll('.projectCard').forEach(card => {
            card.style.width = '';
            card.style.height = '';
            card.style.flex = '0 0 auto';
        });
    }
}


function setSpotlight(project) {
    if (!project) {
        spotlightTitles.innerHTML = '<h3>No project</h3><p>No details available.</p>';
        projectSpotlight.style.backgroundImage = `url(${DEFAULT_SPOTLIGHT_IMAGE})`;
        return;
    }

    const bg = project.spotlight_image || DEFAULT_SPOTLIGHT_IMAGE;
    requestAnimationFrame(() => {
        projectSpotlight.style.backgroundImage = `url(${bg})`;
    });

    spotlightTitles.innerHTML = '';
    const h3 = document.createElement('h3');
    h3.textContent = project.project_name || 'Untitled Project';
    const p = document.createElement('p');
    p.textContent = project.long_description || 'Details coming soon.';
    const a = document.createElement('a');
    a.href = project.url || '#';
    a.textContent = 'Click here to see more...';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    spotlightTitles.append(h3, p, a);
}

function setupProjectCardListeners() {
    projectList.removeEventListener('click', onProjectListClick);
    projectList.addEventListener('click', onProjectListClick);
}

function onProjectListClick(e) {
    const card = e.target.closest('.projectCard');
    if (!card) return;
    const project = projectsData.find(p => p.project_id === card.id);
    if (!project) return;
    setSpotlight(project);
    updateActiveCard(card);
}

function updateActiveCard(activeCard) {
    document.querySelectorAll('.projectCard').forEach(c => c.classList.remove('active'));
    activeCard.classList.add('active');
}

// ==========================
// Continuous Smooth Scroll Arrows
// ==========================
let scrollInterval = null;

function setupProjectArrowScroll() {
    const scrollStep = 40; // faster scroll
    const scrollDelay = 10;

    function startScroll(dir) {
        stopScroll();
        scrollInterval = setInterval(() => {
            const options = isDesktop()
                ? { top: dir * scrollStep, behavior: 'smooth' }
                : { left: dir * scrollStep, behavior: 'smooth' };
            projectList.scrollBy(options);
        }, scrollDelay);
    }

    function stopScroll() {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    }

    arrowLeft.addEventListener('pointerdown', () => startScroll(-1));
    arrowLeft.addEventListener('pointerup', stopScroll);
    arrowLeft.addEventListener('pointerleave', stopScroll);

    arrowRight.addEventListener('pointerdown', () => startScroll(1));
    arrowRight.addEventListener('pointerup', stopScroll);
    arrowRight.addEventListener('pointerleave', stopScroll);
}

// ==========================
// Section 3: Form Validation
// ==========================
function updateCharacterCount() {
    const length = messageInput.value.length;
    charactersLeftDiv.textContent = `Characters: ${length}/${MAX_MESSAGE_LENGTH}`;
    charactersLeftDiv.style.color = length > MAX_MESSAGE_LENGTH ? 'var(--error)' : 'inherit';
}

function validateForm() {
    let isValid = true;
    emailErrorDiv.textContent = '';
    messageErrorDiv.textContent = '';

    const emailValue = emailInput.value.trim();
    const msgValue = messageInput.value.trim();

    if (!emailValue) {
        emailErrorDiv.textContent = 'Email cannot be empty.';
        isValid = false;
    } else if (!EMAIL_REGEX.test(emailValue)) {
        emailErrorDiv.textContent = 'Invalid email format.';
        isValid = false;
    } else if (ILLEGAL_CHAR_EMAIL.test(emailValue)) {
        emailErrorDiv.textContent = 'Email contains illegal characters.';
        isValid = false;
    }

    if (!msgValue) {
        messageErrorDiv.textContent = 'Message cannot be empty.';
        isValid = false;
    } else if (ILLEGAL_CHAR_MESSAGE.test(msgValue)) {
        messageErrorDiv.textContent = 'Message contains illegal characters.';
        isValid = false;
    } else if (msgValue.length > MAX_MESSAGE_LENGTH) {
        messageErrorDiv.textContent = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`;
        isValid = false;
    }

    return isValid;
}

messageInput.addEventListener('input', updateCharacterCount);
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateForm()) {
        alert('Form submitted successfully! Validation passed.');
        form.reset();
        updateCharacterCount();
    }
});

updateCharacterCount();

// ==========================
// Handle window resize
// ==========================
let resizeTimer = null;
window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => rebuildProjectList(), 150);
});

// ==========================
// Initialize Everything
// ==========================
loadAboutMe();
loadProjects();


