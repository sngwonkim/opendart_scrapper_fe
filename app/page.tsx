'use client';

import { useState } from 'react';

// 백엔드 API로부터 받을 데이터의 타입 정의
type FinancialData = {
  rcept_no: string;
  bsns_year: string;
  sj_nm: string; // 재무제표명 (예: '연결재무상태표' 또는 '연결손익계산서')
  account_nm: string; // 백엔드에서 정제한 한글 이름
  thstrm_amount: string;
};

export default function Home() {
  // 1. 폼 입력을 위한 '상태(state)'
  const [startYear, setStartYear] = useState('2022');
  const [endYear, setEndYear] = useState('2022');

  // 2. API 응답을 저장하기 위한 '상태(state)'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 3. 이벤트 핸들러 (동작 함수)
  
  const handleDownloadCSV = (data: FinancialData[]) => {
    // ... (CSV 다운로드 로직은 동일)
    if (data.length === 0) {
        setError("조회는 성공했으나, 다운로드할 데이터가 없습니다.");
        return;
    }
    const headers = ['사업연도', '재무제표명', '계정명', '계정ID', '당기금액(원)', '전기금액(원)'];
    const sortedData = [...data].sort((a, b) => {
        if (a.bsns_year !== b.bsns_year) {
            return parseInt(b.bsns_year) - parseInt(a.bsns_year);
        }
        return a.account_nm.localeCompare(b.account_nm);
    });
    const rows = sortedData.map(item => {
        const thstrm_amount = (item as any).thstrm_amount || '0';
        const frmtrm_amount = (item as any).frmtrm_amount || '0';
        const account_id = (item as any).account_id || '';
        return [
            item.bsns_year,
            `"${item.sj_nm}"`,
            `"${item.account_nm}"`,
            `"${account_id}"`,
            thstrm_amount,
            frmtrm_amount
        ].join(',');
    });
    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ktng_financials_CFS_CIS_${startYear}_${endYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // "데이터 다운로드" 버튼 클릭 시 (API 호출)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const corpCode = '00244455'; // KT&G 고유 코드

    // ======== 여기가 수정 지점입니다! ========

    // [수정 전] - 로컬(개발용) 주소
    // const apiUrl = `http://127.0.0.1:8000/api/financials/${corpCode}?start_year=${startYear}&end_year=${endYear}`;

    // [수정 후] - Vercel 환경 변수(NEXT_PUBLIC_API_URL)를 사용
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/financials/${corpCode}?start_year=${startYear}&end_year=${endYear}`;
    
    // ======================================

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API 요청 실패: ${response.statusText}`);

      const data = await response.json();
      
      if (data.data && data.data.error) {
          throw new Error(`DART API 오류: ${data.data.error}`);
      }
      
      if (!Array.isArray(data.data)) {
          throw new Error("백엔드로부터 잘못된 형식의 데이터를 받았습니다.");
      }

      handleDownloadCSV(data.data);
      
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  

  // 4. UI 렌더링 (JSX)
  return (
    // ... (UI 렌더링 부분은 동일)
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-10">
      <div className="w-full max-w-lg">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-2">
            KT&G 재무제표 데이터 다운로드
          </h1>
          <p className="text-gray-400">
            금융감독원의 전자공시 시스템에서 KT&G의 연결재무상태표와
            <br />
            연결손익계산서를 간편하게 가져와 하나의 CSV 파일로 저장합니다.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="w-full bg-gray-800 p-8 rounded-lg">
          <h2 className="text-xl font-semibold mb-6">다운로드할 기간을 선택하세요.</h2>
          
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              요청하시는 기간
            </label>
            <div className="flex gap-4">
              <select
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="w-1/2 p-3 bg-gray-700 rounded-md border border-gray-600"
              >
                {[...Array(15)].map((_, i) => (
                  <option key={2024 - i} value={2024 - i}>
                    {2024 - i}년
                  </option>
                ))}
              </select>
              <span className="flex items-center">~</span>
              <select
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="w-1/2 p-3 bg-gray-700 rounded-md border border-gray-600"
              >
                {[...Array(15)].map((_, i) => (
                  <option key={2024 - i} value={2024 - i}>
                    {2024 - i}년
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full p-4 bg-green-600 rounded-md font-bold text-lg hover:bg-green-700 disabled:bg-gray-500"
            disabled={loading}
          >
            {loading ? '데이터 생성 중...' : 'CSV 다운로드'}
          </button>
        </form>

        <div className="mt-6 w-full">
          {error && (
            <div className="bg-red-800 text-white p-4 rounded-md">
              <p><b>오류 발생:</b> {error}</p>
  S        </div>
          )}
        </div>

        <footer className="text-center mt-10 text-gray-500 text-sm">
          인하대학교 디지털전략혁신센터
        </footer>
      </div>
    </main>
  );
}
