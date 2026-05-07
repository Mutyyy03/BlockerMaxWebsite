const API_BASE_URL = 'https://blockermax-affiliate.plide.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username || !password) {
                alert('Lütfen kullanıcı adı ve şifre giriniz.');
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            
            try {
                // Yükleniyor durumu
                submitBtn.innerText = 'Giriş Yapılıyor...';
                submitBtn.disabled = true;

                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
                }

                const data = await response.json();

                // Başarılı giriş, verileri localStorage'a kaydet
                if (data.token) localStorage.setItem('token', data.token);
                if (data.role) localStorage.setItem('role', data.role);
                if (data.id) localStorage.setItem('userId', data.id);

                // Role göre yönlendirme
                if (data.role === 'influencer') {
                    window.location.href = 'dashboard.html';
                } else {
                    // Admin veya diğer roller
                    window.location.href = 'admin-panel-hq8v2m.html';
                }
            } catch (error) {
                console.error('Login error:', error);
                alert(error.message);
                
                // Butonu eski haline getir
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
