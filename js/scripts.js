// ==========================
// Global Constants
// ==========================
const DEFAULT_CARD_IMAGE = "images/card_placeholder_bg.webp";
const DEFAULT_SPOTLIGHT_IMAGE = "images/spotlight_placeholder_bg.webp";
const MAX_MESSAGE_LENGTH = 300;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ILLEGAL_CHAR_EMAIL = /[^a-zA-Z0-9@._-]/;
const ILLEGAL_CHAR_MESSAGE = /[^a-zA-Z0-9@._\-\s]/;

// ==========================
// Cached DOM
// ==========================
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
const projectsContainer = document.querySelector('#projectsContainer');
const projectsHeading = projectsContainer?.querySelector('h2');
const projectSection = document.getElementById('projectSection');

let projectsData = [];
let projectCards = []; // Cached NodeList for project cards
let resizeTimer = null;
let scrollInterval = null;

// ==========================
// Helpers
// ==========================
const isDesktop = () => window.matchMedia('(min-width:1024px)').matches;

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
// Section 1: About Me
// ==========================
async function loadAboutMe() {
    try {
        const res = await fetch('data/aboutMeData.json');
        if (!res.ok) throw new Error("Failed to fetch aboutMeData.json");
        const data = await res.json();

        aboutMeContainer.innerHTML = '';

        const frag = document.createDocumentFragment();

        const p = document.createElement('p');
        p.textContent = data.aboutMe ?? "About me info missing.";
        frag.appendChild(p);

        const headshotDiv = document.createElement('div');
        headshotDiv.className = "headshotContainer";
        Object.assign(headshotDiv.style, { padding: '0.5rem', margin: '1rem' });

        const img = document.createElement('img');
        img.src = data.headshot ?? "images/headshot.webp";
        img.alt = "Headshot";
        Object.assign(img.style, { width: "100%", height: "auto", objectFit: "cover" });

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
        const res = await fetch('data/projectsData.json');
        if (!res.ok) throw new Error("Failed to fetch projectsData.json");
        projectsData = await res.json();

        rebuildProjectList();
        setSpotlight(projectsData[0] ?? null);
        setupProjectCardListeners();
        setupProjectArrowScroll();

        requestAnimationFrame(() => {
            adjustProjectListLayout();
            adjustHeadingSpacing();
        });
    } catch (err) {
        console.error(err);
        projectList.textContent = "Failed to load Projects.";
    }
}

function rebuildProjectList() {
    projectList.innerHTML = '';
    const frag = document.createDocumentFragment();

    projectsData.forEach(({ project_id, card_image, project_name, short_description }) => {
        const card = document.createElement('div');
        card.className = 'projectCard';
        card.id = project_id;
        card.style.backgroundImage = `url(${card_image ?? DEFAULT_CARD_IMAGE})`;

        const h4 = document.createElement('h4');
        h4.textContent = project_name ?? "Untitled Project";

        const p = document.createElement('p');
        p.textContent = short_description ?? "No description available.";

        card.append(h4, p);
        frag.appendChild(card);
    });

    projectList.appendChild(frag);

    projectCards = Array.from(document.querySelectorAll('.projectCard'));
    requestAnimationFrame(() => {
        adjustProjectListLayout();
        adjustHeadingSpacing();
    });
}

// ==========================
// Adjust heading spacing
function adjustHeadingSpacing() {
    if (!projectsHeading || !projectSection) return;

    const bufferDesktop = 100; // more professional spacing
    const bufferMobile = 16;

    if (isDesktop()) {
        const headingHeight = projectsHeading.getBoundingClientRect().height;
        projectSection.style.marginTop = `${headingHeight + bufferDesktop}px`;
    } else {
        projectSection.style.marginTop = `${bufferMobile}px`;
    }
}

