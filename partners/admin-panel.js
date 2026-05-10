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
        if (sectionId === 'offer-codes') loadOfferCodes();
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

// Global store
let allInfluencers = [];

// ----------------------------------------------------
// 1. INFLUENCERS (Partner Yönetimi)
// ----------------------------------------------------
async function loadInfluencers() {
    try {
        allInfluencers = await adminFetch('/api/admin/influencers');
        renderInfluencersList(allInfluencers);
        if (document.getElementById('offer-codes').classList.contains('active')) {
            loadOfferCodes();
        }
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

    // Komisyon Oranlarını Güncelle (Sahte Inputlar ama en azından veriyi gösterelim)
    const commInputs = detailPanel.querySelectorAll('.inf-comm-box input');
    if (commInputs.length >= 2) {
        commInputs[0].value = inf.default_first_month_pct || 30;
        commInputs[1].value = inf.default_recurring_pct || 10;
    }

    // Payout Address (Ödeme Adresi) Güncelle
    const payoutRows = detailPanel.querySelectorAll('.inf-payout-row .inf-payout-value');
    if (payoutRows.length >= 3) {
        payoutRows[2].innerText = inf.wallet_address || 'Tanımlanmadı';
    }

    // Edit butonuna tıklandığında modalı aç ve verileri doldur
    const editBtn = detailPanel.querySelector('.inf-profile-header button.btn-outline');
    if (editBtn) {
        editBtn.onclick = () => window.openEditModal(inf.id);
    }
}

// Add Influencer Form Submit Yakalayıcısı
window.addInfluencer = async function(e) {
    e.preventDefault();

    const fullName       = document.getElementById('add-fullName').value.trim();
    const username       = document.getElementById('add-username').value.trim();
    const promoCode      = document.getElementById('add-promoCode').value.trim();
    const firstMonthPct  = parseFloat(document.getElementById('add-firstMonth').value);
    const recurringPct   = parseFloat(document.getElementById('add-recurring').value);
    const walletAddress  = document.getElementById('add-walletAddress').value.trim();

    // Sosyal medya URL'leri (boş olanları filtrele)
    const socials = [
        document.getElementById('add-social-youtube').value.trim(),
        document.getElementById('add-social-tiktok').value.trim(),
        document.getElementById('add-social-instagram').value.trim(),
        document.getElementById('add-social-twitter').value.trim(),
        document.getElementById('add-social-other').value.trim()
    ].filter(Boolean).join(', ');

    // Geçici Şifre
    const password = "BlockerMax" + Math.floor(Math.random() * 1000);

    try {
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = 'Kaydediliyor...';
        btn.disabled = true;

        await adminFetch('/api/admin/influencers', {
            method: 'POST',
            body: JSON.stringify({
                username, password, fullName, promoCode, firstMonthPct, recurringPct, walletAddress
            })
        });

        alert(`Partner eklendi!\nKullanıcı Adı: ${username}\nŞifre: ${password}\nLütfen bu bilgileri partner ile paylaşın.`);

        if (window.closeModal) window.closeModal('addInfluencerModal');
        e.target.reset();

        // Listeyi tazele
        loadInfluencers();

        btn.innerText = originalText;
        btn.disabled = false;
    } catch (error) {
        alert(error.message);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.innerText = 'Save Influencer';
        btn.disabled = false;
    }
};

// Edit Influencer Modal
window.openEditModal = function(infId) {
    const inf = allInfluencers.find(i => i.id === infId);
    if (!inf) return;

    // ID bazlı elementleri doldur
    document.getElementById('edit-fullName').value      = inf.full_name || '';
    document.getElementById('edit-promoCode').value     = inf.promo_code || '';
    document.getElementById('edit-firstMonth').value    = inf.default_first_month_pct || 30;
    document.getElementById('edit-recurring').value     = inf.default_recurring_pct || 10;
    document.getElementById('edit-walletAddress').value = inf.wallet_address || '';

    // Payout method seçili yap
    const payoutSel = document.getElementById('edit-payoutMethod');
    if (payoutSel && inf.payout_method) {
        payoutSel.value = inf.payout_method;
    }

    // Sosyal medya - varsa ayrıştır (virgülle ayrılmış olabilir)
    const socialUrls = (inf.social_accounts || '').split(',').map(s => s.trim());
    document.getElementById('edit-social-youtube').value   = socialUrls[0] || '';
    document.getElementById('edit-social-tiktok').value    = socialUrls[1] || '';
    document.getElementById('edit-social-instagram').value = socialUrls[2] || '';
    document.getElementById('edit-social-twitter').value   = socialUrls[3] || '';
    document.getElementById('edit-social-other').value     = socialUrls[4] || '';

    // Form submit event'ini bağla
    const form = document.getElementById('editInfluencerForm');
    form.onsubmit = async function(e) {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = 'Güncelleniyor...';
        btn.disabled = true;

        const socials = [
            document.getElementById('edit-social-youtube').value.trim(),
            document.getElementById('edit-social-tiktok').value.trim(),
            document.getElementById('edit-social-instagram').value.trim(),
            document.getElementById('edit-social-twitter').value.trim(),
            document.getElementById('edit-social-other').value.trim()
        ].filter(Boolean).join(', ');

        try {
            await adminFetch(`/api/admin/influencers/${infId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    fullName:      document.getElementById('edit-fullName').value.trim(),
                    promoCode:     document.getElementById('edit-promoCode').value.trim(),
                    firstMonthPct: parseFloat(document.getElementById('edit-firstMonth').value),
                    recurringPct:  parseFloat(document.getElementById('edit-recurring').value),
                    walletAddress: document.getElementById('edit-walletAddress').value.trim(),
                    socialAccounts: socials
                })
            });

            alert('Partner başarıyla güncellendi!');
            if (window.closeModal) window.closeModal('editInfluencerModal');
            loadInfluencers();
        } catch (error) {
            alert(error.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    if (window.openModal) window.openModal('editInfluencerModal');
};

// Save Commission Rates (Detay Panelindeki "Save Rates" butonu)
window.saveCommissionRates = async function(btn) {
    // Sağ paneldeki aktif influencer'ı bul
    const activeRow = document.querySelector('.inf-row.active');
    if (!activeRow) { alert('Lütfen önce bir influencer seçin.'); return; }

    // Seçili influencer'ı bul
    const namEl = document.querySelector('#infDetailPanel .inf-profile-meta h3');
    const infName = namEl ? namEl.innerText : '';
    const inf = allInfluencers.find(i => i.full_name === infName);
    if (!inf) { alert('Influencer bulunamadı.'); return; }

    const commInputs = document.querySelectorAll('.inf-comm-box input');
    const firstMonthPct = parseFloat(commInputs[0].value);
    const recurringPct  = parseFloat(commInputs[1].value);

    const origText = btn.innerText;
    btn.innerText = 'Saving...';
    btn.disabled = true;

    try {
        await adminFetch(`/api/admin/influencers/${inf.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                fullName:      inf.full_name,
                promoCode:     inf.promo_code,
                walletAddress: inf.wallet_address || '',
                firstMonthPct,
                recurringPct
            })
        });
        btn.innerText = 'Saved ✓';
        setTimeout(() => { btn.innerText = origText; btn.disabled = false; }, 2000);
        loadInfluencers();
    } catch (error) {
        alert(error.message);
        btn.innerText = origText;
        btn.disabled = false;
    }
};

