// ==================================================================
// 📂 CONFIGURATION
// ==================================================================
const GALLERY_DIRECTORIES = ['images/', 'comfy_images/'];

// --- Image Data ---
let imageFiles = []; 

const galleryContainer = document.getElementById('images-grid');
const modal = document.getElementById('lightbox-modal');
const modalImage = document.getElementById('modal-image');
const modalCaption = document.getElementById('modal-caption');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalPrevBtn = document.getElementById('modal-prev-btn');
const modalNextBtn = document.getElementById('modal-next-btn');
const modalPlayBtn = document.getElementById('modal-play-btn');

// --- Lightbox State Management ---
let currentScale = 1.0;
let currentTranslateX = 0;
let currentTranslateY = 0;
let isDragging = false;
let hasDragged = false;
let startDragX = 0;
let startDragY = 0;
let initialScrollPosition = { x: 0, y: 0 };
let currentIndex = 0;
let lastTapTime = 0;
let lastTouchTime = 0;
let initialPinchDistance = null;
let initialScaleAtPinch = 1.0;

// --- Slideshow State ---
let slideshowInterval = null;
let isSlideshowRunning = false;
const SLIDESHOW_DELAY = 3500; 

// ==================================================================
// 🖼️ CORE FUNCTIONALITY
// ==================================================================

function applyTransform() {
    modalImage.style.transform = `translate(${currentTranslateX}px, ${currentTranslateY}px) scale(${currentScale})`;
}

function setScale(newScale) {
    const MIN_SCALE = 1.0;
    const MAX_SCALE = 5.0;
    currentScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    applyTransform();
}

function handleZoomToFit() {
    currentScale = 1.0;
    currentTranslateX = 0;
    currentTranslateY = 0;
    applyTransform();
}

function startSlideshow() {
    isSlideshowRunning = true;
    modalPlayBtn.textContent = '⏸'; 
    
    if (modal.requestFullscreen) {
        modal.requestFullscreen().catch(err => console.warn("Fullscreen denied", err));
    } else if (modal.webkitRequestFullscreen) { 
        modal.webkitRequestFullscreen();
    }

    slideshowInterval = setInterval(() => {
        cycleGallery(1);
    }, SLIDESHOW_DELAY);
}

function stopSlideshow() {
    if (!isSlideshowRunning) return;
    
    isSlideshowRunning = false;
    modalPlayBtn.textContent = '▶'; 
    clearInterval(slideshowInterval);
    
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

function toggleSlideshow() {
    if (isSlideshowRunning) {
        stopSlideshow();
    } else {
        startSlideshow();
    }
}

// ==================================================================
// 🖱️ INTERACTION HANDLERS
// ==================================================================

function openLightbox(imagePath, imageCaption) {
    modalImage.src = imagePath;
    modalImage.alt = `Full Size Gallery Image: ${imageCaption}`;
    modalCaption.textContent = imageCaption;
    
    modalImage.onload = () => {
        handleZoomToFit();
        modal.classList.remove('closed');
        initialScrollPosition = { x: window.scrollX, y: window.scrollY };
        preloadAdjacentImages(); 
    };
    
    if (modalImage.complete) {
        modalImage.onload(); 
    }
}

function closeLightbox() {
    stopSlideshow(); // FIX: Added missing interrupt
    modal.classList.add('closed');
    window.scrollTo(initialScrollPosition.x, initialScrollPosition.y);
    
    handleZoomToFit();
    modalImage.style.cursor = 'grab';
    document.body.style.overflow = '';
}

function preloadAdjacentImages() {
    if (imageFiles.length <= 1) return;
    const totalImages = imageFiles.length;
    const nextIndex = (currentIndex + 1) % totalImages;
    const prevIndex = (currentIndex - 1 + totalImages) % totalImages;
    const nextImg = new Image();
    nextImg.src = imageFiles[nextIndex].path;
    const prevImg = new Image();
    prevImg.src = imageFiles[prevIndex].path;
}

function handleZoomAndPan(event) {
    event.preventDefault(); 
    const delta = event.deltaY;
    const zoomSpeed = -0.002; 
    const scaleChange = delta * zoomSpeed;
    setScale(currentScale + scaleChange);
}

function handleDrag(event) {
    if (!isDragging) return;
    hasDragged = true; 
    currentTranslateX += (event.clientX - startDragX);
    currentTranslateY += (event.clientY - startDragY);
    applyTransform();
    startDragX = event.clientX;
    startDragY = event.clientY;
}

function cycleGallery(direction) {
    if (imageFiles.length === 0) return;
    const totalImages = imageFiles.length;
    currentIndex = (currentIndex + direction + totalImages) % totalImages;
    const nextFile = imageFiles[currentIndex];
    openLightbox(nextFile.path, nextFile.name);
}

// ==================================================================
// 🛠️ CARD & RENDERING LOGIC
// ==================================================================

function createImageCard(file) {
    const figure = document.createElement('figure');
    figure.classList.add('image-card');
    figure.setAttribute('data-path', file.path);
    figure.dataset.caption = file.name; 

    const img = document.createElement('img');
    img.src = file.path;
    img.alt = `Image: ${file.name}`;
    img.loading = 'lazy';
    img.classList.add('lazy-load');

    const infoDiv = document.createElement('div');
    infoDiv.classList.add('card-info');

    const title = document.createElement('h3');
    title.textContent = file.name.charAt(0).toUpperCase() + file.name.slice(1);

    const description = document.createElement('p');
    description.textContent = `Type: ${file.type.toUpperCase()}`;

    infoDiv.appendChild(title);
    infoDiv.appendChild(description);
    figure.appendChild(img);
    figure.appendChild(infoDiv);

    figure.addEventListener('click', () => {
        currentIndex = imageFiles.findIndex(f => f.path === file.path);
        openLightbox(file.path, file.name);
    });

    return figure;
}

function renderGallery(imageFilesList) {
    galleryContainer.innerHTML = '';
    if (imageFilesList.length === 0) {
         galleryContainer.innerHTML = '<p style="grid-column: 1 / -1; padding: 40px; color: #999;">No images found in any configured directories.</p>';
         return;
    }
    imageFilesList.forEach(file => {
        const cardElement = createImageCard(file);
        galleryContainer.appendChild(cardElement);
    });
}

async function discoverAndRenderGallery() {
    let allDiscoveredFiles = [];
    
    for (const directoryUrl of GALLERY_DIRECTORIES) {
        let filenames = [];
        try {
            const response = await fetch(directoryUrl);
            if (!response.ok) {
                console.warn(`Skipping folder: ${directoryUrl}`);
                continue;
            }
            const fileListText = await response.text();
            if (fileListText.includes('<html') || fileListText.includes('<title>')) {
                const regex = /href="([^"]+\.(png|jpg|jpeg|gif))"/gi;
                let match;
                while ((match = regex.exec(fileListText)) !== null) {
                    filenames.push(match[1]);
                }
            } else {
                filenames = fileListText.trim().split(/\s*[\n\r]\s*/).filter(name => name.length > 0);
            }
        } catch (error) {
            console.warn(`Fetch failed for ${directoryUrl}`, error);
            continue;
        }

        const processedFiles = filenames.map(rawFileName => {
            const cleanFileName = rawFileName.split('/').pop(); 
            const type = cleanFileName.split('.').pop().toLowerCase();
            const baseName = cleanFileName.replace(/\.[^/.]+$/, "");
            return {
                name: baseName,
                type: type,
                path: `${directoryUrl}${cleanFileName}` 
            };
        });
        allDiscoveredFiles = allDiscoveredFiles.concat(processedFiles);
    }
    imageFiles = allDiscoveredFiles;
    renderGallery(imageFiles);
}

