const API_BASE_URL = 'https://blockermax-affiliate.plide.workers.dev';

// Auth Guard & Setup
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Sadece admin yetkisi olan girebilir
    if (!token || role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // İlk yüklemede Ana (Influencers) tabını doldur
    loadInfluencers();

    // Orijinal switchSection fonksiyonunu ezip API çağrılarını bağlıyoruz
    const originalSwitchSection = window.switchSection;
    window.switchSection = function(sectionId, element) {
        if (originalSwitchSection) originalSwitchSection(sectionId, element);
        
        // Hangi sekmeye geçildiyse verilerini çek
        if (sectionId === 'influencers') loadInfluencers();
        if (sectionId === 'transactions') loadTransactions();
        if (sectionId === 'payouts') loadPayouts();
    };
});

async function adminFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        window.location.href = 'login.html';
        throw new Error('Yetkisiz erişim');
    }

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `API Hatası: ${response.status}`);
    }

    return response.json();
}

// ----------------------------------------------------
// 1. INFLUENCERS (Partner Yönetimi)
// ----------------------------------------------------
async function loadInfluencers() {
    try {
        const influencers = await adminFetch('/api/admin/influencers');
        renderInfluencersList(influencers);
    } catch (error) {
        console.error('Influencer yükleme hatası:', error);
    }
}

function renderInfluencersList(influencers) {
    const scrollContainer = document.querySelector('.inf-list-scroll');
    const countHeader = document.querySelector('.inf-list-header div:first-child');
    
    if (!scrollContainer) return;
    
    if (countHeader) countHeader.innerText = `${influencers.length} CREATORS`;
    scrollContainer.innerHTML = '';

    influencers.forEach((inf, index) => {
        // İsimlerin baş harfleri
        const initials = inf.full_name ? inf.full_name.substring(0, 2).toUpperCase() : 'NA';
        const isActiveClass = index === 0 ? 'active' : '';
        const totalEarned = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inf.total_earned || 0);

        const row = document.createElement('div');
        row.className = `inf-row ${isActiveClass}`;
        
        // Satıra tıklandığında aktif olanı değiştir ve detayları sağdaki panele bas
        row.onclick = function() {
            document.querySelectorAll('.inf-row').forEach(r => r.classList.remove('active'));
            this.classList.add('active');
            updateInfluencerDetail(inf);
        };

        row.innerHTML = `
            <div class="inf-avatar" style="background:#E3F2FD; color:#1976D2;">${initials}</div>
            <div class="inf-row-info">
                <div class="inf-row-name">${inf.full_name}</div>
                <div class="inf-row-sub">${inf.promo_code} · ${inf.username}</div>
            </div>
            <div class="inf-row-rev">${totalEarned}</div>
        `;

        scrollContainer.appendChild(row);

        // İlk eleman ise sağ detay panelini onunla doldur
        if (index === 0) {
            updateInfluencerDetail(inf);
        }
    });
}

function updateInfluencerDetail(inf) {
    const detailPanel = document.getElementById('infDetailPanel');
    if (!detailPanel) return;

    // Arayüzdeki hardcode isimleri ve dataları dinamik yapıyoruz
    const nameEl = detailPanel.querySelector('.inf-profile-meta h3');
    const emailEl = detailPanel.querySelector('.inf-profile-meta p');
    
    if (nameEl) nameEl.innerText = inf.full_name;
    if (emailEl) emailEl.innerText = inf.username; // Kullanıcı adını mail gibi gösteriyoruz
    
    // Promosyon Kodu
    const codeEls = detailPanel.querySelectorAll('.inf-payout-value');
    codeEls.forEach(el => {
        if (el.style.color === 'var(--primary-color)' || el.innerText.length < 15) {
            el.innerText = inf.promo_code;
        }
    });

    // Toplam Ciro (Tasarımda 4. kart)
    const statCards = detailPanel.querySelectorAll('.inf-stat-value');
    if (statCards.length >= 4) {
        // Aktif Abone ve Total Ciro
        statCards[2].innerText = inf.active_subs || 0;
        statCards[3].innerText = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(inf.total_earned || 0);
    }
}