// ----------------------------------------------------
// 1.5 OFFER CODES (Kod Yönetimi)
// ----------------------------------------------------
window.loadOfferCodes = function() {
    // Offer codes tablosunu doldur (Influencer verisinden faydalanıyoruz)
    const tbody = document.querySelector('#offer-codes tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (allInfluencers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Kod bulunamadı</td></tr>';
        return;
    }

    allInfluencers.forEach(inf => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><span class="badge" style="background: #eee;">${inf.promo_code}</span></td>
            <td>${inf.full_name}</td>
            <td>${inf.default_first_month_pct}% İlk Ay</td>
            <td>${inf.active_subs || 0} Abone</td>
            <td><span class="badge badge-success">Active</span></td>
            <td><a href="#" style="font-size: 13px;" onclick="event.preventDefault(); window.openEditModal(${inf.id})">Edit</a></td>
        `;
        tbody.appendChild(tr);
    });
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
window.loadPayouts = async function() {
    try {
        const payouts = await adminFetch('/api/admin/payouts');
        const tbody = document.querySelector('#payouts tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (payouts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Ödeme kaydı bulunamadı</td></tr>';
            return;
        }

        payouts.forEach(p => {
            const tr = document.createElement('tr');
            const isPaid = p.status === 'paid';
            const badgeClass = isPaid ? 'badge-success' : 'badge-warning';
            
            const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

            tr.innerHTML = `
                <td>${new Date(p.created_at).toLocaleDateString()}</td>
                <td><a href="#" style="text-decoration: none; font-weight: 500; color: var(--primary-color);" onclick="window.switchSection('influencers'); setTimeout(() => window.openEditModal(${p.influencer_id}), 100); return false;">${p.full_name || 'Bilinmiyor'}</a></td>
                <td>${formatCurrency(p.amount)}</td>
                <td><span style="font-family: monospace; font-size: 13px; color: var(--text-muted);">${p.wallet_address || 'Belirtilmedi'}</span></td>
                <td><span style="text-transform: capitalize;">${p.method || 'crypto'}</span></td>
                <td><span class="badge ${badgeClass}">${p.status}</span></td>
                <td>
                    ${isPaid 
                        ? `<span style="font-size: 13px; color: var(--text-muted);">Ref: ${p.ref_id || '-'}</span>`
                        : `<button class="btn btn-outline" style="padding: 4px 10px; font-size: 12px;" onclick="window.markPayoutPaid(${p.id}, this)">Mark Paid</button>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Payouts yükleme hatası:', error);
    }
};

window.openCreatePayoutModal = function() {
    const select = document.getElementById('payoutInfluencerSelect');
    if (!select) return;
    
    select.innerHTML = '';
    
    allInfluencers.forEach(inf => {
        const totalEarned = inf.total_earned || 0;
        const totalPaid = inf.total_paid || 0;
        const pendingBalance = totalEarned - totalPaid;
        
        const option = document.createElement('option');
        option.value = inf.id;
        option.innerText = `${inf.full_name} (Pending: $${pendingBalance.toFixed(2)})`;
        select.appendChild(option);
    });
    
    if (window.openModal) window.openModal('createPayoutModal');
};

window.submitCreatePayout = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const origText = btn.innerText;
    
    const influencerId = document.getElementById('payoutInfluencerSelect').value;
    const amount = parseFloat(document.getElementById('payoutAmountInput').value);
    const method = document.getElementById('payoutMethodSelect').value;
    
    try {
        btn.innerText = 'Creating...';
        btn.disabled = true;
        
        await adminFetch('/api/admin/payouts', {
            method: 'POST',
            body: JSON.stringify({ influencerId, amount, method })
        });
        
        alert('Payout created successfully!');
        if (window.closeModal) window.closeModal('createPayoutModal');
        e.target.reset();
        window.loadPayouts();
    } catch (error) {
        alert(error.message);
    } finally {
        btn.innerText = origText;
        btn.disabled = false;
    }
};

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
        window.loadPayouts();
    } catch (error) {
        alert(error.message);
        btn.innerText = 'Mark Paid';
        btn.disabled = false;
    }
};