// ==================================================================
// 🚀 INITIALIZATION & EVENT LISTENERS
// ==================================================================

document.addEventListener('DOMContentLoaded', () => {
    modalCloseBtn.addEventListener('click', closeLightbox);
    
    modal.addEventListener('click', (e) => {
        if (hasDragged) {
            hasDragged = false;
            return;
        }
        if (e.target === modalImage || e.target.closest('button')) {
            return;
        }
        closeLightbox();
    }); // FIX: This closing bracket was missing!
    
    // FIX: Separated the play button listener cleanly
    modalPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        toggleSlideshow();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (!modal.classList.contains('closed')) {
            if (e.key === 'ArrowRight') { stopSlideshow(); cycleGallery(1); }
            else if (e.key === 'ArrowLeft') { stopSlideshow(); cycleGallery(-1); }
        }
    });
    
    modalNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stopSlideshow(); 
        cycleGallery(1);
    });

    modalPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stopSlideshow(); 
        cycleGallery(-1);
    });

    modalImage.addEventListener('wheel', (e) => {
        stopSlideshow(); // FIX: Added missing interrupt
        handleZoomAndPan(e);
    }, { passive: false });
    
    modalImage.addEventListener('mousedown', (e) => {
        e.preventDefault(); 
        stopSlideshow(); // FIX: Added missing interrupt
        isDragging = true;
        hasDragged = false; 
        startDragX = e.clientX;
        startDragY = e.clientY;
        modalImage.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        modalImage.style.cursor = 'grab';
    });
    
    modalImage.addEventListener('click', (e) => {
        if (new Date().getTime() - lastTouchTime < 500) return;
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        if (tapLength < 300 && tapLength > 0) {
            handleZoomToFit();
            e.preventDefault();
        }
        lastTapTime = currentTime;
    });

    modalImage.addEventListener('touchstart', (e) => {
        stopSlideshow(); // FIX: Added missing interrupt
        if (e.touches.length === 1) { 
            isDragging = true;
            hasDragged = false;
            startDragX = e.touches[0].clientX;
            startDragY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            isDragging = false; 
            hasDragged = true;  
            initialPinchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialScaleAtPinch = currentScale;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            hasDragged = true;
            currentTranslateX += (e.touches[0].clientX - startDragX);
            currentTranslateY += (e.touches[0].clientY - startDragY);
            applyTransform();
            startDragX = e.touches[0].clientX;
            startDragY = e.touches[0].clientY;
        } else if (e.touches.length === 2 && initialPinchDistance) {
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const pinchScale = currentDistance / initialPinchDistance;
            setScale(initialScaleAtPinch * pinchScale);
        }
    }, { passive: true });

    modalImage.addEventListener('touchend', (e) => {
        isDragging = false;
        if (e.touches.length < 2) {
            initialPinchDistance = null;
        }
        if (!hasDragged && e.changedTouches.length === 1) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTouchTime;
            if (tapLength < 300 && tapLength > 0) {
                handleZoomToFit();
                if (e.cancelable) e.preventDefault(); 
            }
            lastTouchTime = currentTime;
        }
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
        initialPinchDistance = null;
    });
    
    document.addEventListener('mousemove', handleDrag);

    window.addEventListener('resize', () => {
        if (!modal.classList.contains('closed')) handleZoomToFit(); 
    });

    discoverAndRenderGallery();
});
