// pages/auth/complete-profile.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/hooks/useAuth'
import { TokyoDistrict, T_DISTRICTS, DisabilityType } from '@/types/database'

const CompleteProfilePage: React.FC = () => {
  const router = useRouter()
  const { createUserProfile } = useAuth()

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    district: '' as string, // 一旦 string、後で TokyoDistrict に変換
    age: '',
    gender: '',
    disability_types: [] as DisabilityType[],
    disability_grade: '',
    guardian_name: '',
    guardian_phone: '',
    emergency_contact: '',
    medical_info: '',
    transportation_needs: '',
    other_requirements: '',
    receive_notifications: true
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleDisabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setFormData(prev => {
      let types = [...prev.disability_types]
      if (checked) {
        types.push(value as DisabilityType)
      } else {
        types = types.filter(t => t !== value)
      }
      return { ...prev, disability_types: types }
    })
  }

  const handleSave = async () => {
    const districtValue: TokyoDistrict | null = T_DISTRICTS.includes(formData.district as TokyoDistrict)
      ? (formData.district as TokyoDistrict)
      : null

    const metadata = {
      user_type: 'user' as const,
      full_name: formData.full_name,
      phone_number: formData.phone_number || null,
      district: districtValue,
      user_details: {
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        disability_types: formData.disability_types,
        disability_grade: formData.disability_grade || null,
        guardian_name: formData.guardian_name || null,
        guardian_phone: formData.guardian_phone || null,
        emergency_contact: formData.emergency_contact || null,
        medical_info: formData.medical_info || null,
        transportation_needs: formData.transportation_needs || null,
        other_requirements: formData.other_requirements || null,
        receive_notifications: formData.receive_notifications
      }
    }

    const { error } = await createUserProfile(metadata)
    if (!error) router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg w-full p-6 bg-white shadow rounded">
        <h2 className="text-xl font-bold mb-4">プロフィール入力</h2>

        {/* 名前 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">お名前 *</label>
          <input name="full_name" value={formData.full_name} onChange={handleChange}
            className="w-full p-2 border rounded"/>
        </div>

        {/* 電話番号 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">電話番号</label>
          <input name="phone_number" value={formData.phone_number} onChange={handleChange}
            className="w-full p-2 border rounded"/>
        </div>

        {/* 住所（区市町村） */}
        <div className="mb-3">
          <label className="block text-sm mb-1">お住まいの地区</label>
          <select name="district" value={formData.district} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">選択してください</option>
            {T_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* 年齢 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">年齢</label>
          <input name="age" type="number" value={formData.age} onChange={handleChange}
            className="w-full p-2 border rounded"/>
        </div>

        {/* 性別 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">性別</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">選択してください</option>
            <option value="男性">男性</option>
            <option value="女性">女性</option>
            <option value="その他">その他</option>
          </select>
        </div>

        {/* 障害種別 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">障害種別</label>
          <div className="flex flex-col gap-1">
            {['身体障害','知的障害','精神障害','発達障害','難病等','その他'].map(d => (
              <label key={d} className="flex items-center gap-2">
                <input type="checkbox" value={d} checked={formData.disability_types.includes(d as DisabilityType)} onChange={handleDisabilityChange}/>
                {d}
              </label>
            ))}
          </div>
        </div>

        {/* 障害等級 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">障害等級</label>
          <input name="disability_grade" value={formData.disability_grade} onChange={handleChange} className="w-full p-2 border rounded"/>
        </div>

        {/* 保護者情報 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">保護者名</label>
          <input name="guardian_name" value={formData.guardian_name} onChange={handleChange} className="w-full p-2 border rounded"/>
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">保護者電話番号</label>
          <input name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} className="w-full p-2 border rounded"/>
        </div>

        {/* 緊急連絡先 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">緊急連絡先</label>
          <input name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} className="w-full p-2 border rounded"/>
        </div>

        {/* 医療情報 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">医療情報</label>
          <textarea name="medical_info" value={formData.medical_info} onChange={handleChange} className="w-full p-2 border rounded"/>
        </div>

        {/* 交通手段 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">交通手段</label>
          <input name="transportation_needs" value={formData.transportation_needs} onChange={handleChange} className="w-full p-2 border rounded"/>
        </div>

        {/* その他要望 */}
        <div className="mb-3">
          <label className="block text-sm mb-1">その他要望</label>
          <textarea name="other_requirements" value={formData.other_requirements} onChange={handleChange} className="w-full p-2 border rounded"/>
        </div>

        {/* 通知 */}
        <div className="mb-3 flex items-center gap-2">
          <input type="checkbox" name="receive_notifications" checked={formData.receive_notifications} onChange={handleChange}/>
          <label>通知を受け取る</label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={()=>router.push('/')} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded">スキップ</button>
          <button onClick={handleSave} className="flex-1 bg-green-500 text-white py-2 rounded">保存して次へ</button>
        </div>
      </div>
    </div>
  )
}

export default CompleteProfilePage
