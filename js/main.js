import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';

const effect = document.querySelector('.portada-efecto');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (effect) {
    document.body.appendChild(effect);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(effect.clientWidth, effect.clientHeight);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    effect.appendChild(renderer.domElement);

    const cubeMaterials = Array.from({ length: 6 }, () =>
        new THREE.MeshBasicMaterial({ color: 0x0b2a49 })
    );
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), cubeMaterials);
    scene.add(cube);

    let logoImage;
    let themeIndex = 0;
    const themes = [
        { color: '#0b2a49', name: 'azul' },
        { color: '#4a2675', name: 'violeta' },
        { color: '#76501b', name: 'dorado' }
    ];
    const applyTheme = () => {
        if (!logoImage) return;

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        if (!context) {
            console.error('No se pudo crear la textura para el cubo de Blizzard.');
            return;
        }

        context.fillStyle = themes[themeIndex].color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.filter = 'brightness(0) invert(1)';
        const scale = Math.min(420 / logoImage.width, 300 / logoImage.height);
        const width = logoImage.width * scale;
        const height = logoImage.height * scale;
        context.drawImage(logoImage, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);

        const logoTexture = new THREE.CanvasTexture(canvas);
        logoTexture.colorSpace = THREE.SRGBColorSpace;
        cubeMaterials.forEach((material) => {
            if (material.map) material.map.dispose();
            material.map = logoTexture;
            material.color.set(0xffffff);
            material.needsUpdate = true;
        });
    };

    let suppressClick = false;
    let dragState = null;

    effect.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        suppressClick = false;
        const bounds = effect.getBoundingClientRect();
        dragState = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            left: bounds.left,
            top: bounds.top,
            moved: false
        };
        effect.style.left = `${bounds.left}px`;
        effect.style.top = `${bounds.top}px`;
        effect.style.right = 'auto';
        effect.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    effect.addEventListener('pointermove', (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;
        if (Math.abs(deltaX) + Math.abs(deltaY) > 5) dragState.moved = true;

        effect.style.left = `${Math.max(0, Math.min(window.innerWidth - effect.offsetWidth, dragState.left + deltaX))}px`;
        effect.style.top = `${Math.max(0, Math.min(window.innerHeight - effect.offsetHeight, dragState.top + deltaY))}px`;
    });

    const endDrag = (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        suppressClick = dragState.moved;
        dragState = null;
    };
    effect.addEventListener('pointerup', endDrag);
    effect.addEventListener('pointercancel', endDrag);

    const changeTheme = () => {
        if (suppressClick) {
            suppressClick = false;
            return;
        }
        themeIndex = (themeIndex + 1) % themes.length;
        effect.setAttribute(
            'aria-label',
            `Cubo de Blizzard de color ${themes[themeIndex].name}. Arrástralo para moverlo o púlsalo para cambiar el color.`
        );
        applyTheme();
    };

    effect.addEventListener('click', changeTheme);
    effect.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            changeTheme();
        }
    });

    new THREE.TextureLoader().load(
        new URL('../img/Blizzard_Entertainment-Logo.wine.png', import.meta.url).href,
        (logo) => {
            logoImage = logo.image;
            applyTheme();
        },
        undefined,
        (error) => console.error('No se pudo cargar el logotipo de Blizzard para el cubo.', error)
    );

    const resize = () => {
        const width = effect.clientWidth;
        const height = effect.clientHeight;
        camera.aspect = width / height;
        camera.position.x = 0;
        cube.position.x = 0;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    };
    resize();
    window.addEventListener('resize', resize);

    if (reducedMotion) {
        renderer.render(scene, camera);
    } else {
        const clock = new THREE.Clock();
        const animate = () => {
            const elapsed = clock.getElapsedTime();
            cube.rotation.y = elapsed * 0.16;
            cube.rotation.x = Math.sin(elapsed * 0.2) * 0.12;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        animate();
    }
}