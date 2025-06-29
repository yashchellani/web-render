class CubeRenderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.materials = [];
        this.textures = [];
        this.controls = {
            autoRotate: true,
            rotationSpeed: 1.0,
            mouseControl: true
        };
        
        // Mouse interaction
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetRotationX = 0;
        this.targetRotationY = 0;
        this.currentRotationX = 0;
        this.currentRotationY = 0;
        
        // Face names for reference
        this.faceNames = ['Back', 'Front', 'Left', 'Right', 'Bottom', 'Top'];
        
        // Default colors for faces without textures
        this.defaultColors = [
            0xff6b6b, // Back - red
            0x51cf66, // Front - green  
            0x339af0, // Left - blue
            0xffd43b, // Right - yellow
            0xf783ac, // Bottom - pink
            0x4ecdc4  // Top - cyan
        ];
        
        // Performance monitoring
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        
        this.init();
        this.setupEventListeners();
        this.animate();
    }
    
    init() {
        const container = document.getElementById('canvas-container');
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        
        // Create camera
        const aspect = container.clientWidth / container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 5;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Remove loading indicator and add canvas
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);
        
        // Create cube
        this.createCube();
        
        // Add lighting
        this.setupLighting();
        
        // Show stats
        document.getElementById('stats').style.display = 'block';
        
        // Add mobile-specific instructions
        this.addMobileInstructions();
        
        console.log('3D Cube Renderer initialized successfully!');
    }
    
    createCube() {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        
        // Create materials for each face
        this.materials = this.defaultColors.map(color => 
            new THREE.MeshLambertMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.9
            })
        );
        
        // Create cube with materials
        this.cube = new THREE.Mesh(geometry, this.materials);
        this.cube.castShadow = true;
        this.cube.receiveShadow = true;
        
        this.scene.add(this.cube);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point light for better illumination
        const pointLight = new THREE.PointLight(0x4ecdc4, 0.5, 10);
        pointLight.position.set(-3, 3, 3);
        this.scene.add(pointLight);
    }
    
    setupEventListeners() {
        const canvas = this.renderer.domElement;
        
        // Mouse events for rotation
        canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            canvas.style.cursor = 'grabbing';
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (this.isMouseDown && this.controls.mouseControl) {
                const deltaX = e.clientX - this.mouseX;
                const deltaY = e.clientY - this.mouseY;
                
                this.targetRotationY += deltaX * 0.01;
                this.targetRotationX += deltaY * 0.01;
                
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                
                // Disable auto-rotation when manually rotating
                this.controls.autoRotate = false;
                document.getElementById('autoRotate').checked = false;
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            canvas.style.cursor = 'grab';
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
            canvas.style.cursor = 'grab';
        });
        
        // Mouse wheel for zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoom = e.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(zoom);
            this.camera.position.clampLength(2, 10);
        });
        
        // Enhanced touch events for mobile
        let lastTouchDistance = 0;
        let lastTouchTime = 0;
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1) {
                // Single touch - rotation
                this.isMouseDown = true;
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
                lastTouchTime = Date.now();
            } else if (e.touches.length === 2) {
                // Two finger touch - pinch to zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
                this.isMouseDown = false;
            }
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1 && this.isMouseDown) {
                // Single touch move - rotation
                const deltaX = e.touches[0].clientX - this.mouseX;
                const deltaY = e.touches[0].clientY - this.mouseY;
                
                // Increase sensitivity for mobile
                this.targetRotationY += deltaX * 0.015;
                this.targetRotationX += deltaY * 0.015;
                
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
                
                // Disable auto-rotation when manually rotating
                this.controls.autoRotate = false;
                document.getElementById('autoRotate').checked = false;
            } else if (e.touches.length === 2) {
                // Two finger move - pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (lastTouchDistance > 0) {
                    const scale = distance / lastTouchDistance;
                    const zoomFactor = scale > 1 ? 0.95 : 1.05;
                    this.camera.position.multiplyScalar(zoomFactor);
                    this.camera.position.clampLength(2, 10);
                }
                
                lastTouchDistance = distance;
            }
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            // Check for double tap to reset rotation
            const currentTime = Date.now();
            if (currentTime - lastTouchTime < 300 && e.changedTouches.length === 1) {
                // Potential double tap - check if it's quick enough
                if (this.lastDoubleTapTime && currentTime - this.lastDoubleTapTime < 400) {
                    // Double tap detected - reset rotation
                    this.targetRotationX = 0;
                    this.targetRotationY = 0;
                    this.currentRotationX = 0;
                    this.currentRotationY = 0;
                    this.cube.rotation.x = 0;
                    this.cube.rotation.y = 0;
                    this.cube.rotation.z = 0;
                    
                    // Show visual feedback
                    this.showMobileToast('Rotation Reset');
                }
                this.lastDoubleTapTime = currentTime;
            }
            
            this.isMouseDown = false;
            lastTouchDistance = 0;
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
        
        // UI Controls
        this.setupUIControls();
        
        // Set initial cursor
        canvas.style.cursor = 'grab';
    }
    
    setupUIControls() {
        // Face loading buttons
        document.querySelectorAll('.face-button').forEach((button, index) => {
            button.addEventListener('click', () => {
                document.getElementById(`file-${index}`).click();
            });
        });
        
        // File input handlers
        for (let i = 0; i < 6; i++) {
            document.getElementById(`file-${i}`).addEventListener('change', (e) => {
                this.loadImageForFace(i, e.target.files[0]);
            });
        }
        
        // Auto-rotate checkbox
        document.getElementById('autoRotate').addEventListener('change', (e) => {
            this.controls.autoRotate = e.target.checked;
        });
        
        // Rotation speed slider
        document.getElementById('rotationSpeed').addEventListener('input', (e) => {
            this.controls.rotationSpeed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = e.target.value;
        });
        
        // Reset rotation button
        document.getElementById('resetRotation').addEventListener('click', () => {
            this.targetRotationX = 0;
            this.targetRotationY = 0;
            this.currentRotationX = 0;
            this.currentRotationY = 0;
            this.cube.rotation.x = 0;
            this.cube.rotation.y = 0;
            this.cube.rotation.z = 0;
        });
        
        // Clear images button
        document.getElementById('clearImages').addEventListener('click', () => {
            this.clearAllImages();
        });
        
        // Mobile help button
        document.getElementById('mobileHelp').addEventListener('click', () => {
            this.showMobileHelp();
        });
    }
    
    loadImageForFace(faceIndex, file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const loader = new THREE.TextureLoader();
            loader.load(e.target.result, (texture) => {
                // Configure texture
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;
                
                // Create new material with texture
                const material = new THREE.MeshLambertMaterial({ 
                    map: texture,
                    transparent: true,
                    opacity: 1.0
                });
                
                // Update cube material for this face
                this.materials[faceIndex] = material;
                this.cube.material = this.materials;
                
                // Update UI
                this.updateFaceStatus(faceIndex, file.name, true);
                this.updatePreviewImage(faceIndex, e.target.result);
                
                // Show mobile feedback
                if (this.detectMobileDevice()) {
                    this.showMobileToast(`${this.faceNames[faceIndex]} face loaded!`);
                }
                
                console.log(`Loaded texture for ${this.faceNames[faceIndex]} face: ${file.name}`);
            }, undefined, (error) => {
                console.error(`Error loading texture for face ${faceIndex}:`, error);
                this.updateFaceStatus(faceIndex, 'Error loading image', false);
            });
        };
        reader.readAsDataURL(file);
    }
    
    updateFaceStatus(faceIndex, filename, success) {
        const statusElement = document.getElementById(`status-${faceIndex}`);
        const buttonElement = document.querySelector(`[data-face="${faceIndex}"]`);
        
        if (success) {
            const shortName = filename.length > 20 ? filename.substring(0, 17) + '...' : filename;
            statusElement.textContent = `✓ ${shortName}`;
            statusElement.style.color = '#4ecdc4';
            buttonElement.classList.add('loaded');
        } else {
            statusElement.textContent = filename;
            statusElement.style.color = '#e74c3c';
            buttonElement.classList.remove('loaded');
        }
    }
    
    updatePreviewImage(faceIndex, imageSrc) {
        const previewElement = document.getElementById(`preview-${faceIndex}`);
        previewElement.src = imageSrc;
        previewElement.classList.add('loaded');
    }
    
    clearAllImages() {
        // Reset materials to default colors
        this.materials = this.defaultColors.map(color => 
            new THREE.MeshLambertMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.9
            })
        );
        
        this.cube.material = this.materials;
        
        // Reset UI
        for (let i = 0; i < 6; i++) {
            this.updateFaceStatus(i, 'No image loaded', false);
            const previewElement = document.getElementById(`preview-${i}`);
            previewElement.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23${this.defaultColors[i].toString(16).padStart(6, '0')}'/%3E%3C/svg%3E`;
            previewElement.classList.remove('loaded');
            
            // Clear file inputs
            document.getElementById(`file-${i}`).value = '';
        }
        
        this.showMobileToast('All images cleared');
        console.log('All images cleared');
    }
    
    showMobileToast(message) {
        // Create toast notification for mobile feedback
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(78, 205, 196, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            animation: slideInOut 2s ease-in-out forwards;
        `;
        
        // Add animation keyframes if not already added
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Remove toast after animation
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 2000);
    }
    
    detectMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    }
    
    addMobileInstructions() {
        if (this.detectMobileDevice()) {
            // Update instructions for mobile
            const instructionsElement = document.querySelector('.instructions ul');
            if (instructionsElement) {
                instructionsElement.innerHTML = `
                    <li>Tap face buttons to load images</li>
                    <li><strong>Single finger:</strong> Drag to rotate cube</li>
                    <li><strong>Two fingers:</strong> Pinch to zoom in/out</li>
                    <li><strong>Double tap:</strong> Reset rotation</li>
                    <li>Toggle auto-rotation with checkbox</li>
                    <li>Adjust speed with the slider</li>
                    <li>Supports PNG, JPG, GIF, WebP formats</li>
                `;
            }
            
            // Show mobile help button
            document.getElementById('mobileHelp').style.display = 'block';
            
            // Show mobile welcome toast
            setTimeout(() => {
                this.showMobileToast('Mobile controls enabled! Double-tap to reset rotation');
            }, 1000);
        }
    }
    
    showMobileHelp() {
        const helpModal = document.createElement('div');
        helpModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10001;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        `;
        
        const helpContent = document.createElement('div');
        helpContent.style.cssText = `
            background: #2b2b2b;
            border-radius: 15px;
            padding: 20px;
            max-width: 90%;
            max-height: 80%;
            overflow-y: auto;
            color: white;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;
        
        helpContent.innerHTML = `
            <h3 style="color: #4ecdc4; margin-bottom: 15px;">📱 Mobile Controls</h3>
            <div style="line-height: 1.6;">
                <p><strong>🎮 Cube Controls:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><strong>Single finger drag:</strong> Rotate the cube</li>
                    <li><strong>Two finger pinch:</strong> Zoom in/out</li>
                    <li><strong>Double tap:</strong> Reset rotation</li>
                </ul>
                
                <p><strong>🖼️ Loading Images:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Tap colored face buttons to load images</li>
                    <li>Choose from your photo gallery</li>
                    <li>Images will appear on the cube faces</li>
                </ul>
                
                <p><strong>⚙️ Settings:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Toggle auto-rotation on/off</li>
                    <li>Adjust rotation speed with slider</li>
                    <li>Reset or clear all images</li>
                </ul>
            </div>
            <button id="closeHelp" style="
                background: #4ecdc4;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: bold;
                margin-top: 15px;
                width: 100%;
                cursor: pointer;
            ">Got it! 👍</button>
        `;
        
        helpModal.appendChild(helpContent);
        document.body.appendChild(helpModal);
        
        // Close help modal
        document.getElementById('closeHelp').addEventListener('click', () => {
            document.body.removeChild(helpModal);
        });
        
        // Close on background click
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                document.body.removeChild(helpModal);
            }
        });
    }
    
    onWindowResize() {
        const container = document.getElementById('canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    updateStats() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            document.getElementById('fps').textContent = this.fps;
            document.getElementById('triangles').textContent = '12'; // Box geometry has 12 triangles
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Auto-rotation
        if (this.controls.autoRotate) {
            this.targetRotationY += 0.005 * this.controls.rotationSpeed;
            this.targetRotationX += 0.002 * this.controls.rotationSpeed;
        }
        
        // Smooth rotation interpolation
        this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.1;
        this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.1;
        
        // Apply rotations
        this.cube.rotation.x = this.currentRotationX;
        this.cube.rotation.y = this.currentRotationY;
        
        // Update stats
        this.updateStats();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for WebGL support
    if (!window.WebGLRenderingContext) {
        document.getElementById('canvas-container').innerHTML = `
            <div style="text-align: center; color: #e74c3c;">
                <h3>WebGL Not Supported</h3>
                <p>Your browser doesn't support WebGL, which is required for 3D rendering.</p>
                <p>Please update your browser or try a different one.</p>
            </div>
        `;
        return;
    }
    
    try {
        // Initialize the cube renderer
        window.cubeRenderer = new CubeRenderer();
        console.log('3D Textured Cube application started successfully!');
    } catch (error) {
        console.error('Failed to initialize 3D Cube Renderer:', error);
        document.getElementById('canvas-container').innerHTML = `
            <div style="text-align: center; color: #e74c3c;">
                <h3>Initialization Error</h3>
                <p>Failed to initialize the 3D renderer.</p>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CubeRenderer;
} 
