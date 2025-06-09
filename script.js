// 平滑滚动效果
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 导航栏滚动效果
let lastScrollTop = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', function() {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // 添加背景模糊效果
    if (scrollTop > 50) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.backdropFilter = 'blur(20px)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    }
    
    lastScrollTop = scrollTop;
});



// 页面加载动画
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// 鼠标跟踪效果（可选）
document.addEventListener('mousemove', function(e) {
    const hero = document.getElementById('hero');
    if (!hero) return;
    
    const rect = hero.getBoundingClientRect();
    if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        
        hero.style.background = `
            radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.1) 0%, transparent 50%),
            linear-gradient(135deg, #667eea 0%, #764ba2 100%)
        `;
    }
}); 