// Add Influencer Form Submit Yakalayıcısı
window.addInfluencer = async function(e) {
    e.preventDefault();
    const form = e.target;
    const inputs = form.querySelectorAll('input');
    
    // Form Elemanları Sırası (Tasarımına göre index bazlı)
    const fullName = inputs[0].value;
    const username = inputs[1].value;
    const promoCode = inputs[2].value;
    const firstMonthPct = parseFloat(inputs[3].value);
    const recurringPct = parseFloat(inputs[4].value);
    
    // Geçici Şifre
    const password = "BlockerMax" + Math.floor(Math.random() * 1000); 

    try {
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = 'Kaydediliyor...';
        btn.disabled = true;

        await adminFetch('/api/admin/influencers', {
            method: 'POST',
            body: JSON.stringify({
                username, password, fullName, promoCode, firstMonthPct, recurringPct
            })
        });

        alert(`Partner eklendi!\nKullanıcı Adı: ${username}\nŞifre: ${password}\nLütfen bu bilgileri partner ile paylaşın.`);
        
        if (window.closeModal) window.closeModal('addInfluencerModal');
        form.reset();
        
        // Listeyi tazele
        loadInfluencers();
        
        btn.innerText = originalText;
        btn.disabled = false;
    } catch (error) {
        alert(error.message);
        const btn = form.querySelector('button[type="submit"]');
        btn.innerText = 'Save Influencer';
        btn.disabled = false;
    }
};

// ----------------------------------------------------
// 2. TRANSACTIONS (İşlem Geçmişi)
// ----------------------------------------------------
async function loadTransactions() {
    try {
        const txns = await adminFetch('/api/admin/transactions');
        const tbody = document.querySelector('#transactions tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (txns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Henüz hiç işlem yok</td></tr>';
            return;
        }
        
        txns.forEach(tx => {
            const tr = document.createElement('tr');
            const dateObj = new Date(tx.created_at || new Date());
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '<br><span style="font-size: 12px; color: var(--text-muted);">' + dateObj.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) + '</span>';
            
            const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><span style="font-size: 12px; font-family: monospace;">${tx.rc_transaction_id || '-'}</span></td>
                <td><span class="badge" style="background: #eee;">${tx.promo_code}</span></td>
                <td>${tx.event_type}</td>
                <td>${formatCurrency(tx.gross_revenue)}</td>
                <td style="color: var(--success); font-weight: 500;">+${formatCurrency(tx.commission_earned)}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Transactions yükleme hatası:', error);
    }
}

// ----------------------------------------------------
// 3. PAYOUTS (Ödemeler)
// ----------------------------------------------------
async function loadPayouts() {
    try {
        const payouts = await adminFetch('/api/admin/payouts');
        const tbody = document.querySelector('#payouts tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (payouts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Henüz kayıtlı ödeme yok</td></tr>';
            return;
        }

        payouts.forEach(p => {
            const tr = document.createElement('tr');
            const dateStr = new Date(p.created_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
            
            let statusBadge = p.status === 'paid' 
                ? '<span class="badge badge-success">Paid</span>' 
                : '<span class="badge" style="background: #FFF3CD; color: #856404;">Pending</span>';

            let actionBtn = p.status !== 'paid' 
                ? `<button class="btn btn-outline" style="padding:4px 10px; font-size:11px;" onclick="window.markPayoutPaid(${p.id}, this)">Mark Paid</button>`
                : `<span style="font-size: 12px; font-family: monospace;">${p.ref_id || '-'}</span>`;

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td><span class="badge" style="background: #eee;">${p.promo_code}</span></td>
                <td style="font-weight: 500;">${formatCurrency(p.amount)}</td>
                <td><span style="font-size: 12px;">Tanımsız</span></td>
                <td>${statusBadge}</td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Payouts yükleme hatası:', error);
    }
}

window.markPayoutPaid = async function(id, btn) {
    const refId = prompt("Ödeme yapıldığına dair referans kodu girin (TxHash, Dekont ID vb.):");
    if (refId === null) return; // Kullanıcı iptal etti

    try {
        btn.innerText = '...';
        btn.disabled = true;

        await adminFetch(`/api/admin/payouts/${id}/mark-paid`, {
            method: 'POST',
            body: JSON.stringify({ ref_id: refId })
        });

        // Listeyi yenile
        loadPayouts();
    } catch (error) {
        alert(error.message);
        btn.innerText = 'Mark Paid';
        btn.disabled = false;
    }
};
