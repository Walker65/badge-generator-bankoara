class BadgeGenerator {
    constructor() {
        this.photoCanvas = document.getElementById('photoCanvas');
        this.photoCtx = this.photoCanvas.getContext('2d');
        this.exportCanvas = document.getElementById('exportCanvas');
        this.exportCtx = this.exportCanvas.getContext('2d');
        this.badgeTemplate = document.getElementById('badgeTemplate');
        
        this.uploadArea = document.getElementById('uploadArea');
        this.photoInput = document.getElementById('photoInput');
        this.previewSection = document.getElementById('previewSection');
        
        // Contrôles
        this.zoomSlider = document.getElementById('zoomSlider');
        this.rotateSlider = document.getElementById('rotateSlider');
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        this.rotateLeftBtn = document.getElementById('rotateLeft');
        this.rotateRightBtn = document.getElementById('rotateRight');
        this.resetBtn = document.getElementById('resetBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // État de l'image
        this.currentImage = null;
        this.scale = 1;
        this.rotation = 0;
        this.position = { x: 0, y: 0 };
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        // Dimensions du cadre circulaire (pour preview)
        this.circlePreview = {
            diameter: 240,
            radius: 120
        };
        
        // Template 1080x1080 px
        this.templateSize = {
            width: 1080,
            height: 1080
        };
        
        // Position EXACTE du cercle sur le badge final (coordonnées pixels)
        this.circlePosition = {
            x: 540,   // Centre horizontal exact (1080 / 2)
            y: 648    // 60% vertical exact (1080 * 0.6 = 648)
        };

        // État du chargement
        this.isTemplateLoaded = false;
        
        this.initEventListeners();
        this.loadBadgeTemplate();
    }
    
    initEventListeners() {
        // Upload
        this.uploadArea.addEventListener('click', () => this.photoInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.photoInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop sur le canvas
        this.photoCanvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.photoCanvas.addEventListener('mousemove', (e) => this.drag(e));
        this.photoCanvas.addEventListener('mouseup', () => this.stopDrag());
        this.photoCanvas.addEventListener('mouseleave', () => this.stopDrag());
        
        // Touch events pour mobile
        this.photoCanvas.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
        this.photoCanvas.addEventListener('touchmove', (e) => this.drag(e.touches[0]));
        this.photoCanvas.addEventListener('touchend', () => this.stopDrag());
        
        // Contrôles
        this.zoomSlider.addEventListener('input', () => this.handleZoom());
        this.rotateSlider.addEventListener('input', () => this.handleRotation());
        this.zoomInBtn.addEventListener('click', () => this.zoomIn());
        this.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        this.rotateLeftBtn.addEventListener('click', () => this.rotateLeft());
        this.rotateRightBtn.addEventListener('click', () => this.rotateRight());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.downloadBtn.addEventListener('click', () => this.downloadBadge());
    }
    
    loadBadgeTemplate() {
        console.log('Tentative de chargement du template...');
        
        this.badgeTemplate.onload = () => {
            console.log('✅ Template de badge CHARGÉ avec succès');
            console.log('Dimensions:', this.badgeTemplate.naturalWidth, 'x', this.badgeTemplate.naturalHeight);
            this.isTemplateLoaded = true;
            this.templateSize.width = this.badgeTemplate.naturalWidth;
            this.templateSize.height = this.badgeTemplate.naturalHeight;
        };

        this.badgeTemplate.onerror = () => {
            console.error('❌ ERREUR: Impossible de charger le template Jy serai.jpg');
            this.isTemplateLoaded = false;
        };

        if (this.badgeTemplate.complete) {
            console.log('Template déjà chargé');
            this.isTemplateLoaded = true;
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.loadImage(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        }
    }
    
    loadImage(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.reset();
                this.previewSection.style.display = 'block';
                this.updatePreview();
            };
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    }
    
    reset() {
        this.scale = 1;
        this.rotation = 0;
        this.position = { x: 0, y: 0 };
        this.zoomSlider.value = 100;
        this.rotateSlider.value = 0;
        this.updatePreview();
    }
    
    handleZoom() {
        this.scale = this.zoomSlider.value / 100;
        this.updatePreview();
    }
    
    handleRotation() {
        this.rotation = this.rotateSlider.value;
        this.updatePreview();
    }
    
    zoomIn() {
        this.scale = Math.min(2, this.scale + 0.1);
        this.zoomSlider.value = this.scale * 100;
        this.updatePreview();
    }
    
    zoomOut() {
        this.scale = Math.max(0.5, this.scale - 0.1);
        this.zoomSlider.value = this.scale * 100;
        this.updatePreview();
    }
    
    rotateLeft() {
        this.rotation = (parseInt(this.rotation) - 15) % 360;
        this.rotateSlider.value = this.rotation;
        this.updatePreview();
    }
    
    rotateRight() {
        this.rotation = (parseInt(this.rotation) + 15) % 360;
        this.rotateSlider.value = this.rotation;
        this.updatePreview();
    }
    
    startDrag(e) {
        this.isDragging = true;
        const rect = this.photoCanvas.getBoundingClientRect();
        this.lastMousePos = { 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top 
        };
        this.photoCanvas.style.cursor = 'grabbing';
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const rect = this.photoCanvas.getBoundingClientRect();
        const currentMousePos = { 
            x: e.clientX - rect.left, 
            y: e.clientY - rect.top 
        };
        
        const deltaX = currentMousePos.x - this.lastMousePos.x;
        const deltaY = currentMousePos.y - this.lastMousePos.y;
        
        this.position.x += deltaX;
        this.position.y += deltaY;
        
        this.lastMousePos = currentMousePos;
        this.updatePreview();
    }
    
    stopDrag() {
        this.isDragging = false;
        this.photoCanvas.style.cursor = 'move';
    }
    
    updatePreview() {
        if (!this.currentImage) return;
        
        const canvas = this.photoCanvas;
        const ctx = this.photoCtx;
        
        // Taille du canvas (cadre circulaire)
        canvas.width = this.circlePreview.diameter;
        canvas.height = this.circlePreview.diameter;
        
        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Créer un masque circulaire
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.circlePreview.radius, this.circlePreview.radius, this.circlePreview.radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Déplacer au centre du canvas
        ctx.translate(this.circlePreview.radius, this.circlePreview.radius);
        
        // Appliquer la rotation
        ctx.rotate((this.rotation * Math.PI) / 180);
        
        // Calculer les dimensions avec le zoom
        const scaledWidth = this.currentImage.width * this.scale;
        const scaledHeight = this.currentImage.height * this.scale;
        
        // Dessiner l'image centrée avec la position de drag
        ctx.drawImage(
            this.currentImage,
            this.position.x - scaledWidth / 2,
            this.position.y - scaledHeight / 2,
            scaledWidth,
            scaledHeight
        );
        
        // Restaurer le contexte
        ctx.restore();
    }
    
    async downloadBadge() {
        console.log('=== DÉBUT TÉLÉCHARGEMENT ===');
        
        if (!this.currentImage) {
            alert('Veuillez d\'abord uploader une photo');
            return;
        }

        console.log('État du template:', this.isTemplateLoaded ? 'CHARGÉ' : 'NON CHARGÉ');
        
        try {
            // Créer le canvas d'export en haute résolution
            this.exportCanvas.width = this.templateSize.width;
            this.exportCanvas.height = this.templateSize.height;
            
            const ctx = this.exportCtx;
            
            // Effacer le canvas
            ctx.clearRect(0, 0, this.exportCanvas.width, this.exportCanvas.height);
            
            // Dessiner le template du badge ou un fond de secours
            if (this.isTemplateLoaded && this.badgeTemplate.complete) {
                console.log('✅ Utilisation du template réel');
                ctx.drawImage(this.badgeTemplate, 0, 0, this.exportCanvas.width, this.exportCanvas.height);
            } else {
                console.log('⚠️ Utilisation du template de secours');
                this.drawFallbackTemplate(ctx);
                alert('ATTENTION: Le template Jy serai.jpg n\'est pas chargé. Vérifiez que le fichier existe dans le dossier.');
            }
            
            // Dessiner la photo de l'utilisateur dans le cadre circulaire
            this.drawUserPhoto(ctx);
            
            // Télécharger
            this.triggerDownload();
            
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error);
            alert('Erreur: ' + error.message);
        }
    }

    drawFallbackTemplate(ctx) {
        // Fond coloré de secours
        const gradient = ctx.createLinearGradient(0, 0, this.exportCanvas.width, this.exportCanvas.height);
        gradient.addColorStop(0, '#4a90e2');
        gradient.addColorStop(1, '#8e44ad');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.exportCanvas.width, this.exportCanvas.height);
        
        // Texte indicatif
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BADGE FESTIVAL BANKOARA', this.exportCanvas.width / 2, 100);
        ctx.font = '20px Arial';
        ctx.fillText('Template temporaire - Vérifiez le fichier Jy serai.jpg', this.exportCanvas.width / 2, this.exportCanvas.height - 50);
    }
    
    drawUserPhoto(ctx) {
        if (!this.currentImage) return;
        
        // Position EXACTE du cercle sur le badge final
        const circleCenter = {
            x: this.circlePosition.x, // 540 pixels (centre)
            y: this.circlePosition.y  // 648 pixels (60% vertical)
        };
        
        // Diamètre du cercle sur le template final
        const finalCircleDiameter = 400;
        const finalCircleRadius = finalCircleDiameter / 2;
        
        ctx.save();
        
        // CONTOUR BLANC EXTERIEUR
        ctx.beginPath();
        ctx.arc(circleCenter.x, circleCenter.y, finalCircleRadius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 15;
        ctx.stroke();
        
        // Créer un masque circulaire
        ctx.beginPath();
        ctx.arc(circleCenter.x, circleCenter.y, finalCircleRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Déplacer au centre du cercle
        ctx.translate(circleCenter.x, circleCenter.y);
        
        // Appliquer la rotation
        ctx.rotate((this.rotation * Math.PI) / 180);
        
        // Calculer les dimensions avec le zoom (converties pour l'export)
        const scaleFactor = finalCircleDiameter / this.circlePreview.diameter;
        const scaledWidth = this.currentImage.width * this.scale * scaleFactor;
        const scaledHeight = this.currentImage.height * this.scale * scaleFactor;
        
        // Appliquer la position (convertie de la prévisualisation vers l'export)
        const exportX = this.position.x * scaleFactor;
        const exportY = this.position.y * scaleFactor;
        
        // Dessiner l'image
        ctx.drawImage(
            this.currentImage,
            exportX - scaledWidth / 2,
            exportY - scaledHeight / 2,
            scaledWidth,
            scaledHeight
        );
        
        ctx.restore();
    }

    triggerDownload() {
        try {
            const dataURL = this.exportCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            
            link.download = 'badge-festival-bankoara.png';
            link.href = dataURL;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ Téléchargement réussi');
            
        } catch (error) {
            console.error('Erreur de téléchargement:', error);
            alert('Erreur lors du téléchargement');
        }
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    new BadgeGenerator();
    console.log('🎉 Générateur de badge initialisé');
});