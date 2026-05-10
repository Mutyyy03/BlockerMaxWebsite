const API_BASE_URL = 'https://blockermax-affiliate.plide.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard: Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // İlk yüklemede verileri çek
    loadDashboardData();

    // Sandbox Toggle Dinleyicisi
    const sandboxToggle = document.getElementById('sandboxToggleCheckbox');
    if (sandboxToggle) {
        sandboxToggle.addEventListener('change', async (e) => {
            const isSandbox = e.target.checked;
            
            // Geçici UI/UX efekti
            const balanceEl = document.getElementById('metric-balance');
            const earningsEl = document.getElementById('metric-earnings');
            
            if (balanceEl) balanceEl.innerText = 'Yükleniyor...';
            if (earningsEl) earningsEl.innerText = 'Yükleniyor...';
            
            // API'de sandbox parametresi yok ama geçici bir bekleme efekti
            await new Promise(resolve => setTimeout(resolve, 800)); // 800ms sahte bekleme
            
            // Verileri tekrar yükle
            await loadDashboardData();
            
            if (isSandbox) {
                console.log('Sandbox modu aktif edildi.');
            }
        });
    }
});

// Güvenli (Token içeren) Fetch Fonksiyonu
async function authFetch(endpoint) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 401 || response.status === 403) {
        // Token geçersiz veya süresi dolmuş
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        throw new Error(`API Hatası: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// Tüm Dashboard verilerini çeken ana fonksiyon
async function loadDashboardData() {
    try {
        // İki isteği aynı anda (paralel) başlatarak hızı artırıyoruz
        const [overviewData, promoData] = await Promise.all([
            authFetch('/api/influencer/overview').catch(e => { console.error('Overview error:', e); return null; }),
            authFetch('/api/influencer/promo').catch(e => { console.error('Promo error:', e); return null; })
        ]);

        if (overviewData) {
            updateOverviewMetrics(overviewData);
            updateTransactionsTable(overviewData.recentTransactions);
            updatePayoutsTable(overviewData.recentPayouts);
        }

        if (promoData) {
            updatePromoCode(promoData);
        }

    } catch (error) {
        console.error('Veriler yüklenirken hata oluştu:', error);
        if (error.message !== 'Unauthorized') {
            alert('Veriler yüklenemedi. Lütfen sayfayı yenileyin.');
        }
    }
}

// DOM: Üst metrikleri güncelleyen fonksiyon
function updateOverviewMetrics(data) {
    // Para birimi formatlayıcı (Örn: $1,200.50)
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

    const balanceEl = document.getElementById('metric-balance');
    const earningsEl = document.getElementById('metric-earnings');
    const paidEl = document.getElementById('metric-paid');
    const subsEl = document.getElementById('metric-subs');
    const welcomeTitleEl = document.getElementById('welcome-title');

    // API'den gelen dinamik veriler
    if (balanceEl) balanceEl.innerText = formatCurrency(data.balance);
    if (earningsEl) earningsEl.innerText = formatCurrency(data.totalEarned);
    
    // Geçici olarak "Paid Users" kısmını sakla veya API'den gelen veriye bağla (şu an totalPaid kullanılıyor, düzeltilebilir)
    if (paidEl) paidEl.innerText = data.activeSubs || '0'; // İleride gerçek paid users eklenebilir
    if (subsEl) subsEl.innerText = data.activeSubs || '0';
    
    // JWT Token'dan username'i çekip ekrana yaz
    if (welcomeTitleEl) {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload && payload.username) {
                    welcomeTitleEl.innerText = `Welcome, ${payload.username.charAt(0).toUpperCase() + payload.username.slice(1)}`;
                }
            }
        } catch (e) {
            console.error('Kullanıcı adı çekilemedi', e);
        }
    }
}

// DOM: Promosyon kodunu güncelleyen fonksiyon
function updatePromoCode(data) {
    const promoCodeInput = document.getElementById('promoCodeInput');
    if (promoCodeInput && data.promo_code) {
        promoCodeInput.value = data.promo_code;
    }
}

// DOM: İşlem geçmişi (Transactions) tablosunu güncelleyen fonksiyon
function updateTransactionsTable(transactions) {
    const realBody = document.getElementById('tx-tbody-real');
    const emptyBody = document.getElementById('tx-tbody-empty');

    if (!realBody || !emptyBody) return;

    // Önceki verileri temizle
    realBody.innerHTML = '';

    // Eğer işlem yoksa boş durumu (empty state) göster
    if (!transactions || transactions.length === 0) {
        realBody.style.display = 'none';
        emptyBody.style.display = 'table-row-group';
        return;
    }

    // İşlem varsa tabloyu göster
    realBody.style.display = 'table-row-group';
    emptyBody.style.display = 'none';

    // İşlemleri tablo satırlarına (tr) dönüştür
    transactions.forEach(tx => {
        const tr = document.createElement('tr');
        
        // Tarih Formatı
        const dateObj = new Date(tx.created_at || new Date());
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        // Etkinlik Tipine Göre Rozet (Badge)
        let badgeClass = 'badge-primary'; // Varsayılan mavi
        if (tx.event_type && tx.event_type.toLowerCase().includes('renewal')) {
            badgeClass = 'badge-success'; // Yenileme ise yeşil
        }
        
        const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

        tr.innerHTML = `
            <td>${dateStr}</td>
            <td><span class="badge ${badgeClass}">${tx.event_type || 'Subscription'}</span></td>
            <td>${formatCurrency(tx.gross_revenue)}</td>
            <td style="color: var(--success); font-weight: 500;">+${formatCurrency(tx.commission_earned)}</td>
        `;
        
        realBody.appendChild(tr);
    });
}

// DOM: Ödeme (Payout) geçmişi tablosunu güncelleyen fonksiyon
function updatePayoutsTable(payouts) {
    const realBody = document.getElementById('payout-tbody-real');
    const emptyBody = document.getElementById('payout-tbody-empty');

    if (!realBody || !emptyBody) return;

    realBody.innerHTML = '';

    if (!payouts || payouts.length === 0) {
        realBody.style.display = 'none';
        emptyBody.style.display = 'table-row-group';
        return;
    }

    realBody.style.display = 'table-row-group';
    emptyBody.style.display = 'none';

    payouts.forEach(p => {
        const tr = document.createElement('tr');
        
        const dateObj = new Date(p.created_at || new Date());
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        let badgeClass = p.status === 'paid' ? 'badge-success' : 'badge-warning';
        const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

        tr.innerHTML = `
            <td>${dateStr}</td>
            <td style="font-weight: 600;">${formatCurrency(p.amount)}</td>
            <td><span class="badge ${badgeClass}" style="text-transform: capitalize;">${p.status}</span></td>
            <td><span style="font-family: monospace; font-size: 13px; color: var(--text-muted);">${p.ref_id || '-'}</span></td>
        `;
        
        realBody.appendChild(tr);
    });
}

// UI Helper: Switch Tabs
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn-segmented').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
};

// UI Helper: Copy Promo Code
window.copyCode = function() {
    var copyText = document.getElementById("promoCodeInput");
    if (!copyText) return;
    
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(copyText.value);
    
    if (event && event.target) {
        var btn = event.target;
        var originalText = btn.innerText;
        btn.innerText = "Copied!";
        setTimeout(() => {
            btn.innerText = originalText;
        }, 2000);
    }
};
