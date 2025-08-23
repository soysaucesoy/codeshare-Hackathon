
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>マイページ - ケアコネクト</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* Header Styles */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .logo-container {
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .logo {
            width: 40px;
            height: 40px;
            background-color: white;
            color: #667eea;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 24px;
        }

        .main-title {
            font-size: 1.5rem;
            font-weight: bold;
        }

        .cta-primary {
            background-color: white;
            color: #667eea;
            padding: 0.5rem 1.5rem;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s;
        }

        .cta-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        /* Main Content Styles */
        main {
            min-height: calc(100vh - 200px);
            padding: 2rem 0 4rem;
        }

        .services-title {
            font-size: 2rem;
            margin-bottom: 2rem;
            color: #333;
        }

        /* Form Styles */
        .form-section {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }

        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: #555;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
        }

        .form-group.full-width {
            grid-column: 1 / -1;
        }

        label {
            font-size: 0.875rem;
            font-weight: 500;
            color: #555;
            margin-bottom: 0.5rem;
        }

        .required {
            color: #ef4444;
        }

        input[type="text"],
        input[type="email"],
        input[type="tel"],
        select {
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        input:focus,
        select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .checkbox-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            padding: 0.75rem;
            border-radius: 8px;
            transition: background-color 0.2s;
            cursor: pointer;
        }

        .checkbox-item:hover {
            background-color: #f3f4f6;
        }

        .checkbox-item input[type="checkbox"] {
            margin-right: 0.5rem;
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .save-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 3rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            display: block;
            margin: 2rem auto 0;
        }

        .save-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .save-button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
        }

        .message {
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .message.success {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }

        .message.error {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }

        /* Footer Styles */
        .footer {
            background-color: #1f2937;
            color: white;
            padding: 2rem 0;
            margin-top: 4rem;
        }

        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .footer-logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            color: white;
        }

        .footer-logo-icon {
            width: 32px;
            height: 32px;
            background-color: white;
            color: #667eea;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }

        .footer-name {
            font-weight: 600;
        }

        .footer-copyright {
            color: #9ca3af;
            font-size: 0.875rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }

            .form-grid {
                grid-template-columns: 1fr;
            }

            .checkbox-grid {
                grid-template-columns: 1fr;
            }

            .footer-content {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <div style="display: flex; align-items: center; gap: 2rem;">
                <a href="/" class="logo-container">
                    <div class="logo">C</div>
                    <div>
                        <h1 class="main-title">ケアコネクト</h1>
                    </div>
                </a>
                <h2 style="font-size: 16px; margin: 0;">東京都の障害福祉サービス事業所検索システム</h2>
                <div style="margin-left: auto;">
                    <a href="/" class="cta-primary">施設検索</a>
                </div>
            </div>
        </div>        
    </header>

    <main class="container">
        <h2 class="services-title">マイページ</h2>
        
        <div id="message"></div>

        <!-- 基本情報セクション -->
        <div class="form-section">
            <h3 class="section-title">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                基本情報
            </h3>
            
            <div class="form-grid">
                <div class="form-group">
                    <label for="name">
                        氏名 <span class="required">*</span>
                    </label>
                    <input type="text" id="name" name="name" placeholder="山田 太郎">
                </div>

                <div class="form-group">
                    <label for="phone">電話番号</label>
                    <input type="tel" id="phone" name="phone" placeholder="03-1234-5678">
                </div>

                <div class="form-group full-width">
                    <label for="email">
                        メールアドレス <span class="required">*</span>
                    </label>
                    <input type="email" id="email" name="email" placeholder="example@email.com">
                </div>
            </div>
        </div>

        <!-- 希望条件セクション -->
        <div class="form-section">
            <h3 class="section-title">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                希望条件
            </h3>
            
            <div class="form-group">
                <label for="preferred_area">希望する地区</label>
                <select id="preferred_area" name="preferred_area">
                    <option value="">選択してください</option>
                    <option value="千代田区">千代田区</option>
                    <option value="中央区">中央区</option>
                    <option value="港区">港区</option>
                    <option value="新宿区">新宿区</option>
                    <option value="文京区">文京区</option>
                    <option value="台東区">台東区</option>
                    <option value="墨田区">墨田区</option>
                    <option value="江東区">江東区</option>
                    <option value="品川区">品川区</option>
                    <option value="目黒区">目黒区</option>
                    <option value="大田区">大田区</option>
                    <option value="世田谷区">世田谷区</option>
                    <option value="渋谷区">渋谷区</option>
                    <option value="中野区">中野区</option>
                    <option value="杉並区">杉並区</option>
                    <option value="豊島区">豊島区</option>
                    <option value="北区">北区</option>
                    <option value="荒川区">荒川区</option>
                    <option value="板橋区">板橋区</option>
                    <option value="練馬区">練馬区</option>
                    <option value="足立区">足立区</option>
                    <option value="葛飾区">葛飾区</option>
                    <option value="江戸川区">江戸川区</option>
                </select>
            </div>

            <div class="form-group">
                <label>希望するサービス（複数選択可）</label>
                <div class="checkbox-grid">
                    <label class="checkbox-item">
                        <input type="checkbox" name="services" value="home_care">
                        <span>訪問介護</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" name="services" value="day_service">
                        <span>デイサービス</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" name="services" value="short_stay">
                        <span>ショートステイ</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" name="services" value="group_home">
                        <span>グループホーム</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" name="services" value="special_nursing">
                        <span>特別養護老人ホーム</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" name="services" value="care_house">
                        <span>ケアハウス</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" name="services" value="home_nursing">
                        <span>訪問看護</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" name="services" value="rehabilitation">
                        <span>リハビリテーション</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" name="services" value="welfare_equipment">
                        <span>福祉用具</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" name="services" value="care_management">
                        <span>ケアマネジメント</span>
                    </label>
                </div>
            </div>
        </div>

        <button class="save-button" onclick="saveUserData()">情報を保存</button>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <a href="/" class="footer-logo">
                    <div class="footer-logo-icon">C</div>
                    <span class="footer-name">ケアコネクト</span>
                </a>
                <div class="footer-copyright">
                    © 2025 ケアコネクト. All rights reserved.
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Supabase設定（実装時に設定してください）
        const SUPABASE_URL = 'YOUR_SUPABASE_URL';
        const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

        // メッセージ表示関数
        function showMessage(text, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.className = `message ${type}`;
            messageDiv.innerHTML = `
                ${type === 'success' ? 
                    '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>' :
                    '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>'
                }
                ${text}
            `;
            
            // 3秒後にメッセージを消す
            setTimeout(() => {
                messageDiv.innerHTML = '';
                messageDiv.className = '';
            }, 3000);
        }

        // バリデーション関数
        function validateForm() {
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();

            if (!name) {
                showMessage('氏名を入力してください', 'error');
                return false;
            }

            if (!email) {
                showMessage('メールアドレスを入力してください', 'error');
                return false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showMessage('正しいメールアドレスを入力してください', 'error');
                return false;
            }

            if (phone && !/^[\d-]+$/.test(phone)) {
                showMessage('正しい電話番号を入力してください', 'error');
                return false;
            }

            return true;
        }

        // データ保存関数
        async function saveUserData() {
            if (!validateForm()) return;

            const button = document.querySelector('.save-button');
            button.disabled = true;
            button.textContent = '保存中...';

            // フォームデータの取得
            const formData = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                preferred_area: document.getElementById('preferred_area').value,
                preferred_services: Array.from(document.querySelectorAll('input[name="services"]:checked'))
                    .map(cb => cb.value)
            };

            try {
                // ここでSupabaseへの保存処理を実装
                /* 実装例:
                const { createClient } = supabase;
                const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                
                const { data: { user } } = await supabaseClient.auth.getUser();
                
                if (!user) {
                    showMessage('ログインが必要です', 'error');
                    return;
                }

                const { error } = await supabaseClient
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        ...formData,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
                */

                // デモ用：保存成功をシミュレート
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                console.log('保存するデータ:', formData);
                showMessage('保存しました', 'success');
                
            } catch (error) {
                console.error('保存エラー:', error);
                showMessage('保存に失敗しました', 'error');
            } finally {
                button.disabled = false;
                button.textContent = '情報を保存';
            }
        }

        // ページ読み込み時にユーザーデータを取得
        window.addEventListener('DOMContentLoaded', async () => {
            // 実装時はここでSupabaseからデータを取得
            /* 実装例:
            try {
                const { createClient } = supabase;
                const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                
                const { data: { user } } = await supabaseClient.auth.getUser();
                
                if (user) {
                    const { data, error } = await supabaseClient
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (data) {
                        document.getElementById('name').value = data.name || '';
                        document.getElementById('phone').value = data.phone || '';
                        document.getElementById('email').value = data.email || '';
                        document.getElementById('preferred_area').value = data.preferred_area || '';
                        
                        if (data.preferred_services) {
                            data.preferred_services.forEach(service => {
                                const checkbox = document.querySelector(`input[value="${service}"]`);
                                if (checkbox) checkbox.checked = true;
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('データ取得エラー:', error);
            }
            */
        });
    </script>
</body>
</html>