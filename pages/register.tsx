
// pages/register.tsx - 新規事業所登録ページ
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { T_DISTRICTS, SERVICE_CATEGORIES } from '@/types/database';

const districts = T_DISTRICTS;

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [facilityName, setFacilityName] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [appealPoints, setAppealPoints] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const registrationData = {
      name: facilityName,
      district,
      address,
      phone_number: phoneNumber,
      website_url: websiteUrl,
      description,
      appeal_points: appealPoints,
      service_ids: selectedServices,
    };

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登録に失敗しました。');
      }

      setSuccess(true);
      // フォームをリセット
      setFacilityName('');
      setDistrict('');
      setAddress('');
      setPhoneNumber('');
      setWebsiteUrl('');
      setDescription('');
      setAppealPoints('');
      setSelectedServices([]);

      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Head>
        <title>新規事業所登録 - ケアコネクト</title>
      </Head>

      <header className="header">
        <div className="container">
          <div className="logo-container">
            <Link href="/" legacyBehavior>
              <a className="logo-link">
                <div className="logo">C</div>
                <h1 className="main-title">ケアコネクト</h1>
              </a>
            </Link>
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <h2 className="services-title">新規事業所登録</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>
          事業所の情報を入力して、ケアコネクトに登録しましょう。
        </p>

        {success && (
          <div style={{ padding: '1rem', marginBottom: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '0.5rem', textAlign: 'center' }}>
            登録が完了しました。3秒後にトップページに戻ります。
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', marginBottom: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '0.5rem', textAlign: 'center' }}>
            エラー: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-grid">
            {/* 基本情報 */}
            <div className="form-section">
              <h3 className="form-section-title">基本情報</h3>
              <div className="form-group">
                <label htmlFor="facilityName" className="form-label">事業所名 *</label>
                <input
                  id="facilityName"
                  type="text"
                  className="form-input"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="district" className="form-label">地区 *</label>
                <select
                  id="district"
                  className="form-input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                >
                  <option value="">地区を選択してください</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="address" className="form-label">番地以降の住所 *</label>
                <input
                  id="address"
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber" className="form-label">電話番号</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  className="form-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="websiteUrl" className="form-label">ウェブサイトURL</label>
                <input
                  id="websiteUrl"
                  type="url"
                  className="form-input"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
            </div>

            {/* 詳細情報 */}
            <div className="form-section">
              <h3 className="form-section-title">詳細情報</h3>
              <div className="form-group">
                <label htmlFor="description" className="form-label">事業所の説明</label>
                <textarea
                  id="description"
                  className="form-textarea"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="appealPoints" className="form-label">アピールポイント</label>
                <textarea
                  id="appealPoints"
                  className="form-textarea"
                  rows={4}
                  value={appealPoints}
                  onChange={(e) => setAppealPoints(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {/* 提供サービス */}
          <div className="form-section">
            <h3 className="form-section-title">提供サービス *</h3>
            <p className="form-description">提供しているサービスをすべて選択してください。</p>
            {Object.entries(SERVICE_CATEGORIES).map(([category, services]) => (
              <div key={category} style={{ marginBottom: '1.5rem' }}>
                <h4 className="service-category-title">{category}</h4>
                <div className="service-options-grid">
                  {services.map((service) => (
                    <label key={service.id} className="service-checkbox-label">
                      <input
                        type="checkbox"
                        className="filter-checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                      />
                      <span>{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button type="submit" className="cta-primary" disabled={loading}>
              {loading ? '登録中...' : '事業所を登録する'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default RegisterPage;