// ==========================
function adjustProjectListLayout() {
    if (!projectList) return;

    // Reset styles
    Object.assign(projectList.style, { display: '', flexDirection: '', height: '', overflowX: '', overflowY: '', gap: '', padding: '', marginTop: '' });
    projectCards.forEach(card => Object.assign(card.style, { width: '', height: '', flex: '', margin: '', padding: '', borderRadius: '', boxShadow: '' }));

    if (isDesktop()) {
        Object.assign(projectList.style, { display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', overflowX: 'hidden', padding: '20px 0' });

        const spotlightHeight = projectSpotlight.getBoundingClientRect().height || window.innerHeight * 0.5;
        projectList.style.height = `${Math.round(spotlightHeight)}px`;

        const visibleCount = 3;
        const gapPx = 16;
        const perCardHeight = Math.floor((spotlightHeight - (visibleCount - 1) * gapPx) / visibleCount);

        projectCards.forEach(card => Object.assign(card.style, {
            height: `${perCardHeight}px`,
            width: '100%',
            flex: '0 0 auto',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '8px',
            margin: '0'
        }));
    } else {
        Object.assign(projectList.style, { display: 'flex', flexDirection: 'row', gap: '12px', overflowX: 'auto', overflowY: 'hidden', padding: '12px 0', height: 'auto' });

        projectCards.forEach(card => Object.assign(card.style, {
            width: '200px',
            height: 'auto',
            flex: '0 0 auto',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            padding: '6px',
            margin: '0'
        }));
    }
}

// ==========================
// Spotlight
function setSpotlight(project) {
    spotlightTitles.innerHTML = '';
    const frag = document.createDocumentFragment();

    if (!project) {
        const h3 = document.createElement('h3');
        h3.textContent = "No project";
        const p = document.createElement('p');
        p.textContent = "No details available.";
        frag.append(h3, p);
        projectSpotlight.style.backgroundImage = `url(${DEFAULT_SPOTLIGHT_IMAGE})`;
    } else {
        const { spotlight_image, project_name, long_description, url } = project;
        projectSpotlight.style.backgroundImage = `url(${spotlight_image ?? DEFAULT_SPOTLIGHT_IMAGE})`;

        const h3 = document.createElement('h3');
        h3.textContent = project_name ?? 'Untitled Project';
        const p = document.createElement('p');
        p.textContent = long_description ?? 'Details coming soon.';
        const a = document.createElement('a');
        a.href = url ?? '#';
        a.textContent = 'Click here to see more...';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        frag.append(h3, p, a);
    }

    spotlightTitles.appendChild(frag);
}

// ==========================
// Event Delegation for Project Cards
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
    projectCards.forEach(c => c.classList.remove('active'));
    activeCard.classList.add('active');
}

// ==========================
// Smooth Scroll Arrows
function setupProjectArrowScroll() {
    const scrollStep = 40;
    const scrollDelay = 10;

    const startScroll = dir => {
        stopScroll();
        scrollInterval = setInterval(() => {
            const options = isDesktop() ? { top: dir * scrollStep, behavior: 'smooth' } : { left: dir * scrollStep, behavior: 'smooth' };
            projectList.scrollBy(options);
        }, scrollDelay);
    };

    const stopScroll = () => {
        if (scrollInterval) clearInterval(scrollInterval);
        scrollInterval = null;
    };

    arrowLeft.addEventListener('pointerdown', () => startScroll(-1));
    arrowLeft.addEventListener('pointerup', stopScroll);
    arrowLeft.addEventListener('pointerleave', stopScroll);

    arrowRight.addEventListener('pointerdown', () => startScroll(1));
    arrowRight.addEventListener('pointerup', stopScroll);
    arrowRight.addEventListener('pointerleave', stopScroll);
}

// ==========================
// Form Validation
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

    if (!emailValue) { emailErrorDiv.textContent = 'Email cannot be empty.'; isValid = false; }
    else if (!EMAIL_REGEX.test(emailValue)) { emailErrorDiv.textContent = 'Invalid email format.'; isValid = false; }
    else if (ILLEGAL_CHAR_EMAIL.test(emailValue)) { emailErrorDiv.textContent = 'Email contains illegal characters.'; isValid = false; }

    if (!msgValue) { messageErrorDiv.textContent = 'Message cannot be empty.'; isValid = false; }
    else if (ILLEGAL_CHAR_MESSAGE.test(msgValue)) { messageErrorDiv.textContent = 'Message contains illegal characters.'; isValid = false; }
    else if (msgValue.length > MAX_MESSAGE_LENGTH) { messageErrorDiv.textContent = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`; isValid = false; }

    return isValid;
}

messageInput.addEventListener('input', updateCharacterCount);
form.addEventListener('submit', e => {
    e.preventDefault();
    if (validateForm()) {
        alert('Form submitted successfully! Validation passed.');
        form.reset();
        updateCharacterCount();
    }
});

updateCharacterCount();

// ==========================
// Window resize
window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        rebuildProjectList();
        adjustHeadingSpacing();
    }, 150);
});

// ==========================
// Initialize
loadAboutMe();
loadProjects();
